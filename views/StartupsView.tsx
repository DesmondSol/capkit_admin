import React, { useState, useEffect } from 'react';
import { StartupData } from '../types';
import { getAggregatedStartups, toggleStartupFavorite } from '../services/firebase';
import { MOCK_STARTUPS } from '../services/mockData';
import { Star, TrendingUp, MoreHorizontal, Activity, RefreshCcw, Layers } from 'lucide-react';
import StartupDetailPanel from '../components/StartupDetailPanel';

const StartupsView: React.FC = () => {
  const [startups, setStartups] = useState<StartupData[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedStartup, setSelectedStartup] = useState<StartupData | null>(null);

  const fetchStartups = async () => {
    setLoading(true);
    try {
      const data = await getAggregatedStartups();
      if (data.length === 0) {
        // Fallback to mock data ONLY if absolutely no real data is found (for demo purposes)
        // In production you might just want to show "No startups found"
        console.log("No real startups found, checking if we should show mock data...");
        // Uncomment below to force mock data if DB is empty
        // setStartups(MOCK_STARTUPS);
        setStartups([]);
      } else {
        setStartups(data);
      }
    } catch (err) {
      console.error("Error fetching startups", err);
      // Fallback
      setStartups(MOCK_STARTUPS);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStartups();
  }, []);

  const handleFavorite = async (id: string, current: boolean) => {
    // Optimistic update
    setStartups(prev => prev.map(s => s.id === id ? { ...s, isFavorite: !current } : s));
    if(selectedStartup && selectedStartup.id === id) {
        setSelectedStartup(prev => prev ? {...prev, isFavorite: !current} : null);
    }
    
    try {
        await toggleStartupFavorite(id, current);
    } catch (e) { 
        console.warn("Backend update failed", e);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
            <h2 className="text-2xl font-bold text-slate-900">Startups Pipeline</h2>
            <p className="text-slate-500 text-sm mt-1">AI-Powered Evaluation & Tracking</p>
        </div>
        <div className="flex items-center space-x-3">
            <button 
                onClick={fetchStartups} 
                className="p-2 text-slate-400 hover:text-brand-600 hover:bg-slate-100 rounded-full transition-colors"
                title="Refresh Data"
            >
                <RefreshCcw size={18} className={loading ? "animate-spin" : ""} />
            </button>
            <span className="bg-white border border-slate-200 px-3 py-1 rounded-md text-sm text-slate-600 font-medium">Total: {startups.length}</span>
        </div>
      </div>

      {loading && startups.length === 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
           {[1,2,3].map(i => (
               <div key={i} className="h-64 bg-slate-100 rounded-xl animate-pulse"></div>
           ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {startups.length === 0 && !loading && (
                <div className="col-span-full flex flex-col items-center justify-center p-12 bg-white rounded-xl border border-dashed border-slate-300 text-slate-400">
                    <TrendingUp size={48} className="mb-4 opacity-50"/>
                    <p className="text-lg font-medium">No startups found with Canvas data.</p>
                    <p className="text-sm">Users must fill out their Business Canvas to appear here.</p>
                </div>
            )}
            
            {startups.map((startup) => (
            <div 
                key={startup.id} 
                className="bg-white rounded-xl shadow-sm border border-slate-200 hover:shadow-md transition-all duration-200 flex flex-col h-full group cursor-pointer"
                onClick={() => setSelectedStartup(startup)}
            >
                <div className="p-6 flex-1">
                <div className="flex justify-between items-start mb-4">
                    <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-brand-500 to-brand-700 flex items-center justify-center text-white font-bold text-lg shadow-lg shadow-brand-200">
                    {startup.name.substring(0, 2).toUpperCase()}
                    </div>
                    <button 
                    onClick={(e) => { e.stopPropagation(); handleFavorite(startup.id, startup.isFavorite); }}
                    className={`p-1.5 rounded-full hover:bg-slate-100 transition-colors ${startup.isFavorite ? 'text-yellow-400' : 'text-slate-300'}`}
                    >
                    <Star size={20} fill={startup.isFavorite ? "currentColor" : "none"} />
                    </button>
                </div>

                <h3 className="text-lg font-bold text-slate-900 mb-1 line-clamp-1">{startup.name}</h3>
                <p className="text-xs font-semibold text-brand-600 bg-brand-50 inline-block px-2 py-0.5 rounded mb-3">
                    {startup.stage} &bull; {startup.sector}
                </p>
                
                <p className="text-slate-600 text-sm line-clamp-3 mb-4 h-15">
                    {startup.shortDescription}
                </p>

                <div className="flex items-center space-x-4 text-sm text-slate-500 mt-auto">
                    <div className="flex items-center gap-1" title="Canvas Completion Score">
                        <Activity size={14} className={startup.readinessScore > 75 ? "text-green-500" : "text-yellow-500"}/>
                        <span className="font-medium">Readiness: {startup.readinessScore}%</span>
                    </div>
                </div>

                {/* Module Presence Indicators */}
                <div className="flex gap-1 mt-3 pt-3 border-t border-slate-100">
                    <span className="text-xs text-slate-400 mr-1 flex items-center"><Layers size={10} className="mr-1"/> Modules:</span>
                    {['canvas', 'economics', 'sales'].map(mod => (
                        <div 
                            key={mod}
                            className={`w-2 h-2 rounded-full ${startup.moduleProgress && startup.moduleProgress[mod] ? 'bg-green-400' : 'bg-slate-200'}`}
                            title={mod.charAt(0).toUpperCase() + mod.slice(1)}
                        ></div>
                    ))}
                     <span className="text-[10px] text-slate-400 ml-1">
                         {startup.moduleProgress ? Object.values(startup.moduleProgress).filter(Boolean).length : 0}/4+
                     </span>
                </div>

                </div>

                <div className="px-6 py-4 border-t border-slate-100 bg-slate-50 rounded-b-xl flex justify-between items-center">
                <div className="text-xs text-slate-500 truncate max-w-[150px]">
                    Founder: <span className="text-slate-700 font-medium">{startup.founderName}</span>
                </div>
                <button 
                    className="text-sm text-brand-600 font-medium hover:text-brand-800 flex items-center gap-1"
                >
                    Details <MoreHorizontal size={16} />
                </button>
                </div>
            </div>
            ))}
        </div>
      )}

      <StartupDetailPanel 
        startup={selectedStartup} 
        onClose={() => setSelectedStartup(null)} 
        onToggleFavorite={handleFavorite}
      />
    </div>
  );
};

export default StartupsView;