import React, { useState } from 'react';
import { generateDailyReport } from '../services/geminiService';
import { generateSampleLogs } from '../services/mockData';
import { DailyReport, ProgramStats } from '../types';
import { db, getDeepProgramStats } from '../services/firebase';
import { collection, addDoc, Timestamp } from 'firebase/firestore';
import { FileText, RefreshCw, Database, Microscope, AlertTriangle, TrendingUp, BarChart2 } from 'lucide-react';

const AnalyticsView: React.FC = () => {
  const [report, setReport] = useState<Partial<DailyReport> | null>(null);
  const [generating, setGenerating] = useState(false);
  const [lastSaved, setLastSaved] = useState<string | null>(null);
  const [deepStats, setDeepStats] = useState<ProgramStats | null>(null);
  const [scanProgress, setScanProgress] = useState(0);
  const [isScanning, setIsScanning] = useState(false);

  // Mock data for visual charts
  const activityData = [
    { label: 'Mon', val: 40 },
    { label: 'Tue', val: 30 },
    { label: 'Wed', val: 75 },
    { label: 'Thu', val: 50 },
    { label: 'Fri', val: 60 },
    { label: 'Sat', val: 45 },
    { label: 'Sun', val: 80 },
  ];

  const handleGenerateReport = async () => {
    setGenerating(true);
    const activeUsers = 1542;
    const interactions = 8902;
    const startupCount = deepStats?.totalStartups || 45;
    const logs = generateSampleLogs();

    try {
        const result = await generateDailyReport(activeUsers, interactions, startupCount, logs, deepStats || undefined);
        setReport(result);
        
        try {
            await addDoc(collection(db, 'reports'), {
                ...result,
                date: new Date().toISOString(),
                createdAt: Timestamp.now()
            });
            setLastSaved(new Date().toLocaleTimeString());
        } catch (e) {
            console.warn("Could not save to Firestore in demo mode");
            setLastSaved("Demo Mode (Not Saved)");
        }
        
    } catch (e) {
        console.error(e);
    } finally {
        setGenerating(false);
    }
  };

  const handleDeepScan = async () => {
      setIsScanning(true);
      setScanProgress(10);
      try {
          const progressInterval = setInterval(() => {
              setScanProgress(prev => Math.min(prev + 10, 90));
          }, 500);

          const stats = await getDeepProgramStats();
          clearInterval(progressInterval);
          setScanProgress(100);
          setDeepStats(stats);
      } catch (e) {
          console.error("Deep scan error", e);
      } finally {
          setTimeout(() => {
              setIsScanning(false);
              setScanProgress(0);
          }, 800);
      }
  };

  const SimpleBarChart = ({ data, colorClass }: { data: any[], colorClass: string }) => (
      <div className="flex items-end justify-between h-48 w-full gap-2 pt-4">
          {data.map((d, i) => (
              <div key={i} className="flex flex-col items-center flex-1 h-full justify-end group">
                  <div className="relative w-full flex justify-center">
                    <div 
                        className={`w-full max-w-[20px] rounded-t-sm transition-all duration-500 ${colorClass} opacity-80 group-hover:opacity-100`}
                        style={{ height: `${d.val}%` }}
                    ></div>
                    <div className="absolute -top-8 bg-slate-800 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-10">
                        {d.val} units
                    </div>
                  </div>
                  <span className="text-xs text-slate-400 mt-2">{d.label}</span>
              </div>
          ))}
      </div>
  );

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
            <h2 className="text-2xl font-bold text-slate-900">Program Analytics</h2>
            <p className="text-slate-500 text-sm">Deep insights into startup progress and platform usage.</p>
        </div>
        
        <div className="flex gap-3">
             <button 
                onClick={handleDeepScan}
                disabled={isScanning || generating}
                className="flex items-center gap-2 bg-slate-800 text-white px-4 py-2 rounded-lg hover:bg-slate-700 transition-colors disabled:opacity-50"
            >
                {isScanning ? <RefreshCw className="animate-spin" size={18} /> : <Microscope size={18} />}
                {isScanning ? `Scanning Modules ${scanProgress}%` : 'Run Deep Scan'}
            </button>
            <button 
                onClick={handleGenerateReport}
                disabled={generating || isScanning}
                className="flex items-center gap-2 bg-brand-600 text-white px-4 py-2 rounded-lg hover:bg-brand-700 transition-colors disabled:opacity-50"
            >
                {generating ? <RefreshCw className="animate-spin" size={18} /> : <FileText size={18} />}
                {generating ? 'Generating AI Report...' : 'Generate Daily Summary'}
            </button>
        </div>
      </div>

      {deepStats && (
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 animate-fade-in">
             <div className="flex items-center justify-between mb-6">
                <div>
                    <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                        <Database size={20} className="text-brand-500"/>
                        Deep Module Analysis
                    </h3>
                    <p className="text-sm text-slate-500">
                        Based on {deepStats.totalStartups} workspaces scanned. Bottleneck identified: <span className="font-bold text-red-500 capitalize">{deepStats.topBottleneck}</span>
                    </p>
                </div>
             </div>

             <div className="w-full">
                <div className="flex items-end space-x-2 h-64 border-b border-slate-200 pb-2">
                    {deepStats.moduleStats.map((mod, idx) => (
                        <div key={mod.name} className="flex-1 flex flex-col justify-end items-center group h-full">
                            <div 
                                className="w-full max-w-[40px] bg-brand-500 rounded-t-md transition-all duration-700 relative hover:bg-brand-600"
                                style={{ height: `${mod.completionRate}%` }}
                            >
                                <span className="absolute -top-8 left-1/2 -translate-x-1/2 bg-slate-900 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity">
                                    {mod.completionRate}%
                                </span>
                            </div>
                            <span className="text-xs text-slate-500 mt-2 rotate-0 truncate w-full text-center" title={mod.name}>
                                {mod.name.length > 8 ? mod.name.substring(0,8)+'..' : mod.name}
                            </span>
                        </div>
                    ))}
                </div>
             </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
            <h3 className="text-sm font-semibold text-slate-500 mb-4 uppercase tracking-wider flex items-center gap-2">
                <TrendingUp size={16}/> User Activity (7 Days)
            </h3>
            <SimpleBarChart data={activityData} colorClass="bg-blue-500" />
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
            <h3 className="text-sm font-semibold text-slate-500 mb-4 uppercase tracking-wider flex items-center gap-2">
                <BarChart2 size={16}/> System Interactions
            </h3>
            <SimpleBarChart data={activityData.map(d => ({...d, val: Math.min(100, d.val * 1.5)}))} colorClass="bg-slate-700" />
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="bg-gradient-to-r from-slate-900 to-slate-800 px-6 py-4 flex justify-between items-center">
             <div className="flex items-center gap-2 text-white">
                <FileText size={20} className="text-brand-400" />
                <h3 className="font-bold">CapKit Daily Intelligence Report</h3>
             </div>
             {lastSaved && <span className="text-xs text-slate-400 flex items-center gap-1"><Database size={12}/> Saved: {lastSaved}</span>}
        </div>
        
        <div className="p-8">
            {report ? (
                <div className="space-y-6">
                    <div className="prose max-w-none">
                        <h4 className="text-lg font-semibold text-slate-900 mb-2">Program Summary</h4>
                        <p className="text-slate-700 leading-relaxed bg-slate-50 p-4 rounded-lg border-l-4 border-brand-500">
                            {report.summary}
                        </p>
                    </div>

                    {report.deepAnalysis && (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="bg-red-50 p-5 rounded-lg border border-red-100">
                                <h5 className="font-semibold text-red-800 mb-2 flex items-center gap-2">
                                    <AlertTriangle size={16}/> Bottleneck Analysis
                                </h5>
                                <p className="text-sm text-red-700">{report.deepAnalysis.bottleneckAnalysis}</p>
                            </div>
                            <div className="bg-blue-50 p-5 rounded-lg border border-blue-100">
                                <h5 className="font-semibold text-blue-800 mb-2 flex items-center gap-2">
                                    <TrendingUp size={16}/> Trend Analysis
                                </h5>
                                <p className="text-sm text-blue-700">{report.deepAnalysis.trendAnalysis}</p>
                            </div>
                        </div>
                    )}

                    <div>
                        <h4 className="text-lg font-semibold text-slate-900 mb-4">AI Recommendations for Improvement</h4>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            {report.recommendations?.map((rec, idx) => (
                                <div key={idx} className="bg-slate-50 p-4 rounded-lg border border-slate-200">
                                    <div className="text-brand-500 font-bold text-xl mb-2">0{idx + 1}</div>
                                    <p className="text-sm text-slate-700 font-medium">{rec}</p>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            ) : (
                <div className="flex flex-col items-center justify-center py-12 text-slate-400">
                    <div className="bg-slate-100 p-4 rounded-full mb-4">
                        <FileText size={32} />
                    </div>
                    <p>No report generated for today yet.</p>
                </div>
            )}
        </div>
      </div>
    </div>
  );
};

export default AnalyticsView;