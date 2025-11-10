import './config/env';
import express from 'express';
import cors from 'cors';
import { agentRoutes } from './api/routes';

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

app.use('/api', agentRoutes);

app.get('/health', (req: express.Request, res: express.Response) => 
  res.json({ status: 'ok' })
);

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

