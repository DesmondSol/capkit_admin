import React from 'react';
import { X, Building2, Globe, Linkedin, Mail, CheckCircle, XCircle, Clock, DollarSign, Target, FileText } from 'lucide-react';
import { Investor } from '../types';

interface InvestorDetailPanelProps {
  investor: Investor | null;
  onClose: () => void;
  onStatusUpdate: (id: string, status: 'approved' | 'rejected') => void;
}

const InvestorDetailPanel: React.FC<InvestorDetailPanelProps> = ({ investor, onClose, onStatusUpdate }) => {
  if (!investor) return null;

  const getStatusBadge = (status?: string) => {
    switch(status) {
        case 'approved':
            return <div className="flex items-center gap-1 text-green-700 bg-green-100 px-3 py-1 rounded-full text-sm font-medium"><CheckCircle size={16}/> Approved</div>;
        case 'rejected':
            return <div className="flex items-center gap-1 text-red-700 bg-red-100 px-3 py-1 rounded-full text-sm font-medium"><XCircle size={16}/> Rejected</div>;
        default:
            return <div className="flex items-center gap-1 text-yellow-700 bg-yellow-100 px-3 py-1 rounded-full text-sm font-medium"><Clock size={16}/> Pending Review</div>;
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden" role="dialog" aria-modal="true">
      <div className="absolute inset-0 overflow-hidden">
        <div 
            className="absolute inset-0 bg-slate-900 bg-opacity-75 transition-opacity" 
            onClick={onClose}
        ></div>

        <div className="pointer-events-none fixed inset-y-0 right-0 flex max-w-full pl-10">
          <div className="pointer-events-auto w-screen max-w-xl transform transition-transform ease-in-out duration-500">
            <div className="flex h-full flex-col bg-white shadow-2xl">
              
              {/* Header */}
              <div className="bg-slate-900 px-6 py-8">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-4">
                     <div className="h-16 w-16 rounded-full bg-brand-500 flex items-center justify-center text-white text-2xl font-bold">
                        {(investor.fullName || investor.email).charAt(0).toUpperCase()}
                     </div>
                     <div>
                        <h2 className="text-xl font-bold text-white">{investor.fullName || 'Unknown Name'}</h2>
                        <p className="text-slate-300 flex items-center gap-2 mt-1">
                            <Building2 size={14} /> {investor.firmName || 'Individual / Angel'}
                        </p>
                     </div>
                  </div>
                  <button
                    type="button"
                    className="rounded-md bg-slate-800 text-slate-200 hover:text-white focus:outline-none p-2"
                    onClick={onClose}
                  >
                    <X size={24} />
                  </button>
                </div>
              </div>

              {/* Content */}
              <div className="relative flex-1 overflow-y-auto p-6 bg-slate-50">
                
                {/* Status Bar */}
                <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200 mb-6 flex justify-between items-center">
                    <div>
                        <p className="text-xs text-slate-500 uppercase tracking-wide mb-1">Current Status</p>
                        {getStatusBadge(investor.status)}
                    </div>
                    <div className="flex gap-2">
                         {investor.status !== 'approved' && (
                            <button 
                                onClick={() => onStatusUpdate(investor.id, 'approved')}
                                className="px-3 py-1.5 bg-green-600 hover:bg-green-700 text-white rounded text-sm font-medium transition-colors"
                            >
                                Approve Access
                            </button>
                         )}
                         {investor.status !== 'rejected' && (
                            <button 
                                onClick={() => onStatusUpdate(investor.id, 'rejected')}
                                className="px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white rounded text-sm font-medium transition-colors"
                            >
                                Reject
                            </button>
                         )}
                    </div>
                </div>

                {/* Main Info */}
                <div className="space-y-6">
                    <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
                        <h3 className="text-lg font-semibold text-slate-900 mb-4 flex items-center gap-2">
                            <FileText size={18} className="text-brand-500"/> Investment Profile
                        </h3>
                        <div className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="text-xs text-slate-500 uppercase">Investor Type</label>
                                    <p className="text-slate-900 font-medium">{investor.investorType || 'VC'}</p>
                                </div>
                                <div>
                                    <label className="text-xs text-slate-500 uppercase">Check Size</label>
                                    <p className="text-slate-900 font-medium flex items-center gap-1">
                                        <DollarSign size={14} className="text-green-600"/> {investor.checkSize || 'Not specified'}
                                    </p>
                                </div>
                            </div>
                            <div>
                                <label className="text-xs text-slate-500 uppercase">Investment Focus</label>
                                <p className="text-slate-900 font-medium mt-1 p-3 bg-slate-50 rounded-lg border border-slate-100 flex items-start gap-2">
                                    <Target size={16} className="mt-0.5 text-brand-500" />
                                    {investor.investmentFocus || 'Generalist'}
                                </p>
                            </div>
                        </div>
                    </div>

                    <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
                        <h3 className="text-lg font-semibold text-slate-900 mb-4">Contact Information</h3>
                        <div className="space-y-4">
                            <div className="flex items-center gap-3 p-2 hover:bg-slate-50 rounded transition-colors">
                                <div className="w-8 h-8 rounded-full bg-blue-50 flex items-center justify-center text-blue-500">
                                    <Mail size={16}/>
                                </div>
                                <div className="flex-1 overflow-hidden">
                                    <p className="text-xs text-slate-500">Email Address</p>
                                    <p className="text-slate-900 font-medium truncate" title={investor.email}>{investor.email}</p>
                                </div>
                            </div>
                            
                            {investor.linkedinProfile && (
                                <div className="flex items-center gap-3 p-2 hover:bg-slate-50 rounded transition-colors">
                                    <div className="w-8 h-8 rounded-full bg-blue-50 flex items-center justify-center text-[#0077b5]">
                                        <Linkedin size={16}/>
                                    </div>
                                    <div>
                                        <p className="text-xs text-slate-500">LinkedIn</p>
                                        <a href={investor.linkedinProfile} target="_blank" rel="noreferrer" className="text-brand-600 hover:underline text-sm font-medium">
                                            View Profile
                                        </a>
                                    </div>
                                </div>
                            )}

                             {investor.website && (
                                <div className="flex items-center gap-3 p-2 hover:bg-slate-50 rounded transition-colors">
                                    <div className="w-8 h-8 rounded-full bg-blue-50 flex items-center justify-center text-slate-500">
                                        <Globe size={16}/>
                                    </div>
                                    <div>
                                        <p className="text-xs text-slate-500">Website</p>
                                        <a href={investor.website} target="_blank" rel="noreferrer" className="text-brand-600 hover:underline text-sm font-medium">
                                            {investor.website}
                                        </a>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>

                    {(investor.bio || investor.portfolio) && (
                         <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
                            <h3 className="text-lg font-semibold text-slate-900 mb-4">Additional Details</h3>
                             {investor.bio && (
                                 <div className="mb-4">
                                     <label className="text-xs text-slate-500 uppercase">Bio</label>
                                     <p className="text-sm text-slate-700 mt-1">{investor.bio}</p>
                                 </div>
                             )}
                             {investor.portfolio && (
                                 <div>
                                     <label className="text-xs text-slate-500 uppercase">Portfolio Highlights</label>
                                     <p className="text-sm text-slate-700 mt-1">{investor.portfolio}</p>
                                 </div>
                             )}
                         </div>
                    )}
                    
                     <div className="text-center pt-4">
                        <p className="text-xs text-slate-400">ID: {investor.id}</p>
                        <p className="text-xs text-slate-400">Registered: {investor.submittedAt?.toDate ? investor.submittedAt.toDate().toLocaleDateString() : 'Unknown Date'}</p>
                    </div>

                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default InvestorDetailPanel;