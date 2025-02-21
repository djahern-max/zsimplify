import React from 'react'
import * as XLSX from 'xlsx'

export default function ExportButtons({ results }) {
  if (!results) return null

  const exportToExcel = () => {
    const workbook = XLSX.utils.book_new()

    // Add matched items
    if (results.matches && results.matches.length > 0) {
      const matchedData = results.matches.map(m => ({
        Amount: m.creditCard.Amount,
        'Last 4': m.creditCard[' Remark '],
        Description: m.creditCard.Description,
        Status: 'Matched'
      }))
      const matchedSheet = XLSX.utils.json_to_sheet(matchedData)
      XLSX.utils.book_append_sheet(workbook, matchedSheet, 'Matches')
    }

    // Add unmatched credit card transactions
    if (results.unmatched && results.unmatched.length > 0) {
      const unmatchedSheet = XLSX.utils.json_to_sheet(results.unmatched)
      XLSX.utils.book_append_sheet(workbook, unmatchedSheet, 'Unmatched')
    }

    // Add summary sheet
    const summaryData = [{
      'Total Transactions': results.totalTransactions,
      'Matched Transactions': results.matches.length,
      'Unmatched Transactions': results.unmatched.length
    }]
    const summarySheet = XLSX.utils.json_to_sheet(summaryData)
    XLSX.utils.book_append_sheet(workbook, summarySheet, 'Summary')

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