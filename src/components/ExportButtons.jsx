import React from 'react'
import * as XLSX from 'xlsx'

export default function ExportButtons({ results }) {
  if (!results) return null

  const exportToExcel = () => {
    const workbook = XLSX.utils.book_new()

    // Add matched items
    if (results.matches.length > 0) {
      const matchedData = results.matches.map(m => ({
        Amount: m.creditCard.Amount,
        Remark: m.creditCard[' Remark '],
        Description: m.creditCard.Description,
        Status: 'Matched'
      }))
      const matchedSheet = XLSX.utils.json_to_sheet(matchedData)
      XLSX.utils.book_append_sheet(workbook, matchedSheet, 'Matches')
    }

    // Add unmatched items
    if (results.unmatched.screenshots.length > 0) {
      XLSX.utils.book_append_sheet(
        workbook,
        XLSX.utils.json_to_sheet(results.unmatched.screenshots),
        'Unmatched Screenshots'
      )
    }
    if (results.unmatched.creditCard.length > 0) {
      XLSX.utils.book_append_sheet(
        workbook,
        XLSX.utils.json_to_sheet(results.unmatched.creditCard),
        'Unmatched Credit Card'
      )
    }

    XLSX.writeFile(workbook, 'reconciliation-results.xlsx')
  }

  return (
    <button
      onClick={exportToExcel}
      className="mt-4 bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600"
    >
      Export Results
    </button>
  )
}
