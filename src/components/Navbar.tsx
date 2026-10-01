import React from 'react';
import { MessageSquareText, LayoutDashboard, Database, GraduationCap, Download, RotateCcw } from 'lucide-react';

interface NavbarProps {
  activeTab: 'form' | 'dashboard' | 'sqlite' | 'college';
  setActiveTab: (tab: 'form' | 'dashboard' | 'sqlite' | 'college') => void;
  feedbackCount: number;
  averageRating: number;
  onResetSeed: () => void;
  isResetting: boolean;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  setActiveTab,
  feedbackCount,
  averageRating,
  onResetSeed,
  isResetting,
}) => {
  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200 shadow-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo & Brand */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-amber-500 via-orange-500 to-indigo-600 flex items-center justify-center text-white shadow-md shadow-orange-500/20">
              <MessageSquareText className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-slate-900 text-lg tracking-tight">Customer Feedback System</span>
                <span className="hidden sm:inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800 border border-emerald-200">
                  Full-Stack + SQLite
                </span>
              </div>
              <p className="text-xs text-slate-500 hidden md:block">
                Validation • SQLite Storage • Rating Analytics • College Viva Ready
              </p>
            </div>
          </div>

          {/* Nav Tabs */}
          <nav className="flex items-center gap-1 sm:gap-2">
            <button
              onClick={() => setActiveTab('form')}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                activeTab === 'form'
                  ? 'bg-orange-50 text-orange-700 font-semibold shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              <MessageSquareText className="w-4 h-4" />
              <span>Feedback Form</span>
            </button>

            <button
              onClick={() => setActiveTab('dashboard')}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-all relative ${
                activeTab === 'dashboard'
                  ? 'bg-orange-50 text-orange-700 font-semibold shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              <LayoutDashboard className="w-4 h-4" />
              <span>Dashboard</span>
              {feedbackCount > 0 && (
                <span className="ml-1 px-1.5 py-0.2 rounded-full text-xs font-bold bg-orange-600 text-white">
                  {feedbackCount}
                </span>
              )}
            </button>

            <button
              onClick={() => setActiveTab('sqlite')}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                activeTab === 'sqlite'
                  ? 'bg-orange-50 text-orange-700 font-semibold shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              <Database className="w-4 h-4" />
              <span className="hidden sm:inline">SQLite Console</span>
              <span className="sm:hidden">DB</span>
            </button>

            <button
              onClick={() => setActiveTab('college')}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                activeTab === 'college'
                  ? 'bg-indigo-50 text-indigo-700 font-semibold shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              <GraduationCap className="w-4 h-4 text-indigo-600" />
              <span className="hidden sm:inline">College / Django Hub</span>
              <span className="sm:hidden">Viva</span>
            </button>
          </nav>

          {/* Actions: CSV Export & Re-seed */}
          <div className="hidden lg:flex items-center gap-2">
            <a
              href="/api/export/csv"
              download="customer_feedbacks_sqlite.csv"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 transition-colors"
              title="Download SQLite feedback records as CSV"
            >
              <Download className="w-3.5 h-3.5 text-slate-600" />
              Export CSV
            </a>

            <button
              onClick={onResetSeed}
              disabled={isResetting}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-amber-700 bg-amber-50 hover:bg-amber-100 border border-amber-200 transition-colors disabled:opacity-50"
              title="Reset & seed realistic sample reviews"
            >
              <RotateCcw className={`w-3.5 h-3.5 text-amber-600 ${isResetting ? 'animate-spin' : ''}`} />
              Reset Sample Data
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};
