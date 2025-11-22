import React from 'react';
import { ArrowUpRight, ArrowDownRight } from 'lucide-react';

interface StatCardProps {
    title: string;
    value: string;
    change: string;
    isCurrency?: boolean;
}

export const StatCard = ({ title, value, change, isCurrency = false }: StatCardProps) => {
    const isPositive = parseFloat(change) >= 0;
    return (
        <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-[0_2px_10px_-4px_rgba(0,0,0,0.05)] hover:shadow-[0_8px_30px_-4px_rgba(0,0,0,0.05)] transition-all duration-300 group">
            <div className="flex justify-between items-start mb-4">
                <h3 className="text-slate-500 font-medium text-sm tracking-wide">{title}</h3>
                <span className={`flex items-center text-xs font-bold px-2 py-1 rounded-full ${isPositive ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'}`}>
                    {isPositive ? <ArrowUpRight size={12} className="mr-1" /> : <ArrowDownRight size={12} className="mr-1" />}
                    {Math.abs(parseFloat(change))}%
                </span>
            </div>
            <div className="flex items-baseline space-x-1">
                <span className="text-3xl font-bold text-slate-900 font-mono tracking-tight tabular-nums">
                    {value}
                </span>
            </div>
        </div>
    );
};
