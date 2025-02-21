// hooks/useReconciliation.js
import { useState } from 'react'
import { supabase, uploadFile } from '../lib/supabase'

export function useReconciliation() {
  const [results, setResults] = useState(null)
  const [error, setError] = useState(null)
  const [loading, setLoading] = useState(false)

  const handleFileUpload = async (e) => {
    e.preventDefault()
    setError(null)
    setLoading(true)

    const screenshots = e.target.screenshots.files[0]
    const creditCard = e.target.creditCard.files[0]

    if (!screenshots || !creditCard) {
      setError('Please select both files')
      setLoading(false)
      return
    }

    try {
      console.log('Starting file upload process...')

      // Upload files and get paths
      const timestamp = Date.now()
      const screenshotsPath = `reconciliation/${timestamp}-screenshots.xlsx`
      const creditCardPath = `reconciliation/${timestamp}-creditcard.xlsx`

      // Upload both files
      await Promise.all([
        uploadFile(screenshots, screenshotsPath),
        uploadFile(creditCard, creditCardPath)
      ])

      console.log('Files uploaded successfully')

      // Get signed URLs for the files
      const [screenshotsUrlData, creditCardUrlData] = await Promise.all([
        supabase.storage.from('documents').createSignedUrl(screenshotsPath, 3600),
        supabase.storage.from('documents').createSignedUrl(creditCardPath, 3600)
      ])

      if (!screenshotsUrlData.data?.signedUrl || !creditCardUrlData.data?.signedUrl) {
        throw new Error('Failed to generate signed URLs')
      }

      console.log('Signed URLs generated successfully')

      // Call edge function for reconciliation
      const response = await fetch('/api/reconcile-documents', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          file1Url: screenshotsUrlData.data.signedUrl,
          file2Url: creditCardUrlData.data.signedUrl
        })
      })

      if (!response.ok) {
        const errorText = await response.text()
        throw new Error(`Reconciliation failed: ${errorText}`)
      }

      const reconciliationResults = await response.json()

      if (!reconciliationResults.success) {
        throw new Error(reconciliationResults.error || 'Unknown error occurred')
      }

      console.log('Reconciliation completed successfully')

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
    handleFileUpload
  }
}