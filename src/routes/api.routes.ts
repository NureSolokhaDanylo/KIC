import { Router, Request, Response, NextFunction } from "express";
import { AppDataSource } from "../config/data-source";
import { Department } from "../entities/Department";
import { Good } from "../entities/Good";
import { Worker } from "../entities/Worker";
import { Sale } from "../entities/Sale";
import { ProducerReport } from "../entities/ProducerReport";

export const apiRouter = Router();

// ============================================================================
// Модуль 1. Просмотр информации из связанных таблиц
// ============================================================================

/**
 * 1. GET /api/departments
 * Повертає список усіх відділів разом із товарами та працівниками
 */
apiRouter.get("/departments", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const deptRepo = AppDataSource.getRepository(Department);
    const departments = await deptRepo.find({
      relations: {
        goods: true,
        workers: true
      },
      order: {
        deptId: "ASC"
      }
    });

    return res.json({
      success: true,
      count: departments.length,
      data: departments
    });
  } catch (err) {
    return next(err);
  }
});

/**
 * 2. GET /api/goods
 * Повертає список товарів із вкладеним об'єктом відділу.
 * Опціональний фільтр ?deptId= для фільтрації по відділу.
 */
apiRouter.get("/goods", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const goodRepo = AppDataSource.getRepository(Good);
    const where: any = {};

    if (req.query.deptId) {
      const deptId = Number(req.query.deptId);
      if (!isNaN(deptId)) {
        where.deptId = deptId;
      }
    }

    const goods = await goodRepo.find({
      where,
      relations: {
        department: true
      },
      order: {
        goodId: "ASC"
      }
    });

    // Форматування та розбір JSON з extraInfo
    const formatted = goods.map((g) => {
      let parsedExtraInfo = null;
      if (g.extraInfo) {
        try {
          parsedExtraInfo = JSON.parse(g.extraInfo);
        } catch {
          parsedExtraInfo = g.extraInfo;
        }
      }
      return {
        goodId: g.goodId,
        deptId: g.deptId,
        name: g.name,
        price: Number(g.price),
        quantity: g.quantity,
        producer: g.producer,
        description: g.description,
        extraInfo: parsedExtraInfo,
        department: g.department
          ? {
              deptId: g.department.deptId,
              name: g.department.name,
              info: g.department.info
            }
          : null
      };
    });

    return res.json({
      success: true,
      count: formatted.length,
      data: formatted
    });
  } catch (err) {
    return next(err);
  }
});

/**
 * 3. GET /api/sales
 * Повертає історію продажів, об'єднану з товарами та відділами.
 */
apiRouter.get("/sales", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const saleRepo = AppDataSource.getRepository(Sale);
    const sales = await saleRepo
      .createQueryBuilder("sale")
      .innerJoinAndSelect("sale.good", "good")
      .innerJoinAndSelect("good.department", "department")
      .orderBy("sale.saleId", "ASC")
      .getMany();

    const formatted = sales.map((s) => {
      const price = Number(s.good.price);
      const positionTotal = Number((s.quantity * price).toFixed(2));
      return {
        saleId: s.saleId,
        checkNo: s.checkNo,
        dateSale: s.dateSale,
        quantity: s.quantity,
        goodId: s.good.goodId,
        goodName: s.good.name,
        price: price,
        deptId: s.good.department.deptId,
        deptName: s.good.department.name,
        positionTotal: positionTotal
      };
    });

    return res.json({
      success: true,
      count: formatted.length,
      data: formatted
    });
  } catch (err) {
    return next(err);
  }
});

// ============================================================================
// Модуль 2. Виклик збережених процедур із передачею параметрів
// ============================================================================

/**
 * 1. POST /api/departments
 * Виклик збереженої процедури insert_dept(new_name, new_info)
 * Body: { "name": "Sweets", "info": "Кондитерські вироби" }
 */
apiRouter.post("/departments", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { name, info } = req.body;
    if (!name || typeof name !== "string") {
      return res.status(400).json({
        success: false,
        message: "Поле 'name' обов'язкове (рядок)"
      });
    }

    // Виклик процедури через PL/SQL анонімний блок
    if (info !== undefined && info !== null && String(info).trim() !== "") {
      await AppDataSource.query(
        `BEGIN insert_dept(:name, :info); END;`,
        [name.trim(), String(info).trim()]
      );
    } else {
      await AppDataSource.query(
        `BEGIN insert_dept(:name); END;`,
        [name.trim()]
      );
    }

    // Отримання щойно створеного відділу
    const deptRepo = AppDataSource.getRepository(Department);
    const createdDept = await deptRepo.findOne({
      where: { name: name.trim() },
      order: { deptId: "DESC" }
    });

    return res.status(201).json({
      success: true,
      message: "Відділ успішно створено через збережену процедуру insert_dept",
      data: createdDept
    });
  } catch (err) {
    return next(err);
  }
});

