import express from 'express';
import cors from 'cors';
import helmet from 'helmet';

const app = express();
const port = process.env.PORT || 4008;

app.use(helmet());
app.use(cors());
app.use(express.json());

app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok', service: 'calendar-service' });
});

app.use('/api/calendar', (req, res) => { res.status(200).json({ message: '/api/calendar handled by calendar-service' }); });
app.use('/api/scheduling', (req, res) => { res.status(200).json({ message: '/api/scheduling handled by calendar-service' }); });

app.listen(port, () => {
  console.log(`Calendar Service listening at http://localhost:${port}`);
});
