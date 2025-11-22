import { NextRequest, NextResponse } from 'next/server';
import { parseValuationSheet, parseTrsReport } from '@/utils/parser';
import { supabase } from '@/utils/supabase/client';

export async function POST(req: NextRequest) {
    const formData = await req.formData();
    const fileType = formData.get('type') as string;
    const file = formData.get('file') as File;

    if (!file) return NextResponse.json({ error: 'No file uploaded' }, { status: 400 });

    const buffer = Buffer.from(await file.arrayBuffer());

    try {
        if (fileType === 'valuation') {
            const data = parseValuationSheet(buffer);
            if (!data.date) throw new Error('Could not find date in Valuation Sheet');

            const { error } = await supabase.from('fund_daily_metrics').upsert({
                date: data.date,
                nav_total: data.navTotal,
                nav_a: data.navA,
                nav_b: data.navB,
                total_asset_val: data.totalAsset,
                cash_balance: data.cash
            });

            if (error) throw error;
            return NextResponse.json({ success: true, date: data.date });

        } else if (fileType === 'trs') {
            const { date, positions } = parseTrsReport(buffer);
            // If date is not found in file, we might need it from client. 
            // For now, fail if no date.
            if (!date) throw new Error('Could not find date in TRS Report');

            // First, ensure the daily metric exists for this date (FK constraint)
            // If not, we might need to create a dummy one or warn user.
            // We'll try to upsert a dummy one if it doesn't exist? No, that's risky.
            // We'll assume Valuation Sheet is uploaded first or we check existence.

            const { data: existingMetric } = await supabase
                .from('fund_daily_metrics')
                .select('date')
                .eq('date', date)
                .single();

            if (!existingMetric) {
                // Create a placeholder metric entry so we can insert positions
                await supabase.from('fund_daily_metrics').insert({
                    date: date,
                    nav_total: 0,
                    nav_a: 0,
                    nav_b: 0,
                    total_asset_val: 0,
                    cash_balance: 0
                });
            }

            // Delete existing positions for this date to avoid duplicates (full replace)
            await supabase.from('trs_positions').delete().eq('report_date', date);

            const rowsToInsert = positions.map(p => ({
                report_date: date,
                ticker: p.ticker,
                asset_name: p.asset_name,
                notional_cost: p.notional_cost,
                market_value: p.market_value,
                pnl_unrealized: p.market_value - p.notional_cost,
                fx_rate: 1 // Default or extract
            }));

            const { error } = await supabase.from('trs_positions').insert(rowsToInsert);
            if (error) throw error;

            return NextResponse.json({ success: true, date, count: rowsToInsert.length });
        }

        return NextResponse.json({ error: 'Invalid file type' }, { status: 400 });

    } catch (e: any) {
        console.error('Upload error:', e);
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}
