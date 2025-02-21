// hooks/useReconciliation.js
import { useState } from 'react'
import { supabase, uploadFile } from '../lib/supabase'
import * as XLSX from 'xlsx'

export function useReconciliation() {
  const [results, setResults] = useState(null)
  const [error, setError] = useState(null)
  const [loading, setLoading] = useState(false)
  const [aiSuggestions, setAiSuggestions] = useState(null)

  const processExcelFile = async (file) => {
    const data = await file.arrayBuffer()
    const workbook = XLSX.read(data, {
      type: 'array',
      cellDates: true,
      dateNF: 'yyyy-mm-dd'
    })
    const firstSheet = workbook.Sheets[workbook.SheetNames[0]]
    return XLSX.utils.sheet_to_json(firstSheet, { raw: false, defval: null })
  }

  const handleFileUpload = async (e) => {
    e.preventDefault()
    setError(null)
    setLoading(true)
    setAiSuggestions(null)

    const screenshots = e.target.screenshots.files[0]
    const creditCard = e.target.creditCard.files[0]

    if (!screenshots || !creditCard) {
      setError('Please select both files')
      setLoading(false)
      return
    }

    try {
      console.log('Starting file upload process...')

      // Process files locally first to get headers and sample data
      const [screenshotsData, creditCardData] = await Promise.all([
        processExcelFile(screenshots),
        processExcelFile(creditCard)
      ])

      // Upload files with timestamps
      const timestamp = Date.now()
      const screenshotsPath = `${timestamp}-screenshots.xlsx`
      const creditCardPath = `${timestamp}-creditcard.xlsx`

      // Upload both files
      const [screenshotsUpload, creditCardUpload] = await Promise.all([
        uploadFile(screenshots, screenshotsPath),
        uploadFile(creditCard, creditCardPath)
      ])

      console.log('Files uploaded successfully')

      // Get signed URLs
      const [screenshotsUrlData, creditCardUrlData] = await Promise.all([
        supabase.storage
          .from('Test_Reconciliation_Data')
          .createSignedUrl(screenshotsPath, 3600),
        supabase.storage
          .from('Test_Reconciliation_Data')
          .createSignedUrl(creditCardPath, 3600)
      ])

      if (!screenshotsUrlData.data?.signedUrl || !creditCardUrlData.data?.signedUrl) {
        throw new Error('Failed to generate signed URLs')
      }

      // Call edge function for AI suggestions first
      const aiResponse = await fetch('/api/suggest-columns', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          file1Headers: Object.keys(screenshotsData[0] || {}),
          file2Headers: Object.keys(creditCardData[0] || {}),
          file1Sample: screenshotsData.slice(0, 3),
          file2Sample: creditCardData.slice(0, 3)
        })
      })

      if (!aiResponse.ok) {
        const errorText = await aiResponse.text()
        throw new Error(`AI suggestion failed: ${errorText}`)
      }

      const aiSuggestionsData = await aiResponse.json()
      setAiSuggestions(aiSuggestionsData.suggestions)

      // Call reconciliation function
      const reconcileResponse = await fetch('/api/reconcile-documents', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          file1Url: screenshotsUrlData.data.signedUrl,
          file2Url: creditCardUrlData.data.signedUrl,
          columnMappings: aiSuggestionsData.suggestions
        })
      })

      if (!reconcileResponse.ok) {
        const errorText = await reconcileResponse.text()
        throw new Error(`Reconciliation failed: ${errorText}`)
      }

      const reconciliationResults = await reconcileResponse.json()

      if (!reconciliationResults.success) {
        throw new Error(reconciliationResults.error || 'Unknown error occurred')
      }

      setResults({
        matches: reconciliationResults.matches,
        unmatched: reconciliationResults.unmatched,
        totalTransactions: reconciliationResults.totalTransactions,
        matchingStats: reconciliationResults.matchingStats
      })
    } catch (err) {
      console.error('Reconciliation error:', err)
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return {
    results,
    error,
    loading,
    aiSuggestions,
    handleFileUpload
  }
}