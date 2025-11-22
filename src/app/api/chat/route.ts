import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenAI } from '@google/genai';
import { supabase } from '@/utils/supabase/client';

/**
 * POST /api/chat
 * Handles AI chat requests using Google's Gemini model.
 * Injects fund context (metrics and holdings) into the system prompt.
 */
export async function POST(req: NextRequest) {
    try {
        const { messages } = await req.json();
        const apiKey = process.env.GEMINI_API_KEY;

        if (!apiKey) {
            return NextResponse.json({ error: 'Missing Gemini API Key' }, { status: 500 });
        }

        // 1. Fetch Context Data
        // Fetch latest fund metrics
        const { data: fundMetrics } = await supabase
            .from('fund_daily_metrics')
            .select('*')
            .order('date', { ascending: false })
            .limit(5); // Get last 5 days for trend context

        // Fetch latest positions (for the most recent date)
        let positions: any[] = [];
        if (fundMetrics && fundMetrics.length > 0) {
            const latestDate = fundMetrics[0].date;
            const { data: posData } = await supabase
                .from('trs_positions')
                .select('*')
                .eq('report_date', latestDate);
            positions = posData || [];
        }

        // 2. Construct System Prompt
        const contextPrompt = `
You are an expert Fund Manager Assistant for "Xinzhida Growth Fund VI" (新智达成长六号).
Your role is to analyze the fund's performance, answer questions about holdings, and provide insights based on the provided data.

Current Fund Context (Latest Data):
${JSON.stringify(fundMetrics, null, 2)}

Current Holdings (TRS Positions):
${JSON.stringify(positions, null, 2)}

Instructions:
- Answer questions concisely and professionally.
- Use Markdown formatting for tables, lists, and emphasis.
- If asked about PnL, refer to the "pnl_unrealized" field.
- If asked about NAV, refer to "nav_total".
- Be helpful and data-driven.
`;

        // 3. Call Gemini API using @google/genai
        const ai = new GoogleGenAI({ apiKey });

        // Construct history for the model
        // Note: @google/genai might have different chat history format.
        // The user example used `ai.models.generateContent`.
        // For chat, we usually append history. 
        // Let's try to use generateContent with the full history as text or see if there is a chat method.
        // Looking at the user snippet: `ai.models.generateContent({ model: ..., contents: ... })`
        // We can pass a list of contents for multi-turn.

        const contents = [
            { role: 'user', parts: [{ text: contextPrompt }] },
            { role: 'model', parts: [{ text: 'Understood. I am ready to assist with the fund analysis.' }] },
            ...messages.slice(0, -1).map((m: any) => ({
                role: m.role === 'user' ? 'user' : 'model',
                parts: [{ text: m.content }],
            })),
            { role: 'user', parts: [{ text: messages[messages.length - 1].content }] }
        ];

        const response = await ai.models.generateContent({
            model: 'gemini-3-pro-preview',
            contents: contents,
        });

        const text = response.text;

        return NextResponse.json({ role: 'assistant', content: text });

    } catch (error: any) {
        console.error('Chat API Error:', error);
        return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
    }
}
