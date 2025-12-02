export enum UserRole {
  ADMIN = 'admin',
  STARTUP = 'startup',
  INVESTOR = 'investor'
}

export interface UserProfile {
  id: string;
  email: string;
  displayName?: string;
  photoURL?: string;
  role: UserRole;
  isActive: boolean;
  lastLogin?: any; // Generic type to avoid SDK dependency issues
  createdAt: any;
}

export interface CanvasData {
  "Problem"?: string;
  "Solution"?: string;
  "Unique Value Proposition"?: string;
  "Unfair Advantage"?: string;
  "Customer Segments"?: string; 
  "Key Metrics"?: string;
  "North Star Metric"?: string;
  "Channels"?: string;
  "Cost Structure"?: string;
  "Revenue Streams"?: string;
  "Business Model"?: string;
  "Pricing"?: string;
  "Unit Economics"?: string;
  "Product - Market Fit"?: string;
  "Project Overview"?: string;
  "Product Detail"?: string;
  "Product Vision"?: string;
  "Product Why"?: string;
  "Competitors"?: string;
  "Market"?: string;
  "Brand & Style Guides"?: string;
  "Use Cases"?: string;
  [key: string]: any;
}

export interface StartupData {
  id: string;
  name: string;
  shortDescription: string;
  fullDescription: string;
  founderName: string;
  founderBio: string;
  stage: 'Idea' | 'MVP' | 'Seed' | 'Series A' | 'Growth';
  sector: string;
  website?: string;
  readinessScore: number;
  isFavorite: boolean;
  businessModel: string;
  traction: string;
  askAmount: number;
  canvas?: CanvasData;
  moduleProgress?: {
      [key: string]: boolean;
  };
  aiEvaluation?: StartupAiEvaluation;
}

export interface StartupAiEvaluation {
  confidenceScore: number;
  verdict: 'Invest' | 'Watch' | 'Pass';
  strengths: string[];
  weaknesses: string[];
  strategicAnalysis: string;
  nextSteps: string[];
  lastUpdated: string;
}

export interface Investor {
  id: string;
  fullName?: string;
  name?: string;
  email: string;
  firmName?: string;
  firm?: string;
  investorType?: string;
  investmentFocus?: string;
  checkSize?: string;
  linkedinProfile?: string;
  website?: string;
  status?: 'pending' | 'approved' | 'rejected';
  submittedAt?: any;
  [key: string]: any;
}

export interface ModuleStats {
    name: string;
    count: number;
    completionRate: number;
}

export interface ProgramStats {
    totalStartups: number;
    moduleStats: ModuleStats[];
    topBottleneck: string;
    samples: string[];
}

export interface DailyReport {
  id?: string;
  date: string;
  summary: string;
  recommendations: string[];
  metrics: {
    activeUsers: number;
    newStartups: number;
    interactions: number;
  };
  deepAnalysis?: {
      bottleneckAnalysis: string;
      trendAnalysis: string;
  }
}