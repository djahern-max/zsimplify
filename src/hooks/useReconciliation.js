import { useState } from 'react'
import * as XLSX from 'xlsx'

export function useReconciliation() {
  const [results, setResults] = useState(null)
  const [error, setError] = useState(null)
  const [loading, setLoading] = useState(false)

  const readExcelFile = (file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = (e) => {
        try {
          const data = new Uint8Array(e.target.result)
          const workbook = XLSX.read(data, { type: 'array' })
          const firstSheet = workbook.Sheets[workbook.SheetNames[0]]
          resolve(XLSX.utils.sheet_to_json(firstSheet))
        } catch (err) {
          reject(new Error('Error reading file: ' + err.message))
        }
      }
      reader.onerror = () => reject(new Error('Error reading file'))
      reader.readAsArrayBuffer(file)
    })
  }

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
      const [ssData, ccData] = await Promise.all([
        readExcelFile(screenshots),
        readExcelFile(creditCard)
      ])

      // Create lookup maps using concatenated key (Remark + Amount)
      const matches = []
      const unmatchedCC = [...ccData]

      // Create lookup keys
      ssData.forEach(ss => {
        const ssKey = `${ss[' Remark ']}${ss.Amount}`
        const ccIndex = unmatchedCC.findIndex(cc => {
          const ccKey = `${cc[' Remark ']}${cc.Amount}`
          return ssKey === ccKey
        })

        if (ccIndex !== -1) {
          matches.push({
            screenshot: ss,
            creditCard: unmatchedCC[ccIndex]
          })
          // Remove the matched transaction from unmatchedCC
          unmatchedCC.splice(ccIndex, 1)
        }
      })

      // Create output workbook
      const wb = XLSX.utils.book_new()

      // Add matched transactions
      const matchedSheet = XLSX.utils.json_to_sheet(
        matches.map(m => ({
          Amount: m.creditCard.Amount,
          'Last 4': m.creditCard[' Remark '],
          Description: m.creditCard.Description,
          Status: 'Matched'
        }))
      )
      XLSX.utils.book_append_sheet(wb, matchedSheet, 'Matches')

      // Add unmatched credit card transactions
      if (unmatchedCC.length > 0) {
        const unmatchedSheet = XLSX.utils.json_to_sheet(unmatchedCC)
        XLSX.utils.book_append_sheet(wb, unmatchedSheet, 'Unmatched')
      }

      setResults({
        matches,
        unmatched: unmatchedCC,
        totalTransactions: ccData.length,
        workbook: wb
      })

    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const exportResults = () => {
    if (results?.workbook) {
      XLSX.writeFile(results.workbook, 'reconciliation-results.xlsx')
    }
  }

  return {
    results,
    error,
    loading,
    handleFileUpload,
    exportResults
  }
}