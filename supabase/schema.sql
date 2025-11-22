-- Create table for fund daily metrics
CREATE TABLE IF NOT EXISTS fund_daily_metrics (
  date DATE PRIMARY KEY,
  nav_total NUMERIC(10, 4) NOT NULL,
  nav_a NUMERIC(10, 4) NOT NULL,
  nav_b NUMERIC(10, 4) NOT NULL,
  total_asset_val NUMERIC(15, 2) NOT NULL,
  cash_balance NUMERIC(15, 2) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create table for TRS positions
CREATE TABLE IF NOT EXISTS trs_positions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  report_date DATE REFERENCES fund_daily_metrics(date) ON DELETE CASCADE,
  ticker TEXT NOT NULL,
  asset_name TEXT NOT NULL,
  notional_cost NUMERIC(15, 2) NOT NULL,
  market_value NUMERIC(15, 2) NOT NULL,
  pnl_unrealized NUMERIC(15, 2) NOT NULL,
  fx_rate NUMERIC(10, 4),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_trs_positions_report_date ON trs_positions(report_date);
CREATE INDEX IF NOT EXISTS idx_trs_positions_ticker ON trs_positions(ticker);

-- Enable Row Level Security
ALTER TABLE fund_daily_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE trs_positions ENABLE ROW LEVEL SECURITY;

-- Create policies for public access (since we are using Anon key for this internal tool)
-- In a real production app with auth, we would restrict this to authenticated users.
CREATE POLICY "Allow public read access" ON fund_daily_metrics FOR SELECT USING (true);
CREATE POLICY "Allow public insert access" ON fund_daily_metrics FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update access" ON fund_daily_metrics FOR UPDATE USING (true);
CREATE POLICY "Allow public delete access" ON fund_daily_metrics FOR DELETE USING (true);

CREATE POLICY "Allow public read access" ON trs_positions FOR SELECT USING (true);
CREATE POLICY "Allow public insert access" ON trs_positions FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update access" ON trs_positions FOR UPDATE USING (true);
CREATE POLICY "Allow public delete access" ON trs_positions FOR DELETE USING (true);
