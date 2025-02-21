// useReconciliation.js
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

  const normalizeAmount = (amount) => {
    if (!amount) return null
    const str = amount.toString().trim()
    return parseFloat(str.replace(/[^0-9.-]/g, ''))
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

      const matches = []
      const unmatched = []

      // Create lookup map for credit card data
      const ccMap = new Map()
      ccData.forEach(trans => {
        const amount = normalizeAmount(trans.Amount)
        const last4 = trans[' Last4 ']?.toString().trim()
        const key = `${last4}-${amount}`
        ccMap.set(key, trans)
      })

      // Match screenshot transactions
      ssData.forEach(trans => {
        const amount = normalizeAmount(trans.Amount)
        const remark = trans[' Remark ']?.toString().trim()
        const key = `${remark}-${amount}`

        const matchingTrans = ccMap.get(key)
        if (matchingTrans) {
          matches.push({
            creditCard: matchingTrans,
            screenshot: trans
          })
          ccMap.delete(key)
        } else {
          unmatched.push(trans)
        }
      })

      setResults({
        matches,
        unmatched,
        totalTransactions: ssData.length,
        matchingStats: {
          matched: matches.length,
          unmatched: unmatched.length
        }
      })

    } catch (err) {
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