import express, { Router } from 'express';
import { TutorialAgent } from '../agent/core/agent';

const router = Router();
const agent = new TutorialAgent();

router.post('/chat', (req: express.Request, res: express.Response) => {
  const { message, userId, appState } = req.body;
  
  if (!message) return res.status(400).json({ error: 'Message is required' });

  return agent
    .processMessage(message, userId || 'default', appState || {})
    .then(response => res.json(response))
    .catch(error => {
      console.error('Error processing message:', error);
      return res.status(500).json({ error: 'Internal server error' });
    });
});

router.get('/progress/:userId', (req: express.Request, res: express.Response) => {
  const { userId } = req.params;
  return res.json(agent.getUserProgress(userId));
});

export { router as agentRoutes };

