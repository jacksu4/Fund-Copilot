import * as XLSX from 'xlsx';

interface ValuationMetrics {
    date: string;
    navTotal: number;
    navA: number;
    navB: number;
    totalAsset: number;
    cash: number;
}

interface TrsPosition {
    ticker: string;
    asset_name: string;
    notional_cost: number;
    market_value: number;
    pnl_unrealized?: number;
}

/**
 * Parses the Valuation Sheet (Excel) to extract fund metrics.
 * @param buffer - The file buffer of the valuation sheet.
 * @returns ValuationMetrics object containing NAV, Total Assets, etc.
 */
export const parseValuationSheet = (buffer: Buffer): ValuationMetrics => {
    const workbook = XLSX.read(buffer, { type: 'buffer' });
    const sheetName = workbook.SheetNames[0];
    const sheet = workbook.Sheets[sheetName];
    const data = XLSX.utils.sheet_to_json(sheet, { header: 1 }) as any[][];

    let date = '';
    let navTotal = 0;
    let navA = 0;
    let navB = 0;
    let totalAsset = 0;
    let cash = 0;

    for (const row of data) {
        const rowStr = row.join(' ');

        // Date
        if (!date) {
            const dateMatch = rowStr.match(/日期[：:]\s*(\d{4}-\d{2}-\d{2})/);
            if (dateMatch) date = dateMatch[1];
        }

        // NAVs
        // NAVs
        if (rowStr.includes('单位净值')) {
            const navMatch = rowStr.match(/单位净值[:：\s]*([\d\.]+)/);
            if (navMatch) navTotal = parseFloat(navMatch[1]);
        }

        if (rowStr.includes('新智达成长六号A类')) {
            const navAMatch = rowStr.match(/新智达成长六号A类[:：\s]*([\d\.]+)/);
            if (navAMatch) navA = parseFloat(navAMatch[1]);
        }

        if (rowStr.includes('新智达成长六号B类')) {
            const navBMatch = rowStr.match(/新智达成长六号B类[:：\s]*([\d\.]+)/);
            if (navBMatch) navB = parseFloat(navBMatch[1]);
        }

        // Total Asset
        if (row.some(cell => cell && cell.toString().includes('资产净值'))) {
            const nums = row.filter(c => typeof c === 'number');
            if (nums.length > 0) totalAsset = Math.max(...nums);
        }

        // Cash
        if (row.some(cell => cell && cell.toString().includes('银行存款'))) {
            const nums = row.filter(c => typeof c === 'number');
            if (nums.length > 0) cash = Math.max(...nums);
        }
    }

    // Fallback date extraction if not found in rows
    if (!date) {
        const allText = data.map(r => r.join(' ')).join(' ');
        const match = allText.match(/(\d{4}-\d{2}-\d{2})/);
        if (match) date = match[1];
    }

    return { date, navTotal, navA, navB, totalAsset, cash };
};

/**
 * Parses the TRS Daily Report (Excel) to extract position data and calculate PnL.
 * @param buffer - The file buffer of the TRS report.
 * @returns Object containing the report date and list of positions.
 */
export const parseTrsReport = (buffer: Buffer): { date: string, positions: TrsPosition[] } => {
    const workbook = XLSX.read(buffer, { type: 'buffer' });
    // Use '合约盯市情况' as requested for PnL
    const sheetName = workbook.SheetNames.find(n => n.includes('合约盯市情况'));

    if (!sheetName) return { date: '', positions: [] };

    const sheet = workbook.Sheets[sheetName];
    const data = XLSX.utils.sheet_to_json(sheet, { header: 1 }) as any[][];

    let date = '';
    for (let i = 0; i < Math.min(10, data.length); i++) { // Check first 10 rows for date
        if (data[i]) {
            const rowStr = data[i].join(' ');
            const match = rowStr.match(/(\d{4}-\d{2}-\d{2})/);
            if (match) {
                date = match[1];
                break;
            }
        }
    }

    // Find header row (look for '证券代码' or '标的代码')
    const headerRowIndex = data.findIndex(row => row && row.some(cell => cell && (cell.toString().includes('证券代码') || cell.toString().includes('标的代码'))));
    if (headerRowIndex === -1) return { date, positions: [] };

    const header = data[headerRowIndex];
    const tickerIdx = header.findIndex((h: any) => h && (h.toString().includes('证券代码') || h.toString().includes('标的代码')));
    const nameIdx = header.findIndex((h: any) => h && (h.toString().includes('证券名称') || h.toString().includes('标的名称')));
    const notionalIdx = header.findIndex((h: any) => h && h.toString().includes('期初名义本金（计价货币）'));
    const marketValIdx = header.findIndex((h: any) => h && h.toString().includes('标的市值(计价货币)'));
    const contractValIdx = header.findIndex((h: any) => h && h.toString().includes('乙方合约价值'));
    const settlementIdx = header.findIndex((h: any) => h && h.toString().includes('合计结算金额'));

    // Ensure all required headers are found
    if (tickerIdx === -1 || nameIdx === -1 || notionalIdx === -1 || marketValIdx === -1 || contractValIdx === -1 || settlementIdx === -1) {
        console.warn("Missing one or more required headers in TRS report.");
        return { date, positions: [] };
    }

    const positionsMap: Record<string, TrsPosition & { pnl: number }> = {};

    for (let i = headerRowIndex + 1; i < data.length; i++) {
        const row = data[i];
        if (!row || !row[tickerIdx] || typeof row[tickerIdx] !== 'string' || row[tickerIdx].trim() === '') continue; // Skip empty or invalid ticker rows

        const ticker = row[tickerIdx].toString().trim();
        const name = row[nameIdx] ? row[nameIdx].toString().trim() : '';
        const notional = parseFloat(row[notionalIdx] || 0);
        const marketVal = parseFloat(row[marketValIdx] || 0);
        const contractVal = parseFloat(row[contractValIdx] || 0);
        const settlement = parseFloat(row[settlementIdx] || 0);

        // PnL = Contract Value + Settlement (Algebraic sum, since settlement is negative for cost/loss)
        // User said "Subtract... because it is negative", implying net result.
        // We assume Contract Value is Unrealized PnL, Settlement is Realized PnL.
        const pnl = contractVal + settlement;

        if (!positionsMap[ticker]) {
            positionsMap[ticker] = {
                ticker,
                asset_name: name,
                notional_cost: 0,
                market_value: 0,
                pnl: 0 // Temporary field for calculation
            } as any;
        }

        positionsMap[ticker].notional_cost += notional;
        positionsMap[ticker].market_value += marketVal;
        positionsMap[ticker].pnl += pnl; // Sum PnL for partial + existing
    }

    const positions = Object.values(positionsMap).map(p => ({
        ticker: p.ticker,
        asset_name: p.asset_name,
        notional_cost: p.notional_cost,
        market_value: p.market_value,
        pnl_unrealized: p.pnl
    }));

    return { date, positions };
};
