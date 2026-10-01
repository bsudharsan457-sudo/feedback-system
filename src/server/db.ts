import fs from 'fs';
import path from 'path';
import initSqlJs, { Database, SqlJsStatic } from 'sql.js';

let SQL: SqlJsStatic | null = null;
let db: Database | null = null;

const DATA_DIR = path.resolve(process.cwd(), 'data');
const DB_FILE = path.resolve(DATA_DIR, 'feedback.sqlite');

export interface FeedbackRecord {
  id: number;
  customer_name: string;
  email: string;
  rating: number;
  category: string;
  feedback: string;
  sentiment: 'Positive' | 'Neutral' | 'Negative';
  admin_reply: string | null;
  created_at: string;
}

export interface FeedbackSummary {
  total: number;
  averageRating: number;
  ratingDistribution: {
    5: { count: number; percentage: number };
    4: { count: number; percentage: number };
    3: { count: number; percentage: number };
    2: { count: number; percentage: number };
    1: { count: number; percentage: number };
  };
  sentimentCounts: {
    positive: number;
    neutral: number;
    negative: number;
  };
  categoryCounts: Record<string, number>;
  recentFeedbacks: FeedbackRecord[];
}

function persistDb() {
  if (!db) return;
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
  const data = db.export();
  const buffer = Buffer.from(data);
  fs.writeFileSync(DB_FILE, buffer);
}

export async function getDb(): Promise<Database> {
  if (db) return db;

  if (!SQL) {
    SQL = await initSqlJs();
  }

  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }

  if (fs.existsSync(DB_FILE)) {
    const fileBuffer = fs.readFileSync(DB_FILE);
    db = new SQL.Database(fileBuffer);
  } else {
    db = new SQL.Database();
  }

  // Create table if not exists with complete SQLite constraints
  db.run(`
    CREATE TABLE IF NOT EXISTS feedbacks (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      customer_name TEXT NOT NULL,
      email TEXT NOT NULL,
      rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
      category TEXT NOT NULL DEFAULT 'General',
      feedback TEXT NOT NULL,
      sentiment TEXT NOT NULL DEFAULT 'Positive',
      admin_reply TEXT DEFAULT NULL,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );
  `);

  // Seed sample data if empty
  const countResult = db.exec("SELECT COUNT(*) as cnt FROM feedbacks;");
  const rowCount = (countResult[0]?.values[0]?.[0] as number) || 0;

  if (rowCount === 0) {
    seedInitialFeedbacks(db);
    persistDb();
  }

  return db;
}

function determineSentiment(rating: number, comment: string): 'Positive' | 'Neutral' | 'Negative' {
  const lower = comment.toLowerCase();
  if (rating >= 4 || lower.includes('great') || lower.includes('excellent') || lower.includes('super') || lower.includes('awesome') || lower.includes('loved')) {
    return 'Positive';
  } else if (rating === 3 || lower.includes('average') || lower.includes('okay') || lower.includes('fine')) {
    return 'Neutral';
  } else {
    return 'Negative';
  }
}

function seedInitialFeedbacks(database: Database) {
  const samples = [
    {
      name: 'Anitha Krishnan',
      email: 'anitha.k@example.com',
      rating: 5,
      category: 'Product Quality',
      comment: 'Super fast delivery and top quality product! Highly satisfied with the packaging and customer care.',
      sentiment: 'Positive',
      reply: 'Thank you Anitha! We are delighted to hear you loved the quality.',
      date: '2026-09-28 10:15:00',
    },
    {
      name: 'Karthik Ramanathan',
      email: 'karthik.r@example.com',
      rating: 4,
      category: 'Customer Service',
      comment: 'Customer support answered all my queries within 5 minutes. Very helpful and polite team.',
      sentiment: 'Positive',
      reply: null,
      date: '2026-09-28 14:32:00',
    },
    {
      name: 'Priya Sundar',
      email: 'priya.sundar@example.com',
      rating: 5,
      category: 'Website Experience',
      comment: 'The checkout process was ultra smooth and UI is so easy to navigate. Best shopping experience!',
      sentiment: 'Positive',
      reply: 'Thanks a lot Priya! We worked hard on our new intuitive design.',
      date: '2026-09-29 09:20:00',
    },
    {
      name: 'Mohamed Rizwan',
      email: 'rizwan.m@example.com',
      rating: 3,
      category: 'Delivery Speed',
      comment: 'Product arrived safely but delivery took two days longer than estimated. Tracking could be improved.',
      sentiment: 'Neutral',
      reply: 'Hi Rizwan, apologies for the slight transit delay. We have notified our courier partner.',
      date: '2026-09-29 16:45:00',
    },
    {
      name: 'Rajesh Kannan',
      email: 'rajesh.kannan@example.com',
      rating: 2,
      category: 'Packaging',
      comment: 'Outer carton box was slightly dented when received. Fortunately the inner item was intact.',
      sentiment: 'Negative',
      reply: 'Hi Rajesh, we sincerely apologize for the transit box damage. We are reinforcing outer bubble wrap.',
      date: '2026-09-30 06:10:00',
    },
    {
      name: 'Deepa Natarajan',
      email: 'deepa.n@example.com',
      rating: 5,
      category: 'Pricing & Value',
      comment: 'Affordable pricing with unmatched quality. Worth every single penny paid!',
      sentiment: 'Positive',
      reply: null,
      date: '2026-09-30 07:30:00',
    },
  ];

  for (const s of samples) {
    database.run(
      `INSERT INTO feedbacks (customer_name, email, rating, category, feedback, sentiment, admin_reply, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?);`,
      [s.name, s.email, s.rating, s.category, s.comment, s.sentiment, s.reply, s.date]
    );
  }
}

