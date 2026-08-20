// Observability registration — must be first
try {
  require("@agency/observability/register");
} catch { /* observability optional */ }
import { metricsMiddleware, metricsEndpoint } from "@agency/observability";
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { setupGracefulShutdown } from "@agency/service-auth";
import { agentTeamRouter } from './routes/agent-team.routes';
import { errorHandler } from './middlewares/agent-team.middleware';

const app = express();
app.use(metricsMiddleware("agent-team-engine"));
app.get("/metrics", metricsEndpoint);
const port = process.env.PORT || 4012;

app.use(helmet());
app.use(cors());
app.use(express.json());

app.get('/health', (_req, res) => {
  res.status(200).json({ status: 'ok', service: 'agent-team-engine' });
});

app.use('/api/v1', agentTeamRouter);
app.use(errorHandler);

const server = app.listen(port, () => {
  console.log(`Agent Team Engine listening at http://localhost:${port}`);
});
setupGracefulShutdown(server);
