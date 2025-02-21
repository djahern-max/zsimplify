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

    // Perform reconciliation using Last4+Amount matching
    const reconciliationResults = performReconciliation(file1Data, file2Data)

    return new Response(
      JSON.stringify({
        success: true,
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

function normalizeAmount(amount) {
  if (!amount) return null
  // Convert amount to string and clean it
  const str = amount.toString().trim()
  // Remove all non-numeric characters except . and -
  return parseFloat(str.replace(/[^0-9.-]/g, ''))
}

function performReconciliation(file1Data, file2Data) {
  const matches = []
  const unmatched = []

  // Create lookup map for file2 data
  const file2Map = new Map()
  file2Data.forEach(trans => {
    const amount = normalizeAmount(trans.Amount)
    const last4 = trans[' Last4 ']?.toString().trim()
    const key = `${last4}-${amount}`
    file2Map.set(key, trans)
  })

  // Match file1 transactions against lookup map
  file1Data.forEach(trans => {
    const amount = normalizeAmount(trans.Amount)
    const remark = trans[' Remark ']?.toString().trim()
    const key = `${remark}-${amount}`

    const matchingTrans = file2Map.get(key)
    if (matchingTrans) {
      matches.push({
        creditCard: matchingTrans,
        screenshot: trans
      })
      // Remove matched transaction from map to prevent duplicate matches
      file2Map.delete(key)
    } else {
      unmatched.push(trans)
    }
  })

  return {
    matches,
    unmatched,
    totalTransactions: file1Data.length,
    matchingStats: {
      matched: matches.length,
      unmatched: unmatched.length
    }
  }
}