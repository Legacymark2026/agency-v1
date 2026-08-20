// Observability registration — must be first
try {
  require("@agency/observability/register");
} catch { /* observability optional */ }
import { metricsMiddleware, metricsEndpoint } from "@agency/observability";
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { setupGracefulShutdown } from "@agency/service-auth";

const app = express();
app.use(metricsMiddleware("public-api-service"));
app.get("/metrics", metricsEndpoint);
const port = process.env.PORT || 4015;

app.use(helmet());
app.use(cors());
app.use(express.json());

app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok', service: 'public-api-service' });
});

import { publicApiRouter } from "./routes/public-api.routes";
import { errorHandler } from "./middlewares/public-api.middleware";

app.use("/api/v1", publicApiRouter);
app.use(errorHandler);

const server = app.listen(port, () => {
  console.log(`Public API Service listening at http://localhost:${port}`);
});
setupGracefulShutdown(server);
