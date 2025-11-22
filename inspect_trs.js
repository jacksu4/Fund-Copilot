const { createClient } = require('@supabase/supabase-js');
const XLSX = require('xlsx');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error('Missing Supabase credentials');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function inspectTrs() {
    console.log('Downloading TRS report for inspection...');
    // Use a known date
    const dateStr = '20251120';
    const trsPath = `reports/${dateStr}/trs.xlsx`;

    const { data: trsData, error: trsError } = await supabase.storage.from('reports').download(trsPath);
    if (trsError) {
        console.error('Error downloading TRS:', trsError);
        return;
    }

    const buffer = Buffer.from(await trsData.arrayBuffer());
    const workbook = XLSX.read(buffer, { type: 'buffer' });

    console.log('Sheet Names:', workbook.SheetNames);

    const sheetName = '合约盯市情况'; // As suspected from screenshot
    if (!workbook.SheetNames.includes(sheetName)) {
        console.error(`Sheet ${sheetName} not found!`);
        return;
    }

    const sheet = workbook.Sheets[sheetName];
    const data = XLSX.utils.sheet_to_json(sheet, { header: 1 });

    console.log(`--- ${sheetName} (Rows 15-29) ---`);
    data.slice(15, 29).forEach((row, i) => console.log(`Row ${i + 15}:`, JSON.stringify(row)));
}

inspectTrs();
