'use client';

import React, { useState, useEffect } from 'react';
import { UploadCloud } from 'lucide-react';
import { StatCard } from '@/components/ui/stat-card';
import { NavChart } from '@/components/charts/nav-chart';
import { PnlAttribution } from '@/components/charts/pnl-attribution';
import { HoldingsTable } from '@/components/tables/holdings-table';
import { FileUploadModal } from '@/components/ui/file-upload-modal';
import { ChatInterface } from '@/components/chat/chat-interface';
import { formatCurrency } from '@/utils/format';
import { supabase } from '@/utils/supabase/client';

export default function FundDashboard() {
  const [selectedDate, setSelectedDate] = useState('');
  const [isSyncing, setIsSyncing] = useState(false);
  const [fundData, setFundData] = useState<any[]>([]);
  const [positionsData, setPositionsData] = useState<Record<string, any[]>>({});
  const [isUploadOpen, setIsUploadOpen] = useState(false); // Kept for manual upload backup if needed, or remove if fully deprecated.

  const handleSync = async () => {
    setIsSyncing(true);
    try {
      const res = await fetch('/api/sync', { method: 'POST' });
      const result = await res.json();
      if (result.success) {
        const count = result.results.filter((r: any) => r.status === 'success').length;
        const skipped = result.results.filter((r: any) => r.status === 'skipped').length;
        const errors = result.results.filter((r: any) => r.status === 'error').length;
        alert(`Sync complete!\nProcessed: ${count}\nSkipped: ${skipped}\nErrors: ${errors}`);
        window.location.reload();
      } else {
        alert('Sync failed: ' + result.error);
      }
    } catch (e) {
      alert('Sync error');
    } finally {
      setIsSyncing(false);
    }
  };

  // Fetch data from Supabase on mount
  useEffect(() => {
    const fetchData = async () => {
      const { data: fundMetrics } = await supabase
        .from('fund_daily_metrics')
        .select('*')
        .order('date', { ascending: true });

      if (fundMetrics && fundMetrics.length > 0) {
        // Transform snake_case to camelCase if needed or map directly
        const formattedFundData = fundMetrics.map(d => ({
          date: d.date,
          nav: d.nav_total,
          navA: d.nav_a,
          navB: d.nav_b,
          totalAsset: d.total_asset_val,
          cash: d.cash_balance
        }));
        setFundData(formattedFundData);
        setSelectedDate(formattedFundData[formattedFundData.length - 1].date);
      }

      // Fetch positions for the latest date or all dates
      // For simplicity, we might fetch all and group by date, or fetch on date change
      // Here we just fetch all for now
      const { data: positions } = await supabase
        .from('trs_positions')
        .select('*');

      if (positions && positions.length > 0) {
        const groupedPositions: Record<string, any[]> = {};
        positions.forEach(p => {
          if (!groupedPositions[p.report_date]) {
            groupedPositions[p.report_date] = [];
          }
          groupedPositions[p.report_date].push({
            ticker: p.ticker,
            name: p.asset_name,
            notional: p.notional_cost,
            marketVal: p.market_value,
            pnl_unrealized: p.pnl_unrealized, // Pass this through
            dir: 'Long' // Assuming Long for now
          });
        });
        setPositionsData(prev => ({ ...prev, ...groupedPositions }));
      }
    };

    fetchData();
  }, []);

  // Derived state
  const currentFundData = fundData.find(d => d.date === selectedDate) || (fundData.length > 0 ? fundData[fundData.length - 1] : null);
  const currentPositions = selectedDate ? (positionsData[selectedDate] || []) : [];

  const pnlChartData = currentPositions.map((p: any) => ({
    ticker: p.ticker,
    pnl: p.pnl_unrealized ?? (p.marketVal - p.notional),
    marketVal: p.marketVal,
  }));

  const prevDateIndex = fundData.findIndex(d => d.date === selectedDate) - 1;
  const prevFundData = prevDateIndex >= 0 ? fundData[prevDateIndex] : currentFundData;

  // Calculate changes safely
  const navChange = (currentFundData && prevFundData && prevFundData.nav)
    ? ((currentFundData.nav - prevFundData.nav) / prevFundData.nav * 100).toFixed(2)
    : "0.00";

  const assetChange = (currentFundData && prevFundData && prevFundData.totalAsset)
    ? ((currentFundData.totalAsset - prevFundData.totalAsset) / prevFundData.totalAsset * 100).toFixed(2)
    : "0.00";

  const totalTrsVal = currentPositions.reduce((a: number, c: any) => a + c.marketVal, 0);
  const prevPositions = (prevFundData && positionsData[prevFundData.date]) || [];
  const prevTrsVal = prevPositions.reduce((a: number, c: any) => a + c.marketVal, 0) || totalTrsVal;
  const trsChange = prevTrsVal ? ((totalTrsVal - prevTrsVal) / prevTrsVal * 100).toFixed(2) : "0.00";

  if (!currentFundData) {
    return (
      <div className="min-h-screen bg-[#F8FAFC] flex flex-col items-center justify-center text-slate-500">
        <p className="mb-4">No data available. Please sync data from storage.</p>
        <button
          onClick={handleSync}
          disabled={isSyncing}
          className="px-4 py-2 bg-slate-900 text-white font-bold rounded-lg hover:bg-slate-800 transition-colors flex items-center disabled:opacity-50"
        >
          <UploadCloud size={14} className={`mr-2 ${isSyncing ? 'animate-bounce' : ''}`} />
          {isSyncing ? 'SYNCING...' : 'SYNC DATA'}
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F8FAFC] font-sans text-slate-900 selection:bg-indigo-100 selection:text-indigo-900">
      <FileUploadModal isOpen={isUploadOpen} onClose={() => setIsUploadOpen(false)} />

      {/* Top Navigation */}
      <header className="bg-white/80 backdrop-blur-md border-b border-slate-200 sticky top-0 z-30">
        <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-slate-900 rounded-lg flex items-center justify-center text-white font-bold">XZ</div>
            <div className="flex flex-col">
              <span className="text-sm font-bold text-slate-900 leading-none">新智达成长六号</span>
              <span className="text-[10px] text-slate-500 font-medium tracking-wider uppercase mt-1">Growth Fund VI</span>
            </div>
          </div>

          <div className="flex items-center space-x-4">
            <div className="hidden md:flex items-center space-x-1 bg-slate-100 p-1 rounded-xl overflow-x-auto max-w-[500px]">
              {fundData.map((d) => (
                <button
                  key={d.date}
                  onClick={() => setSelectedDate(d.date)}
                  className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all whitespace-nowrap ${selectedDate === d.date ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'
                    }`}
                >
                  {d.date.slice(5)}
                </button>
              ))}
            </div>
            <button
              onClick={() => setIsUploadOpen(true)}
              className="px-4 py-2 bg-slate-900 text-white text-xs font-bold rounded-lg hover:bg-slate-800 transition-colors flex items-center"
            >
              <UploadCloud size={14} className="mr-2" />
              UPLOAD & SYNC
            </button>
            <div className="h-8 w-8 rounded-full bg-indigo-100 border border-indigo-200 flex items-center justify-center text-indigo-700 font-bold text-xs">
              FM
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 py-8">

        {/* Key Metrics Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-6 mb-8">
          <StatCard
            title="UNIT NAV (单位净值)"
            value={currentFundData.nav?.toFixed(4) || "0.0000"}
            change={navChange}
          />
          <StatCard
            title="TOTAL ASSETS (资产净值)"
            value={`¥${formatCurrency(currentFundData.totalAsset || 0)}`}
            change={assetChange}
          />
          {/* TRS Market Value Card Removed as requested */}
        </div>

        {/* Charts Section */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
          <div className="lg:col-span-2">
            <NavChart data={fundData} />
          </div>
          <div className="lg:col-span-1">
            <PnlAttribution data={pnlChartData} />
          </div>
        </div>

        {/* Holdings Table */}
        <div className="mb-12">
          <HoldingsTable data={currentPositions} date={selectedDate} />
        </div>

        <FileUploadModal
          isOpen={isUploadOpen}
          onClose={() => setIsUploadOpen(false)}
        />

        <ChatInterface />
      </main>
    </div>
  );
}
