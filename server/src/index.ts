import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { Bindings } from './types';
import catalogRouter from './routes/catalog';
import eventsRouter from './routes/events';
import ticketsRouter from './routes/tickets';
import gatekeeperRouter from './routes/gatekeeper';

const app = new Hono<{ Bindings: Bindings }>();

// Global CORS Middleware
app.use('*', cors({
  origin: '*',
  allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowHeaders: ['Content-Type', 'Authorization', 'x-app-role']
}));

// Health Check
app.get('/api/health', (c) => {
  return c.json({
    status: 'ok',
    service: 'Desafio Elite Dev Hono API (Cloudflare Workers)',
    version: '2.0.0',
    runtime: 'Cloudflare Edge V8 Isolates'
  });
});

// Mount Modular Sub-Routers
app.route('/api', catalogRouter);
app.route('/api', eventsRouter);
app.route('/api', ticketsRouter);
app.route('/api', gatekeeperRouter);

export default app;
