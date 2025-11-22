const { createClient } = require('@supabase/supabase-js');
// require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error('Missing Supabase credentials');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function listBuckets() {
    console.log("Listing inside 'reports/reports/20251120'...");
    const { data: files, error } = await supabase.storage.from('reports').list('reports/20251120');

    if (error) {
        console.error(`Error:`, error);
        return;
    }

    files.forEach(f => console.log(` - ${f.name}`));
}

listBuckets();
