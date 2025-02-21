// supabase/functions/reconcile-documents/index.ts
// @ts-nocheck
import { serve } from 'https://deno.land/std@0.208.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.38.4'
import * as XLSX from 'https://esm.sh/xlsx@0.18.5'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }
  
  try {
    const { receiptFileUrl, statementFileUrl, testUserId } = await req.json()
    
    // Create Supabase client with anon key for testing
    const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? ''
    const supabaseKey = Deno.env.get('SUPABASE_ANON_KEY') ?? ''
    const supabase = createClient(supabaseUrl, supabaseKey)
    
    // TEMPORARY: Use testUserId instead of getting the user from auth
    const userId = testUserId || 'anonymous-user'
    
    console.log('Processing files for user:', userId)
    console.log('Receipt file URL:', receiptFileUrl)
    console.log('Statement file URL:', statementFileUrl)
    
    // Download files from the signed URLs
    const receiptRes = await fetch(receiptFileUrl)
    const statementRes = await fetch(statementFileUrl)
    
    if (!receiptRes.ok || !statementRes.ok) {
      throw new Error('Failed to download files')
    }
    
    const receiptBuffer = await receiptRes.arrayBuffer()
    const statementBuffer = await statementRes.arrayBuffer()
    
    console.log('Files downloaded successfully')
    
    // Process Excel files
    const receiptWorkbook = XLSX.read(new Uint8Array(receiptBuffer), {
      type: 'array',
      cellDates: true,
      cellNF: true,
      raw: false
    })
    
    const statementWorkbook = XLSX.read(new Uint8Array(statementBuffer), {
      type: 'array',
      cellDates: true,
      cellNF: true,
      raw: false
    })
    
    const receipts = XLSX.utils.sheet_to_json(
      receiptWorkbook.Sheets[receiptWorkbook.SheetNames[0]],
      { raw: false, defval: null }
    )
    
    const statements = XLSX.utils.sheet_to_json(
      statementWorkbook.Sheets[statementWorkbook.SheetNames[0]],
      { raw: false, defval: null }
    )
    
    console.log('Receipts processed:', receipts.length)
    console.log('Statements processed:', statements.length)
    
    // Simple matching logic (you can implement the AI matching here if needed)
    const matches = []
    
    for (const receipt of receipts) {
      // Normalize receipt amount to handle potential formatting issues
      const normalizedReceipt = {
        ...receipt,
        amount: typeof receipt.amount === 'string'
          ? parseFloat(receipt.amount.replace(/[^0-9.-]+/g, ''))
          : receipt.amount
      }
      
      for (const statement of statements) {
        // Normalize statement amount
        const normalizedStatement = {
          ...statement,
          Amount: typeof statement.Amount === 'string'
            ? parseFloat(statement.Amount.replace(/[^0-9.-]+/g, ''))
            : statement.Amount
        }
        
        // Simple matching logic - check if amount and last 4 digits match
        const receiptAmount = normalizedReceipt.amount
        const statementAmount = normalizedStatement.Amount
        const receiptRemark = String(normalizedReceipt.remark || '')
        const statementRemark = String(normalizedStatement.Remark || '')
        
        let isMatch = false
        let confidence = "No match"
        
        // Basic matching criteria
        // 1. Exact amount match
        if (receiptAmount === statementAmount) {
          isMatch = true
          confidence = "MATCH: Amount"
        }
        
        // 2. Last 4 digits match
        if (receiptRemark === statementRemark) {
          isMatch = true
          confidence = isMatch ? "MATCH: Amount and Remark" : "MATCH: Remark"
        }
        
        if (isMatch) {
          matches.push({
            receipt: normalizedReceipt,
            statement: normalizedStatement,
            confidence: confidence
          })
        }
      }
    }
    
    console.log('Matches found:', matches.length)
    
    return new Response(
      JSON.stringify({ 
        success: true, 
        matches, 
        matchCount: matches.length,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
    
  } catch (error) {
    console.error('Error in Edge Function:', error)
    return new Response(
      JSON.stringify({ error: error.message || 'Unknown error occurred' }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})