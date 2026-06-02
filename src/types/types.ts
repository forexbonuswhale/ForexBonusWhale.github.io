export interface Broker {
  id: string;
  name: string;
  category: "no_deposit" | "deposit" | "contest";
  bonus: number;
  bonusCurrency: string;
  status: "active" | "inactive";
  views: number;
  rating: number;
  reviews: number;
  description: string;
  howToClaimSteps: string[];
  terms: string;
  website: string;
  regulated: boolean;
  country: string;
  logo?: string;
  createdAt?: string;
}

export interface Stats {
  totalBrokers: number;
  activeBonuses: number;
  totalReviews: number;
}

export interface BrokerReview {
  id: string;
  userName: string;
  rating: number;
  comment: string;
  createdAt: string;
}
