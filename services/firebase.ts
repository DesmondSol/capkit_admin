import firebase from "firebase/app";
import "firebase/auth";
import "firebase/firestore";
// import { getAnalytics, isSupported } from "firebase/analytics"; // Removed to prevent ad-blocker crashes
import { StartupData, UserProfile, CanvasData, Investor, ProgramStats, TeamData, MindsetData } from "../types";

// Explicitly use stable version URL in import map for index.html to avoid "failed to load" errors
const firebaseConfig = {
  apiKey: "AIzaSyA4GqjifWsIk6jxyQkdh_BK_0YoUExvZIM",
  authDomain: "capkit-et.firebaseapp.com",
  projectId: "capkit-et",
  storageBucket: "capkit-et.firebasestorage.app",
  messagingSenderId: "590666611170",
  appId: "1:590666611170:web:ea6d92a087fa6bd766e1bb",
  measurementId: "G-XS2VEBCHH6"
};

// Initialize Firebase
// Fix: Use v8 namespaced API for initialization
if (!firebase.apps.length) {
  firebase.initializeApp(firebaseConfig);
}
console.log("Firebase Initialized"); // Debug log

export const auth = firebase.auth();
export const db = firebase.firestore();

// Safe Analytics Initialization - Optional
export const analytics: any = null;

// Fix: Export types and objects compatible with v8 API
export type User = firebase.User;
export const Timestamp = firebase.firestore.Timestamp;

// --- Data Helper Functions ---