/**
 * 2. POST /api/sales
 * Виклик збереженої процедури ins_sale(new_check, new_good_id, SYSDATE, need_quantity)
 * Body: { "checkNo": 1050, "goodId": 1, "quantity": 5 }
 */
apiRouter.post("/sales", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { checkNo, goodId, quantity } = req.body;
    const checkNum = Number(checkNo);
    const gId = Number(goodId);
    const qty = Number(quantity || 1);

    if (isNaN(checkNum) || isNaN(gId) || isNaN(qty) || qty <= 0) {
      return res.status(400).json({
        success: false,
        message: "Необхідно вказати коректні 'checkNo', 'goodId' та 'quantity' (> 0)"
      });
    }

    // Виклик збереженої процедури
    await AppDataSource.query(
      `BEGIN ins_sale(:checkNo, :goodId, SYSDATE, :quantity); END;`,
      [checkNum, gId, qty]
    );

    // Отримання оновленого стану товару
    const goodRepo = AppDataSource.getRepository(Good);
    const updatedGood = await goodRepo.findOne({
      where: { goodId: gId },
      relations: { department: true }
    });

    // Отримання продажів по цьому чеку
    const saleRepo = AppDataSource.getRepository(Sale);
    const checkSales = await saleRepo.find({
      where: { checkNo: checkNum },
      relations: { good: true },
      order: { saleId: "ASC" }
    });

    return res.status(201).json({
      success: true,
      message: "Продаж успішно оформлено через збережену процедуру ins_sale",
      updatedGood,
      checkSales
    });
  } catch (err) {
    return next(err);
  }
});

/**
 * 3. DELETE /api/workers/low-sales
 * Виклик процедури del_workers_low_sales(min_sales_amount)
 * Query / Body: { "minSalesAmount": 100 }
 */
apiRouter.delete("/workers/low-sales", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const minSales = Number(req.body.minSalesAmount ?? req.query.minSalesAmount ?? 100);
    if (isNaN(minSales)) {
      return res.status(400).json({
        success: false,
        message: "Параметр 'minSalesAmount' має бути числовим значенням"
      });
    }

    // Виклик збереженої процедури
    await AppDataSource.query(
      `BEGIN del_workers_low_sales(:minSalesAmount); END;`,
      [minSales]
    );

    // Отримання списку співробітників, що залишилися
    const workerRepo = AppDataSource.getRepository(Worker);
    const remainingWorkers = await workerRepo.find({
      relations: { department: true },
      order: { workerId: "ASC" }
    });

    return res.json({
      success: true,
      message: `Співробітників у відділах з продажами менше ${minSales} успішно видалено через del_workers_low_sales`,
      minSalesAmount: minSales,
      remainingCount: remainingWorkers.length,
      remainingWorkers
    });
  } catch (err) {
    return next(err);
  }
});

/**
 * 4. POST /api/reports/producer-summary
 * Виклик курсорної процедури fill_producer_report та повернення сформованого звіту
 */
apiRouter.post("/reports/producer-summary", async (req: Request, res: Response, next: NextFunction) => {
  try {
    // 1. Виклик процедури
    await AppDataSource.query(`BEGIN fill_producer_report; END;`);

    // 2. Читання сформованої таблиці
    const reportRepo = AppDataSource.getRepository(ProducerReport);
    const report = await reportRepo.find({
      order: { rowId: "ASC" }
    });

    return res.json({
      success: true,
      message: "Звіт по виробниках сформовано через збережену процедуру fill_producer_report",
      rowCount: report.length,
      data: report
    });
  } catch (err) {
    return next(err);
  }
});

// ============================================================================
// Модуль 3. Виконання збережених функцій із виведенням результату
// ============================================================================

/**
 * 1. GET /api/analytics/less-than-avg
 * Виклик функції LESS_THAN_AVG()
 * SELECT ROUND(AVG(Price), 2) AS "avgPrice", LESS_THAN_AVG() AS "countBelowAvg" FROM Goods
 */
apiRouter.get("/analytics/less-than-avg", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const rawResult = await AppDataSource.query(
      `SELECT ROUND(AVG(Price), 2) AS "avgPrice", LESS_THAN_AVG() AS "countBelowAvg" FROM Goods`
    );

    const row = rawResult[0] || {};
    return res.json({
      avgPrice: Number(row.avgPrice ?? row.AVGPRICE ?? 0),
      countBelowAvg: Number(row.countBelowAvg ?? row.COUNTBELOWAVG ?? 0)
    });
  } catch (err) {
    return next(err);
  }
});

