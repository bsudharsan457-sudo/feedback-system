import { FeedbackRecord, FeedbackSummary } from './types.ts';

export async function fetchFeedbacks(filters?: {
  rating?: number;
  category?: string;
  search?: string;
}): Promise<FeedbackRecord[]> {
  const params = new URLSearchParams();
  if (filters?.rating && filters.rating > 0) params.append('rating', String(filters.rating));
  if (filters?.category && filters.category !== 'All') params.append('category', filters.category);
  if (filters?.search && filters.search.trim()) params.append('search', filters.search.trim());

  const url = `/api/feedbacks${params.toString() ? `?${params.toString()}` : ''}`;
  const res = await fetch(url);
  const data = await res.json();
  if (!data.success) {
    throw new Error(data.error || 'Failed to fetch feedbacks');
  }
  return data.data;
}

export async function fetchSummary(): Promise<FeedbackSummary> {
  const res = await fetch('/api/summary');
  const data = await res.json();
  if (!data.success) {
    throw new Error(data.error || 'Failed to fetch summary');
  }
  return data.data;
}

export async function submitFeedback(payload: {
  customer_name: string;
  email: string;
  rating: number;
  category: string;
  feedback: string;
}): Promise<FeedbackRecord> {
  const res = await fetch('/api/feedbacks', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  const data = await res.json();
  if (!data.success) {
    throw new Error(data.error || 'Failed to submit feedback');
  }
  return data.data;
}

export async function deleteFeedbackApi(id: number): Promise<void> {
  const res = await fetch(`/api/feedbacks/${id}`, { method: 'DELETE' });
  const data = await res.json();
  if (!data.success) {
    throw new Error(data.error || 'Failed to delete feedback');
  }
}

export async function replyFeedbackApi(id: number, reply: string): Promise<void> {
  const res = await fetch(`/api/feedbacks/${id}/reply`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ reply }),
  });
  const data = await res.json();
  if (!data.success) {
    throw new Error(data.error || 'Failed to reply feedback');
  }
}

export async function resetAndSeedApi(): Promise<FeedbackSummary> {
  const res = await fetch('/api/reset-seed', { method: 'POST' });
  const data = await res.json();
  if (!data.success) {
    throw new Error(data.error || 'Failed to reset database');
  }
  return data.data;
}

export async function executeSqlApi(query: string): Promise<{
  columns: string[];
  values: any[][];
}> {
  const res = await fetch('/api/sqlite/query', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ query }),
  });
  const data = await res.json();
  if (!data.success) {
    throw new Error(data.error || 'Query execution failed');
  }
  return data.result;
}

export async function fetchSqliteSchemaApi(): Promise<any[]> {
  const res = await fetch('/api/sqlite/schema');
  const data = await res.json();
  if (!data.success) {
    throw new Error(data.error || 'Failed to fetch schema');
  }
  return data.schema;
}
