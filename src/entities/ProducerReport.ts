import { Entity, PrimaryColumn, Column } from "typeorm";

@Entity({ name: "PRODUCER_REPORT" })
export class ProducerReport {
  @PrimaryColumn({ name: "ROW_ID", type: "number" })
  rowId: number;

  @Column({ name: "GROUP_NAME", type: "varchar2", length: 40, nullable: true })
  groupName: string | null;

  @Column({ name: "GOOD_NAME", type: "varchar2", length: 30, nullable: true })
  goodName: string | null;

  @Column({ name: "BATCH_COST", type: "number", precision: 12, scale: 2, nullable: true })
  batchCost: number | null;
}
