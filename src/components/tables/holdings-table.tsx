'use client';

import React from 'react';
import { formatCurrency } from '@/utils/format';

interface Holding {
    ticker: string;
    name: string;
    notional: number;
    marketVal: number;
    pnl_unrealized?: number;
}

interface HoldingsTableProps {
    data: Holding[];
    date: string;
}

export const HoldingsTable = ({ data, date }: HoldingsTableProps) => {
    return (
        <div className="bg-white rounded-3xl shadow-[0_2px_10px_-4px_rgba(0,0,0,0.05)] border border-slate-100 overflow-hidden">
            <div className="px-8 py-6 border-b border-slate-50 flex items-center justify-between">
                <div>
                    <h2 className="text-lg font-bold text-slate-900">TRS Portfolio Composition</h2>
                    <p className="text-slate-400 text-sm">Underlying Assets Detail (美股持仓明细)</p>
                </div>
                <div className="bg-slate-50 px-3 py-1 rounded-lg text-xs font-mono text-slate-500">
                    {date}
                </div>
            </div>
            <div className="overflow-x-auto">
                <table className="w-full text-sm text-left">
                    <thead className="bg-slate-50/50 text-slate-400 text-xs uppercase tracking-wider font-semibold">
                        <tr>
                            <th className="px-8 py-4 pl-8">Asset</th>
                            <th className="px-8 py-4 text-right">Notional (Cost)</th>
                            <th className="px-8 py-4 text-right">Market Value</th>
                            <th className="px-8 py-4 text-right pr-8">Unrealized P&L</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50">
                        {data.map((row) => {
                            const currentPnl = row.pnl_unrealized ?? (row.marketVal - row.notional);
                            const pnlPercent = (currentPnl / row.notional) * 100;

                            return (
                                <tr key={row.ticker} className="border-b border-slate-50 hover:bg-slate-50/50 transition-colors group">
                                    <td className="px-8 py-5">
                                        <div className="flex items-center">
                                            <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold text-sm mr-4 group-hover:scale-110 transition-transform shadow-sm">
                                                {row.ticker[0]}
                                            </div>
                                            <div>
                                                <div className="font-bold text-slate-900">{row.ticker}</div>
                                                <div className="text-xs text-slate-500 font-medium mt-0.5">{row.name}</div>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-8 py-5 text-right font-mono text-slate-600 tabular-nums">
                                        {formatCurrency(row.notional)}
                                    </td>
                                    <td className="px-8 py-5 text-right font-mono text-slate-900 font-medium tabular-nums">
                                        {formatCurrency(row.marketVal)}
                                    </td>
                                    <td className={`py-4 px-4 text-right font-bold text-xs ${currentPnl >= 0 ? 'text-emerald-500' : 'text-rose-500'
                                        }`}>
                                        {currentPnl >= 0 ? '+' : ''}
                                        ¥{formatCurrency(currentPnl)}
                                        <div className="text-[10px] font-medium opacity-80 mt-1">
                                            {pnlPercent.toFixed(2)}%
                                        </div>
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>
            {/* Footer of Table */}
            <div className="bg-slate-50/50 px-8 py-4 border-t border-slate-50 flex justify-between items-center text-xs text-slate-400">
                <span>* Values shown in CNY (RMB) based on daily FX rates.</span>
                <span>Data source: Daily Mark-to-Market Report</span>
            </div>
        </div>
    );
};
