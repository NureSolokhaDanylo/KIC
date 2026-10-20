import "reflect-metadata";
import { DataSource } from "typeorm";
import oracledb from "oracledb";
import dotenv from "dotenv";
import { Department } from "../entities/Department";
import { Worker } from "../entities/Worker";
import { Good } from "../entities/Good";
import { Sale } from "../entities/Sale";
import { ProducerReport } from "../entities/ProducerReport";

dotenv.config();

// Auto-fetch CLOBs as strings in oracledb
if (oracledb.fetchAsString) {
  oracledb.fetchAsString = [oracledb.CLOB];
}

export const AppDataSource = new DataSource({
  type: "oracle",
  connectString: process.env.ORACLE_CONNECT_STRING || "localhost:1521/freepdb1",
  username: process.env.ORACLE_USER || "SYSTEM",
  password: process.env.ORACLE_PASSWORD || "YourStrongPassword123!",
  synchronize: false,
  logging: false,
  entities: [Department, Worker, Good, Sale, ProducerReport]
});
