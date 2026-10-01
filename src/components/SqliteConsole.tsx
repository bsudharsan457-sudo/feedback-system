import React, { useState, useEffect } from 'react';
import { Database, Play, Terminal, Table, Check, AlertCircle, RefreshCw } from 'lucide-react';
import { executeSqlApi, fetchSqliteSchemaApi } from '../api.ts';

export const SqliteConsole: React.FC = () => {
  const [query, setQuery] = useState(
    'SELECT rating, COUNT(*) as feedback_count, ROUND(AVG(rating), 2) as avg_rating FROM feedbacks GROUP BY rating ORDER BY rating DESC;'
  );
  const [results, setResults] = useState<{ columns: string[]; values: any[][] } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [execTime, setExecTime] = useState<number | null>(null);
  const [schema, setSchema] = useState<any[]>([]);

  const sampleQueries = [
    {
      title: 'Rating Distribution & Averages',
      sql: 'SELECT rating, COUNT(*) as count, ROUND(COUNT(*) * 100.0 / (SELECT COUNT(*) FROM feedbacks), 1) || "%" as percentage FROM feedbacks GROUP BY rating ORDER BY rating DESC;',
    },
    {
      title: 'All Feedbacks (Recent First)',
      sql: 'SELECT id, customer_name, email, rating, category, sentiment, created_at FROM feedbacks ORDER BY id DESC LIMIT 10;',
    },
    {
      title: 'Summary Aggregates',
      sql: 'SELECT COUNT(*) as total_feedback, ROUND(AVG(rating), 2) as average_rating, MIN(rating) as min_star, MAX(rating) as max_star FROM feedbacks;',
    },
    {
      title: 'Sentiment Breakdown',
      sql: 'SELECT sentiment, COUNT(*) as total, ROUND(AVG(rating), 2) as avg_rating FROM feedbacks GROUP BY sentiment;',
    },
    {
      title: 'Category Breakdown',
      sql: 'SELECT category, COUNT(*) as count, ROUND(AVG(rating), 2) as avg_rating FROM feedbacks GROUP BY category ORDER BY count DESC;',
    },
  ];

  const runQuery = async (sqlToRun?: string) => {
    const sql = sqlToRun || query;
    if (!sql.trim()) return;
    setLoading(true);
    setError(null);
    const start = performance.now();
    try {
      const res = await executeSqlApi(sql);
      setResults(res);
      setExecTime(Number((performance.now() - start).toFixed(2)));
    } catch (err: any) {
      setError(err.message || 'SQL execution failed');
      setResults(null);
    } finally {
      setLoading(false);
    }
  };

  const loadSchema = async () => {
    try {
      const s = await fetchSqliteSchemaApi();
      setSchema(s);
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    runQuery();
    loadSchema();
  }, []);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-2 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-orange-100 text-orange-700 flex items-center justify-center font-bold">
              <Database className="w-5 h-5" />
            </div>
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Interactive SQLite Engine Console</h1>
            <span className="px-2 py-0.5 rounded-full text-xs font-mono font-semibold bg-blue-100 text-blue-800">
              data/feedback.sqlite
            </span>
          </div>
          <p className="text-slate-500 text-sm mt-1">
            Execute native SQLite 3 queries directly on the feedback database table. Ideal for college viva demonstrations.
          </p>
        </div>
      </div>

      {/* Grid: Schema Info & Quick Queries */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Schema Details */}
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <Table className="w-4 h-4 text-orange-600" />
              <span>Table: feedbacks</span>
            </h2>
            <button
              onClick={loadSchema}
              className="text-xs text-slate-500 hover:text-slate-800 flex items-center gap-1"
            >
              <RefreshCw className="w-3 h-3" /> Refresh
            </button>
          </div>

          <div className="overflow-x-auto text-xs font-mono">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-200 text-slate-400">
                  <th className="py-1.5 px-2">Column</th>
                  <th className="py-1.5 px-2">Type</th>
                  <th className="py-1.5 px-2">Key</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {schema.map((col, idx) => (
                  <tr key={idx} className="hover:bg-slate-50">
                    <td className="py-1.5 px-2 font-semibold text-slate-700">{col.name}</td>
                    <td className="py-1.5 px-2 text-indigo-600">{col.type}</td>
                    <td className="py-1.5 px-2 text-slate-400">
                      {col.pk ? <span className="text-amber-600 font-bold">PRIMARY KEY</span> : col.notnull ? 'NOT NULL' : ''}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-100 text-[11px] text-slate-500">
            Storage Engine: <strong>SQLite 3 via sql.js</strong>
            <br />
            Persistence: <strong>Disk sync to /data/feedback.sqlite</strong>
          </div>
        </div>

        {/* Right: Quick Demo Queries */}
        <div className="lg:col-span-2 bg-white border border-slate-200 rounded-2xl p-5 shadow-xs space-y-3">
          <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
            <Terminal className="w-4 h-4 text-orange-600" />
            <span>Pre-built College Project SQL Queries</span>
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {sampleQueries.map((item, idx) => (
              <button
                key={idx}
                onClick={() => {
                  setQuery(item.sql);
                  runQuery(item.sql);
                }}
                className="p-2.5 rounded-xl border border-slate-200 text-left hover:border-orange-400 hover:bg-orange-50/50 transition-all group"
              >
                <span className="font-semibold text-xs text-slate-800 group-hover:text-orange-700 block">
                  {item.title}
                </span>
                <span className="font-mono text-[10px] text-slate-400 line-clamp-1 mt-0.5">{item.sql}</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* SQL Query Editor */}
      <div className="bg-slate-900 rounded-2xl p-5 shadow-lg space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-slate-300 font-mono text-xs">
            <Terminal className="w-4 h-4 text-emerald-400" />
            <span>sqlite&gt; SQL Query Terminal</span>
          </div>

          <button
            onClick={() => runQuery()}
            disabled={loading}
            className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-lg bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-bold text-xs shadow-md transition-all disabled:opacity-50"
          >
            {loading ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Play className="w-3.5 h-3.5 fill-current" />}
            <span>Run SQL</span>
          </button>
        </div>

        <textarea
          rows={3}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="SELECT * FROM feedbacks WHERE rating = 5;"
          className="w-full bg-slate-950 text-emerald-300 font-mono text-xs sm:text-sm p-4 rounded-xl border border-slate-700 focus:border-emerald-500 outline-none leading-relaxed"
        />

        {error && (
          <div className="p-3 rounded-xl bg-rose-950/50 border border-rose-800 text-rose-300 text-xs font-mono flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
            <span>{error}</span>
          </div>
        )}
      </div>

      {/* SQL Results Table */}
      {results && (
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs space-y-3">
          <div className="flex items-center justify-between text-xs text-slate-500">
            <div className="flex items-center gap-2 font-medium">
              <Check className="w-4 h-4 text-emerald-600" />
              <span>
                Returned <strong>{results.values.length} rows</strong> across <strong>{results.columns.length} columns</strong>
              </span>
            </div>
            {execTime !== null && <span className="font-mono text-[11px]">Execution time: {execTime} ms</span>}
          </div>

          <div className="overflow-x-auto rounded-xl border border-slate-200">
            <table className="w-full text-left text-xs font-mono">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  {results.columns.map((col, idx) => (
                    <th key={idx} className="py-2.5 px-3 font-bold text-slate-700 uppercase tracking-wider">
                      {col}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {results.values.length === 0 ? (
                  <tr>
                    <td colSpan={results.columns.length} className="text-center py-6 text-slate-400 italic">
                      Query executed successfully with 0 rows returned.
                    </td>
                  </tr>
                ) : (
                  results.values.map((row, rIdx) => (
                    <tr key={rIdx} className="hover:bg-slate-50">
                      {row.map((cell, cIdx) => (
                        <td key={cIdx} className="py-2 px-3 text-slate-800 truncate max-w-xs">
                          {cell === null ? (
                            <span className="text-slate-400 italic">NULL</span>
                          ) : (
                            String(cell)
                          )}
                        </td>
                      ))}
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
