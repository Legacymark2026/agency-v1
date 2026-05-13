import express from 'express';
import cors from 'cors';
import helmet from 'helmet';

const app = express();
const port = process.env.PORT || 4011;

app.use(helmet());
app.use(cors());
app.use(express.json());

app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok', service: 'document-service' });
});

app.use('/api/proposals', (req, res) => { res.status(200).json({ message: '/api/proposals handled by document-service' }); });
app.use('/api/propuesta', (req, res) => { res.status(200).json({ message: '/api/propuesta handled by document-service' }); });
app.use('/api/kb', (req, res) => { res.status(200).json({ message: '/api/kb handled by document-service' }); });

app.listen(port, () => {
  console.log(`Document Service listening at http://localhost:${port}`);
});
