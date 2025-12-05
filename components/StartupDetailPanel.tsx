import React, { useEffect, useState } from 'react';
import { X, Star, Zap, CheckCircle, AlertTriangle, FileText, ArrowRight, LayoutGrid, Users, Target, BrainCircuit } from 'lucide-react';
import { StartupData, StartupAiEvaluation } from '../types';
import { evaluateStartup } from '../services/geminiService';
import { updateStartupAiData } from '../services/firebase';

interface StartupDetailPanelProps {
  startup: StartupData | null;
  onClose: () => void;
  onToggleFavorite: (id: string, current: boolean) => void;
}

const StartupDetailPanel: React.FC<StartupDetailPanelProps> = ({ startup, onClose, onToggleFavorite }) => {
  const [loading, setLoading] = useState(false);
  const [evaluation, setEvaluation] = useState<StartupAiEvaluation | undefined>(undefined);
  const [activeTab, setActiveTab] = useState<'overview' | 'analysis' | 'canvas'>('overview');

  useEffect(() => {
    if (startup) {
      setEvaluation(startup.aiEvaluation);
    }
  }, [startup]);

  const handleRunAnalysis = async () => {
    if (!startup) return;
    setLoading(true);
    try {
      const result = await evaluateStartup(startup);
      setEvaluation(result);
      await updateStartupAiData(startup.id, result);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  if (!startup) return null;

  const scoreColor = (score: number) => {
    if (score >= 80) return 'text-green-500';
    if (score >= 60) return 'text-yellow-500';
    return 'text-red-500';
  };

  const CanvasBlock = ({ title, content }: { title: string, content?: string }) => (
      <div className="bg-slate-50 p-4 rounded-lg border border-slate-200">
          <h5 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">{title}</h5>
          <p className="text-sm text-slate-700 whitespace-pre-wrap">{content || 'Not specified'}</p>
      </div>
  );

  const renderProfileReport = (report: any) => {
      if (!report) return null;
      if (typeof report === 'string') return report;
      
      // If it's the structured object
      return (
          <div className="space-y-3">
              {report.founderTypeTitle && (
                  <div className="font-bold text-purple-900 text-base">{report.founderTypeTitle}</div>
              )}
              {report.founderTypeDescription && (
                  <p className="italic text-slate-600">{report.founderTypeDescription}</p>
              )}
              {report.keyTakeaways && Array.isArray(report.keyTakeaways) && (
                  <div>
                      <span className="font-bold text-xs uppercase text-purple-700 block mb-1">Key Strengths:</span>
                      <ul className="list-disc pl-4 space-y-1">
                          {report.keyTakeaways.slice(0, 3).map((t: string, i: number) => (
                              <li key={i} className="text-xs text-slate-700">{t}</li>
                          ))}
                      </ul>
                  </div>
              )}
              {report.cofounderPersonaSuggestion && (
                   <div className="mt-2 pt-2 border-t border-purple-200">
                      <span className="font-bold text-xs uppercase text-purple-700 block mb-1">Recommended Co-Founder:</span>
                      <p className="text-xs text-slate-700">{report.cofounderPersonaSuggestion}</p>
                   </div>
              )}
          </div>
      );
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden" aria-labelledby="slide-over-title" role="dialog" aria-modal="true">
      <div className="absolute inset-0 overflow-hidden">
        {/* Backdrop */}
        <div 
            className="absolute inset-0 bg-slate-900 bg-opacity-75 transition-opacity" 
            onClick={onClose}
        ></div>

        <div className="pointer-events-none fixed inset-y-0 right-0 flex max-w-full pl-10">
          <div className="pointer-events-auto w-screen max-w-2xl transform transition-transform ease-in-out duration-500">
            <div className="flex h-full flex-col bg-white shadow-2xl">
              
              {/* Header */}
              <div className="bg-slate-900 px-4 py-6 sm:px-6">
                <div className="flex items-start justify-between">
                  <h2 className="text-xl font-semibold leading-6 text-white" id="slide-over-title">
                    {startup.name}
                  </h2>
                  <div className="ml-3 flex h-7 items-center gap-2">
                    <button 
                        onClick={() => onToggleFavorite(startup.id, startup.isFavorite)}
                        className={`p-1 rounded-full hover:bg-slate-700 transition-colors ${startup.isFavorite ? 'text-yellow-400' : 'text-slate-400'}`}
                    >
                        <Star size={20} fill={startup.isFavorite ? "currentColor" : "none"} />
                    </button>
                    <button
                      type="button"
                      className="rounded-md bg-slate-800 text-slate-200 hover:text-white focus:outline-none"
                      onClick={onClose}
                    >
                      <span className="sr-only">Close panel</span>
                      <X size={24} />
                    </button>
                  </div>
                </div>
                <div className="mt-2">
                  <p className="text-sm text-slate-300">{startup.shortDescription}</p>
                </div>
                
                {/* Tabs */}
                <div className="mt-8 flex space-x-4 border-b border-slate-700">
                    <button 
                        onClick={() => setActiveTab('overview')}
                        className={`pb-3 text-sm font-medium border-b-2 transition-colors ${activeTab === 'overview' ? 'border-brand-500 text-white' : 'border-transparent text-slate-400 hover:text-slate-300'}`}
                    >
                        Overview
                    </button>
                    <button 
                        onClick={() => setActiveTab('analysis')}
                        className={`pb-3 text-sm font-medium border-b-2 transition-colors flex items-center gap-2 ${activeTab === 'analysis' ? 'border-brand-500 text-white' : 'border-transparent text-slate-400 hover:text-slate-300'}`}
                    >
                        <Zap size={14} /> AI Expert
                    </button>
                    <button 
                        onClick={() => setActiveTab('canvas')}
                        className={`pb-3 text-sm font-medium border-b-2 transition-colors flex items-center gap-2 ${activeTab === 'canvas' ? 'border-brand-500 text-white' : 'border-transparent text-slate-400 hover:text-slate-300'}`}
                    >
                        <LayoutGrid size={14} /> Business Canvas
                    </button>
                </div>
              </div>

              {/* Content */}
              <div className="relative flex-1 overflow-y-auto p-6 bg-slate-50">
                
                {activeTab === 'overview' && (
                    <div className="space-y-6">
                        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
                            <h3 className="text-lg font-semibold text-slate-900 mb-4 flex items-center gap-2">
                                <Users size={20} className="text-brand-500"/> Team & Leadership
                            </h3>
                            <div className="flex items-start gap-4 mb-4">
                                <div className="w-12 h-12 rounded-full bg-brand-100 flex items-center justify-center text-brand-600 font-bold text-xl flex-shrink-0">
                                    {startup.founderName.charAt(0)}
                                </div>
                                <div>
                                    <h4 className="font-medium text-slate-900">{startup.founderName}</h4>
                                    <p className="text-xs text-brand-600 font-semibold uppercase tracking-wide">Founder</p>
                                    <p className="text-sm text-slate-600 mt-2 bg-slate-50 p-3 rounded-lg">{startup.founderBio}</p>
                                </div>
                            </div>
                            
                            {startup.team && (
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4 pt-4 border-t border-slate-100">
                                    {startup.team["Team Members"] && (
                                        <div className="bg-slate-50 p-3 rounded">
                                            <span className="text-xs text-slate-400 uppercase font-bold">Team Members</span>
                                            <p className="text-sm text-slate-700 mt-1">{startup.team["Team Members"]}</p>
                                        </div>
                                    )}
                                    {startup.team["Key Roles"] && (
                                        <div className="bg-slate-50 p-3 rounded">
                                            <span className="text-xs text-slate-400 uppercase font-bold">Key Roles</span>
                                            <p className="text-sm text-slate-700 mt-1">{startup.team["Key Roles"]}</p>
                                        </div>
                                    )}
                                    {startup.team["Advisors"] && (
                                        <div className="bg-slate-50 p-3 rounded">
                                            <span className="text-xs text-slate-400 uppercase font-bold">Advisors</span>
                                            <p className="text-sm text-slate-700 mt-1">{startup.team["Advisors"]}</p>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                        
                        {(startup.mindset?.goals || startup.mindset?.profileReport) && (
                            <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
                                <h3 className="text-lg font-semibold text-slate-900 mb-4 flex items-center gap-2">
                                    <BrainCircuit size={20} className="text-purple-500"/> Mindset & Vision
                                </h3>
                                
                                {startup.mindset.profileReport && (
                                    <div className="mb-4">
                                        <h5 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Psychological Profile</h5>
                                        <div className="bg-purple-50 p-4 rounded-lg border border-purple-100 text-sm text-slate-700">
                                            {renderProfileReport(startup.mindset.profileReport)}
                                        </div>
                                    </div>
                                )}

                                {startup.mindset.goals && (
                                    <div>
                                        <h5 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 flex items-center gap-1">
                                            <Target size={12}/> Primary Goals
                                        </h5>
                                        <div className="bg-slate-50 p-4 rounded-lg border border-slate-200 text-sm text-slate-700 whitespace-pre-line">
                                             {typeof startup.mindset.goals === 'string' 
                                                ? startup.mindset.goals 
                                                : JSON.stringify(startup.mindset.goals, null, 2)
                                             }
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}

                        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
                            <h3 className="text-lg font-semibold text-slate-900 mb-4">Executive Summary</h3>
                            <dl className="grid grid-cols-1 gap-x-4 gap-y-6 sm:grid-cols-2">
                                <div>
                                    <dt className="text-sm font-medium text-slate-500">Stage</dt>
                                    <dd className="mt-1 text-sm text-slate-900 font-medium bg-slate-100 inline-block px-2 py-1 rounded">{startup.stage}</dd>
                                </div>
                                <div>
                                    <dt className="text-sm font-medium text-slate-500">Sector</dt>
                                    <dd className="mt-1 text-sm text-slate-900">{startup.sector}</dd>
                                </div>
                                <div className="sm:col-span-2">
                                    <dt className="text-sm font-medium text-slate-500">Business Model</dt>
                                    <dd className="mt-1 text-sm text-slate-900">{startup.businessModel}</dd>
                                </div>
                                <div className="sm:col-span-2">
                                    <dt className="text-sm font-medium text-slate-500">Current Traction</dt>
                                    <dd className="mt-1 text-sm text-slate-900">{startup.traction}</dd>
                                </div>
                                <div className="sm:col-span-2">
                                    <dt className="text-sm font-medium text-slate-500">Full Details</dt>
                                    <dd className="mt-1 text-sm text-slate-700 leading-relaxed whitespace-pre-wrap">{startup.fullDescription}</dd>
                                </div>
                            </dl>
                        </div>
                    </div>
                )}

                {activeTab === 'analysis' && (
                    <div className="space-y-6">
                        {loading && !evaluation ? (
                            <div className="flex flex-col items-center justify-center h-64 text-slate-400">
                                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-600 mb-4"></div>
                                <p>Strict Investment Expert Analyzing...</p>
                            </div>
                        ) : evaluation ? (
                            <>
                                {/* Score Card */}
                                <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 flex items-center justify-between">
                                    <div>
                                        <h3 className="text-sm font-medium text-slate-500 uppercase tracking-wider">Expert Confidence</h3>
                                        <div className="flex items-baseline mt-1">
                                            <span className={`text-4xl font-extrabold ${scoreColor(evaluation.confidenceScore)}`}>
                                                {evaluation.confidenceScore}
                                            </span>
                                            <span className="text-slate-400 ml-1">/100</span>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <div className={`inline-flex items-center px-4 py-2 rounded-lg text-sm font-bold border ${
                                            evaluation.verdict === 'Invest' ? 'bg-green-50 text-green-700 border-green-200' :
                                            evaluation.verdict === 'Watch' ? 'bg-yellow-50 text-yellow-700 border-yellow-200' :
                                            'bg-red-50 text-red-700 border-red-200'
                                        }`}>
                                            VERDICT: {evaluation.verdict.toUpperCase()}
                                        </div>
                                    </div>
                                </div>

                                {/* Strategic Analysis */}
                                <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
                                    <h3 className="flex items-center gap-2 text-lg font-semibold text-slate-900 mb-4">
                                        <FileText size={18} className="text-brand-500"/>
                                        Executive Memo
                                    </h3>
                                    <p className="text-slate-700 leading-relaxed text-sm">
                                        {evaluation.strategicAnalysis}
                                    </p>
                                </div>

                                {/* Strengths & Weaknesses */}
                                <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                                    <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 border-l-4 border-l-green-500">
                                        <h4 className="font-semibold text-green-700 mb-3 flex items-center gap-2">
                                            <CheckCircle size={16}/> Strengths
                                        </h4>
                                        <ul className="space-y-2">
                                            {evaluation.strengths.map((s, i) => (
                                                <li key={i} className="text-sm text-slate-600 flex items-start gap-2">
                                                    <span className="mt-1.5 w-1 h-1 bg-green-400 rounded-full flex-shrink-0"></span>
                                                    {s}
                                                </li>
                                            ))}
                                        </ul>
                                    </div>
                                    <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 border-l-4 border-l-red-500">
                                        <h4 className="font-semibold text-red-700 mb-3 flex items-center gap-2">
                                            <AlertTriangle size={16}/> Weaknesses
                                        </h4>
                                        <ul className="space-y-2">
                                            {evaluation.weaknesses.map((w, i) => (
                                                <li key={i} className="text-sm text-slate-600 flex items-start gap-2">
                                                    <span className="mt-1.5 w-1 h-1 bg-red-400 rounded-full flex-shrink-0"></span>
                                                    {w}
                                                </li>
                                            ))}
                                        </ul>
                                    </div>
                                </div>

                                {/* Next Steps */}
                                <div className="bg-slate-800 p-6 rounded-xl shadow-lg text-white">
                                    <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                                        <ArrowRight size={18} /> Recommended Actions
                                    </h3>
                                    <ul className="space-y-3">
                                        {evaluation.nextSteps.map((step, i) => (
                                            <li key={i} className="flex items-start gap-3 text-sm text-slate-300">
                                                <span className="flex items-center justify-center w-5 h-5 rounded-full border border-slate-500 text-xs font-mono mt-0.5">
                                                    {i + 1}
                                                </span>
                                                {step}
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                                
                                <div className="flex justify-end pt-4">
                                     <button 
                                        onClick={handleRunAnalysis}
                                        className="text-sm text-brand-600 hover:text-brand-800 underline"
                                    >
                                        Re-run Analysis
                                    </button>
                                </div>
                            </>
                        ) : (
                            <div className="flex flex-col items-center justify-center h-48">
                                <p className="text-slate-500 mb-4">No analysis generated yet.</p>
                                <button 
                                    onClick={handleRunAnalysis}
                                    className="px-4 py-2 bg-brand-600 text-white rounded-lg hover:bg-brand-700 transition-colors"
                                >
                                    Generate Expert Analysis
                                </button>
                            </div>
                        )}
                    </div>
                )}

                {activeTab === 'canvas' && (
                    <div className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                             <div className="md:col-span-2">
                                 <CanvasBlock title="Unique Value Proposition" content={startup.canvas?.["Unique Value Proposition"]} />
                             </div>
                             <CanvasBlock title="Problem" content={startup.canvas?.["Problem"]} />
                             <CanvasBlock title="Solution" content={startup.canvas?.["Solution"]} />
                             
                             <CanvasBlock title="Market / Customer" content={startup.canvas?.["Market"] || startup.canvas?.["Customer Segments"]} />
                             <CanvasBlock title="Unfair Advantage" content={startup.canvas?.["Unfair Advantage"]} />
                             
                             <CanvasBlock title="Business Model" content={startup.canvas?.["Business Model"] || startup.canvas?.["Revenue Streams"]} />
                             <CanvasBlock title="Unit Economics" content={startup.canvas?.["Unit Economics"]} />
                             
                             <CanvasBlock title="Key Metrics / Traction" content={startup.canvas?.["North Star Metric"] || startup.canvas?.["Key Metrics"] || startup.canvas?.["Product - Market Fit"]} />
                             <CanvasBlock title="Pricing" content={startup.canvas?.["Pricing"]} />
                             
                             <div className="md:col-span-2">
                                 <CanvasBlock title="Project Overview" content={startup.canvas?.["Project Overview"]} />
                             </div>
                        </div>
                        {!startup.canvas && (
                            <div className="text-center p-8 text-slate-400 bg-white rounded-lg border border-dashed border-slate-300">
                                <LayoutGrid size={32} className="mx-auto mb-2 opacity-50"/>
                                <p>No raw Canvas data available.</p>
                            </div>
                        )}
                    </div>
                )}

              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StartupDetailPanel;