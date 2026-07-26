import express from 'express';
import cors from 'cors';
import helmet from 'helmet';

const app = express();
const port = process.env.PORT || 4015;

app.use(helmet());
app.use(cors());
app.use(express.json());

app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok', service: 'public-api-service' });
});

import { publicApiRouter } from "./routes/public-api.routes";
import { errorHandler } from "./middlewares/public-api.middleware";

app.use("/api", publicApiRouter);
app.use(errorHandler);

app.listen(port, () => {
  console.log(`Public API Service listening at http://localhost:${port}`);
});
