export const swaggerDocument = {
  openapi: "3.0.0",
  info: {
    title: "Oracle Shop REST API (Лабораторна робота № 4)",
    version: "1.0.0",
    description:
      "Клієнт-серверне застосування (REST API) на TypeScript + Express + TypeORM для роботи з СУБД Oracle 23ai.\n\n" +
      "Демонструє виконання 4 обов'язкових пунктів ЛР № 4:\n" +
      "1. Перегляд інформації з пов'язаних таблиць (ORM Relations)\n" +
      "2. Виклик збережених процедур з передачею параметрів\n" +
      "3. Виконання збережених функцій з виведенням результатів\n" +
      "4. Перехоплення та обробка серверних виключень Oracle (ORA-20xxx)",
    contact: {
      name: "Назар Солоха (група ПЗПІ-23-10)"
    }
  },
  servers: [
    {
      url: "http://localhost:3000",
      description: "Локальний сервер Express"
    }
  ],
  tags: [
    {
      name: "1. Пов'язані таблиці (ORM Relations)",
      description: "Запити вибірки даних зі зв'язаних реляційних таблиць (TypeORM relations)"
    },
    {
      name: "2. Виклик збережених процедур (Stored Procedures)",
      description: "Параметризовані виклики PL/SQL процедур через анонімні блоки"
    },
    {
      name: "3. Виконання збережених функцій (Stored Functions)",
      description: "Виконання збережених функцій Oracle у SQL-запитах"
    },
    {
      name: "4. Обробка виключень сервера (PL/SQL Exceptions)",
      description: "Перехоплення серверних помилок RAISE_APPLICATION_ERROR (ORA-20001..20020) та формування зрозумілих HTTP-відповідей"
    }
  ],
  paths: {
    "/api/departments": {
      get: {
        tags: ["1. Пов'язані таблиці (ORM Relations)"],
        summary: "1.1 Отримати список відділів із товарами та працівниками",
        description: "Повертає всі записи таблиці DEPARTMENTS разом із зв'язаними записами GOODS (@OneToMany) та WORKERS (@OneToMany).",
        responses: {
          "200": {
            description: "Список відділів зі зв'язаними сутностями",
            content: {
              "application/json": {
                example: {
                  success: true,
                  count: 6,
                  data: [
                    {
                      deptId: 1,
                      name: "Fruits",
                      info: null,
                      goods: [
                        {
                          goodId: 1,
                          name: "Яблука Голден",
                          price: 35.5,
                          quantity: 120,
                          producer: "Україна",
                          description: "Солодкі жовті яблука"
                        }
                      ],
                      workers: [
                        {
                          workerId: 101,
                          name: "Іваненко І.І.",
                          address: "вул. Сумська, 12",
                          information: "Старший продавець"
                        }
                      ]
                    }
                  ]
                }
              }
            }
          }
        }
      },
      post: {
        tags: ["2. Виклик збережених процедур (Stored Procedures)"],
        summary: "2.1 Створення відділу через збережену процедуру insert_dept",
        description: "Викликає процедуру insert_dept(new_name, new_info). Значення Dept_id генерується послідовністю SEQ_DEPT.NEXTVAL.",
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["name"],
                properties: {
                  name: { type: "string", example: "Sweets" },
                  info: { type: "string", example: "Кондитерські вироби" }
                }
              },
              examples: {
                withInfo: {
                  summary: "З назвою та описом",
                  value: { name: "Sweets", info: "Кондитерські вироби" }
                },
                defaultInfo: {
                  summary: "Тільки назва (опис за замовчуванням)",
                  value: { name: "Grocery" }
                }
              }
            }
          }
        },
        responses: {
          "201": {
            description: "Відділ успішно створено",
            content: {
              "application/json": {
                example: {
                  success: true,
                  message: "Відділ успішно створено через збережену процедуру insert_dept",
                  data: {
                    deptId: 7,
                    name: "Sweets",
                    info: "Кондитерські вироби"
                  }
                }
              }
            }
          },
          "400": { description: "Некоректне тіло запиту" }
        }
      }
    },
    "/api/goods": {
      get: {
        tags: ["1. Пов'язані таблиці (ORM Relations)"],
        summary: "1.2 Отримати список товарів із об'єктом відділу",
        description: "Повертає список товарів (GOODS) із вкладеним відділом (DEPARTMENTS через @ManyToOne). Підтримує фільтрацію за ?deptId=.",
        parameters: [
          {
            name: "deptId",
            in: "query",
            description: "Опціональний фільтр за ідентифікатором відділу",
            required: false,
            schema: { type: "integer", example: 2 }
          }
        ],
        responses: {
          "200": {
            description: "Список товарів",
            content: {
              "application/json": {
                example: {
                  success: true,
                  count: 9,
                  data: [
                    {
                      goodId: 2,
                      deptId: 2,
                      name: "Молоко 2.5%",
                      price: 42,
                      quantity: 50,
                      producer: "Ферма",
                      description: "Пастеризоване молоко",
                      extraInfo: {
                        color: "white",
                        weight: "0.9 kg",
                        dimensions: { length: 8, width: 8, height: 22 },
                        tags: ["eco", "popular"]
                      },
                      department: {
                        deptId: 2,
                        name: "Dairy",
                        info: "Молочна продукція"
                      }
                    }
                  ]
                }
              }
            }
          }
        }
      }
    },
    "/api/sales": {
      get: {
        tags: ["1. Пов'язані таблиці (ORM Relations)"],
        summary: "1.3 Отримати історію продажів (об'єднання SALES + GOODS + DEPARTMENTS)",
        description: "Повертає продажі з розрахунком суми позиції (quantity * price), назвою товару та назвою відділу.",
        responses: {
          "200": {
            description: "Історія продажів",
            content: {
              "application/json": {
                example: {
                  success: true,
                  count: 6,
                  data: [
                    {
                      saleId: 1,
                      checkNo: 1001,
                      dateSale: "2026-10-19T00:00:00.000Z",
                      quantity: 3,
                      goodId: 1,
                      goodName: "Яблука Голден",
                      price: 35.5,
                      deptId: 1,
                      deptName: "Fruits",
                      positionTotal: 106.5
                    }
                  ]
                }
              }
            }
          }
        }
      },
      post: {
        tags: ["2. Виклик збережених процедур (Stored Procedures)"],
        summary: "2.2 Оформлення продажу через збережену процедуру ins_sale",
        description: "Викликає ins_sale(new_check, new_good_id, SYSDATE, need_quantity). Процедура зменшує залишок товару в GOODS та додає запис у SALES.",
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["checkNo", "goodId", "quantity"],
                properties: {
                  checkNo: { type: "integer", example: 1050 },
                  goodId: { type: "integer", example: 1 },
                  quantity: { type: "integer", example: 5 }
                }
              },
              example: {
                checkNo: 1050,
                goodId: 1,
                quantity: 5
              }
            }
          }
        },
        responses: {
          "201": {
            description: "Продаж успішно зафіксовано",
            content: {
              "application/json": {
                example: {
                  success: true,
                  message: "Продаж успішно оформлено через збережену процедуру ins_sale",
                  updatedGood: {
                    goodId: 1,
                    name: "Яблука Голден",
                    quantity: 115,
                    price: 35.5
                  },
                  checkSales: [
                    {
                      saleId: 10,
                      checkNo: 1050,
                      goodId: 1,
                      quantity: 5
                    }
                  ]
                }
              }
            }
          },
          "422": {
            description: "Недостатній залишок товару на складі"
          }
        }
      }
    },
    "/api/workers/low-sales": {
      delete: {
        tags: ["2. Виклик збережених процедур (Stored Procedures)"],
        summary: "2.3 Видалення співробітників відділів із низькими продажами (del_workers_low_sales, Варіант 5)",
        description: "Викликає del_workers_low_sales(min_sales_amount). Видаляє співробітників (окрім менеджерів) у відділах, де сумарні продажі менше заданого порогу, та повертає список співробітників, що залишилися.",
        parameters: [
          {
            name: "minSalesAmount",
            in: "query",
            description: "Мінімальна сума продажів відділу (поріг)",
            required: false,
            schema: { type: "number", example: 100 }
          }
        ],
        requestBody: {
          required: false,
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  minSalesAmount: { type: "number", example: 100 }
                }
              },
              example: { minSalesAmount: 100 }
            }
          }
        },
        responses: {
          "200": {
            description: "Операцію успішно виконано, повернуто співробітників що залишилися",
            content: {
              "application/json": {
                example: {
                  success: true,
                  message: "Співробітників у відділах з продажами менше 100 успішно видалено через del_workers_low_sales",
                  minSalesAmount: 100,
                  remainingCount: 5,
                  remainingWorkers: [
                    {
                      workerId: 101,
                      name: "Іваненко І.І.",
                      information: "Старший продавець",
                      deptId: 1
                    }
                  ]
                }
              }
            }
          }
        }
      }
    },
    "/api/reports/producer-summary": {
      post: {
        tags: ["2. Виклик збережених процедур (Stored Procedures)"],
        summary: "2.4 Формування зведеного звіту по виробниках (fill_producer_report, Варіант 5)",
        description: "Викликає курсорну збережену процедуру fill_producer_report, яка обчислює партії товарів, підсумки по виробниках та загальний баланс магазину у таблиці PRODUCER_REPORT.",
        responses: {
          "200": {
            description: "Сформована зведена таблиця",
            content: {
              "application/json": {
                example: {
                  success: true,
                  message: "Звіт по виробниках сформовано через збережену процедуру fill_producer_report",
                  rowCount: 14,
                  data: [
                    {
                      rowId: 1,
                      groupName: "Іспанія",
                      goodName: "Хамон Іберіко",
                      batchCost: 4500
                    },
                    {
                      rowId: 2,
                      groupName: "Сумарна вартість товарів",
                      goodName: "-",
                      batchCost: 4500
                    },
                    {
                      rowId: 14,
                      groupName: "Підсумок",
                      goodName: "-",
                      batchCost: 172900
                    }
                  ]
                }
              }
            }
          }
        }
      }
    },
    "/api/analytics/less-than-avg": {
      get: {
        tags: ["3. Виконання збережених функцій (Stored Functions)"],
        summary: "3.1 Підрахунок товарів з ціною нижче середньої (LESS_THAN_AVG)",
        description: "Виконує SQL-запит: SELECT ROUND(AVG(Price), 2) AS \"avgPrice\", LESS_THAN_AVG() AS \"countBelowAvg\" FROM Goods",
        responses: {
          "200": {
            description: "Середня ціна та кількість товарів нижче середньої",
            content: {
              "application/json": {
                example: {
                  avgPrice: 394.44,
                  countBelowAvg: 4
                }
              }
            }
          }
        }
      }
    },
    "/api/analytics/count-under-price": {
      get: {
        tags: ["3. Виконання збережених функцій (Stored Functions)"],
        summary: "3.2 Кількість товарів дешевших за вказану ціну (count_goods)",
        description: "Виконує SQL-запит: SELECT count_goods(:price) AS \"count\" FROM dual",
        parameters: [
          {
            name: "price",
            in: "query",
            required: false,
            description: "Гранична ціна для пошуку",
            schema: { type: "number", example: 100 }
          }
        ],
        responses: {
          "200": {
            description: "Кількість товарів з ціною < price",
            content: {
              "application/json": {
                example: {
                  maxPrice: 100,
                  goodsCount: 4
                }
              }
            }
          }
        }
      }
    },
    "/api/analytics/low-weekly-sales": {
      get: {
        tags: ["3. Виконання збережених функцій (Stored Functions)"],
        summary: "3.3 Відділи з тижневими продажами нижче суми (get_depts_low_weekly_sales, Варіант 5)",
        description: "Виконує SQL-запит: SELECT get_depts_low_weekly_sales(:maxSum) AS \"departments\" FROM dual",
        parameters: [
          {
            name: "maxSum",
            in: "query",
            required: false,
            description: "Максимальна сума виручки відділу за останні 7 днів",
            schema: { type: "number", example: 200 }
          }
        ],
        responses: {
          "200": {
            description: "Перелік відділів через кому",
            content: {
              "application/json": {
                example: {
                  maxSum: 200,
                  departments: "Bakery, Beverages, Fruits"
                }
              }
            }
          }
        }
      }
    },
    "/api/goods/{id}/price": {
      patch: {
        tags: ["4. Обробка виключень сервера (PL/SQL Exceptions)"],
        summary: "4.1 Зміна ціни товару з перевіркою правил сервера (change_good_price, Варіант 5)",
        description:
          "Викликає збережену процедуру change_good_price(p_good_id, p_new_price).\n\n" +
          "**Тестові сценарії перевірки виключень:**\n" +
          "* **200 OK (Успіх):** `id=4`, `newPrice=450` (було 520 грн, знижка ~13.5%)\n" +
          "* **404 Not Found (ORA-20010):** `id=999`, `newPrice=100` («Товар із вказаним ID не знайдено»)\n" +
          "* **400 Bad Request (ORA-20011):** `id=4`, `newPrice=-50` («Негативна ціна»)\n" +
          "* **400 Bad Request (ORA-20013):** `id=4`, `newPrice=600` («Подорожчання»)\n" +
          "* **400 Bad Request (ORA-20012):** `id=4`, `newPrice=200` («Зниження ціни більше, ніж на 50%»)\n" +
          "* **422 Unprocessable Entity (ORA-20014):** `id=5`, `newPrice=800` («Знижка не потрібна», оскільки залишок < 10)\n" +
          "* **422 Unprocessable Entity (ORA-20015):** `id=8`, `newPrice=450` («Збільшити знижку на 10%», залишок > 100 та знижка 40%)",
        parameters: [
          {
            name: "id",
            in: "path",
            required: true,
            description: "Ідентифікатор товару (Good_id: 4 для Пармезан, 5 для Хамон, 8 для Лосось)",
            schema: { type: "integer", example: 4 }
          }
        ],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["newPrice"],
                properties: {
                  newPrice: { type: "number", example: 450 }
                }
              },
              examples: {
                successExample: {
                  summary: "200 OK — Коректна зміна (ID=4, 520 -> 450)",
                  value: { newPrice: 450 }
                },
                negPriceExample: {
                  summary: "400 Bad Request — ORA-20011 Негативна ціна",
                  value: { newPrice: -50 }
                },
                priceIncreaseExample: {
                  summary: "400 Bad Request — ORA-20013 Подорожчання",
                  value: { newPrice: 600 }
                },
                over50PercentExample: {
                  summary: "400 Bad Request — ORA-20012 Знижка > 50%",
                  value: { newPrice: 200 }
                },
                inc10PctExample: {
                  summary: "422 Unprocessable — ORA-20015 Збільшити знижку на 10% (для ID=8, 750 -> 450)",
                  value: { newPrice: 450 }
                },
                noDiscNeededExample: {
                  summary: "422 Unprocessable — ORA-20014 Знижка не потрібна (для ID=5, 900 -> 800)",
                  value: { newPrice: 800 }
                }
              }
            }
          }
        },
        responses: {
          "200": {
            description: "Ціну успішно оновлено",
            content: {
              "application/json": {
                example: {
                  success: true,
                  message: "Ціну товару успішно змінено",
                  goodId: 4,
                  name: "Сир Пармезан",
                  oldPrice: 520,
                  newPrice: 450,
                  good: {
                    goodId: 4,
                    name: "Сир Пармезан",
                    price: 450,
                    quantity: 50
                  }
                }
              }
            }
          },
          "400": {
            description: "Помилка валідації або бізнес-правил ціни (ORA-20011, ORA-20012, ORA-20013)",
            content: {
              "application/json": {
                example: {
                  success: false,
                  source: "Oracle PL/SQL Exception",
                  oracleCode: "ORA-20011",
                  errorNumber: 20011,
                  message: "Негативна ціна",
                  rawOracleError: "ORA-20011: Негативна ціна\nORA-06512: at \"SYSTEM.CHANGE_GOOD_PRICE\", line 28"
                }
              }
            }
          },
          "404": {
            description: "Товар не знайдено (ORA-20010)",
            content: {
              "application/json": {
                example: {
                  success: false,
                  source: "Oracle PL/SQL Exception",
                  oracleCode: "ORA-20010",
                  errorNumber: 20010,
                  message: "Товар із вказаним ID не знайдено",
                  rawOracleError: "ORA-20010: Товар із вказаним ID не знайдено\nORA-06512: at \"SYSTEM.CHANGE_GOOD_PRICE\", line 26"
                }
              }
            }
          },
          "422": {
            description: "Невідповідність умовам знижки (ORA-20014, ORA-20015)",
            content: {
              "application/json": {
                example: {
                  success: false,
                  source: "Oracle PL/SQL Exception",
                  oracleCode: "ORA-20015",
                  errorNumber: 20015,
                  message: "Збільшити знижку на 10%",
                  rawOracleError: "ORA-20015: Збільшити знижку на 10%\nORA-06512: at \"SYSTEM.CHANGE_GOOD_PRICE\", line 43"
                }
              }
            }
          }
        }
      }
    },
    "/api/goods/discount": {
      post: {
        tags: ["4. Обробка виключень сервера (PL/SQL Exceptions)"],
        summary: "4.2 Застосування знижки за назвою товару (Discount)",
        description:
          "Викликає збережену процедуру Discount(G_name, Price1).\n\n" +
          "**Тестові сценарії перевірки виключень:**\n" +
          "* **200 OK (Успіх):** `name='Молоко'`, `discountAmount=5` (знижка 5 грн для ціни 42 грн)\n" +
          "* **404 Not Found (ORA-20001):** `name='Ананас'`, `discountAmount=10` («No such good»)\n" +
          "* **422 Unprocessable Entity (ORA-20002):** `name='Яблука'`, `discountAmount=1` («Low discount» — залишок > 100 та знижка < 10%)\n" +
          "* **422 Unprocessable Entity (ORA-20003):** `name='Хамон'`, `discountAmount=500` («Big discount» — залишок < 10 та знижка > 50%)",
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["name", "discountAmount"],
                properties: {
                  name: { type: "string", example: "Хамон" },
                  discountAmount: { type: "number", example: 500 }
                }
              },
              examples: {
                bigDiscountError: {
                  summary: "422 — ORA-20003 Big discount (Хамон: залишок 5 < 10, знижка 500 > 50%)",
                  value: { name: "Хамон", discountAmount: 500 }
                },
                lowDiscountError: {
                  summary: "422 — ORA-20002 Low discount (Яблука: залишок 120 > 100, знижка 1 < 10%)",
                  value: { name: "Яблука", discountAmount: 1 }
                },
                notFoundError: {
                  summary: "404 — ORA-20001 No such good (Ананас)",
                  value: { name: "Ананас", discountAmount: 10 }
                },
                successCase: {
                  summary: "200 OK — Успішна знижка (Молоко, знижка 5 грн)",
                  value: { name: "Молоко", discountAmount: 5 }
                }
              }
            }
          }
        },
        responses: {
          "200": {
            description: "Знижку успішно застосовано",
            content: {
              "application/json": {
                example: {
                  success: true,
                  message: "Знижку у розмірі 5 успішно застосовано до товару 'Молоко'",
                  good: {
                    goodId: 2,
                    name: "Молоко 2.5%",
                    price: 37,
                    quantity: 50
                  }
                }
              }
            }
          },
          "404": {
            description: "Товар не знайдено (ORA-20001 No such good)"
          },
          "422": {
            description: "Невідповідність розміру знижки (ORA-20002 Low discount або ORA-20003 Big discount)"
          }
        }
      }
    }
  }
};
