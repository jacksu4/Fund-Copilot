'use client';

import React from 'react';
import {
    BarChart, Bar, Cell, ReferenceLine, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer
} from 'recharts';

interface PnlAttributionProps {
    data: any[];
}

const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('zh-CN', {
        style: 'currency',
        currency: 'CNY',
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
    }).format(value);
};

export const PnlAttribution = ({ data }: PnlAttributionProps) => {
    // Dynamic height: base 100px + 40px per item
    const height = Math.max(320, data.length * 40);

    return (
        <div className="bg-white rounded-3xl shadow-[0_2px_10px_-4px_rgba(0,0,0,0.05)] border border-slate-100 p-8 flex flex-col">
            <h2 className="text-lg font-bold text-slate-900 mb-1">Daily P&L Attribution</h2>
            <p className="text-slate-400 text-sm mb-6">Profit/Loss by Ticker (个股盈亏)</p>

            <div className="flex-grow overflow-y-auto max-h-[600px]">
                <div style={{ height: `${height}px` }}>
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={data} layout="vertical" margin={{ left: 0, right: 0 }}>
                            <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} stroke="#f1f5f9" />
                            <XAxis type="number" hide />
                            <YAxis dataKey="ticker" type="category" width={50} tick={{ fill: '#64748b', fontSize: 11, fontWeight: 500 }} axisLine={false} tickLine={false} />
                            <RechartsTooltip
                                cursor={{ fill: '#f8fafc' }}
                                content={({ active, payload }) => {
                                    if (active && payload && payload.length) {
                                        return (
                                            <div className="bg-slate-900 text-white text-xs py-1 px-3 rounded-lg shadow-xl">
                                                {formatCurrency(payload[0].value as number)}
                                            </div>
                                        );
                                    }
                                    return null;
                                }}
                            />
                            <ReferenceLine x={0} stroke="#cbd5e1" />
                            <Bar dataKey="pnl" radius={[4, 4, 4, 4]} barSize={24}>
                                {data.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={entry.pnl >= 0 ? '#10b981' : '#f43f5e'} />
                                ))}
                            </Bar>
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            </div>
        </div>
    );
};
