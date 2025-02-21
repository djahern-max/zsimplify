// @ts-nocheck
import { serve } from "https://deno.land/std@0.208.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.38.4"
import * as XLSX from "https://esm.sh/xlsx@0.18.5"

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Content-Type": "application/json"
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { file1Url, file2Url } = await req.json();

    const file1Res = await fetch(file1Url);
    const file2Res = await fetch(file2Url);

    if (!file1Res.ok || !file2Res.ok) {
      throw new Error("Failed to download files");
    }

    const file1Buffer = await file1Res.arrayBuffer();
    const file2Buffer = await file2Res.arrayBuffer();

    // Read Excel files
    const file1Workbook = XLSX.read(new Uint8Array(file1Buffer), { type: "array" });
    const file2Workbook = XLSX.read(new Uint8Array(file2Buffer), { type: "array" });

    const file1Data = XLSX.utils.sheet_to_json(file1Workbook.Sheets[file1Workbook.SheetNames[0]], { raw: false, defval: null });
    const file2Data = XLSX.utils.sheet_to_json(file2Workbook.Sheets[file2Workbook.SheetNames[0]], { raw: false, defval: null });

    // Extract headers and sample data
    const file1Headers = Object.keys(file1Data[0] || {});
    const file2Headers = Object.keys(file2Data[0] || {});

    const file1Sample = file1Data.slice(0, 3);
    const file2Sample = file2Data.slice(0, 3);

    // OpenAI Request
    const openaiApiKey = Deno.env.get("OPENAI_API_KEY");
    if (!openaiApiKey) {
      throw new Error("Missing OpenAI API Key");
    }

    const openaiResponse = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${openaiApiKey}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: "gpt-4",
        messages: [
          {
            role: "system",
            content: `You are a data reconciliation expert. Your task is to analyze two files and suggest the best matching columns.
            Consider:
            - Matching by Amount, Remark, or a combination of Name + Date.
            - Providing a confidence score for each suggested match.
            - Returning only structured JSON in this format:
            {
              "possibleMatches": [
                {"file1Field": "Column1", "file2Field": "ColumnA", "confidence": "high"},
                {"file1Field": "Column2", "file2Field": "ColumnB", "confidence": "medium"}
              ]
            }`
          },
          {
            role: "user",
            content: `File 1: Headers: ${JSON.stringify(file1Headers)}, Sample: ${JSON.stringify(file1Sample)}
                      File 2: Headers: ${JSON.stringify(file2Headers)}, Sample: ${JSON.stringify(file2Sample)}`
          }
        ],
        temperature: 0.5,
        max_tokens: 500
      })
    });
        
    

   // Handle AI response
const aiData = await openaiResponse.json();
const aiSuggestedMatches = aiData.choices?.[0]?.message?.content;

try {
  // Ensure the response is valid JSON
  const structuredMatches = JSON.parse(aiSuggestedMatches); 

  return new Response(
    JSON.stringify({
      success: true,
      file1Headers,
      file2Headers,
      aiSuggestedMatches: structuredMatches
    }),
    { headers: corsHeaders }
  );

} catch (error) {
  console.error("AI response was not valid JSON:", aiSuggestedMatches);
  
  return new Response(
    JSON.stringify({ error: "Invalid AI response format" }),
    { status: 500, headers: corsHeaders }
  );
}
  }
  catch (error) {
    console.error("Error:", error);

    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: corsHeaders }
    );
  }
});
