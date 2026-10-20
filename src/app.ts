import "reflect-metadata";
import express, { Request, Response } from "express";
import cors from "cors";
import dotenv from "dotenv";
import swaggerUi from "swagger-ui-express";
import { AppDataSource } from "./config/data-source";
import { swaggerDocument } from "./config/swagger";
import { apiRouter } from "./routes/api.routes";
import { oracleErrorHandler } from "./middlewares/oracleErrorHandler";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middlewares
app.use(cors());
app.use(express.json());

// Root endpoint: quick overview and link to /api-docs
app.get("/", (req: Request, res: Response) => {
  return res.json({
    status: "ok",
    message: "Oracle Shop REST API is running. Visit /api-docs for interactive Swagger UI documentation.",
    swaggerDocs: `http://localhost:${PORT}/api-docs`
  });
});

// Swagger UI documentation
app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerDocument, {
  customSiteTitle: "Oracle Shop REST API - Swagger UI",
  customCss: ".swagger-ui .topbar { display: block; }"
}));

// API Routes
app.use("/api", apiRouter);

// Centralized error handling (captures Oracle ORA-20xxx exceptions)
app.use(oracleErrorHandler);

// Start server
async function startServer() {
  try {
    console.log("Connecting to Oracle Database...");
    await AppDataSource.initialize();
    console.log("Oracle Database connected successfully (Thin Mode).");

    app.listen(PORT, () => {
      console.log(`Server is running at http://localhost:${PORT}`);
      console.log(`Swagger UI is available at http://localhost:${PORT}/api-docs`);
    });
  } catch (err) {
    console.error("Failed to start server:", err);
    process.exit(1);
  }
}

startServer();

export default app;
