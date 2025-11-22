
const filenames = [
    'Valuation_20251122.xls',
    'TRS_Report_2025-11-22.xlsx',
    '2025.11.22_Report.xlsx',
    'Report.xlsx',
    'SBEJ97新智达成长六号私募证券投资基金委托资产-20251122.xls'
];

filenames.forEach(name => {
    let foundDate = '';
    const dateMatch = name.match(/(20\d{2})[-.]?(0[1-9]|1[0-2])[-.]?(0[1-9]|[12]\d|3[01])/);
    if (dateMatch) {
        foundDate = `${dateMatch[1]}${dateMatch[2]}${dateMatch[3]}`;
    }
    console.log(`File: ${name} -> Date: ${foundDate || 'Not Found'}`);
});