const extractVentureName = (canvas?: CanvasData, userDisplayName?: string): string => {
  if (!canvas) return userDisplayName ? `${userDisplayName}'s Venture` : 'Unnamed Venture';

  // 1. Check strict Brand fields first
  if (canvas["Brand & Style Guides"] && canvas["Brand & Style Guides"].length < 50 && canvas["Brand & Style Guides"].length > 2) {
      return canvas["Brand & Style Guides"].replace(/["']/g, "");
  }

  // 2. Regex for "Project Name:" or "Title:" patterns in Project Overview
  if (canvas["Project Overview"]) {
      const namePatterns = [
          /Project Name:\s*([^\n\r]+)/i,
          /Venture Name:\s*([^\n\r]+)/i,
          /Startup Name:\s*([^\n\r]+)/i,
          /Title:\s*([^\n\r]+)/i
      ];
      
      for (const pattern of namePatterns) {
          const match = canvas["Project Overview"].match(pattern);
          if (match && match[1] && match[1].trim().length > 1) {
              return match[1].trim().replace(/["']/g, "");
          }
      }
      
      // If short enough, use the whole overview as a title
      if (canvas["Project Overview"].length < 40) return canvas["Project Overview"];
  }

  // 3. Fallbacks
  if (canvas["Unique Value Proposition"] && canvas["Unique Value Proposition"].length < 30) return canvas["Unique Value Proposition"];
  if (canvas["Problem"] && canvas["Problem"].length < 30) return `Project: ${canvas["Problem"]}`;

  return userDisplayName ? `${userDisplayName}'s Startup` : 'Unnamed Venture';
};

// Aggregates User Profile + Workspace Canvas + Admin Metadata
export const getAggregatedStartups = async (): Promise<StartupData[]> => {
  try {
    const usersRef = db.collection('users');
    const usersSnapshot = await usersRef.get();
    const users = usersSnapshot.docs.map(d => ({ id: d.id, ...d.data() } as UserProfile));
    
    const startupsPromises = users.map(async (user) => {
      // 1. Setup Refs
      const workspaceModulesRef = db.collection('workspaces').doc(user.id).collection('modules');
      
      // 2. Fetch Canvas Data
      let canvasData: CanvasData | undefined = undefined;
      const canvasDocRef = workspaceModulesRef.doc('canvas');
      const canvasSnap = await canvasDocRef.get();
      if (canvasSnap.exists) {
        canvasData = canvasSnap.data() as CanvasData;
      }

      // 3. Fetch Team Data
      let teamData: TeamData | undefined = undefined;
      const teamDocRef = workspaceModulesRef.doc('team');
      const teamSnap = await teamDocRef.get();
      if (teamSnap.exists) {
          teamData = teamSnap.data() as TeamData;
      }

      // 4. Fetch Mindset Data
      let mindsetData: MindsetData | undefined = undefined;
      const mindsetDocRef = workspaceModulesRef.doc('mindset');
      const mindsetSnap = await mindsetDocRef.get();
      if (mindsetSnap.exists) {
          mindsetData = mindsetSnap.data() as MindsetData;
      }

      // Check startup role or existence of canvas
      if (!canvasData) {
         if (user.role !== 'startup') return null;
      }

      // 5. Check existence of other modules for progress tracking
      const moduleCheckPromise = ['economics', 'productDesign', 'sales', 'grow'].map(async (mod) => {
          const modDocRef = workspaceModulesRef.doc(mod);
          const s = await modDocRef.get();
          return { name: mod, exists: s.exists };
      });
      const moduleResults = await Promise.all(moduleCheckPromise);
      const moduleProgress: {[key:string]: boolean} = {};
      moduleResults.forEach(r => moduleProgress[r.name] = r.exists);
      if (canvasData) moduleProgress['canvas'] = true;
      if (teamData) moduleProgress['team'] = true;
      if (mindsetData) moduleProgress['mindset'] = true;

      // 6. Fetch Admin Metadata (Scores, Favorites, AI Evals)
      const metaRef = db.collection('startups').doc(user.id);
      const metaSnap = await metaRef.get();
      const metaData = metaSnap.exists ? (metaSnap.data() || {}) : {};

      // 7. Smart Name Extraction
      const ventureName = extractVentureName(canvasData, user.displayName);

      // 8. Map to StartupData
      return {
        id: user.id,
        name: ventureName,
        founderName: user.displayName || 'Unknown Founder',
        // Prioritize mindset profile report for bio if available
        founderBio: mindsetData?.profileReport || teamData?.["Founder Story"] || metaData.founderBio || 'Profile not yet enriched.',
        
        shortDescription: canvasData?.["Unique Value Proposition"] || canvasData?.["Project Overview"] || 'No Value Proposition defined yet.',
        
        fullDescription: canvasData?.["Solution"] 
            ? `Problem: ${canvasData["Problem"] || 'N/A'}\n\nSolution: ${canvasData["Solution"]}` 
            : (canvasData?.["Product Detail"] || 'No detailed canvas data available.'),
            
        stage: metaData.stage || 'Idea',
        sector: metaData.sector || 'General',
        
        businessModel: canvasData?.["Business Model"] || canvasData?.["Pricing"] || canvasData?.["Unit Economics"] || 'Revenue streams not defined.',
        traction: canvasData?.["North Star Metric"] || canvasData?.["Product - Market Fit"] || 'Key metrics not tracked.',
        
        readinessScore: calculateReadiness(canvasData, teamData, mindsetData),
        isFavorite: metaData.isFavorite || false,
        aiEvaluation: metaData.aiEvaluation || undefined,
        askAmount: metaData.askAmount || 0,
        
        canvas: canvasData,
        team: teamData,
        mindset: mindsetData,
        moduleProgress: moduleProgress
      } as StartupData;
    });

    const results = await Promise.all(startupsPromises);
    return results.filter((s): s is StartupData => s !== null);
    
  } catch (error) {
    console.error("Error aggregating startups:", error);
    return [];
  }
};

const calculateReadiness = (canvas?: CanvasData, team?: TeamData, mindset?: MindsetData): number => {
  if (!canvas) return 0;
  let score = 0;
  if (canvas["Problem"]) score += 10;
  if (canvas["Solution"]) score += 10;
  if (canvas["Unique Value Proposition"]) score += 15; 
  if (canvas["Market"] || canvas["Customer Segments"]) score += 10;
  if (canvas["Business Model"] || canvas["Revenue Streams"]) score += 15;
  if (canvas["Unit Economics"] || canvas["Cost Structure"]) score += 5;
  if (canvas["North Star Metric"] || canvas["Key Metrics"]) score += 5;
  
  // Team Bonus
  if (team && (team["Founder Story"] || team["Team Members"])) score += 10; 
  // Mindset Bonus
  if (mindset && (mindset.goals || mindset.assessmentAnswers)) score += 20;

  return Math.min(score, 100);
};

export const toggleUserAccess = async (userId: string, currentStatus: boolean) => {
  const userRef = db.collection('users').doc(userId);
  await userRef.update({ isActive: !currentStatus });
};

export const updateStartupAiData = async (startupId: string, aiData: any) => {
  const startupRef = db.collection('startups').doc(startupId);
  await startupRef.set({ aiEvaluation: aiData }, { merge: true });
};

export const toggleStartupFavorite = async (startupId: string, currentStatus: boolean) => {
  const startupRef = db.collection('startups').doc(startupId);
  await startupRef.set({ isFavorite: !currentStatus }, { merge: true });
};

// --- DEEP SCAN ---

const TARGET_MODULES = [
    'canvas',
    'copywriting',
    'economics',
    'grow',
    'marketResearch',
    'personas',
    'productDesign',
    'sales',
    'team',
    'mindset'
];

export const getDeepProgramStats = async (): Promise<ProgramStats> => {
    try {
        const usersRef = db.collection('users');
        const usersSnap = await usersRef.get();
        const totalUsers = usersSnap.size;
        
        const moduleCounts: Record<string, number> = {};
        TARGET_MODULES.forEach(m => moduleCounts[m] = 0);
        
        const samples: string[] = [];

        const userPromises = usersSnap.docs.map(async (userDoc) => {
            const userId = userDoc.id;
            
            for (const mod of TARGET_MODULES) {
                const docRef = db.collection('workspaces').doc(userId).collection('modules').doc(mod);
                const docSnap = await docRef.get();
                if (docSnap.exists) {
                    moduleCounts[mod]++;
                    
                    if (samples.length < 5 && Math.random() > 0.8) {
                        const data = docSnap.data();
                        if (data) {
                            const sampleText = JSON.stringify(data).substring(0, 100);
                            samples.push(`[${mod}]: ${sampleText}...`);
                        }
                    }
                }
            }
        });

        await Promise.all(userPromises);

        const moduleStats = TARGET_MODULES.map(name => ({
            name,
            count: moduleCounts[name],
            completionRate: totalUsers > 0 ? Math.round((moduleCounts[name] / totalUsers) * 100) : 0
        }));

        const sortedStats = [...moduleStats].sort((a, b) => a.completionRate - b.completionRate);
        const topBottleneck = sortedStats[0]?.name || 'None';

        return {
            totalStartups: totalUsers,
            moduleStats,
            topBottleneck,
            samples
        };

    } catch (e) {
        console.error("Deep scan failed:", e);
        return {
            totalStartups: 0,
            moduleStats: [],
            topBottleneck: 'Error',
            samples: []
        };
    }
};

// --- INVESTORS ---

export const getInvestors = async (): Promise<Investor[]> => {
    try {
        const invRef = db.collection('investor_registrations');
        const snapshot = await invRef.get();
        return snapshot.docs.map(d => {
            const data = d.data();
            return { 
                id: d.id, 
                ...data,
                fullName: data.fullName || data.name || 'Unknown Investor',
                firmName: data.firmName || data.firm || 'Independent',
                status: data.status || 'pending'
            } as Investor;
        });
    } catch (error) {
        console.error("Error fetching investors:", error);
        return [];
    }
};

export const updateInvestorStatus = async (id: string, status: 'approved' | 'rejected') => {
    const ref = db.collection('investor_registrations').doc(id);
    await ref.update({ status });
};
