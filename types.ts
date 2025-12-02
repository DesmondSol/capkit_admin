import firebase from 'firebase/compat/app';
import 'firebase/compat/firestore';

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
  lastLogin?: firebase.firestore.Timestamp | Date;
  createdAt: firebase.firestore.Timestamp | Date;
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
  id: string; // This corresponds to userId
  name: string;
  shortDescription: string;
  fullDescription: string; // Detailed business summary
  founderName: string;
  founderBio: string;
  stage: 'Idea' | 'MVP' | 'Seed' | 'Series A' | 'Growth';
  sector: string;
  website?: string;
  readinessScore: number; // 0-100 calculated by system previously
  isFavorite: boolean;
  // Specific data for AI analysis
  businessModel: string;
  traction: string;
  askAmount: number;
  
  // Raw Canvas Data
  canvas?: CanvasData;
  
  // Module Progress (for quick visual on card)
  moduleProgress?: {
      [key: string]: boolean; // e.g. 'economics': true
  };

  // AI Generated fields (stored here for caching)
  aiEvaluation?: StartupAiEvaluation;
}

export interface StartupAiEvaluation {
  confidenceScore: number; // 0-100
  verdict: 'Invest' | 'Watch' | 'Pass';
  strengths: string[];
  weaknesses: string[];
  strategicAnalysis: string;
  nextSteps: string[];
  lastUpdated: string;
}

export interface Investor {
  id: string;
  fullName?: string; // Normalize to this
  name?: string; // Fallback
  email: string;
  firmName?: string;
  firm?: string; // Fallback
  investorType?: string; // VC, Angel, PE, etc.
  investmentFocus?: string; // Sectors
  checkSize?: string;
  linkedinProfile?: string;
  website?: string;
  status?: 'pending' | 'approved' | 'rejected';
  submittedAt?: firebase.firestore.Timestamp | Date;
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
    topBottleneck: string; // Module with lowest completion
    samples: string[]; // Random text samples for AI context
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