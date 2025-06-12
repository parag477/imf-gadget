import express from 'express';
import cors from 'cors';
import fs from 'fs';
import path from 'path';
import swaggerUi from 'swagger-ui-express';
import { auth } from './utils/auth.js';
import gadgetsRouter from './routes/gadgets.js';
import authRouter from './routes/auth.js';

const swaggerDocument = JSON.parse(fs.readFileSync(path.resolve('./swagger.json'), 'utf-8'));
const app = express();

app.use(cors());
app.use(express.json());

app.use('/auth', authRouter);
app.use('/gadgets', auth(), gadgetsRouter);

app.use('/docs', 
  swaggerUi.serve,
  swaggerUi.setup(swaggerDocument, {
    customCss: '.swagger-ui .topbar { display: none }',
    customSiteTitle: 'IMF Gadget API Documentation'
  })
);

app.get('/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development'
  });
});

app.get('/docs.json', (req, res) => {
  res.setHeader('Content-Type', 'application/json');
  res.send(swaggerDocument);
});

app.use((req, res) => {
  res.status(404).json({ error: 'Not found' });
});

app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(500).json({ error: 'Internal server error' });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Backend running on port ${PORT}`);
  console.log(`API Documentation: http://localhost:${PORT}/docs`);
});
