import express from 'express';
import cors from 'cors';
import helmet from 'helmet';

const app = express();
const port = process.env.PORT || 4012;

app.use(helmet());
app.use(cors());
app.use(express.json());

app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok', service: 'agent-team-engine' });
});

app.use('/api/agent', (req, res) => { res.status(200).json({ message: '/api/agent handled by agent-team-engine' }); });
app.use('/api/test-flow', (req, res) => { res.status(200).json({ message: '/api/test-flow handled by agent-team-engine' }); });

app.listen(port, () => {
  console.log(`Agent Team Engine listening at http://localhost:${port}`);
});