/**
 * 2. GET /api/analytics/count-under-price?price=100
 * Виклик функції count_goods(new_price)
 * SELECT count_goods(:price) AS "count" FROM dual
 */
apiRouter.get("/analytics/count-under-price", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const price = Number(req.query.price ?? 100);
    if (isNaN(price)) {
      return res.status(400).json({
        success: false,
        message: "Query-параметр 'price' повинен бути числом"
      });
    }

    const rawResult = await AppDataSource.query(
      `SELECT count_goods(:price) AS "count" FROM dual`,
      [price]
    );

    const count = Number(rawResult[0]?.count ?? rawResult[0]?.COUNT ?? 0);
    return res.json({
      maxPrice: price,
      goodsCount: count
    });
  } catch (err) {
    return next(err);
  }
});

/**
 * 3. GET /api/analytics/low-weekly-sales?maxSum=200
 * Виклик функції get_depts_low_weekly_sales(max_sum)
 * SELECT get_depts_low_weekly_sales(:maxSum) AS "departments" FROM dual
 */
apiRouter.get("/analytics/low-weekly-sales", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const maxSum = Number(req.query.maxSum ?? 200);
    if (isNaN(maxSum)) {
      return res.status(400).json({
        success: false,
        message: "Query-параметр 'maxSum' повинен бути числом"
      });
    }

    const rawResult = await AppDataSource.query(
      `SELECT get_depts_low_weekly_sales(:maxSum) AS "departments" FROM dual`,
      [maxSum]
    );

    const depts = String(rawResult[0]?.departments ?? rawResult[0]?.DEPARTMENTS ?? "");
    return res.json({
      maxSum,
      departments: depts
    });
  } catch (err) {
    return next(err);
  }
});

// ============================================================================
// Модуль 4. Перехоплення та обробка виключень сервера БД
// ============================================================================

/**
 * 1. PATCH /api/goods/:id/price
 * Виклик збереженої процедури change_good_price(p_good_id, p_new_price)
 * Параметри: :id в URL, Body { "newPrice": 450 }
 */
apiRouter.patch("/goods/:id/price", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const goodId = Number(req.params.id);
    const newPrice = Number(req.body.newPrice);

    if (isNaN(goodId)) {
      return res.status(400).json({
        success: false,
        message: "Некоректний ID товару в URL"
      });
    }

    if (isNaN(newPrice)) {
      return res.status(400).json({
        success: false,
        message: "Поле 'newPrice' у тілі запиту обов'язкове (число)"
      });
    }

    const goodRepo = AppDataSource.getRepository(Good);
    const goodBefore = await goodRepo.findOneBy({ goodId });
    const oldPrice = goodBefore ? Number(goodBefore.price) : null;

    // Виклик процедури БД (при порушенні правил згенерує ORA-20010..ORA-20015)
    await AppDataSource.query(
      `BEGIN change_good_price(:goodId, :newPrice); END;`,
      [goodId, newPrice]
    );

    // Успішне оновлення (200 OK)
    const updatedGood = await goodRepo.findOne({
      where: { goodId },
      relations: { department: true }
    });

    return res.json({
      success: true,
      message: "Ціну товару успішно змінено",
      goodId,
      name: updatedGood?.name,
      oldPrice,
      newPrice,
      good: updatedGood
    });
  } catch (err) {
    return next(err);
  }
});

/**
 * 2. POST /api/goods/discount
 * Виклик збереженої процедури Discount(G_name, Price1)
 * Body: { "name": "Хамон", "discountAmount": 500 }
 */
apiRouter.post("/goods/discount", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { name, discountAmount } = req.body;
    const discount = Number(discountAmount);

    if (!name || typeof name !== "string") {
      return res.status(400).json({
        success: false,
        message: "Поле 'name' обов'язкове (назва товару для пошуку)"
      });
    }

    if (isNaN(discount) || discount <= 0) {
      return res.status(400).json({
        success: false,
        message: "Поле 'discountAmount' обов'язкове (число > 0)"
      });
    }

    // Виклик процедури БД (при порушенні правил згенерує ORA-20001..ORA-20003)
    await AppDataSource.query(
      `BEGIN Discount(:name, :discountAmount); END;`,
      [name.trim(), discount]
    );

    // Отримання оновленого товару
    const goodRepo = AppDataSource.getRepository(Good);
    const updatedGood = await goodRepo
      .createQueryBuilder("good")
      .where("UPPER(good.name) LIKE :pattern", { pattern: `%${name.trim().toUpperCase()}%` })
      .leftJoinAndSelect("good.department", "department")
      .getOne();

    return res.json({
      success: true,
      message: `Знижку у розмірі ${discount} успішно застосовано до товару '${name}'`,
      good: updatedGood
    });
  } catch (err) {
    return next(err);
  }
});
