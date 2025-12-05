import React, { useState, useEffect } from 'react';
// Fix: Use v8 namespaced API
import { auth, User } from './services/firebase';
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

  useEffect(() => {
    // Fix: Use v8 namespaced API for auth state changes
    const unsubscribe = auth.onAuthStateChanged((currentUser) => {
      setUser(currentUser);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const handleLogout = async () => {
    try {
      // Fix: Use v8 namespaced API for sign out
      await auth.signOut();
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

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-brand-200 border-t-brand-600 rounded-full animate-spin"></div>
          <p className="text-slate-500 text-sm font-medium">Loading CapKit Admin...</p>
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
