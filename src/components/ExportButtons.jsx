import React from 'react'
import { exportToExcel, exportToCSV, exportToPDF } from '../lib/export'

export default function ExportButtons({ results }) {
  return (
    <div className="mt-6 flex space-x-4">
      <button
        onClick={() => exportToExcel(results)}
        className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
      >
        Export to Excel
      </button>
      
      <button
        onClick={() => exportToCSV(results)}
        className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
      >
        Export to CSV
      </button>
      
      <button
        onClick={() => exportToPDF(results)}
        className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-purple-600 hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500"
      >
        Export to PDF
      </button>
    </div>
  )
}
