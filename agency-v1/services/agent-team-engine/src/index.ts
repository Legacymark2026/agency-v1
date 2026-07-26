import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { agentTeamRouter } from './routes/agent-team.routes';
import { errorHandler } from './middlewares/agent-team.middleware';

const app = express();
const port = process.env.PORT || 4012;

app.use(helmet());
app.use(cors());
app.use(express.json());

app.get('/health', (_req, res) => {
  res.status(200).json({ status: 'ok', service: 'agent-team-engine' });
});

app.use('/api', agentTeamRouter);
app.use(errorHandler);

app.listen(port, () => {
  console.log(`Agent Team Engine listening at http://localhost:${port}`);
});
