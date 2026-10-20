import { Entity, PrimaryColumn, Column, OneToMany } from "typeorm";
import { Good } from "./Good";
import { Worker } from "./Worker";

@Entity({ name: "DEPARTMENTS" })
export class Department {
  @PrimaryColumn({ name: "DEPT_ID", type: "number" })
  deptId: number;

  @Column({ name: "NAME", type: "varchar2", length: 20 })
  name: string;

  @Column({ name: "INFO", type: "varchar2", length: 40, nullable: true })
  info: string | null;

  @OneToMany(() => Good, (good) => good.department)
  goods: Good[];

  @OneToMany(() => Worker, (worker) => worker.department)
  workers: Worker[];
}
