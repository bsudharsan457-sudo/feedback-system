import React, { useState, useEffect } from 'react';
import { Navbar } from './components/Navbar.tsx';
import { FeedbackForm } from './components/FeedbackForm.tsx';
import { Dashboard } from './components/Dashboard.tsx';
import { SqliteConsole } from './components/SqliteConsole.tsx';
import { CollegeVivaHub } from './components/CollegeVivaHub.tsx';
import { fetchFeedbacks, fetchSummary, resetAndSeedApi } from './api.ts';
import { FeedbackRecord, FeedbackSummary } from './types.ts';
import { Database, Sparkles, RefreshCw } from 'lucide-react';

export default function App() {
  const [activeTab, setActiveTab] = useState<'form' | 'dashboard' | 'sqlite' | 'college'>('form');
  const [feedbacks, setFeedbacks] = useState<FeedbackRecord[]>([]);
  const [summary, setSummary] = useState<FeedbackSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [isResetting, setIsResetting] = useState(false);
  const [notification, setNotification] = useState<string | null>(null);

  const loadData = async () => {
    try {
      const [fData, sData] = await Promise.all([fetchFeedbacks(), fetchSummary()]);
      setFeedbacks(fData);
      setSummary(sData);
    } catch (err: any) {
      console.error('Error fetching data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleFeedbackSuccess = (newRecord: FeedbackRecord) => {
    setFeedbacks((prev) => [newRecord, ...prev]);
    loadData();
  };

  const handleResetSeed = async () => {
    if (!window.confirm('Reset database and seed realistic sample customer feedbacks into SQLite?')) {
      return;
    }
    setIsResetting(true);
    try {
      const newSummary = await resetAndSeedApi();
      setSummary(newSummary);
      const allFeedbacks = await fetchFeedbacks();
      setFeedbacks(allFeedbacks);
      setNotification('SQLite Database reset and populated with sample feedbacks!');
      setTimeout(() => setNotification(null), 3500);
    } catch (err: any) {
      alert(`Reset failed: ${err.message}`);
    } finally {
      setIsResetting(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col font-sans selection:bg-orange-500 selection:text-white">
      {/* Top Navbar */}
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        feedbackCount={feedbacks.length}
        averageRating={summary?.averageRating || 0}
        onResetSeed={handleResetSeed}
        isResetting={isResetting}
      />

      {/* Global Notification Banner */}
      {notification && (
        <div className="bg-emerald-600 text-white text-xs font-semibold py-2 px-4 text-center flex items-center justify-center gap-2 animate-in fade-in duration-200">
          <Sparkles className="w-4 h-4 text-emerald-200" />
          <span>{notification}</span>
        </div>
      )}

      {/* Main Content Area */}
      <main className="flex-1">
        {loading ? (
          <div className="flex flex-col items-center justify-center min-h-[60vh] gap-3">
            <RefreshCw className="w-8 h-8 text-orange-600 animate-spin" />
            <p className="text-sm font-medium text-slate-500">Connecting to SQLite database...</p>
          </div>
        ) : (
          <>
            {activeTab === 'form' && (
              <FeedbackForm
                onSuccess={handleFeedbackSuccess}
                onNavigateToDashboard={() => setActiveTab('dashboard')}
              />
            )}

            {activeTab === 'dashboard' && (
              <Dashboard
                summary={summary}
                feedbacks={feedbacks}
                onRefresh={loadData}
                onNavigateToForm={() => setActiveTab('form')}
              />
            )}

            {activeTab === 'sqlite' && <SqliteConsole />}

            {activeTab === 'college' && <CollegeVivaHub />}
          </>
        )}
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-slate-200 py-6 text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <Database className="w-4 h-4 text-orange-600" />
            <span>Customer Feedback System • Embedded SQLite 3 Database</span>
          </div>

          <div className="flex items-center gap-4 text-slate-400">
            <span>JavaScript Validation</span>
            <span>•</span>
            <span>REST API Backend</span>
            <span>•</span>
            <span>Summary Analytics</span>
            <span>•</span>
            <span>Django / Viva Voce Ready</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
