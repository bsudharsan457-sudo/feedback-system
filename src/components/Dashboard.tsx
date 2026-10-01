import React, { useState } from 'react';
import {
  Star,
  Search,
  Filter,
  Trash2,
  Reply,
  Calendar,
  CheckCircle,
  ThumbsUp,
  MessageSquare,
  TrendingUp,
  Award,
  Sparkles,
  Download,
  AlertCircle,
} from 'lucide-react';
import { FeedbackRecord, FeedbackSummary } from '../types.ts';
import { deleteFeedbackApi, replyFeedbackApi } from '../api.ts';

interface DashboardProps {
  summary: FeedbackSummary | null;
  feedbacks: FeedbackRecord[];
  onRefresh: () => void;
  onNavigateToForm: () => void;
}

export const Dashboard: React.FC<DashboardProps> = ({
  summary,
  feedbacks,
  onRefresh,
  onNavigateToForm,
}) => {
  const [selectedRating, setSelectedRating] = useState<number | 0>(0);
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [replyingId, setReplyingId] = useState<number | null>(null);
  const [replyText, setReplyText] = useState('');
  const [isSubmittingReply, setIsSubmittingReply] = useState(false);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [actionMessage, setActionMessage] = useState<string | null>(null);

  // Filter feedbacks
  const filteredFeedbacks = feedbacks.filter((item) => {
    if (selectedRating > 0 && item.rating !== selectedRating) return false;
    if (selectedCategory !== 'All' && item.category !== selectedCategory) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchesName = item.customer_name.toLowerCase().includes(q);
      const matchesEmail = item.email.toLowerCase().includes(q);
      const matchesFeedback = item.feedback.toLowerCase().includes(q);
      const matchesCategory = item.category.toLowerCase().includes(q);
      return matchesName || matchesEmail || matchesFeedback || matchesCategory;
    }
    return true;
  });

  const handleDelete = async (id: number) => {
    if (!window.confirm(`Are you sure you want to delete feedback #${id} from the SQLite database?`)) {
      return;
    }
    setDeletingId(id);
    try {
      await deleteFeedbackApi(id);
      setActionMessage(`Feedback #${id} was deleted successfully from SQLite database.`);
      onRefresh();
      setTimeout(() => setActionMessage(null), 3500);
    } catch (err: any) {
      alert(`Delete failed: ${err.message}`);
    } finally {
      setDeletingId(null);
    }
  };

  const handleSendReply = async (id: number) => {
    if (!replyText.trim()) return;
    setIsSubmittingReply(true);
    try {
      await replyFeedbackApi(id, replyText.trim());
      setActionMessage(`Official admin reply posted for feedback #${id}.`);
      setReplyingId(null);
      setReplyText('');
      onRefresh();
      setTimeout(() => setActionMessage(null), 3500);
    } catch (err: any) {
      alert(`Reply failed: ${err.message}`);
    } finally {
      setIsSubmittingReply(false);
    }
  };

  const categories = Array.from(new Set(feedbacks.map((f) => f.category))).filter(Boolean);

  const total = summary?.total || 0;
  const avg = summary?.averageRating || 0;
  const dist = summary?.ratingDistribution || {
    5: { count: 0, percentage: 0 },
    4: { count: 0, percentage: 0 },
    3: { count: 0, percentage: 0 },
    2: { count: 0, percentage: 0 },
    1: { count: 0, percentage: 0 },
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Top Banner & Stats Overview */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-2 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">
              Customer Feedback Analytics
            </h1>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-orange-100 text-orange-800">
              Live SQLite Data
            </span>
          </div>
          <p className="text-slate-500 text-sm mt-1">
            Real-time feedback summary, star rating distributions, and response management dashboard.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <a
            href="/api/export/csv"
            download="feedbacks_sqlite.csv"
            className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold text-slate-700 bg-white border border-slate-300 hover:bg-slate-50 shadow-xs transition-colors"
          >
            <Download className="w-4 h-4 text-slate-500" />
            <span>Download CSV</span>
          </a>
          <button
            onClick={onNavigateToForm}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold text-white bg-orange-600 hover:bg-orange-700 shadow-md shadow-orange-500/20 transition-all"
          >
            <MessageSquare className="w-4 h-4" />
            <span>+ Submit New Feedback</span>
          </button>
        </div>
      </div>

      {actionMessage && (
        <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-sm flex items-center gap-2 animate-in fade-in duration-200">
          <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{actionMessage}</span>
        </div>
      )}

      {/* SUMMARY METRICS CARDS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Total Feedback Count */}
        <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Total Feedback Count</p>
            <p className="text-3xl font-extrabold text-slate-900 mt-1">{total}</p>
            <p className="text-xs text-slate-400 mt-1 flex items-center gap-1">
              <TrendingUp className="w-3.5 h-3.5 text-emerald-600" />
              Recorded in SQLite DB
            </p>
          </div>
          <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
            <MessageSquare className="w-6 h-6" />
          </div>
        </div>

        {/* Card 2: Average Rating */}
        <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Average Rating</p>
            <div className="flex items-baseline gap-2 mt-1">
              <span className="text-3xl font-extrabold text-slate-900">{avg}</span>
              <span className="text-sm font-semibold text-slate-400">/ 5.0</span>
            </div>
            <div className="flex items-center gap-0.5 mt-1">
              {Array.from({ length: 5 }).map((_, i) => (
                <Star
                  key={i}
                  className={`w-3.5 h-3.5 ${
                    i < Math.round(avg) ? 'text-amber-400 fill-amber-400' : 'text-slate-300'
                  }`}
                />
              ))}
            </div>
          </div>
          <div className="w-12 h-12 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
            <Award className="w-6 h-6" />
          </div>
        </div>

        {/* Card 3: Satisfaction Score (4+5 star %) */}
        <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Customer Satisfaction</p>
            <p className="text-3xl font-extrabold text-emerald-600 mt-1">
              {total > 0 ? (((dist[5].count + dist[4].count) / total) * 100).toFixed(0) : 0}%
            </p>
            <p className="text-xs text-slate-400 mt-1">4 & 5-Star Reviews</p>
          </div>
          <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
            <ThumbsUp className="w-6 h-6" />
          </div>
        </div>

        {/* Card 4: Sentiment Breakdown */}
        <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs">
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Sentiment Overview</p>
          <div className="space-y-1.5 text-xs">
            <div className="flex justify-between items-center">
              <span className="flex items-center gap-1.5 text-emerald-700 font-medium">
                <span className="w-2 h-2 rounded-full bg-emerald-500"></span> Positive:
              </span>
              <span className="font-semibold text-slate-900">{summary?.sentimentCounts.positive || 0}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="flex items-center gap-1.5 text-amber-700 font-medium">
                <span className="w-2 h-2 rounded-full bg-amber-500"></span> Neutral:
              </span>
              <span className="font-semibold text-slate-900">{summary?.sentimentCounts.neutral || 0}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="flex items-center gap-1.5 text-rose-700 font-medium">
                <span className="w-2 h-2 rounded-full bg-rose-500"></span> Negative:
              </span>
              <span className="font-semibold text-slate-900">{summary?.sentimentCounts.negative || 0}</span>
            </div>
          </div>
        </div>
      </div>

      {/* RATING BREAKDOWN CHART (5★, 4★, 3★, 2★, 1★ breakdown) */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4">
          <div>
            <h2 className="text-lg font-bold text-slate-900">Rating Breakdown Summary (⭐ 1–5)</h2>
            <p className="text-xs text-slate-500">Click any rating bar to instantly filter customer feedbacks below</p>
          </div>
          {selectedRating > 0 && (
            <button
              onClick={() => setSelectedRating(0)}
              className="text-xs text-orange-600 hover:text-orange-700 font-semibold underline self-start sm:self-center"
            >
              Clear filter (showing {selectedRating}-star only)
            </button>
          )}
        </div>

        <div className="space-y-3">
          {[5, 4, 3, 2, 1].map((stars) => {
            const starKey = stars as 1 | 2 | 3 | 4 | 5;
            const item = dist[starKey] || { count: 0, percentage: 0 };
            const isSelected = selectedRating === stars;

            return (
              <button
                key={stars}
                type="button"
                onClick={() => setSelectedRating(isSelected ? 0 : stars)}
                className={`w-full flex items-center gap-3 p-2 rounded-xl transition-all text-left ${
                  isSelected ? 'bg-orange-50 ring-2 ring-orange-400' : 'hover:bg-slate-50'
                }`}
              >
                {/* Star label */}
                <div className="flex items-center gap-1 w-24 shrink-0 font-medium text-xs text-slate-700">
                  <span className="font-bold">{stars} Star</span>
                  <Star className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
                </div>

                {/* Visual Progress Bar */}
                <div className="flex-1 h-3.5 bg-slate-100 rounded-full overflow-hidden relative">
                  <div
                    className={`h-full rounded-full transition-all duration-500 ${
                      stars >= 4
                        ? 'bg-emerald-500'
                        : stars === 3
                        ? 'bg-amber-400'
                        : 'bg-rose-400'
                    }`}
                    style={{ width: `${item.percentage}%` }}
                  />
                </div>

                {/* Stats Numbers */}
                <div className="w-24 text-right shrink-0 text-xs">
                  <span className="font-bold text-slate-900">{item.count}</span>
                  <span className="text-slate-400 ml-1">({item.percentage}%)</span>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* FILTER & SEARCH BAR */}
      <div className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-5 shadow-xs space-y-4">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          {/* Search Input */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search by customer name, email, or comment keywords..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 text-sm rounded-xl border border-slate-300 focus:border-orange-500 focus:ring-2 focus:ring-orange-200 outline-none transition-all"
            />
          </div>

          {/* Category Dropdown Filter */}
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-slate-400 shrink-0" />
            <span className="text-xs font-semibold text-slate-600 shrink-0">Category:</span>
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="py-1.5 px-3 rounded-lg border border-slate-300 text-xs text-slate-800 bg-white focus:border-orange-500 outline-none"
            >
              <option value="All">All Categories ({feedbacks.length})</option>
              {categories.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Rating Quick Filter Pills */}
        <div className="flex items-center gap-1.5 flex-wrap pt-1 border-t border-slate-100 text-xs">
          <span className="text-slate-500 font-medium mr-1">Rating Filter:</span>
          <button
            onClick={() => setSelectedRating(0)}
            className={`px-3 py-1 rounded-lg font-medium transition-colors ${
              selectedRating === 0
                ? 'bg-slate-900 text-white'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            All Ratings ({feedbacks.length})
          </button>
          {[5, 4, 3, 2, 1].map((s) => (
            <button
              key={s}
              onClick={() => setSelectedRating(s)}
              className={`flex items-center gap-1 px-2.5 py-1 rounded-lg font-medium transition-colors ${
                selectedRating === s
                  ? 'bg-orange-600 text-white'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              <span>{s}</span>
              <Star className={`w-3 h-3 ${selectedRating === s ? 'fill-white' : 'fill-amber-400 text-amber-400'}`} />
              <span>({dist[s as 1 | 2 | 3 | 4 | 5]?.count || 0})</span>
            </button>
          ))}
        </div>
      </div>

      {/* FEEDBACK LIST / CARDS */}
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <h2 className="text-lg font-bold text-slate-900">
            Customer Feedback Records
            <span className="text-sm font-normal text-slate-500 ml-2">
              (Showing {filteredFeedbacks.length} of {feedbacks.length})
            </span>
          </h2>
        </div>

        {filteredFeedbacks.length === 0 ? (
          <div className="p-12 text-center bg-white border border-slate-200 rounded-2xl">
            <AlertCircle className="w-10 h-10 text-slate-300 mx-auto mb-3" />
            <h3 className="text-base font-semibold text-slate-800">No feedbacks match your criteria</h3>
            <p className="text-xs text-slate-500 mt-1">Try clearing your filters or search keywords.</p>
            <button
              onClick={() => {
                setSelectedRating(0);
                setSelectedCategory('All');
                setSearchQuery('');
              }}
              className="mt-4 px-4 py-2 rounded-xl text-xs font-semibold bg-orange-50 text-orange-700 hover:bg-orange-100 transition-colors"
            >
              Reset Filters
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4">
            {filteredFeedbacks.map((item) => (
              <div
                key={item.id}
                className="p-5 bg-white border border-slate-200 rounded-2xl shadow-xs hover:border-slate-300 transition-all space-y-3"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-orange-400 to-amber-500 text-white font-bold text-sm flex items-center justify-center shadow-xs">
                      {item.customer_name.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-slate-900 text-sm">{item.customer_name}</span>
                        <span className="text-xs text-slate-400 font-mono">#{item.id}</span>
                      </div>
                      <span className="text-xs text-slate-500">{item.email}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 flex-wrap">
                    {/* Star Rating Display */}
                    <div className="flex items-center gap-0.5 bg-amber-50 px-2.5 py-1 rounded-lg border border-amber-200">
                      {Array.from({ length: 5 }).map((_, i) => (
                        <Star
                          key={i}
                          className={`w-3.5 h-3.5 ${
                            i < item.rating ? 'fill-amber-400 text-amber-500' : 'text-slate-300'
                          }`}
                        />
                      ))}
                      <span className="text-xs font-bold text-amber-800 ml-1">{item.rating}/5</span>
                    </div>

                    {/* Category Badge */}
                    <span className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-700 border border-slate-200">
                      {item.category}
                    </span>

                    {/* Sentiment Badge */}
                    <span
                      className={`px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                        item.sentiment === 'Positive'
                          ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                          : item.sentiment === 'Neutral'
                          ? 'bg-amber-100 text-amber-800 border border-amber-200'
                          : 'bg-rose-100 text-rose-800 border border-rose-200'
                      }`}
                    >
                      {item.sentiment}
                    </span>
                  </div>
                </div>

                {/* Feedback Comment */}
                <div className="p-3.5 bg-slate-50/80 rounded-xl border border-slate-100 text-slate-800 text-sm leading-relaxed">
                  "{item.feedback}"
                </div>

                {/* Admin Reply Section */}
                {item.admin_reply && (
                  <div className="p-3 bg-orange-50/60 border border-orange-100 rounded-xl text-xs space-y-1">
                    <div className="flex items-center gap-1.5 font-semibold text-orange-900">
                      <Sparkles className="w-3.5 h-3.5 text-orange-600" />
                      <span>Admin Official Reply:</span>
                    </div>
                    <p className="text-orange-950 pl-5 italic leading-relaxed">{item.admin_reply}</p>
                  </div>
                )}

                {/* Reply Form (if open) */}
                {replyingId === item.id && (
                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
                    <label className="block text-xs font-semibold text-slate-700">Write Admin Response:</label>
                    <textarea
                      rows={2}
                      value={replyText}
                      onChange={(e) => setReplyText(e.target.value)}
                      placeholder="Thank the customer or address their concern..."
                      className="w-full p-2.5 text-xs rounded-lg border border-slate-300 focus:border-orange-500 outline-none"
                    />
                    <div className="flex justify-end gap-2">
                      <button
                        onClick={() => {
                          setReplyingId(null);
                          setReplyText('');
                        }}
                        className="px-3 py-1 rounded-md text-xs text-slate-600 hover:bg-slate-200"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={() => handleSendReply(item.id)}
                        disabled={isSubmittingReply || !replyText.trim()}
                        className="px-3.5 py-1 rounded-md text-xs font-semibold bg-orange-600 hover:bg-orange-700 text-white disabled:opacity-50"
                      >
                        {isSubmittingReply ? 'Saving...' : 'Post Reply'}
                      </button>
                    </div>
                  </div>
                )}

                {/* Card Footer: Timestamp & Actions */}
                <div className="flex justify-between items-center pt-2 border-t border-slate-100 text-xs text-slate-400">
                  <div className="flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5" />
                    <span>{item.created_at}</span>
                  </div>

                  <div className="flex items-center gap-2">
                    {replyingId !== item.id && (
                      <button
                        onClick={() => {
                          setReplyingId(item.id);
                          setReplyText(item.admin_reply || '');
                        }}
                        className="inline-flex items-center gap-1 text-slate-600 hover:text-orange-600 font-medium px-2 py-1 rounded-md hover:bg-slate-100 transition-colors"
                      >
                        <Reply className="w-3.5 h-3.5" />
                        <span>{item.admin_reply ? 'Edit Reply' : 'Reply'}</span>
                      </button>
                    )}

                    <button
                      onClick={() => handleDelete(item.id)}
                      disabled={deletingId === item.id}
                      className="inline-flex items-center gap-1 text-slate-400 hover:text-rose-600 px-2 py-1 rounded-md hover:bg-rose-50 transition-colors disabled:opacity-50"
                      title="Delete from SQLite database"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>{deletingId === item.id ? 'Deleting...' : 'Delete'}</span>
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
