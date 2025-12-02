import firebase from "firebase/compat/app";
import "firebase/compat/auth";
import "firebase/compat/firestore";
import "firebase/compat/analytics";
import { StartupData, UserProfile, CanvasData, Investor, ProgramStats } from "../types";

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
if (!firebase.apps.length) {
  firebase.initializeApp(firebaseConfig);
}
const app = firebase.app();
export const auth = firebase.auth();
export const db = firebase.firestore();
export const analytics = firebase.analytics();

// Export User type for use in components
export type User = firebase.User;

// Auth Functions wrapped to match existing import signatures
export const signInWithEmailAndPassword = (authArg: firebase.auth.Auth, email: string, pass: string) => {
  return authArg.signInWithEmailAndPassword(email, pass);
};
export const signOut = (authArg: firebase.auth.Auth) => authArg.signOut();
export const onAuthStateChanged = (authArg: firebase.auth.Auth, nextOrObserver: any) => authArg.onAuthStateChanged(nextOrObserver);

// Firestore Collections
export const usersCol = db.collection('users');
export const startupsMetaCol = db.collection('startups'); 
export const investorsCol = db.collection('investor_registrations');
export const reportsCol = db.collection('reports');

// Data Helper Functions

// Aggregates User Profile + Workspace Canvas + Admin Metadata
export const getAggregatedStartups = async (): Promise<StartupData[]> => {
  try {
    // 1. Fetch all users
    const usersSnapshot = await usersCol.get();
    const users = usersSnapshot.docs.map(d => ({ id: d.id, ...d.data() } as UserProfile));
    
    // Filter for likely startups (or just take all if roles aren't strictly set)
    // For now, we process all users to see if they have a canvas
    const startupsPromises = users.map(async (user) => {
      // 2. Fetch Canvas Data from /workspaces/{userId}/modules/canvas
      let canvasData: CanvasData | undefined = undefined;
      const workspaceRef = db.collection('workspaces').doc(user.id).collection('modules');
      
      const canvasSnap = await workspaceRef.doc('canvas').get();
      
      if (canvasSnap.exists) {
        canvasData = canvasSnap.data() as CanvasData;
      }

      // If no canvas, this user might not be a startup or hasn't started yet
      // However, we might want to check if they have OTHER modules to confirm startup status
      if (!canvasData) {
         if (user.role !== 'startup') return null;
      }

      // Check existence of other modules for the "Progress" indicator on the card
      const moduleCheckPromise = ['economics', 'productDesign', 'sales'].map(async (mod) => {
          const s = await workspaceRef.doc(mod).get();
          return { name: mod, exists: s.exists };
      });
      const moduleResults = await Promise.all(moduleCheckPromise);
      const moduleProgress: {[key:string]: boolean} = {};
      moduleResults.forEach(r => moduleProgress[r.name] = r.exists);
      if (canvasData) moduleProgress['canvas'] = true;


      // 3. Fetch Admin Metadata (Favorites, previous AI evals) from our internal collection
      const metaRef = db.collection('startups').doc(user.id);
      const metaSnap = await metaRef.get();
      const metaData = metaSnap.exists ? (metaSnap.data() || {}) : {};

      // 4. Map to StartupData interface
      // NOTE: Database keys have spaces, so we access them via bracket notation
      return {
        id: user.id,
        name: user.displayName || 'Unknown Venture',
        founderName: user.displayName || 'Unknown Founder',
        founderBio: metaData.founderBio || 'Profile not yet enriched.',
        
        // Map Canvas Blocks to Description
        shortDescription: canvasData?.["Unique Value Proposition"] || canvasData?.["Project Overview"] || 'No Value Proposition defined yet.',
        
        fullDescription: canvasData?.["Solution"] 
            ? `Problem: ${canvasData["Problem"] || 'N/A'}\n\nSolution: ${canvasData["Solution"]}` 
            : (canvasData?.["Product Detail"] || 'No detailed canvas data available.'),
            
        stage: metaData.stage || 'Idea',
        sector: metaData.sector || 'General',
        
        // Map Canvas Blocks to Analysis Fields
        businessModel: canvasData?.["Business Model"] || canvasData?.["Pricing"] || canvasData?.["Unit Economics"] || 'Revenue streams not defined.',
        traction: canvasData?.["North Star Metric"] || canvasData?.["Product - Market Fit"] || 'Key metrics not tracked.',
        
        readinessScore: calculateReadiness(canvasData),
        isFavorite: metaData.isFavorite || false,
        aiEvaluation: metaData.aiEvaluation || undefined,
        askAmount: metaData.askAmount || 0,
        
        // Store raw canvas for the detail view
        canvas: canvasData,
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

const calculateReadiness = (canvas?: CanvasData): number => {
  if (!canvas) return 0;
  let score = 0;
  // Simple heuristic: 10-15 points for each filled major block
  // Using the database keys with spaces
  if (canvas["Problem"]) score += 10;
  if (canvas["Solution"]) score += 10;
  if (canvas["Unique Value Proposition"]) score += 15; // Weighted higher
  if (canvas["Market"] || canvas["Customer Segments"]) score += 10;
  if (canvas["Business Model"] || canvas["Revenue Streams"]) score += 15; // Weighted higher
  if (canvas["Unit Economics"] || canvas["Cost Structure"]) score += 10;
  if (canvas["North Star Metric"] || canvas["Key Metrics"]) score += 10;
  if (canvas["Unfair Advantage"]) score += 10;
  if (canvas["Product - Market Fit"]) score += 10;
  return Math.min(score, 100);
};

export const toggleUserAccess = async (userId: string, currentStatus: boolean) => {
  const userRef = db.collection('users').doc(userId);
  await userRef.update({ isActive: !currentStatus });
};

// Update AI data in the METADATA collection, not the user's workspace
export const updateStartupAiData = async (startupId: string, aiData: any) => {
  const startupRef = db.collection('startups').doc(startupId);
  await startupRef.set({ aiEvaluation: aiData }, { merge: true });
};

export const toggleStartupFavorite = async (startupId: string, currentStatus: boolean) => {
  const startupRef = db.collection('startups').doc(startupId);
  await startupRef.set({ isFavorite: !currentStatus }, { merge: true });
};

// --- DEEP SCAN FUNCTIONALITY ---

const TARGET_MODULES = [
    'canvas',
    'copywriting',
    'economics',
    'grow',
    'marketResearch',
    'personas',
    'productDesign',
    'sales'
];

export const getDeepProgramStats = async (): Promise<ProgramStats> => {
    try {
        const usersSnap = await usersCol.get();
        // Assuming all users in 'users' collection are potential startups for this scan
        const totalUsers = usersSnap.size;
        
        const moduleCounts: Record<string, number> = {};
        TARGET_MODULES.forEach(m => moduleCounts[m] = 0);
        
        const samples: string[] = [];

        // This can be heavy, in production use Cloud Functions. 
        // For client-side admin dashboard, we process in batches or just Promise.all if < 500 users.
        const userPromises = usersSnap.docs.map(async (userDoc) => {
            const userId = userDoc.id;
            const modulesRef = db.collection('workspaces').doc(userId).collection('modules');
            
            // Check each module
            for (const mod of TARGET_MODULES) {
                const docSnap = await modulesRef.doc(mod).get();
                if (docSnap.exists) {
                    moduleCounts[mod]++;
                    
                    // Extract a sample for AI (anonymized snippet)
                    // We only take 1 sample per module type globally to save tokens/complexity
                    if (samples.length < 5 && Math.random() > 0.8) {
                        const data = docSnap.data();
                        if (data) {
                            const sampleText = JSON.stringify(data).substring(0, 100); // truncated
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

        // Find bottleneck (module with lowest non-zero score, or just lowest)
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

// --- INVESTOR FUNCTIONS ---

export const getInvestors = async (): Promise<Investor[]> => {
    try {
        const snapshot = await investorsCol.get();
        return snapshot.docs.map(d => {
            const data = d.data();
            // Normalize data structure
            return { 
                id: d.id, 
                ...data,
                // Ensure name and firm are populated regardless of field naming convention
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