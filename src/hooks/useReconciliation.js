import { useState, useCallback } from 'react'
import * as XLSX from 'xlsx'
import { supabase } from '../lib/supabase'
import { matchReceiptToStatement } from '../lib/ai'

export function useReconciliation() {
  const [loading, setLoading] = useState(false)
  const [results, setResults] = useState([])
  const [error, setError] = useState(null)

  const processFiles = useCallback(async (screenshotsFile, statementFile) => {
    try {
      setLoading(true)
      setError(null)

      // Debug logs
      console.log('Starting file processing')
      console.log('Screenshots file:', screenshotsFile)
      console.log('Statement file:', statementFile)

      // Process both files as Excel
      const screenshotsBuffer = await screenshotsFile.arrayBuffer()
      const statementBuffer = await statementFile.arrayBuffer()

      console.log('Files loaded into buffer')

      // Read screenshots Excel with number formatting
      const screenshotsWorkbook = XLSX.read(screenshotsBuffer, {
        type: 'array',
        cellDates: true,
        cellNF: true,
        raw: false
      })

      // Read statement Excel with number formatting
      const statementWorkbook = XLSX.read(statementBuffer, {
        type: 'array',
        cellDates: true,
        cellNF: true,
        raw: false
      })

      console.log('Workbooks loaded')

      // Convert to JSON with number handling
      const receipts = XLSX.utils.sheet_to_json(screenshotsWorkbook.Sheets[screenshotsWorkbook.SheetNames[0]], {
        raw: false,
        defval: null
      })

      const statements = XLSX.utils.sheet_to_json(statementWorkbook.Sheets[statementWorkbook.SheetNames[0]], {
        raw: false,
        defval: null
      })

      console.log('Receipts processed:', receipts.length)
      console.log('Statements processed:', statements.length)

      // Log sample data for debugging
      console.log('Sample receipt:', receipts[0])
      console.log('Sample statement:', statements[0])

      // Match receipts with statements using AI
      const matches = []
      console.log('Starting matching process')

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

          try {
            const match = await matchReceiptToStatement(normalizedReceipt, normalizedStatement)
            console.log('Match result:', match)
            if (match.includes('match')) {
              matches.push({
                receipt: normalizedReceipt,
                statement: normalizedStatement,
                confidence: match
              })
            }
          } catch (err) {
            console.error('Error in matching:', err)
            throw new Error(`AI matching failed: ${err.message}`)
          }
        }
      }

      console.log('Matches found:', matches.length)

      // Store results in Supabase
      const { data, error: supabaseError } = await supabase
        .from('reconciliations')
        .insert({
          matches,
          created_at: new Date().toISOString()
        })
        .select()

      if (supabaseError) {
        console.error('Supabase error:', supabaseError)
        throw supabaseError
      }

      setResults(matches)
    } catch (err) {
      console.error('Process files error:', err)
      setError(err.message || 'An unexpected error occurred')
    } finally {
      setLoading(false)
    }
  }, [])

  return { processFiles, loading, results, error }
}