export async function getAllFeedbacks(filters?: {
  rating?: number;
  category?: string;
  search?: string;
}): Promise<FeedbackRecord[]> {
  const database = await getDb();
  let query = 'SELECT id, customer_name, email, rating, category, feedback, sentiment, admin_reply, created_at FROM feedbacks WHERE 1=1';
  const params: (string | number)[] = [];

  if (filters?.rating && filters.rating > 0) {
    query += ' AND rating = ?';
    params.push(filters.rating);
  }

  if (filters?.category && filters.category !== 'All') {
    query += ' AND category = ?';
    params.push(filters.category);
  }

  if (filters?.search && filters.search.trim() !== '') {
    query += ' AND (customer_name LIKE ? OR email LIKE ? OR feedback LIKE ?)';
    const term = `%${filters.search.trim()}%`;
    params.push(term, term, term);
  }

  query += ' ORDER BY id DESC;';

  const stmt = database.prepare(query);
  if (params.length > 0) {
    stmt.bind(params);
  }

  const results: FeedbackRecord[] = [];
  while (stmt.step()) {
    const row = stmt.getAsObject();
    results.push({
      id: Number(row.id),
      customer_name: String(row.customer_name),
      email: String(row.email),
      rating: Number(row.rating),
      category: String(row.category),
      feedback: String(row.feedback),
      sentiment: row.sentiment as 'Positive' | 'Neutral' | 'Negative',
      admin_reply: row.admin_reply ? String(row.admin_reply) : null,
      created_at: String(row.created_at),
    });
  }
  stmt.free();

  return results;
}

export async function addFeedback(data: {
  customer_name: string;
  email: string;
  rating: number;
  category?: string;
  feedback: string;
}): Promise<FeedbackRecord> {
  const database = await getDb();

  // Rigorous validation as per prompt requirements
  const trimmedName = data.customer_name?.trim();
  const trimmedEmail = data.email?.trim();
  const ratingNum = Number(data.rating);
  const trimmedFeedback = data.feedback?.trim();
  const category = data.category?.trim() || 'General';

  if (!trimmedName || trimmedName.length < 2) {
    throw new Error('Customer Name is required (minimum 2 characters)');
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!trimmedEmail || !emailRegex.test(trimmedEmail)) {
    throw new Error('Please enter a valid email address');
  }

  if (!ratingNum || isNaN(ratingNum) || ratingNum < 1 || ratingNum > 5) {
    throw new Error('Rating must be selected between 1 and 5 stars');
  }

  if (!trimmedFeedback || trimmedFeedback.length < 10) {
    throw new Error('Feedback comment must contain at least 10 characters');
  }

  const sentiment = determineSentiment(ratingNum, trimmedFeedback);
  const now = new Date().toISOString().replace('T', ' ').substring(0, 19);

  database.run(
    `INSERT INTO feedbacks (customer_name, email, rating, category, feedback, sentiment, created_at)
     VALUES (?, ?, ?, ?, ?, ?, ?);`,
    [trimmedName, trimmedEmail, ratingNum, category, trimmedFeedback, sentiment, now]
  );

  persistDb();

  // Retrieve the newly inserted record
  const lastIdResult = database.exec('SELECT MAX(id) as id FROM feedbacks;');
  const lastId = Number(lastIdResult[0]?.values[0]?.[0] || 1);

  return {
    id: lastId,
    customer_name: trimmedName,
    email: trimmedEmail,
    rating: ratingNum,
    category,
    feedback: trimmedFeedback,
    sentiment,
    admin_reply: null,
    created_at: now,
  };
}

