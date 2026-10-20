import { Entity, PrimaryColumn, Column, ManyToOne, JoinColumn } from "typeorm";
import { Good } from "./Good";

@Entity({ name: "SALES" })
export class Sale {
  @PrimaryColumn({ name: "SALE_ID", type: "number" })
  saleId: number;

  @Column({ name: "CHECK_NO", type: "number", precision: 6, scale: 0, nullable: true })
  checkNo: number | null;

  @Column({ name: "GOOD_ID", type: "number" })
  goodId: number;

  @Column({ name: "DATE_SALE", type: "date" })
  dateSale: Date;

  @Column({ name: "QUANTITY", type: "int" })
  quantity: number;

  @ManyToOne(() => Good, (good) => good.sales)
  @JoinColumn({ name: "GOOD_ID" })
  good: Good;
}
