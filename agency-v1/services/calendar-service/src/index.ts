import express from "express";
import cors from "cors";
import helmet from "helmet";
import { prisma } from "@agency/database";
import { calendarRouter } from "./routes/calendar.routes";
import { errorHandler } from "./middlewares/calendar.middleware";

const app = express();
const port = process.env.PORT || 4008;

app.use(helmet());
app.use(cors());
app.use(express.json());

app.get("/health", (_req, res) => {
  res.status(200).json({ status: "ok", service: "calendar-service" });
});

app.get("/ready", async (_req, res) => {
  try {
    await prisma.$queryRaw`SELECT 1`;
    res.json({ status: "ready" });
  } catch (err) {
    res.status(503).json({ status: "not_ready", error: String(err) });
  }
});

app.use("/api", calendarRouter);
app.use(errorHandler);

app.listen(port, () => {
  console.log(`Calendar Service listening at http://localhost:${port}`);
});

export default app;
