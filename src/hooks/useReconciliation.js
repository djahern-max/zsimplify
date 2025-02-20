import { useState, useCallback } from 'react'
import * as XLSX from 'xlsx'
import Papa from 'papaparse'
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

      // Process Excel file
      const screenshotsBuffer = await screenshotsFile.arrayBuffer()
      const workbook = XLSX.read(screenshotsBuffer, {
        type: 'array',
        cellDates: true
      })
      const receipts = XLSX.utils.sheet_to_json(workbook.Sheets[workbook.SheetNames[0]])

      // Process CSV file
      const statementText = await statementFile.text()
      const { data: statements } = Papa.parse(statementText, {
        header: true,
        skipEmptyLines: true
      })

      // Match receipts with statements using AI
      const matches = []
      for (const receipt of receipts) {
        for (const statement of statements) {
          const match = await matchReceiptToStatement(receipt, statement)
          if (match.includes('match')) {
            matches.push({ receipt, statement, confidence: match })
          }
        }
      }

      // Store results in Supabase
      const { data, error } = await supabase
        .from('reconciliations')
        .insert({
          matches,
          created_at: new Date().toISOString()
        })
        .select()

      if (error) throw error

      setResults(matches)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }, [])

  return { processFiles, loading, results, error }
}
