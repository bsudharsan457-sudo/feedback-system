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

export interface RatingBreakdownItem {
  count: number;
  percentage: number;
}

export interface FeedbackSummary {
  total: number;
  averageRating: number;
  ratingDistribution: {
    5: RatingBreakdownItem;
    4: RatingBreakdownItem;
    3: RatingBreakdownItem;
    2: RatingBreakdownItem;
    1: RatingBreakdownItem;
  };
  sentimentCounts: {
    positive: number;
    neutral: number;
    negative: number;
  };
  categoryCounts: Record<string, number>;
  recentFeedbacks: FeedbackRecord[];
}

export interface ValidationErrors {
  customer_name?: string;
  email?: string;
  rating?: string;
  feedback?: string;
}
