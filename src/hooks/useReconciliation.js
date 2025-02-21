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

      const matches = []
      const unmatched = {
        screenshots: [...ssData],
        creditCard: [...ccData]
      }

      ssData.forEach((ss, ssIndex) => {
        const ccIndex = ccData.findIndex(cc => 
          cc.Amount === ss.Amount && 
          cc[' Remark '] === ss[' Remark ']
        )

        if (ccIndex !== -1) {
          matches.push({
            screenshot: ss,
            creditCard: ccData[ccIndex]
          })
          unmatched.screenshots = unmatched.screenshots.filter((_, i) => i !== ssIndex)
          unmatched.creditCard = unmatched.creditCard.filter((_, i) => i !== ccIndex)
        }
      })

      setResults({ matches, unmatched })
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
