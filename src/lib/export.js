import * as XLSX from 'xlsx'
import jsPDF from 'jspdf'
import 'jspdf-autotable'

export const exportToExcel = (data) => {
  const worksheet = XLSX.utils.json_to_sheet(data.map(match => ({
    'Receipt Date': match.receipt.date,
    'Receipt Amount': match.receipt.amount,
    'Receipt Description': match.receipt.description,
    'Statement Date': match.statement.Date,
    'Statement Amount': match.statement.Amount,
    'Statement Description': match.statement.Description,
    'Match Confidence': match.confidence
  })))

  const workbook = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Reconciliation')
  
  const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' })
  
  const blob = new Blob([excelBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = `reconciliation-${new Date().toISOString().split('T')[0]}.xlsx`
  link.click()
  URL.revokeObjectURL(url)
}