export async function deleteFeedback(id: number): Promise<boolean> {
  const database = await getDb();
  database.run('DELETE FROM feedbacks WHERE id = ?;', [id]);
  persistDb();
  return true;
}

export async function replyFeedback(id: number, reply: string): Promise<boolean> {
  const database = await getDb();
  database.run('UPDATE feedbacks SET admin_reply = ? WHERE id = ?;', [reply, id]);
  persistDb();
  return true;
}

export async function resetAndSeed(): Promise<void> {
  const database = await getDb();
  database.run('DROP TABLE IF EXISTS feedbacks;');
  database.run(`
    CREATE TABLE feedbacks (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      customer_name TEXT NOT NULL,
      email TEXT NOT NULL,
      rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
      category TEXT NOT NULL DEFAULT 'General',
      feedback TEXT NOT NULL,
      sentiment TEXT NOT NULL DEFAULT 'Positive',
      admin_reply TEXT DEFAULT NULL,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );
  `);
  seedInitialFeedbacks(database);
  persistDb();
}

export async function getFeedbackSummary(): Promise<FeedbackSummary> {
  const database = await getDb();
  const allFeedbacks = await getAllFeedbacks();

  const total = allFeedbacks.length;
  if (total === 0) {
    return {
      total: 0,
      averageRating: 0,
      ratingDistribution: {
        5: { count: 0, percentage: 0 },
        4: { count: 0, percentage: 0 },
        3: { count: 0, percentage: 0 },
        2: { count: 0, percentage: 0 },
        1: { count: 0, percentage: 0 },
      },
      sentimentCounts: { positive: 0, neutral: 0, negative: 0 },
      categoryCounts: {},
      recentFeedbacks: [],
    };
  }

  const sumRatings = allFeedbacks.reduce((acc, f) => acc + f.rating, 0);
  const averageRating = Number((sumRatings / total).toFixed(2));

  const dist = {
    5: { count: 0, percentage: 0 },
    4: { count: 0, percentage: 0 },
    3: { count: 0, percentage: 0 },
    2: { count: 0, percentage: 0 },
    1: { count: 0, percentage: 0 },
  };

  const sentiments = { positive: 0, neutral: 0, negative: 0 };
  const categories: Record<string, number> = {};

  for (const f of allFeedbacks) {
    const r = f.rating as 1 | 2 | 3 | 4 | 5;
    if (dist[r]) {
      dist[r].count += 1;
    }

    if (f.sentiment === 'Positive') sentiments.positive += 1;
    else if (f.sentiment === 'Neutral') sentiments.neutral += 1;
    else sentiments.negative += 1;

    categories[f.category] = (categories[f.category] || 0) + 1;
  }

  // Calculate percentages
  for (let r = 1; r <= 5; r++) {
    const key = r as 1 | 2 | 3 | 4 | 5;
    dist[key].percentage = Number(((dist[key].count / total) * 100).toFixed(1));
  }

  return {
    total,
    averageRating,
    ratingDistribution: dist,
    sentimentCounts: sentiments,
    categoryCounts: categories,
    recentFeedbacks: allFeedbacks.slice(0, 5),
  };
}

export async function executeRawSql(sqlQuery: string): Promise<{
  columns: string[];
  values: any[][];
  changes?: number;
}> {
  const database = await getDb();
  const trimmed = sqlQuery.trim();

  // If SELECT or PRAGMA
  if (/^(SELECT|PRAGMA|EXPLAIN)/i.test(trimmed)) {
    const res = database.exec(trimmed);
    if (res.length > 0) {
      return {
        columns: res[0].columns,
        values: res[0].values,
      };
    }
    return { columns: [], values: [] };
  } else {
    // INSERT, UPDATE, DELETE, etc.
    database.run(trimmed);
    persistDb();
    return {
      columns: ['status', 'message'],
      values: [['success', 'Query executed successfully']],
    };
  }
}

export async function getSqliteSchema(): Promise<any[]> {
  const database = await getDb();
  const res = database.exec("PRAGMA table_info('feedbacks');");
  if (res.length > 0) {
    const columns = res[0].columns;
    return res[0].values.map((val) => {
      const obj: any = {};
      columns.forEach((col, idx) => {
        obj[col] = val[idx];
      });
      return obj;
    });
  }
  return [];
}
