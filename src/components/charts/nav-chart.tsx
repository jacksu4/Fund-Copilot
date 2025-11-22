'use client';

import React from 'react';
import {
    LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, Legend, ResponsiveContainer, AreaChart, Area
} from 'recharts';

interface NavChartProps {
    data: any[];
}

export const NavChart = ({ data }: NavChartProps) => {
    return (
        <div className="lg:col-span-2 bg-white rounded-3xl shadow-[0_2px_10px_-4px_rgba(0,0,0,0.05)] border border-slate-100 p-8">
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h2 className="text-lg font-bold text-slate-900">NAV Performance</h2>
                    <p className="text-slate-400 text-sm">Net Asset Value Trend (净值走势)</p>
                </div>
                <div className="flex space-x-4">
                    <div className="flex items-center text-xs text-slate-500"><span className="w-2 h-2 rounded-full bg-indigo-600 mr-2"></span>Total NAV</div>
                    <div className="flex items-center text-xs text-slate-500"><span className="w-2 h-2 rounded-full bg-sky-400 mr-2"></span>Class B</div>
                </div>
            </div>
            <div className="h-[320px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={data} margin={{ top: 10, right: 0, left: -20, bottom: 0 }}>
                        <defs>
                            <linearGradient id="colorNav" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#4f46e5" stopOpacity={0.1} />
                                <stop offset="95%" stopColor="#4f46e5" stopOpacity={0} />
                            </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                        <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 12 }} tickFormatter={(str) => str.slice(5)} dy={10} />
                        <YAxis domain={['auto', 'auto']} axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 12 }} tickFormatter={(num) => num.toFixed(3)} />
                        <RechartsTooltip
                            contentStyle={{ backgroundColor: '#fff', borderRadius: '12px', border: 'none', boxShadow: '0 4px 20px rgba(0,0,0,0.1)' }}
                            itemStyle={{ fontSize: '12px', fontWeight: 600 }}
                        />
                        <Area type="monotone" dataKey="nav" stroke="#4f46e5" strokeWidth={3} fillOpacity={1} fill="url(#colorNav)" />
                        <Line type="monotone" dataKey="navB" stroke="#38bdf8" strokeWidth={2} dot={false} strokeDasharray="4 4" />
                    </AreaChart>
                </ResponsiveContainer>
            </div>
        </div>
    );
};
