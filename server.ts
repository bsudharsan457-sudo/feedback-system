import express, { Request, Response } from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import {
  getAllFeedbacks,
  addFeedback,
  deleteFeedback,
  replyFeedback,
  getFeedbackSummary,
  resetAndSeed,
  executeRawSql,
  getSqliteSchema,
} from './src/server/db.ts';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const PORT = Number(process.env.PORT) || 3000;

  app.use(express.json());

  // API Routes
  // 1. Get all feedbacks with optional filters
  app.get('/api/feedbacks', async (req: Request, res: Response) => {
    try {
      const rating = req.query.rating ? Number(req.query.rating) : undefined;
      const category = req.query.category ? String(req.query.category) : undefined;
      const search = req.query.search ? String(req.query.search) : undefined;

      const feedbacks = await getAllFeedbacks({ rating, category, search });
      res.json({ success: true, data: feedbacks });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message || 'Failed to fetch feedbacks' });
    }
  });

  // 2. Submit new feedback with response validation
  app.post('/api/feedbacks', async (req: Request, res: Response) => {
    try {
      const { customer_name, email, rating, category, feedback } = req.body;

      // Backend validation
      if (!customer_name || typeof customer_name !== 'string' || customer_name.trim().length < 2) {
        return res.status(400).json({
          success: false,
          error: 'Customer name is required and must be at least 2 characters.',
        });
      }

      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!email || !emailRegex.test(email.trim())) {
        return res.status(400).json({
          success: false,
          error: 'A valid email address is required (e.g. user@example.com).',
        });
      }

      const ratingNum = Number(rating);
      if (!ratingNum || isNaN(ratingNum) || ratingNum < 1 || ratingNum > 5) {
        return res.status(400).json({
          success: false,
          error: 'Please select a rating between 1 and 5 stars.',
        });
      }

      if (!feedback || typeof feedback !== 'string' || feedback.trim().length < 10) {
        return res.status(400).json({
          success: false,
          error: 'Feedback comments must be at least 10 characters long.',
        });
      }

      const newRecord = await addFeedback({
        customer_name: customer_name.trim(),
        email: email.trim().toLowerCase(),
        rating: ratingNum,
        category: category || 'General',
        feedback: feedback.trim(),
      });

      res.status(201).json({
        success: true,
        message: 'Feedback submitted successfully to SQLite database!',
        data: newRecord,
      });
    } catch (err: any) {
      res.status(400).json({ success: false, error: err.message || 'Validation error' });
    }
  });

  // 3. Overall Feedback Summary (Total count, average rating, 5/4/3/2/1 star breakdown, recent feedbacks)
  app.get('/api/summary', async (_req: Request, res: Response) => {
    try {
      const summary = await getFeedbackSummary();
      res.json({ success: true, data: summary });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message || 'Failed to fetch summary' });
    }
  });

  // 4. Delete feedback
  app.delete('/api/feedbacks/:id', async (req: Request, res: Response) => {
    try {
      const id = Number(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ success: false, error: 'Invalid ID' });
      }
      await deleteFeedback(id);
      res.json({ success: true, message: `Feedback #${id} deleted from SQLite database.` });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  // 5. Admin Reply
  app.post('/api/feedbacks/:id/reply', async (req: Request, res: Response) => {
    try {
      const id = Number(req.params.id);
      const { reply } = req.body;
      if (!reply || !reply.trim()) {
        return res.status(400).json({ success: false, error: 'Reply text cannot be empty' });
      }
      await replyFeedback(id, reply.trim());
      res.json({ success: true, message: 'Admin reply saved successfully.' });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  // 6. Reset & Seed sample data
  app.post('/api/reset-seed', async (_req: Request, res: Response) => {
    try {
      await resetAndSeed();
      const summary = await getFeedbackSummary();
      res.json({
        success: true,
        message: 'Database re-seeded with realistic customer feedbacks!',
        data: summary,
      });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  // 7. Interactive SQLite Query Console (for College Viva & Demonstration)
  app.post('/api/sqlite/query', async (req: Request, res: Response) => {
    try {
      const { query } = req.body;
      if (!query || typeof query !== 'string') {
        return res.status(400).json({ success: false, error: 'SQL query string is required' });
      }
      const result = await executeRawSql(query);
      res.json({ success: true, result });
    } catch (err: any) {
      res.status(400).json({ success: false, error: err.message });
    }
  });

  // 8. SQLite Schema Inspector
  app.get('/api/sqlite/schema', async (_req: Request, res: Response) => {
    try {
      const schema = await getSqliteSchema();
      res.json({ success: true, schema });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  // 9. Export feedbacks as CSV
  app.get('/api/export/csv', async (_req: Request, res: Response) => {
    try {
      const feedbacks = await getAllFeedbacks();
      const headers = ['ID', 'Customer Name', 'Email', 'Rating', 'Category', 'Sentiment', 'Feedback', 'Admin Reply', 'Created At'];
      const rows = feedbacks.map((f) => [
        f.id,
        `"${f.customer_name.replace(/"/g, '""')}"`,
        `"${f.email.replace(/"/g, '""')}"`,
        f.rating,
        `"${f.category.replace(/"/g, '""')}"`,
        `"${f.sentiment}"`,
        `"${f.feedback.replace(/"/g, '""')}"`,
        `"${(f.admin_reply || '').replace(/"/g, '""')}"`,
        `"${f.created_at}"`,
      ]);

      const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', 'attachment; filename="customer_feedbacks_sqlite.csv"');
      res.send(csvContent);
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  // Vite middleware in development
  const isProduction = process.env.NODE_ENV === 'production';
  if (!isProduction) {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    // Serve static files in production
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (_req: Request, res: Response) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 Customer Feedback System server running on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Fatal server startup error:', err);
  process.exit(1);
});
