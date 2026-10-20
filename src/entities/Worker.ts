import { Entity, PrimaryColumn, Column, ManyToOne, JoinColumn } from "typeorm";
import { Department } from "./Department";

@Entity({ name: "WORKERS" })
export class Worker {
  @PrimaryColumn({ name: "WORKER_ID", type: "number" })
  workerId: number;

  @Column({ name: "NAME", type: "varchar2", length: 20 })
  name: string;

  @Column({ name: "ADDRESS", type: "varchar2", length: 40, nullable: true })
  address: string | null;

  @Column({ name: "DEPT_ID", type: "number" })
  deptId: number;

  @Column({ name: "INFORMATION", type: "varchar2", length: 40, nullable: true })
  information: string | null;

  @ManyToOne(() => Department, (dept) => dept.workers)
  @JoinColumn({ name: "DEPT_ID" })
  department: Department;
}
