import { metricsMiddleware, metricsEndpoint } from "@agency/observability";
import express from "express";
try {
  require("@agency/observability/register");
} catch { /* optional */ }
import cors from "cors";
import helmet from "helmet";
import { prisma } from "@agency/database";
import { calendarRouter } from "./routes/calendar.routes";
import { errorHandler } from "./middlewares/calendar.middleware";
import { setupGracefulShutdown } from "@agency/service-auth";

const app = express();
app.use(metricsMiddleware("calendar-service"));
app.get("/metrics", metricsEndpoint);
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

app.use("/api/v1", calendarRouter);
app.use(errorHandler);

const server = app.listen(port, () => {
  console.log(`Calendar Service listening at http://localhost:${port}`);
});
setupGracefulShutdown(server);

export default app;
