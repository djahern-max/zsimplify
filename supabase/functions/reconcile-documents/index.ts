// @ts-nocheck
import { serve } from 'https://deno.land/std@0.208.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.38.4'
import * as XLSX from 'https://esm.sh/xlsx@0.18.5'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Content-Type': 'application/json',
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { file1Url, file2Url, matchingRules, testUserId } = await req.json()

    // Create Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? ''
    const supabaseKey = Deno.env.get('SUPABASE_ANON_KEY') ?? ''
    const supabase = createClient(supabaseUrl, supabaseKey)

    const userId = testUserId || 'anonymous-user'
    console.log('Processing files for user:', userId)
    console.log('File 1 URL:', file1Url)
    console.log('File 2 URL:', file2Url)
    
    // Fetch files from storage
    const file1Res = await fetch(file1Url)
    const file2Res = await fetch(file2Url)

    if (!file1Res.ok || !file2Res.ok) {
      throw new Error('Failed to download one or both files')
    }

    const file1Buffer = await file1Res.arrayBuffer()
    const file2Buffer = await file2Res.arrayBuffer()

    console.log('Files downloaded successfully')

    // Read Excel files
    const file1Workbook = XLSX.read(new Uint8Array(file1Buffer), { type: 'array' })
    const file2Workbook = XLSX.read(new Uint8Array(file2Buffer), { type: 'array' })

    const file1Data = XLSX.utils.sheet_to_json(file1Workbook.Sheets[file1Workbook.SheetNames[0]], { raw: false, defval: null })
    const file2Data = XLSX.utils.sheet_to_json(file2Workbook.Sheets[file2Workbook.SheetNames[0]], { raw: false, defval: null })

    console.log('Rows in File 1:', file1Data.length)
    console.log('Rows in File 2:', file2Data.length)

    // Ensure AI-determined matching rules exist
    if (!matchingRules || matchingRules.length === 0) {
      throw new Error('No matching rules provided')
    }
    console.log('Matching rules:', matchingRules)

    // Perform reconciliation based on AI suggestions
    const matches = []
    const unmatched = []

    for (const row1 of file1Data) {
      let foundMatch = false
      let matchDetails = {}

      for (const row2 of file2Data) {
        let isMatch = true
        let matchReasons = []

        for (const rule of matchingRules) {
          const value1 = row1[rule.file1Field]?.toString().trim() || ''
          const value2 = row2[rule.file2Field]?.toString().trim() || ''

          if (value1 !== value2) {
            isMatch = false
            matchReasons.push(`Mismatch in ${rule.file1Field} vs ${rule.file2Field}`)
          }
        }

        if (isMatch) {
          foundMatch = true
          matchDetails = { file1: row1, file2: row2, confidence: "high", reasons: matchReasons }
          matches.push(matchDetails)
          break // Stop checking once a match is found
        }
      }

      if (!foundMatch) {
        unmatched.push(row1)
      }
    }

    console.log(`Matches found: ${matches.length}, Unmatched records: ${unmatched.length}`)

    return new Response(
      JSON.stringify({ success: true, matches, unmatched, matchCount: matches.length }),
      { headers: corsHeaders }
    )

  } catch (error) {
    console.error('Error in Edge Function:', error)
    return new Response(
      JSON.stringify({ error: error.message || 'Unknown error occurred' }),
      { status: 400, headers: corsHeaders }
    )
  }
})
