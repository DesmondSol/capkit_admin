import React, { useState, useEffect } from 'react';
import { auth, onAuthStateChanged, signOut, User } from './services/firebase';
import Sidebar from './components/Sidebar';
import UsersView from './views/UsersView';
import StartupsView from './views/StartupsView';
import AnalyticsView from './views/AnalyticsView';
import InvestorsView from './views/InvestorsView';
import LoginView from './views/LoginView';

const App: React.FC = () => {
  const [currentView, setCurrentView] = useState('startups');
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [timeoutError, setTimeoutError] = useState(false);

  console.log("App component loaded.");

  useEffect(() => {
    // Safety timeout in case Firebase fails to connect silently
    const timer = setTimeout(() => {
      if (loading) setTimeoutError(true);
    }, 10000);

    let unsubscribe: any;
    try {
        unsubscribe = onAuthStateChanged(auth, (currentUser) => {
          console.log("Auth state changed:", currentUser?.email);
          setUser(currentUser);
          setLoading(false);
          clearTimeout(timer);
        });
    } catch (e) {
        console.error("Auth init failed:", e);
        setTimeoutError(true);
    }

    return () => {
        if(unsubscribe) unsubscribe();
        clearTimeout(timer);
    };
  }, []);

  const handleLogout = async () => {
    try {
      await signOut(auth);
    } catch (error) {
      console.error("Error signing out", error);
    }
  };

  const renderContent = () => {
    switch (currentView) {
      case 'users':
        return <UsersView />;
      case 'startups':
        return <StartupsView />;
      case 'analytics':
        return <AnalyticsView />;
      case 'investors':
        return <InvestorsView />;
      case 'settings':
        return (
            <div className="space-y-6">
                <h2 className="text-2xl font-bold text-slate-900">Settings</h2>
                <div className="bg-white p-8 rounded-xl border border-slate-200 shadow-sm">
                    <p className="text-slate-500">Global platform settings.</p>
                    <div className="mt-4 pt-4 border-t border-slate-100">
                      <p className="text-sm text-slate-500 mb-2">Authenticated as: <span className="font-medium text-slate-900">{user?.email}</span></p>
                      <button onClick={handleLogout} className="text-sm text-red-600 hover:text-red-800 font-medium">Sign Out</button>
                    </div>
                </div>
            </div>
        );
      default:
        return <StartupsView />;
    }
  };

  if (timeoutError && loading) {
     return (
        <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
            <div className="max-w-md w-full bg-white p-6 rounded-lg shadow-lg border-l-4 border-red-500">
                <h3 className="text-red-600 font-bold text-lg mb-2">Connection Timeout</h3>
                <p className="text-slate-600">The application is taking too long to connect to Firebase. This might be due to:</p>
                <ul className="list-disc ml-5 mt-2 text-sm text-slate-500 space-y-1">
                    <li>Network restrictions or AdBlockers blocking Firebase.</li>
                    <li>Slow internet connection.</li>
                    <li>Invalid Firebase configuration.</li>
                </ul>
                <button 
                    onClick={() => window.location.reload()}
                    className="mt-4 bg-slate-900 text-white px-4 py-2 rounded hover:bg-slate-800 transition-colors w-full"
                >
                    Reload Page
                </button>
            </div>
        </div>
     )
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-brand-200 border-t-brand-600 rounded-full animate-spin"></div>
          <p className="text-slate-500 text-sm font-medium">Connecting to Firebase...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <LoginView />;
  }

  return (
    <div className="min-h-screen bg-slate-50 flex">
      <Sidebar 
        currentView={currentView} 
        setCurrentView={setCurrentView} 
        onLogout={handleLogout}
      />
      
      <main className="flex-1 ml-64 p-8 overflow-y-auto h-screen">
        <div className="max-w-7xl mx-auto">
            {renderContent()}
        </div>
      </main>
    </div>
  );
};

export default App;