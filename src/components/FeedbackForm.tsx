import React, { useState } from 'react';
import confetti from 'canvas-confetti';
import {
  Star,
  Send,
  User,
  Mail,
  MessageSquare,
  CheckCircle2,
  AlertCircle,
  Sparkles,
  ArrowRight,
  RefreshCw,
  Tag,
} from 'lucide-react';
import { submitFeedback } from '../api.ts';
import { FeedbackRecord, ValidationErrors } from '../types.ts';

interface FeedbackFormProps {
  onSuccess: (newRecord: FeedbackRecord) => void;
  onNavigateToDashboard: () => void;
}

const CATEGORIES = [
  'General',
  'Product Quality',
  'Customer Support',
  'Delivery Speed',
  'Website Experience',
  'Pricing & Value',
  'Packaging',
];

const RATING_LABELS: Record<number, { text: string; emoji: string; color: string }> = {
  1: { text: 'Poor - Needs Improvement', emoji: '😞', color: 'text-rose-600' },
  2: { text: 'Fair - Below Expectations', emoji: '😐', color: 'text-amber-600' },
  3: { text: 'Good - Met Expectations', emoji: '🙂', color: 'text-yellow-600' },
  4: { text: 'Very Good - Highly Satisfied', emoji: '😊', color: 'text-lime-600' },
  5: { text: 'Excellent - Outstanding Experience!', emoji: '🤩', color: 'text-emerald-600' },
};

