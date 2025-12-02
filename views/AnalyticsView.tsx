import React, { useState, useEffect } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, Legend, Cell } from 'recharts';
import { generateDailyReport } from '../services/geminiService';
import { generateSampleLogs } from '../services/mockData';
import { DailyReport, ProgramStats } from '../types';
import { reportsCol, getDeepProgramStats } from '../services/firebase';
import firebase from 'firebase/compat/app';
import 'firebase/compat/firestore';
import { FileText, RefreshCw, Database, Microscope, AlertTriangle } from 'lucide-react';

const activityData = [
  { name: 'Mon', users: 400, interactions: 240 },
  { name: 'Tue', users: 300, interactions: 139 },
  { name: 'Wed', users: 200, interactions: 980 },
  { name: 'Thu', users: 278, interactions: 390 },
  { name: 'Fri', users: 189, interactions: 480 },
  { name: 'Sat', users: 239, interactions: 380 },
  { name: 'Sun', users: 349, interactions: 430 },
];

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#6366f1', '#14b8a6'];

const AnalyticsView: React.FC = () => {
  const [report, setReport] = useState<Partial<DailyReport> | null>(null);
  const [generating, setGenerating] = useState(false);
  const [lastSaved, setLastSaved] = useState<string | null>(null);
  const [deepStats, setDeepStats] = useState<ProgramStats | null>(null);
  const [scanProgress, setScanProgress] = useState(0); // 0 to 100
  const [isScanning, setIsScanning] = useState(false);

  const handleGenerateReport = async () => {
    setGenerating(true);
    // Simulate fetching metrics
    const activeUsers = 1542;
    const interactions = 8902;
    const startupCount = deepStats?.totalStartups || 45;
    const logs = generateSampleLogs();

    try {
        const result = await generateDailyReport(activeUsers, interactions, startupCount, logs, deepStats || undefined);
        setReport(result);
        
        // Save to DB (Simulated "Daily Save")
        try {
            await reportsCol.add({
                ...result,
                date: new Date().toISOString(),
                createdAt: firebase.firestore.Timestamp.now()
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
          // In a real app with many users, we might stream this progress.
          // Here we simulate progress steps while waiting for the promise.
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

      {/* Deep Scan Results Section - Only visible if stats exist */}
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

             <div className="h-72 w-full">
                <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={deepStats.moduleStats} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0"/>
                        <XAxis dataKey="name" stroke="#64748b" fontSize={12} tickFormatter={(val) => val.charAt(0).toUpperCase() + val.slice(1)}/>
                        <YAxis stroke="#64748b" fontSize={12} unit="%" />
                        <Tooltip 
                            cursor={{fill: '#f1f5f9'}}
                            contentStyle={{borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'}}
                        />
                        <Bar dataKey="completionRate" name="Completion Rate" radius={[4, 4, 0, 0]}>
                            {deepStats.moduleStats.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                            ))}
                        </Bar>
                    </BarChart>
                </ResponsiveContainer>
             </div>
        </div>
      )}

      {/* Standard Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
            <h3 className="text-sm font-semibold text-slate-500 mb-4 uppercase tracking-wider">User Activity (7 Days)</h3>
            <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={activityData}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                        <XAxis dataKey="name" stroke="#64748b" fontSize={12} />
                        <YAxis stroke="#64748b" fontSize={12} />
                        <Tooltip />
                        <Line type="monotone" dataKey="users" stroke="#3b82f6" strokeWidth={2} dot={{ r: 4 }} activeDot={{ r: 6 }} />
                    </LineChart>
                </ResponsiveContainer>
            </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
            <h3 className="text-sm font-semibold text-slate-500 mb-4 uppercase tracking-wider">System Interactions</h3>
            <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={activityData}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                        <XAxis dataKey="name" stroke="#64748b" fontSize={12} />
                        <YAxis stroke="#64748b" fontSize={12} />
                        <Tooltip />
                        <Bar dataKey="interactions" fill="#1e293b" radius={[4, 4, 0, 0]} />
                    </BarChart>
                </ResponsiveContainer>
            </div>
        </div>
      </div>

      {/* AI Report Section */}
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

                    {/* Deep Analysis Section - Only if available */}
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
                                    <TrendingUpIcon size={16}/> Trend Analysis
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
                    <p className="text-xs mt-2 text-slate-400">Run a "Deep Scan" first for better results.</p>
                </div>
            )}
        </div>
      </div>
    </div>
  );
};

// Helper icon component
const TrendingUpIcon = ({size}: {size: number}) => (
    <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="23 6 13.5 15.5 8.5 10.5 1 18"></polyline><polyline points="17 6 23 6 23 12"></polyline></svg>
);

export default AnalyticsView;