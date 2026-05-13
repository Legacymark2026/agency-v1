import express from 'express';
import cors from 'cors';
import helmet from 'helmet';

const app = express();
const port = process.env.PORT || 4010;

app.use(helmet());
app.use(cors());
app.use(express.json());

app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok', service: 'integration-service' });
});

app.use('/api/integrations', (req, res) => { res.status(200).json({ message: '/api/integrations handled by integration-service' }); });
app.use('/api/webhooks', (req, res) => { res.status(200).json({ message: '/api/webhooks handled by integration-service' }); });

app.listen(port, () => {
  console.log(`Integration Service listening at http://localhost:${port}`);
});
