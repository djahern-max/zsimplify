import { useState } from 'react'
import * as XLSX from 'xlsx'
import { supabase } from '../lib/supabase'

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
      // Upload files to Supabase
      const screenshotsPath = `reconciliation/${Date.now()}-screenshots.xlsx`
      const creditCardPath = `reconciliation/${Date.now()}-creditcard.xlsx`

      const [screenshotsUpload, creditCardUpload] = await Promise.all([
        supabase.storage.from('documents').upload(screenshotsPath, screenshots),
        supabase.storage.from('documents').upload(creditCardPath, creditCard)
      ])

      if (screenshotsUpload.error) throw screenshotsUpload.error
      if (creditCardUpload.error) throw creditCardUpload.error

      // Get public URLs for the files
      const [screenshotsUrl, creditCardUrl] = await Promise.all([
        supabase.storage.from('documents').getPublicUrl(screenshotsPath),
        supabase.storage.from('documents').getPublicUrl(creditCardPath)
      ])

      // Call edge function for reconciliation
      const response = await fetch('/api/reconcile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          file1Url: screenshotsUrl.data.publicUrl,
          file2Url: creditCardUrl.data.publicUrl
        })
      })

      if (!response.ok) {
        throw new Error('Reconciliation failed')
      }

      const reconciliationResults = await response.json()

      if (!reconciliationResults.success) {
        throw new Error(reconciliationResults.error || 'Unknown error occurred')
      }

      setResults({
        matches: reconciliationResults.matches,
        unmatched: reconciliationResults.unmatched,
        totalTransactions: reconciliationResults.totalTransactions,
        matchingCriteria: reconciliationResults.matchingCriteria,
        stats: reconciliationResults.matchingStats
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