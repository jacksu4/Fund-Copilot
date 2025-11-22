# Fund Copilot (Xinzhida Growth Fund VI)

A modern, AI-powered dashboard for managing and visualizing fund performance data, specifically tailored for "Xinzhida Growth Fund VI". This application automates the processing of daily valuation and TRS reports, provides interactive visualizations, and features an AI assistant for data-driven insights.

![Dashboard Screenshot](/Users/sujingcheng/.gemini/antigravity/brain/dfab0218-085e-470b-a68a-f2a0c4f26792/ai_chat_success_1763822079526.png)

## Features

-   **Automated Data Sync**: Upload Excel reports (Valuation Sheet & TRS Daily Report) directly to Supabase Storage. The system automatically parses and syncs data to the database.
-   **Interactive Dashboard**:
    -   **Key Metrics**: Real-time display of Unit NAV, Total Assets, and daily changes.
    -   **NAV Chart**: Historical performance visualization with interactive tooltips.
    -   **PnL Attribution**: Dynamic bar chart showing unrealized PnL for each holding.
    -   **Holdings Table**: Detailed list of positions with PnL calculation and sorting.
-   **AI Assistant (Gemini 3 Pro)**:
    -   Integrated chat interface powered by Google's `gemini-3-pro-preview`.
    -   **Context-Aware**: The AI has access to the latest fund metrics and holdings, allowing it to answer specific questions like "What is the current NAV?" or "Which stock has the highest PnL?".
    -   **Markdown Support**: Rich text responses with tables and formatting.
-   **Smart Parsing**:
    -   Robust Excel parsing logic handling various formats.
    -   Automatic date extraction from filenames.
    -   Custom PnL calculation logic (`Contract Value + Settlement Amount`).

## Tech Stack

-   **Framework**: [Next.js 14](https://nextjs.org/) (App Router)
-   **Language**: TypeScript
-   **Styling**: Tailwind CSS (Vanilla CSS for custom components)
-   **Database**: [Supabase](https://supabase.com/) (PostgreSQL)
-   **Storage**: Supabase Storage (for report files)
-   **AI**: Google Gemini API (`@google/genai` SDK)
-   **Charts**: Recharts
-   **Icons**: Lucide React
-   **Excel Parsing**: SheetJS (`xlsx`)

## Architecture

1.  **Frontend**:
    -   `src/app/page.tsx`: Main dashboard controller. Fetches data from Supabase and manages state.
    -   `src/components/ui`: Reusable UI components (StatCard, FileUploadModal).
    -   `src/components/charts`: Visualization components (NavChart, PnlAttribution).
    -   `src/components/chat`: AI Chat interface (`ChatInterface`).

2.  **Backend (API Routes)**:
    -   `src/app/api/sync/route.ts`: Handles file synchronization. Downloads files from Storage, parses them using `src/utils/parser.ts`, and updates the DB.
    -   `src/app/api/chat/route.ts`: Handles AI chat requests. Fetches context from DB, constructs a prompt, and calls Gemini API.

3.  **Database Schema**:
    -   `fund_daily_metrics`: Stores daily NAV, Total Assets, Cash, etc.
    -   `trs_positions`: Stores individual stock positions for each date.

## Deployment on Vercel

This project is optimized for deployment on [Vercel](https://vercel.com/).

1.  **Prerequisites**:
    -   A Vercel account.
    -   A Supabase project (URL and Anon Key).
    -   A Google Gemini API Key.

2.  **Steps**:
    -   Push this code to a GitHub repository.
    -   Log in to Vercel and click "Add New Project".
    -   Import your GitHub repository.
    -   **Environment Variables**: Add the following variables in the Vercel project settings:
        -   `NEXT_PUBLIC_SUPABASE_URL`: Your Supabase Project URL.
        -   `NEXT_PUBLIC_SUPABASE_ANON_KEY`: Your Supabase Anon Key.
        -   `GEMINI_API_KEY`: Your Google Gemini API Key.
    -   Click "Deploy".

3.  **Post-Deployment**:
    -   Ensure your Supabase database has the correct schema (run `supabase/schema.sql` in Supabase SQL Editor).
    -   Ensure your Supabase Storage bucket `reports` is created and public/private access is configured correctly (RLS policies).

## Development

1.  **Install Dependencies**:
    ```bash
    npm install
    ```

2.  **Run Locally**:
    ```bash
    npm run dev
    ```

3.  **Run Tests**:
    ```bash
    npx jest
    ```
