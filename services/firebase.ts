import { initializeApp } from "firebase/app";
import { getAuth, signInWithEmailAndPassword, signOut, onAuthStateChanged, User } from "firebase/auth";
import { getFirestore, collection, doc, getDoc, getDocs, updateDoc, setDoc, addDoc, query, where, Timestamp } from "firebase/firestore";
import { getAnalytics } from "firebase/analytics";
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
const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
export const analytics = getAnalytics(app);

// Export Auth functions
export { signInWithEmailAndPassword, signOut, onAuthStateChanged };
export type { User };

// --- Data Helper Functions ---

// Aggregates User Profile + Workspace Canvas + Admin Metadata
export const getAggregatedStartups = async (): Promise<StartupData[]> => {
  try {
    const usersRef = collection(db, 'users');
    const usersSnapshot = await getDocs(usersRef);
    const users = usersSnapshot.docs.map(d => ({ id: d.id, ...d.data() } as UserProfile));
    
    const startupsPromises = users.map(async (user) => {
      // 2. Fetch Canvas Data from /workspaces/{userId}/modules/canvas
      let canvasData: CanvasData | undefined = undefined;
      const workspaceModulesRef = collection(db, 'workspaces', user.id, 'modules');
      const canvasDocRef = doc(workspaceModulesRef, 'canvas');
      
      const canvasSnap = await getDoc(canvasDocRef);
      
      if (canvasSnap.exists()) {
        canvasData = canvasSnap.data() as CanvasData;
      }

      // Check startup role or existence of canvas
      if (!canvasData) {
         if (user.role !== 'startup') return null;
      }

      // Check existence of other modules
      const moduleCheckPromise = ['economics', 'productDesign', 'sales'].map(async (mod) => {
          const modDocRef = doc(workspaceModulesRef, mod);
          const s = await getDoc(modDocRef);
          return { name: mod, exists: s.exists() };
      });
      const moduleResults = await Promise.all(moduleCheckPromise);
      const moduleProgress: {[key:string]: boolean} = {};
      moduleResults.forEach(r => moduleProgress[r.name] = r.exists);
      if (canvasData) moduleProgress['canvas'] = true;

      // 3. Fetch Admin Metadata
      const metaRef = doc(db, 'startups', user.id);
      const metaSnap = await getDoc(metaRef);
      const metaData = metaSnap.exists() ? (metaSnap.data() || {}) : {};

      // 4. Map to StartupData
      return {
        id: user.id,
        name: user.displayName || 'Unknown Venture',
        founderName: user.displayName || 'Unknown Founder',
        founderBio: metaData.founderBio || 'Profile not yet enriched.',
        
        shortDescription: canvasData?.["Unique Value Proposition"] || canvasData?.["Project Overview"] || 'No Value Proposition defined yet.',
        
        fullDescription: canvasData?.["Solution"] 
            ? `Problem: ${canvasData["Problem"] || 'N/A'}\n\nSolution: ${canvasData["Solution"]}` 
            : (canvasData?.["Product Detail"] || 'No detailed canvas data available.'),
            
        stage: metaData.stage || 'Idea',
        sector: metaData.sector || 'General',
        
        businessModel: canvasData?.["Business Model"] || canvasData?.["Pricing"] || canvasData?.["Unit Economics"] || 'Revenue streams not defined.',
        traction: canvasData?.["North Star Metric"] || canvasData?.["Product - Market Fit"] || 'Key metrics not tracked.',
        
        readinessScore: calculateReadiness(canvasData),
        isFavorite: metaData.isFavorite || false,
        aiEvaluation: metaData.aiEvaluation || undefined,
        askAmount: metaData.askAmount || 0,
        
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
  if (canvas["Problem"]) score += 10;
  if (canvas["Solution"]) score += 10;
  if (canvas["Unique Value Proposition"]) score += 15; 
  if (canvas["Market"] || canvas["Customer Segments"]) score += 10;
  if (canvas["Business Model"] || canvas["Revenue Streams"]) score += 15;
  if (canvas["Unit Economics"] || canvas["Cost Structure"]) score += 10;
  if (canvas["North Star Metric"] || canvas["Key Metrics"]) score += 10;
  if (canvas["Unfair Advantage"]) score += 10;
  if (canvas["Product - Market Fit"]) score += 10;
  return Math.min(score, 100);
};

export const toggleUserAccess = async (userId: string, currentStatus: boolean) => {
  const userRef = doc(db, 'users', userId);
  await updateDoc(userRef, { isActive: !currentStatus });
};

export const updateStartupAiData = async (startupId: string, aiData: any) => {
  const startupRef = doc(db, 'startups', startupId);
  await setDoc(startupRef, { aiEvaluation: aiData }, { merge: true });
};

export const toggleStartupFavorite = async (startupId: string, currentStatus: boolean) => {
  const startupRef = doc(db, 'startups', startupId);
  await setDoc(startupRef, { isFavorite: !currentStatus }, { merge: true });
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
    'sales'
];

export const getDeepProgramStats = async (): Promise<ProgramStats> => {
    try {
        const usersRef = collection(db, 'users');
        const usersSnap = await getDocs(usersRef);
        const totalUsers = usersSnap.size;
        
        const moduleCounts: Record<string, number> = {};
        TARGET_MODULES.forEach(m => moduleCounts[m] = 0);
        
        const samples: string[] = [];

        const userPromises = usersSnap.docs.map(async (userDoc) => {
            const userId = userDoc.id;
            
            for (const mod of TARGET_MODULES) {
                const docRef = doc(db, 'workspaces', userId, 'modules', mod);
                const docSnap = await getDoc(docRef);
                if (docSnap.exists()) {
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
        const invRef = collection(db, 'investor_registrations');
        const snapshot = await getDocs(invRef);
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
    const ref = doc(db, 'investor_registrations', id);
    await updateDoc(ref, { status });
};