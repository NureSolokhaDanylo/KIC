import { Entity, PrimaryColumn, Column, ManyToOne, OneToMany, JoinColumn } from "typeorm";
import { Department } from "./Department";
import { Sale } from "./Sale";

@Entity({ name: "GOODS" })
export class Good {
  @PrimaryColumn({ name: "GOOD_ID", type: "number" })
  goodId: number;

  @Column({ name: "DEPT_ID", type: "number" })
  deptId: number;

  @Column({ name: "NAME", type: "varchar2", length: 20 })
  name: string;

  @Column({ name: "PRICE", type: "number", precision: 10, scale: 2 })
  price: number;

  @Column({ name: "QUANTITY", type: "int" })
  quantity: number;

  @Column({ name: "PRODUCER", type: "varchar2", length: 20, nullable: true })
  producer: string | null;

  @Column({ name: "DESCRIPTION", type: "varchar2", length: 50, nullable: true })
  description: string | null;

  @Column({ name: "EXTRA_INFO", type: "clob", nullable: true })
  extraInfo: string | null;

  @ManyToOne(() => Department, (dept) => dept.goods)
  @JoinColumn({ name: "DEPT_ID" })
  department: Department;

  @OneToMany(() => Sale, (sale) => sale.good)
  sales: Sale[];
}