export const FeedbackForm: React.FC<FeedbackFormProps> = ({ onSuccess, onNavigateToDashboard }) => {
  const [customerName, setCustomerName] = useState('');
  const [email, setEmail] = useState('');
  const [rating, setRating] = useState<number>(0);
  const [hoverRating, setHoverRating] = useState<number>(0);
  const [category, setCategory] = useState('General');
  const [feedback, setFeedback] = useState('');

  const [errors, setErrors] = useState<ValidationErrors>({});
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);
  const [submittedFeedback, setSubmittedFeedback] = useState<FeedbackRecord | null>(null);

  // Client-side validation function (matches prompt rules)
  const validateField = (field: string, value: any): string | undefined => {
    switch (field) {
      case 'customer_name': {
        const val = String(value || '').trim();
        if (!val) return 'Customer Name empty-ah irukka koodathu (Name cannot be empty).';
        if (val.length < 2) return 'Customer Name must be at least 2 characters long.';
        return undefined;
      }
      case 'email': {
        const val = String(value || '').trim();
        if (!val) return 'Email empty-ah irukka koodathu (Email is required).';
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(val)) return 'Valid email format irukkanum (e.g. yourname@domain.com).';
        return undefined;
      }
      case 'rating': {
        const num = Number(value);
        if (!num || num < 1 || num > 5) return 'Rating select pannirukkanum (Please select 1 to 5 stars).';
        return undefined;
      }
      case 'feedback': {
        const val = String(value || '').trim();
        if (!val) return 'Feedback empty-ah irukka koodathu (Comments are required).';
        if (val.length < 10) return `Feedback minimum characters irukkanum (${val.length}/10 chars entered).`;
        return undefined;
      }
      default:
        return undefined;
    }
  };

  const handleBlur = (field: string) => {
    setTouched((prev) => ({ ...prev, [field]: true }));
    let val: any = '';
    if (field === 'customer_name') val = customerName;
    if (field === 'email') val = email;
    if (field === 'rating') val = rating;
    if (field === 'feedback') val = feedback;

    const err = validateField(field, val);
    setErrors((prev) => ({ ...prev, [field]: err }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setServerError(null);

    // Validate all fields
    const nameErr = validateField('customer_name', customerName);
    const emailErr = validateField('email', email);
    const ratingErr = validateField('rating', rating);
    const feedbackErr = validateField('feedback', feedback);

    const newErrors: ValidationErrors = {
      customer_name: nameErr,
      email: emailErr,
      rating: ratingErr,
      feedback: feedbackErr,
    };

    setErrors(newErrors);
    setTouched({ customer_name: true, email: true, rating: true, feedback: true });

    if (nameErr || emailErr || ratingErr || feedbackErr) {
      return;
    }

    setIsSubmitting(true);
    try {
      const savedRecord = await submitFeedback({
        customer_name: customerName,
        email,
        rating,
        category,
        feedback,
      });

      // Confetti celebration
      confetti({
        particleCount: 80,
        spread: 60,
        origin: { y: 0.6 },
        colors: ['#f97316', '#3b82f6', '#10b981', '#fbbf24'],
      });

      setSubmittedFeedback(savedRecord);
      onSuccess(savedRecord);
    } catch (err: any) {
      setServerError(err.message || 'Submission failed. Please check inputs.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleResetForm = () => {
    setCustomerName('');
    setEmail('');
    setRating(0);
    setCategory('General');
    setFeedback('');
    setErrors({});
    setTouched({});
    setServerError(null);
    setSubmittedFeedback(null);
  };

  if (submittedFeedback) {
    return (
      <div className="max-w-2xl mx-auto my-8 p-8 bg-white border border-emerald-200 rounded-2xl shadow-xl shadow-emerald-500/5 text-center animate-in fade-in zoom-in-95 duration-200">
        <div className="w-16 h-16 mx-auto mb-4 bg-emerald-100 rounded-full flex items-center justify-center text-emerald-600 shadow-inner">
          <CheckCircle2 className="w-10 h-10" />
        </div>
        <span className="px-3 py-1 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800">
          Saved in SQLite Database • ID #{submittedFeedback.id}
        </span>
        <h2 className="text-2xl font-bold text-slate-900 mt-3">Feedback Submitted Successfully!</h2>
        <p className="text-slate-600 mt-1 max-w-md mx-auto text-sm">
          Thank you, <strong className="text-slate-800">{submittedFeedback.customer_name}</strong>! Your {submittedFeedback.rating}-star rating and comments have been recorded.
        </p>

        {/* Feedback Receipt Card */}
        <div className="mt-6 p-4 bg-slate-50 border border-slate-200 rounded-xl text-left text-sm space-y-2">
          <div className="flex justify-between items-center pb-2 border-b border-slate-200">
            <span className="text-slate-500 font-medium">Customer</span>
            <span className="font-semibold text-slate-900">{submittedFeedback.customer_name} ({submittedFeedback.email})</span>
          </div>
          <div className="flex justify-between items-center pb-2 border-b border-slate-200">
            <span className="text-slate-500 font-medium">Rating Given</span>
            <div className="flex items-center gap-1 font-bold text-amber-500">
              {Array.from({ length: 5 }).map((_, i) => (
                <Star
                  key={i}
                  className={`w-4 h-4 ${
                    i < submittedFeedback.rating ? 'fill-amber-400 text-amber-500' : 'text-slate-300'
                  }`}
                />
              ))}
              <span className="text-slate-700 ml-1">({submittedFeedback.rating} / 5)</span>
            </div>
          </div>
          <div className="flex justify-between items-center pb-2 border-b border-slate-200">
            <span className="text-slate-500 font-medium">Category</span>
            <span className="px-2 py-0.5 rounded-md bg-blue-100 text-blue-700 text-xs font-medium">
              {submittedFeedback.category}
            </span>
          </div>
          <div className="pt-1">
            <span className="text-slate-500 font-medium block mb-1">Your Comment:</span>
            <p className="text-slate-800 bg-white p-2.5 rounded-lg border border-slate-200 italic text-xs leading-relaxed">
              "{submittedFeedback.feedback}"
            </p>
          </div>
        </div>

        <div className="mt-6 flex flex-col sm:flex-row items-center justify-center gap-3">
          <button
            onClick={handleResetForm}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl border border-slate-300 text-slate-700 font-medium text-sm hover:bg-slate-100 transition-colors"
          >
            <RefreshCw className="w-4 h-4" />
            Submit Another Feedback
          </button>
          <button
            onClick={onNavigateToDashboard}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl bg-orange-600 hover:bg-orange-700 text-white font-semibold text-sm shadow-md shadow-orange-500/20 transition-all"
          >
            <span>View Summary & Dashboard</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    );
  }

  const activeStarCount = hoverRating || rating;
  const currentRatingInfo = activeStarCount ? RATING_LABELS[activeStarCount] : null;

  return (
    <div className="max-w-3xl mx-auto my-6 px-4">
      {/* Hero Welcome banner */}
      <div className="mb-6 bg-gradient-to-r from-orange-500 via-amber-500 to-indigo-600 rounded-2xl p-6 text-white shadow-lg relative overflow-hidden">
        <div className="relative z-10 max-w-xl">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/20 backdrop-blur-xs text-xs font-semibold text-white mb-2">
            <Sparkles className="w-3.5 h-3.5 text-amber-200" />
            We Value Your Voice
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Customer Feedback Form</h1>
          <p className="text-orange-100 text-sm mt-1">
            Share your experience with us! Validated in real-time and stored directly into SQLite database for summary analytics.
          </p>
        </div>
        <div className="absolute right-4 -bottom-6 opacity-15 pointer-events-none">
          <MessageSquare className="w-40 h-40 text-white" />
        </div>
      </div>

      {/* Form Container */}
      <div className="bg-white border border-slate-200 rounded-2xl shadow-sm p-6 sm:p-8">
        {serverError && (
          <div className="mb-6 p-4 rounded-xl bg-rose-50 border border-rose-200 flex items-start gap-3 text-rose-800 text-sm">
            <AlertCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold">Submission Error</p>
              <p className="text-xs text-rose-700">{serverError}</p>
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} noValidate className="space-y-6">
          {/* Row 1: Customer Name & Email */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            {/* Customer Name */}
            <div>
              <label htmlFor="customerName" className="block text-sm font-semibold text-slate-800 mb-1.5">
                Customer Name <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <User className="w-4 h-4" />
                </div>
                <input
                  id="customerName"
                  type="text"
                  placeholder="e.g. Sudharsan B"
                  value={customerName}
                  onChange={(e) => {
                    setCustomerName(e.target.value);
                    if (touched.customer_name) {
                      setErrors((prev) => ({ ...prev, customer_name: validateField('customer_name', e.target.value) }));
                    }
                  }}
                  onBlur={() => handleBlur('customer_name')}
                  className={`w-full pl-10 pr-3.5 py-2.5 rounded-xl border text-sm transition-all outline-none ${
                    touched.customer_name && errors.customer_name
                      ? 'border-rose-400 bg-rose-50/40 focus:ring-2 focus:ring-rose-200'
                      : 'border-slate-300 hover:border-slate-400 focus:border-orange-500 focus:ring-2 focus:ring-orange-200'
                  }`}
                />
              </div>
              {touched.customer_name && errors.customer_name ? (
                <p className="mt-1.5 text-xs text-rose-600 font-medium flex items-center gap-1">
                  <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                  {errors.customer_name}
                </p>
              ) : (
                <p className="mt-1 text-xs text-slate-400">Name empty-ah irukka koodathu (Min 2 chars)</p>
              )}
            </div>

            {/* Email Address */}
            <div>
              <label htmlFor="email" className="block text-sm font-semibold text-slate-800 mb-1.5">
                Email Address <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <Mail className="w-4 h-4" />
                </div>
                <input
                  id="email"
                  type="email"
                  placeholder="e.g. student@college.edu"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    if (touched.email) {
                      setErrors((prev) => ({ ...prev, email: validateField('email', e.target.value) }));
                    }
                  }}
                  onBlur={() => handleBlur('email')}
                  className={`w-full pl-10 pr-3.5 py-2.5 rounded-xl border text-sm transition-all outline-none ${
                    touched.email && errors.email
                      ? 'border-rose-400 bg-rose-50/40 focus:ring-2 focus:ring-rose-200'
                      : 'border-slate-300 hover:border-slate-400 focus:border-orange-500 focus:ring-2 focus:ring-orange-200'
                  }`}
                />
              </div>
              {touched.email && errors.email ? (
                <p className="mt-1.5 text-xs text-rose-600 font-medium flex items-center gap-1">
                  <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                  {errors.email}
                </p>
              ) : (
                <p className="mt-1 text-xs text-slate-400">Valid email check (e.g. name@domain.com)</p>
              )}
            </div>
          </div>

          {/* Row 2: Category & Rating */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 pt-1">
            {/* Category Dropdown */}
            <div>
              <label htmlFor="category" className="block text-sm font-semibold text-slate-800 mb-1.5">
                Feedback Category
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <Tag className="w-4 h-4" />
                </div>
                <select
                  id="category"
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-300 text-sm bg-white hover:border-slate-400 focus:border-orange-500 focus:ring-2 focus:ring-orange-200 transition-all outline-none"
                >
                  {CATEGORIES.map((cat) => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                </select>
              </div>
              <p className="mt-1 text-xs text-slate-400">Helps sort feedback in the admin summary</p>
            </div>

            {/* Interactive Rating ⭐ (1–5) */}
            <div>
              <label className="block text-sm font-semibold text-slate-800 mb-1.5">
                Rating ⭐ (1–5) <span className="text-rose-500">*</span>
              </label>
              <div className="flex items-center gap-1.5 py-1">
                {[1, 2, 3, 4, 5].map((starVal) => {
                  const isFilled = starVal <= (hoverRating || rating);
                  return (
                    <button
                      key={starVal}
                      type="button"
                      onClick={() => {
                        setRating(starVal);
                        setErrors((prev) => ({ ...prev, rating: undefined }));
                      }}
                      onMouseEnter={() => setHoverRating(starVal)}
                      onMouseLeave={() => setHoverRating(0)}
                      className="p-1 rounded-lg hover:scale-115 transition-transform focus:outline-hidden"
                      aria-label={`Rate ${starVal} out of 5 stars`}
                    >
                      <Star
                        className={`w-7 h-7 sm:w-8 sm:h-8 transition-colors ${
                          isFilled
                            ? 'text-amber-400 fill-amber-400 drop-shadow-xs'
                            : 'text-slate-300 hover:text-amber-200'
                        }`}
                      />
                    </button>
                  );
                })}
              </div>

              {currentRatingInfo ? (
                <p className={`text-xs font-semibold mt-1 flex items-center gap-1 ${currentRatingInfo.color}`}>
                  <span>{currentRatingInfo.emoji}</span>
                  <span>{activeStarCount} Star - {currentRatingInfo.text}</span>
                </p>
              ) : touched.rating && errors.rating ? (
                <p className="mt-1 text-xs text-rose-600 font-medium flex items-center gap-1">
                  <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                  {errors.rating}
                </p>
              ) : (
                <p className="mt-1 text-xs text-slate-400">Click a star to rate from 1 (Poor) to 5 (Excellent)</p>
              )}
            </div>
          </div>

          {/* Row 3: Comments / Feedback Text */}
          <div>
            <div className="flex justify-between items-center mb-1.5">
              <label htmlFor="feedbackComments" className="block text-sm font-semibold text-slate-800">
                Feedback / Comments <span className="text-rose-500">*</span>
              </label>
              <span
                className={`text-xs font-mono ${
                  feedback.trim().length >= 10 ? 'text-emerald-600 font-semibold' : 'text-slate-400'
                }`}
              >
                {feedback.trim().length} / 10 min chars
              </span>
            </div>
            <textarea
              id="feedbackComments"
              rows={4}
              placeholder="Tell us what you liked or what we can improve (minimum 10 characters)..."
              value={feedback}
              onChange={(e) => {
                setFeedback(e.target.value);
                if (touched.feedback) {
                  setErrors((prev) => ({ ...prev, feedback: validateField('feedback', e.target.value) }));
                }
              }}
              onBlur={() => handleBlur('feedback')}
              className={`w-full p-3.5 rounded-xl border text-sm transition-all outline-none resize-y ${
                touched.feedback && errors.feedback
                  ? 'border-rose-400 bg-rose-50/40 focus:ring-2 focus:ring-rose-200'
                  : 'border-slate-300 hover:border-slate-400 focus:border-orange-500 focus:ring-2 focus:ring-orange-200'
              }`}
            />
            {touched.feedback && errors.feedback ? (
              <p className="mt-1.5 text-xs text-rose-600 font-medium flex items-center gap-1">
                <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                {errors.feedback}
              </p>
            ) : (
              <p className="mt-1 text-xs text-slate-400">
                Feedback minimum characters irukkanum (At least 10 descriptive characters)
              </p>
            )}
          </div>

          {/* Validation Checklist / Guidance box */}
          <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-600 space-y-1.5">
            <span className="font-semibold text-slate-800 block">Response Validation Checklist:</span>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <div className="flex items-center gap-1.5">
                <span className={`w-3.5 h-3.5 rounded-full flex items-center justify-center text-[9px] font-bold ${customerName.trim().length >= 2 ? 'bg-emerald-500 text-white' : 'bg-slate-300 text-slate-600'}`}>
                  ✓
                </span>
                <span>Name empty-ah irukka koodathu</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className={`w-3.5 h-3.5 rounded-full flex items-center justify-center text-[9px] font-bold ${/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim()) ? 'bg-emerald-500 text-white' : 'bg-slate-300 text-slate-600'}`}>
                  ✓
                </span>
                <span>Valid email check</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className={`w-3.5 h-3.5 rounded-full flex items-center justify-center text-[9px] font-bold ${rating > 0 ? 'bg-emerald-500 text-white' : 'bg-slate-300 text-slate-600'}`}>
                  ✓
                </span>
                <span>Rating select pannirukkanum (1–5 ⭐)</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className={`w-3.5 h-3.5 rounded-full flex items-center justify-center text-[9px] font-bold ${feedback.trim().length >= 10 ? 'bg-emerald-500 text-white' : 'bg-slate-300 text-slate-600'}`}>
                  ✓
                </span>
                <span>Feedback minimum characters (≥10)</span>
              </div>
            </div>
          </div>

          {/* Submit & Reset Buttons */}
          <div className="flex flex-col sm:flex-row items-center gap-3 pt-2">
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full sm:flex-1 py-3 px-6 rounded-xl bg-orange-600 hover:bg-orange-700 text-white font-semibold text-sm shadow-md shadow-orange-500/25 flex items-center justify-center gap-2 transition-all hover:translate-y-[-1px] disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Validating & Saving to SQLite...</span>
                </>
              ) : (
                <>
                  <Send className="w-4 h-4" />
                  <span>Submit Customer Feedback</span>
                </>
              )}
            </button>

            <button
              type="button"
              onClick={handleResetForm}
              className="w-full sm:w-auto px-5 py-3 rounded-xl border border-slate-300 hover:bg-slate-100 text-slate-600 font-medium text-sm transition-colors"
            >
              Reset Form
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
