// @ts-nocheck
import { serve } from "https://deno.land/std@0.208.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.38.4"
import * as XLSX from "https://esm.sh/xlsx@0.18.5"

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Content-Type": "application/json"
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders })
  }

  try {
    const { file1Url, file2Url } = await req.json()

    // Download and parse files
    const [file1Data, file2Data] = await Promise.all([
      downloadAndParseFile(file1Url),
      downloadAndParseFile(file2Url)
    ])

    // Get GPT-4 analysis of matching criteria
    const matchingCriteria = await analyzeMatchingCriteria(file1Data, file2Data)
    console.log('GPT-4 suggested matching criteria:', matchingCriteria)

    // Perform reconciliation using the suggested criteria
    const reconciliationResults = performReconciliation(file1Data, file2Data, matchingCriteria)

    return new Response(
      JSON.stringify({
        success: true,
        matchingCriteria,
        ...reconciliationResults
      }),
      { headers: corsHeaders }
    )
  } catch (error) {
    console.error('Error:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: corsHeaders }
    )
  }
})

async function downloadAndParseFile(url) {
  const response = await fetch(url)
  if (!response.ok) throw new Error(`Failed to download file: ${response.statusText}`)
  
  const buffer = await response.arrayBuffer()
  const workbook = XLSX.read(new Uint8Array(buffer), { type: "array" })
  return XLSX.utils.sheet_to_json(workbook.Sheets[workbook.SheetNames[0]], { 
    raw: false, 
    defval: null 
  })
}

async function analyzeMatchingCriteria(file1Data, file2Data) {
  const openaiApiKey = Deno.env.get("OPENAI_API_KEY")
  if (!openaiApiKey) throw new Error("Missing OpenAI API Key")

  // Extract headers and sample data
  const file1Headers = Object.keys(file1Data[0] || {})
  const file2Headers = Object.keys(file2Data[0] || {})
  const file1Sample = file1Data.slice(0, 3)
  const file2Sample = file2Data.slice(0, 3)

  const response = await fetch("https://api.openai.com/v1/chat/completions", {
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
          content: `You are a data reconciliation expert. Analyze these files and suggest the best matching columns for reconciling credit card transactions. Return a JSON array of objects, each with 'file1Field' and 'file2Field' properties indicating which columns should be matched. Example format:
          [
            {"file1Field": "Amount", "file2Field": "Transaction_Amount"},
            {"file1Field": "Last4", "file2Field": "Card_Number_End"}
          ]`
        },
        {
          role: "user",
          content: `File 1 Headers: ${JSON.stringify(file1Headers)}
          File 1 Sample: ${JSON.stringify(file1Sample)}
          File 2 Headers: ${JSON.stringify(file2Headers)}
          File 2 Sample: ${JSON.stringify(file2Sample)}`
        }
      ],
      temperature: 0.1,
      max_tokens: 500
    })
  })

  const aiData = await response.json()
  if (!aiData.choices?.[0]?.message?.content) {
    throw new Error("Invalid AI response")
  }

  return JSON.parse(aiData.choices[0].message.content)
}

function performReconciliation(file1Data, file2Data, matchingCriteria) {
  const matches = []
  const unmatched = []
  const matchedTransactions = new Set() // Keep track of matched transactions

  // Normalize field values for comparison
  function normalizeValue(value, fieldName) {
    if (!value) return null
    const str = value.toString().trim()
    if (fieldName.toLowerCase().includes('amount')) {
      return parseFloat(str.replace(/[^0-9.-]/g, ''))
    }
    return str
  }

  // Try to match each transaction from file1
  file1Data.forEach((trans1, index1) => {
    let bestMatch = null
    let bestConfidence = 0
    let bestMatchIndex = -1

    file2Data.forEach((trans2, index2) => {
      if (matchedTransactions.has(index2)) return // Skip already matched transactions

      let matchScore = 0
      let totalCriteria = 0

      matchingCriteria.forEach(criterion => {
        const value1 = normalizeValue(trans1[criterion.file1Field], criterion.file1Field)
        const value2 = normalizeValue(trans2[criterion.file2Field], criterion.file2Field)

        if (value1 !== null && value2 !== null) {
          totalCriteria++
          if (criterion.file1Field.toLowerCase().includes('amount')) {
            // For amounts, allow small differences due to rounding
            if (Math.abs(value1 - value2) < 0.01) matchScore++
          } else {
            if (value1 === value2) matchScore++
          }
        }
      })

      const confidence = totalCriteria > 0 ? matchScore / totalCriteria : 0
      if (confidence > bestConfidence) {
        bestConfidence = confidence
        bestMatch = {
          file1: trans1,
          file2: trans2,
          confidence,
          matchedFields: matchScore,
          totalFields: totalCriteria
        }
        bestMatchIndex = index2
      }
    })

    if (bestConfidence >= 0.5 && bestMatchIndex !== -1) { // Require at least 50% match
      matches.push(bestMatch)
      matchedTransactions.add(bestMatchIndex)
    } else {
      unmatched.push({
        transaction: trans1,
        bestMatchConfidence: bestConfidence
      })
    }
  })

  return {
    matches,
    unmatched,
    totalTransactions: file1Data.length,
    matchingStats: {
      matched: matches.length,
      unmatched: unmatched.length,
      totalConfidence: matches.length > 0 ? matches.reduce((sum, m) => sum + m.confidence, 0) / matches.length : 0
    }
  }
}