import { parseValuationSheet, parseTrsReport } from '../src/utils/parser';
import * as fs from 'fs';
import * as path from 'path';
import * as XLSX from 'xlsx';

// Mock XLSX to avoid needing real files for basic logic tests, 
// or we can create simple buffers.
// For robustness, let's create a real buffer with XLSX.

describe('Parser Utility', () => {

    describe('parseValuationSheet', () => {
        it('should extract date and metrics correctly', () => {
            // Create a mock workbook
            const wb = XLSX.utils.book_new();
            const data = [
                ['日期：2024-11-20'],
                ['单位净值', 1.0322],
                ['新智达成长六号A类', 1.0315],
                ['新智达成长六号B类', 1.0334],
                ['资产净值', 1000000],
                ['银行存款', 50000]
            ];
            const ws = XLSX.utils.aoa_to_sheet(data);
            XLSX.utils.book_append_sheet(wb, ws, 'Sheet1');
            const buffer = XLSX.write(wb, { type: 'buffer', bookType: 'xls' });

            const result = parseValuationSheet(buffer);

            expect(result.date).toBe('2024-11-20');
            expect(result.navTotal).toBe(1.0322);
            expect(result.navA).toBe(1.0315);
            expect(result.navB).toBe(1.0334);
            expect(result.totalAsset).toBe(1000000);
            expect(result.cash).toBe(50000);
        });
    });

    describe('parseTrsReport', () => {
        it('should extract positions and calculate PnL correctly', () => {
            // Create a mock workbook
            const wb = XLSX.utils.book_new();
            const headers = [
                '证券代码', '证券名称', '期初名义本金（计价货币）',
                '标的市值(计价货币)', '乙方合约价值', '合计结算金额'
            ];
            const row1 = ['NVDA', 'NVIDIA', 1000, 1200, 200, 0]; // PnL = 200 + 0 = 200
            const row2 = ['TSLA', 'TESLA', 2000, 1800, -200, -50]; // PnL = -200 + (-50) = -250

            const data = [
                ['2024-11-20'], // Date row
                headers,
                row1,
                row2
            ];
            const ws = XLSX.utils.aoa_to_sheet(data);
            XLSX.utils.book_append_sheet(wb, ws, '合约盯市情况');
            const buffer = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });

            const result = parseTrsReport(buffer);

            expect(result.date).toBe('2024-11-20');
            expect(result.positions).toHaveLength(2);

            const nvda = result.positions.find(p => p.ticker === 'NVDA');
            expect(nvda).toBeDefined();
            expect(nvda?.pnl_unrealized).toBe(200);

            const tsla = result.positions.find(p => p.ticker === 'TSLA');
            expect(tsla).toBeDefined();
            expect(tsla?.pnl_unrealized).toBe(-250);
        });
    });
});
