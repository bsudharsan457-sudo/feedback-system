import React, { useState } from 'react';
import {
  GraduationCap,
  Copy,
  Check,
  Code2,
  FileCode,
  Terminal,
  HelpCircle,
  ArrowRight,
  BookOpen,
  Database,
  Layers,
  Cpu,
} from 'lucide-react';

export const CollegeVivaHub: React.FC = () => {
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [activeCodeTab, setActiveCodeTab] = useState<'models' | 'forms' | 'views' | 'urls' | 'html' | 'settings'>('models');

  const copyToClipboard = (key: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2500);
  };

  const djangoCode = {
    models: `# feedback_app/models.py
from django.db import models
from django.core.validators import MinValueValidator, MaxValueValidator

class CustomerFeedback(models.Model):
    CATEGORY_CHOICES = [
        ('General', 'General'),
        ('Product Quality', 'Product Quality'),
        ('Customer Support', 'Customer Support'),
        ('Delivery Speed', 'Delivery Speed'),
        ('Website Experience', 'Website Experience'),
        ('Pricing & Value', 'Pricing & Value'),
    ]

    customer_name = models.CharField(max_length=150, help_text="Customer Name (cannot be empty)")
    email = models.EmailField(help_text="Valid Customer Email")
    rating = models.IntegerField(
        validators=[MinValueValidator(1), MaxValueValidator(5)],
        help_text="Rating between 1 and 5 stars"
    )
    category = models.CharField(max_length=50, choices=CATEGORY_CHOICES, default='General')
    feedback = models.TextField(help_text="Customer comments (min 10 characters)")
    sentiment = models.CharField(max_length=20, default='Positive')
    admin_reply = models.TextField(blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def save(self, *args, **kwargs):
        # Auto-compute sentiment based on rating
        if self.rating >= 4:
            self.sentiment = 'Positive'
        elif self.rating == 3:
            self.sentiment = 'Neutral'
        else:
            self.sentiment = 'Negative'
        super().save(*args, **kwargs)

    def __str__(self):
        return f"{self.customer_name} - {self.rating} Stars ({self.created_at.strftime('%Y-%m-%d')})"

    class Meta:
        ordering = ['-created_at']
        db_table = 'feedbacks'`,

    forms: `# feedback_app/forms.py
import re
from django import forms
from .models import CustomerFeedback

class FeedbackForm(forms.ModelForm):
    class Meta:
        model = CustomerFeedback
        fields = ['customer_name', 'email', 'rating', 'category', 'feedback']
        widgets = {
            'customer_name': forms.TextInput(attrs={
                'class': 'form-control',
                'placeholder': 'Enter your full name'
            }),
            'email': forms.EmailInput(attrs={
                'class': 'form-control',
                'placeholder': 'name@example.com'
            }),
            'rating': forms.NumberInput(attrs={
                'class': 'form-control',
                'min': 1,
                'max': 5
            }),
            'category': forms.Select(attrs={'class': 'form-select'}),
            'feedback': forms.Textarea(attrs={
                'class': 'form-control',
                'rows': 4,
                'placeholder': 'Write your detailed feedback here...'
            }),
        }

    # Custom Validation rules matching project requirements
    def clean_customer_name(self):
        name = self.cleaned_data.get('customer_name', '').strip()
        if not name:
            raise forms.ValidationError("Name empty-ah irukka koodathu (Customer Name is required).")
        if len(name) < 2:
            raise forms.ValidationError("Customer Name must be at least 2 characters long.")
        return name

    def clean_email(self):
        email = self.cleaned_data.get('email', '').strip()
        email_regex = r'^[a-zA-Z0-9_.+-]+@[a-zA-Z0-9-]+\\.[a-zA-Z0-9-.]+$'
        if not re.match(email_regex, email):
            raise forms.ValidationError("Valid email format enter pannunga.")
        return email

    def clean_rating(self):
        rating = self.cleaned_data.get('rating')
        if not rating or rating < 1 or rating > 5:
            raise forms.ValidationError("Rating select pannirukkanum (1 to 5 stars).")
        return rating

    def clean_feedback(self):
        feedback = self.cleaned_data.get('feedback', '').strip()
        if len(feedback) < 10:
            raise forms.ValidationError("Feedback minimum 10 characters irukkanum.")
        return feedback`,

    views: `# feedback_app/views.py
from django.shortcuts import render, redirect, get_object_or_404
from django.http import JsonResponse
from django.db.models import Avg, Count
from .models import CustomerFeedback
from .forms import FeedbackForm

# 1. Customer Feedback Submission View
def feedback_submit(request):
    if request.method == 'POST':
        form = FeedbackForm(request.POST)
        if form.is_valid():
            saved_instance = form.save()
            return JsonResponse({
                'success': True,
                'message': 'Feedback successfully saved in SQLite database!',
                'id': saved_instance.id
            })
        else:
            return JsonResponse({'success': False, 'errors': form.errors}, status=400)
    else:
        form = FeedbackForm()
    return render(request, 'feedback_form.html', {'form': form})

# 2. Overall Feedback Summary & Admin Dashboard View
def feedback_dashboard(request):
    feedbacks = CustomerFeedback.objects.all().order_by('-created_at')
    total_count = feedbacks.count()
    
    # Calculate Average Rating using Django ORM SQLite Aggregation
    avg_data = feedbacks.aggregate(Avg('rating'))
    average_rating = round(avg_data['rating__avg'] or 0.0, 2)

    # 5-star to 1-star breakdown
    star_counts = {
        star: feedbacks.filter(rating=star).count()
        for star in range(1, 6)
    }

    # Percentages
    star_percentages = {
        star: round((count / total_count * 100), 1) if total_count > 0 else 0
        for star, count in star_counts.items()
    }

    context = {
        'feedbacks': feedbacks,
        'total_count': total_count,
        'average_rating': average_rating,
        'star_counts': star_counts,
        'star_percentages': star_percentages,
    }
    return render(request, 'dashboard.html', context)`,

    urls: `# feedback_app/urls.py
from django.urls import path
from . import views

urlpatterns = [
    # Customer Submission Form
    path('', views.feedback_submit, name='feedback_submit'),
    # Summary Dashboard
    path('dashboard/', views.feedback_dashboard, name='feedback_dashboard'),
]`,

    html: `<!-- templates/feedback_form.html -->
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Customer Feedback Form</title>
  <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/css/bootstrap.min.css">
</head>
<body class="bg-light p-4">
  <div class="container" style="max-width: 600px;">
    <div class="card shadow-sm p-4">
      <h3 class="mb-3">Customer Feedback Form</h3>
      <form id="feedbackForm" method="POST">
        {% csrf_token %}
        <div class="mb-3">
          <label class="form-label">Customer Name</label>
          <input type="text" id="id_customer_name" name="customer_name" class="form-control" required>
        </div>
        <div class="mb-3">
          <label class="form-label">Email Address</label>
          <input type="email" id="id_email" name="email" class="form-control" required>
        </div>
        <div class="mb-3">
          <label class="form-label">Rating ⭐ (1–5)</label>
          <select id="id_rating" name="rating" class="form-select" required>
            <option value="">Select rating...</option>
            <option value="5">⭐⭐⭐⭐⭐ 5 - Excellent</option>
            <option value="4">⭐⭐⭐⭐ 4 - Very Good</option>
            <option value="3">⭐⭐⭐ 3 - Good</option>
            <option value="2">⭐⭐ 2 - Fair</option>
            <option value="1">⭐ 1 - Poor</option>
          </select>
        </div>
        <div class="mb-3">
          <label class="form-label">Comments</label>
          <textarea id="id_feedback" name="feedback" rows="4" class="form-control" required></textarea>
        </div>
        <button type="submit" class="btn btn-warning w-100">Submit Feedback</button>
      </form>
    </div>
  </div>

  <script>
    // Client-side JavaScript Validation (matches prompt requirements)
    document.getElementById('feedbackForm').addEventListener('submit', function(e) {
      const name = document.getElementById('id_customer_name').value.trim();
      const email = document.getElementById('id_email').value.trim();
      const rating = document.getElementById('id_rating').value;
      const feedback = document.getElementById('id_feedback').value.trim();
      const emailRegex = /^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$/;

      if (!name) {
        alert("Name empty-ah irukka koodathu!");
        e.preventDefault();
        return;
      }
      if (!emailRegex.test(email)) {
        alert("Valid email enter pannunga!");
        e.preventDefault();
        return;
      }
      if (!rating) {
        alert("Rating select pannirukkanum!");
        e.preventDefault();
        return;
      }
      if (feedback.length < 10) {
        alert("Feedback minimum 10 characters irukkanum!");
        e.preventDefault();
        return;
      }
    });
  </script>
</body>
</html>`,

    settings: `# feedback_project/settings.py
from pathlib import Path
BASE_DIR = Path(__file__).resolve().parent.parent

# Database Configuration with SQLite 3 (Default & Recommended for College Projects)
DATABASES = {
    'default': {
        'ENGINE': 'django.db.backends.sqlite3',
        'NAME': BASE_DIR / 'db.sqlite3',
    }
}

INSTALLED_APPS = [
    'django.contrib.admin',
    'django.contrib.auth',
    'django.contrib.contenttypes',
    'django.contrib.sessions',
    'django.contrib.messages',
    'django.contrib.staticfiles',
    'feedback_app', # Your feedback application
]`,
  };

  const vivaQuestions = [
    {
      q: 'Why did you choose SQLite database for this Customer Feedback System?',
      tanglish: 'En SQLite database use pannom?',
      a: 'SQLite is a serverless, self-contained, zero-configuration relational database engine. In college projects and embedded applications, it eliminates the need to run an external DB server like MySQL/PostgreSQL. Data is stored directly in a portable file (db.sqlite3 or feedback.sqlite), making it fast, ACID-compliant, and effortless to back up and evaluate.',
    },
    {
      q: 'Why do we need BOTH JavaScript (Client-side) and Backend (Django/Express) validation?',
      tanglish: 'Client-side JS validation + Backend validation rendu edhukku venum?',
      a: 'JavaScript validation gives immediate feedback to users in the browser without reloading the page, improving UX. However, users can disable JavaScript or bypass the frontend using Postman/curl. Backend validation ensures data integrity and security, preventing invalid, malicious, or empty data from corrupting the SQLite database.',
    },
    {
      q: 'How is the Average Rating and Star Count calculated in SQLite & Django?',
      tanglish: 'Average rating & 5-star count epdi calculate aagudhu?',
      a: 'In SQL: "SELECT AVG(rating) as avg_rating, COUNT(*) FROM feedbacks;" and "SELECT rating, COUNT(*) FROM feedbacks GROUP BY rating;". In Django ORM: "feedbacks.aggregate(Avg("rating"))" and "feedbacks.filter(rating=star).count()".',
    },
    {
      q: 'What is the role of CSRF token in Django forms?',
      tanglish: 'Django-la {% csrf_token %} edhukku use pannuvom?',
      a: 'CSRF (Cross-Site Request Forgery) protection ensures that POST submissions originate from our legitimate form and not from malicious third-party websites trying to forge actions on behalf of the customer.',
    },
    {
      q: 'What happens when a customer submits feedback with less than 10 characters?',
      tanglish: 'Feedback 10 chars-ku kulla irundha enna aagum?',
      a: 'The JavaScript validation interrupts the submit event with a warning ("Feedback minimum characters irukkanum"). Even if bypassed, the backend form validation clean_feedback() / API validation rejects the request with HTTP 400 Bad Request error.',
    },
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-10">
      {/* Banner */}
      <div className="bg-gradient-to-r from-indigo-900 via-slate-900 to-indigo-950 text-white rounded-3xl p-6 sm:p-8 shadow-xl border border-indigo-800/40 relative overflow-hidden">
        <div className="relative z-10 max-w-3xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/20 border border-indigo-400/30 text-indigo-300 text-xs font-semibold mb-3">
            <GraduationCap className="w-4 h-4 text-indigo-400" />
            College Project & Viva Voce Submission Guide
          </div>
          <h1 className="text-2xl sm:text-4xl font-extrabold tracking-tight">
            Customer Feedback System (Full-Stack + SQLite)
          </h1>
          <p className="text-slate-300 text-sm sm:text-base mt-2 leading-relaxed">
            Dei Mapla 😎! Inga full project architecture, live SQLite integration, complete Django + Python code snippets, and top Viva Voce questions & answers ellame ready-ah irukku.
          </p>
        </div>
      </div>

      {/* SECTION 1: USER FLOW & ARCHITECTURE DIAGRAM */}
      <div className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 shadow-xs space-y-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-orange-100 text-orange-600 flex items-center justify-center font-bold">
            <Layers className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-slate-900">Project User Flow & Architecture</h2>
            <p className="text-xs text-slate-500">Visual mapping of the exact workflow described in your requirements</p>
          </div>
        </div>

        {/* Diagram Flow Cards */}
        <div className="grid grid-cols-1 md:grid-cols-7 gap-3 items-center">
          {/* Step 1 */}
          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 text-center space-y-1 md:col-span-1">
            <span className="w-6 h-6 mx-auto rounded-full bg-slate-900 text-white text-xs font-bold flex items-center justify-center">
              1
            </span>
            <p className="font-bold text-slate-800 text-xs">Customer</p>
            <p className="text-[11px] text-slate-500">Visits website</p>
          </div>

          <div className="hidden md:flex justify-center text-slate-300">
            <ArrowRight className="w-5 h-5" />
          </div>

          {/* Step 2 */}
          <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 text-center space-y-1 md:col-span-1">
            <span className="w-6 h-6 mx-auto rounded-full bg-amber-600 text-white text-xs font-bold flex items-center justify-center">
              2
            </span>
            <p className="font-bold text-amber-900 text-xs">Feedback Form</p>
            <p className="text-[11px] text-amber-700">Name, Email, ⭐, Comment</p>
          </div>

          <div className="hidden md:flex justify-center text-slate-300">
            <ArrowRight className="w-5 h-5" />
          </div>

          {/* Step 3 */}
          <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-center space-y-1 md:col-span-1">
            <span className="w-6 h-6 mx-auto rounded-full bg-rose-600 text-white text-xs font-bold flex items-center justify-center">
              3
            </span>
            <p className="font-bold text-rose-900 text-xs">JS Validation</p>
            <p className="text-[11px] text-rose-700">Regex, Min length, Non-empty</p>
          </div>

          <div className="hidden md:flex justify-center text-slate-300">
            <ArrowRight className="w-5 h-5" />
          </div>

          {/* Step 4 */}
          <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-center space-y-1 md:col-span-1">
            <span className="w-6 h-6 mx-auto rounded-full bg-emerald-600 text-white text-xs font-bold flex items-center justify-center">
              4
            </span>
            <p className="font-bold text-emerald-900 text-xs">SQLite DB</p>
            <p className="text-[11px] text-emerald-700">Persisted in feedbacks table</p>
          </div>
        </div>

        {/* Second row of flow */}
        <div className="p-4 bg-orange-50/60 rounded-2xl border border-orange-200 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-orange-500 text-white flex items-center justify-center font-bold text-xs">
              5
            </div>
            <div>
              <p className="text-xs font-bold text-orange-900">SQLite Aggregations & Summary</p>
              <p className="text-[11px] text-orange-700">
                Calculates total count, AVG(rating), and 5-star to 1-star distribution count.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <ArrowRight className="w-4 h-4 text-orange-500" />
            <span className="text-xs font-bold bg-white px-3 py-1 rounded-lg border border-orange-200 text-orange-900">
              Admin Dashboard Output
            </span>
          </div>
        </div>
      </div>

      {/* SECTION 2: PYTHON / DJANGO + SQLITE CODE VIEWER */}
      <div className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 shadow-xs space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-100 text-indigo-600 flex items-center justify-center font-bold">
              <Code2 className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-slate-900">Python / Django + SQLite Implementation Code</h2>
              <p className="text-xs text-slate-500">
                Copy and run these exact Django files for your college lab record & demo.
              </p>
            </div>
          </div>

          {/* Copy Button */}
          <button
            onClick={() => copyToClipboard(activeCodeTab, djangoCode[activeCodeTab])}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold bg-slate-900 hover:bg-slate-800 text-white transition-all shadow-xs"
          >
            {copiedKey === activeCodeTab ? (
              <>
                <Check className="w-4 h-4 text-emerald-400" />
                <span>Copied to Clipboard!</span>
              </>
            ) : (
              <>
                <Copy className="w-4 h-4" />
                <span>Copy {activeCodeTab}.py</span>
              </>
            )}
          </button>
        </div>

        {/* Tab Switcher for Code Files */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-2 border-b border-slate-200">
          {[
            { id: 'models', label: 'models.py (Database Schema)' },
            { id: 'forms', label: 'forms.py (Validations)' },
            { id: 'views', label: 'views.py (Backend Logic)' },
            { id: 'urls', label: 'urls.py (Routing)' },
            { id: 'html', label: 'feedback_form.html (Template)' },
            { id: 'settings', label: 'settings.py (SQLite DB)' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveCodeTab(tab.id as any)}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all ${
                activeCodeTab === tab.id
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Syntax Box */}
        <div className="relative rounded-2xl bg-slate-950 p-4 sm:p-6 overflow-x-auto text-xs font-mono text-slate-200 shadow-inner">
          <pre className="leading-relaxed">
            <code>{djangoCode[activeCodeTab]}</code>
          </pre>
        </div>

        {/* Terminal Run Instructions */}
        <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 text-xs space-y-2">
          <div className="flex items-center gap-2 font-bold text-slate-800">
            <Terminal className="w-4 h-4 text-slate-600" />
            <span>Terminal Setup Commands (How to run locally in Python)</span>
          </div>
          <div className="bg-slate-900 text-emerald-400 p-3 rounded-xl font-mono text-[11px] space-y-1">
            <p># 1. Create and activate virtual environment</p>
            <p>python -m venv venv && source venv/bin/activate  # (Windows: venv\Scripts\activate)</p>
            <p># 2. Install Django</p>
            <p>pip install django</p>
            <p># 3. Create migrations and build SQLite database tables</p>
            <p>python manage.py makemigrations</p>
            <p>python manage.py migrate</p>
            <p># 4. Start the Django development server</p>
            <p>python manage.py runserver</p>
          </div>
        </div>
      </div>

      {/* SECTION 3: VIVA VOCE QUESTIONS & ANSWERS */}
      <div className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 shadow-xs space-y-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-600 flex items-center justify-center font-bold">
            <HelpCircle className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-slate-900">College Viva Voce Q&A Cheat Sheet</h2>
            <p className="text-xs text-slate-500">
              Frequently asked questions by college examiners with English & Tanglish explanations.
            </p>
          </div>
        </div>

        <div className="space-y-4">
          {vivaQuestions.map((item, idx) => (
            <div key={idx} className="p-4 sm:p-5 rounded-2xl border border-slate-200 bg-slate-50/50 space-y-2">
              <div className="flex items-start gap-2.5">
                <span className="w-6 h-6 rounded-full bg-indigo-600 text-white text-xs font-bold flex items-center justify-center shrink-0 mt-0.5">
                  Q{idx + 1}
                </span>
                <div>
                  <h3 className="text-sm font-bold text-slate-900">{item.q}</h3>
                  <span className="text-xs font-medium text-amber-700 block mt-0.5">
                    Tamil/Tanglish context: {item.tanglish}
                  </span>
                </div>
              </div>
              <div className="pl-8 text-xs text-slate-700 leading-relaxed bg-white p-3 rounded-xl border border-slate-200">
                <strong>Answer: </strong> {item.a}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
