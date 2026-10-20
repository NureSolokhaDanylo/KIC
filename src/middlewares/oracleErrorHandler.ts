import { Request, Response, NextFunction } from "express";

export interface OracleErrorResponse {
  success: false;
  source: string;
  oracleCode: string;
  errorNumber: number;
  message: string;
  rawOracleError: string;
}

const ORACLE_STATUS_MAP: Record<number, number> = {
  // Not found
  20001: 404, // No such good (Discount)
  20010: 404, // Товар із вказаним ID не знайдено (change_good_price)

  // Bad Request
  20011: 400, // Негативна ціна
  20012: 400, // Зниження ціни більше, ніж на 50%
  20013: 400, // Подорожчання

  // Unprocessable Entity
  20002: 422, // Low discount (< 10% when qty > 100)
  20003: 422, // Big discount (> 50% when qty < 10)
  20014: 422, // Знижка не потрібна (qty < 10)
  20015: 422, // Збільшити знижку на 10% (qty > 100 and discount 30-50%)
  20020: 422  // Не вистачає одиниць товару (ins_sale)
};

export function parseOracleError(err: any): { status: number; body: OracleErrorResponse } | null {
  const rawMessage: string =
    err?.driverError?.message ||
    err?.message ||
    (typeof err === "string" ? err : "");

  const errorNum: number | undefined =
    err?.driverError?.errorNum ||
    err?.errorNum ||
    err?.code;

  // Regex to extract ORA-20xxx and error message
  const match = rawMessage.match(/ORA-(\d{5}):\s*([^\n\r]+)/);
  if (!match) {
    return null;
  }

  const num = parseInt(match[1], 10);
  // Check if it's a user PL/SQL error (-20000 to -20999)
  if (num >= 20000 && num <= 20999) {
    const status = ORACLE_STATUS_MAP[num] || 422;
    return {
      status,
      body: {
        success: false,
        source: "Oracle PL/SQL Exception",
        oracleCode: `ORA-${num}`,
        errorNumber: num,
        message: match[2].trim(),
        rawOracleError: rawMessage.trim()
      }
    };
  }

  return null;
}

export function oracleErrorHandler(err: any, req: Request, res: Response, next: NextFunction) {
  const parsed = parseOracleError(err);
  if (parsed) {
    return res.status(parsed.status).json(parsed.body);
  }

  // Not a custom Oracle PL/SQL exception
  console.error("Unhandled error:", err);
  return res.status(500).json({
    success: false,
    message: err?.message || "Internal server error",
    details: err?.toString()
  });
}
