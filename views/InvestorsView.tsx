import React, { useState, useEffect } from 'react';
import { Investor } from '../types';
import { getInvestors, updateInvestorStatus } from '../services/firebase';
import { MOCK_INVESTORS } from '../services/mockData';
import { Search, Building2, Globe, Linkedin, CheckCircle, XCircle, Clock, ExternalLink } from 'lucide-react';
import InvestorDetailPanel from '../components/InvestorDetailPanel';

const InvestorsView: React.FC = () => {
  const [investors, setInvestors] = useState<Investor[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedInvestor, setSelectedInvestor] = useState<Investor | null>(null);

  useEffect(() => {
    const fetchInvestors = async () => {
      try {
        const data = await getInvestors();
        if (data.length === 0) {
            console.log("No investors found in DB, using mock if available.");
             setInvestors(MOCK_INVESTORS);
        } else {
            setInvestors(data);
        }
      } catch (err) {
        console.error("Failed to fetch investors", err);
        setInvestors(MOCK_INVESTORS);
      } finally {
        setLoading(false);
      }
    };
    fetchInvestors();
  }, []);

  const handleStatusUpdate = async (id: string, newStatus: 'approved' | 'rejected') => {
    // Optimistic UI update
    setInvestors(prev => prev.map(inv => inv.id === id ? { ...inv, status: newStatus } : inv));
    
    // Also update selected investor if it's the one being modified
    if (selectedInvestor && selectedInvestor.id === id) {
        setSelectedInvestor(prev => prev ? { ...prev, status: newStatus } : null);
    }

    try {
        await updateInvestorStatus(id, newStatus);
    } catch (e) {
        console.error("Failed to update status in backend", e);
    }
  };

  const filteredInvestors = investors.filter(inv => 
    (inv.fullName || '').toLowerCase().includes(searchTerm.toLowerCase()) || 
    (inv.firmName || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (inv.email || '').toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getStatusBadge = (status?: string) => {
      switch(status) {
          case 'approved':
              return <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800"><CheckCircle size={12}/> Approved</span>;
          case 'rejected':
              return <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800"><XCircle size={12}/> Rejected</span>;
          default:
              return <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800"><Clock size={12}/> Pending</span>;
      }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
            <h2 className="text-2xl font-bold text-slate-900">Investor Registrations</h2>
            <p className="text-slate-500 text-sm mt-1">Manage inbound VC and Angel requests</p>
        </div>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400" size={18} />
          <input 
            type="text" 
            placeholder="Search investors..." 
            className="pl-10 pr-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500 w-64"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        {loading ? (
            <div className="p-8 text-center text-slate-400">Loading investors...</div>
        ) : (
        <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-200">
            <thead className="bg-slate-50">
                <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Investor Profile</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Firm & Focus</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Check Size</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Status</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-slate-500 uppercase tracking-wider">Actions</th>
                </tr>
            </thead>
            <tbody className="bg-white divide-y divide-slate-200">
                {filteredInvestors.map((inv) => (
                <tr 
                    key={inv.id} 
                    className="hover:bg-slate-50 transition-colors cursor-pointer"
                    onClick={() => setSelectedInvestor(inv)}
                >
                    <td className="px-6 py-4">
                    <div className="flex items-center">
                        <div className="h-10 w-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 font-bold flex-shrink-0">
                            {(inv.fullName || inv.email).charAt(0).toUpperCase()}
                        </div>
                        <div className="ml-4">
                        <div className="text-sm font-medium text-slate-900">{inv.fullName || 'Unknown Name'}</div>
                        <div className="text-sm text-slate-500">{inv.email}</div>
                        <div className="flex gap-2 mt-1">
                            {inv.linkedinProfile && (
                                <span className="text-slate-400"><Linkedin size={14}/></span>
                            )}
                            {inv.website && (
                                <span className="text-slate-400"><Globe size={14}/></span>
                            )}
                        </div>
                        </div>
                    </div>
                    </td>
                    <td className="px-6 py-4">
                        <div className="text-sm text-slate-900 font-medium flex items-center gap-1">
                            <Building2 size={14} className="text-slate-400"/>
                            {inv.firmName || 'Individual'}
                        </div>
                        <div className="text-xs text-slate-500 mt-1">
                            <span className="bg-slate-100 px-1.5 py-0.5 rounded">{inv.investorType || 'VC'}</span>
                        </div>
                        <div className="text-xs text-slate-500 mt-1 line-clamp-1 max-w-xs" title={inv.investmentFocus}>
                            Focus: {inv.investmentFocus || 'Generalist'}
                        </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-700">
                        {inv.checkSize || 'Not specified'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                        {getStatusBadge(inv.status)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                         <button className="text-brand-600 hover:text-brand-800">View Details</button>
                    </td>
                </tr>
                ))}
            </tbody>
            </table>
            {filteredInvestors.length === 0 && (
                <div className="p-12 text-center flex flex-col items-center justify-center text-slate-500">
                    <Search size={32} className="mb-4 opacity-50" />
                    <p>No investors found matching your criteria.</p>
                </div>
            )}
        </div>
        )}
      </div>

      <InvestorDetailPanel 
        investor={selectedInvestor}
        onClose={() => setSelectedInvestor(null)}
        onStatusUpdate={handleStatusUpdate}
      />
    </div>
  );
};

export default InvestorsView;