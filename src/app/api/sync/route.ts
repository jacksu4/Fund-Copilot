import { NextRequest, NextResponse } from 'next/server';
import { parseValuationSheet, parseTrsReport } from '@/utils/parser';
import { supabase } from '@/utils/supabase/client';

/**
 * POST /api/sync
 * Synchronizes reports from Supabase Storage to the Database.
 * 1. Lists date-folders in 'reports' bucket.
 * 2. Downloads 'valuation.xls' and 'trs.xlsx'.
 * 3. Parses them and updates 'fund_daily_metrics' and 'trs_positions'.
 */
export async function POST(req: NextRequest) {
    try {
        // 1. List date folders in 'reports/reports/'
        const { data: folders, error: listError } = await supabase.storage.from('reports').list('reports');

        if (listError) throw listError;

        const results = [];

        for (const folder of folders) {
            // Filter for date-like folders (YYYYMMDD)
            if (!folder.name.match(/^\d{8}$/)) continue;

            const dateStr = folder.name;
            const formattedDate = `${dateStr.slice(0, 4)}-${dateStr.slice(4, 6)}-${dateStr.slice(6, 8)}`; // YYYY-MM-DD

            // Check if already exists (optional: skip if exists to save time, or overwrite)
            // For now, let's check if metric exists. If so, we skip unless force=true query param is set.
            // But user might want to update. Let's just process all or maybe check if "trs_positions" has count > 0.
            // Let's do a check to avoid re-processing everything every time.
            // Check if already exists
            // We removed the skip logic to allow updates/overwrites when user manually syncs.
            // const { data: existing } = await supabase.from('fund_daily_metrics').select('date').eq('date', formattedDate).single();
            // if (existing) { ... }

            // 2. Download files
            const valuationPath = `reports/${dateStr}/valuation.xls`;
            const trsPath = `reports/${dateStr}/trs.xlsx`;

            // Download Valuation
            const { data: valData, error: valError } = await supabase.storage.from('reports').download(valuationPath);
            if (valError) {
                console.error(`Missing valuation for ${dateStr}:`, valError);
                results.push({ date: formattedDate, status: 'error', reason: 'missing_valuation' });
                continue;
            }

            // Download TRS
            const { data: trsData, error: trsError } = await supabase.storage.from('reports').download(trsPath);
            if (trsError) {
                console.error(`Missing TRS for ${dateStr}:`, trsError);
                // We might still process valuation? No, let's require both.
                results.push({ date: formattedDate, status: 'error', reason: 'missing_trs' });
                continue;
            }

            // 3. Parse & Insert
            const valBuffer = Buffer.from(await valData.arrayBuffer());
            const trsBuffer = Buffer.from(await trsData.arrayBuffer());

            const valMetrics = parseValuationSheet(valBuffer);
            // Use the folder date as the source of truth if parsing fails to find date or matches
            // But parser extracts date from file. Let's verify they match or just use parser's date.
            // Actually, parser's date is "YYYY-MM-DD".
            if (!valMetrics.date) valMetrics.date = formattedDate;

            const { date: trsDate, positions } = parseTrsReport(trsBuffer);

            // Insert Metrics
            const { error: metricError } = await supabase.from('fund_daily_metrics').upsert({
                date: valMetrics.date,
                nav_total: valMetrics.navTotal,
                nav_a: valMetrics.navA,
                nav_b: valMetrics.navB,
                total_asset_val: valMetrics.totalAsset,
                cash_balance: valMetrics.cash
            });
            if (metricError) throw metricError;

            // Insert Positions
            // Delete old ones first
            await supabase.from('trs_positions').delete().eq('report_date', valMetrics.date);

            const rowsToInsert = positions.map(p => ({
                report_date: valMetrics.date,
                ticker: p.ticker,
                asset_name: p.asset_name,
                notional_cost: p.notional_cost,
                market_value: p.market_value,
                pnl_unrealized: p.pnl_unrealized ?? (p.market_value - p.notional_cost),
                fx_rate: 1
            }));

            if (rowsToInsert.length > 0) {
                const { error: posError } = await supabase.from('trs_positions').insert(rowsToInsert);
                if (posError) throw posError;
            }

            results.push({ date: formattedDate, status: 'success' });
        }

        return NextResponse.json({ success: true, results });

    } catch (e: any) {
        console.error('Sync error:', e);
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}
