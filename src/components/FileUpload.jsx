import React from 'react'
import { useReconciliation } from '../hooks/useReconciliation'

export default function FileUpload() {
  const { processFiles, loading, error } = useReconciliation()

  const handleSubmit = async (e) => {
    e.preventDefault()
    const screenshots = e.target.screenshots.files[0]
    const statement = e.target.statement.files[0]
    await processFiles(screenshots, statement)
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label htmlFor="screenshots" className="block text-sm font-medium text-gray-700">
          Screenshots Excel File
        </label>
        <input
          type="file"
          id="screenshots"
          name="screenshots"
          accept=".xlsx,.xls"
          className="mt-1 block w-full"
          required
        />
      </div>

      <div>
        <label htmlFor="statement" className="block text-sm font-medium text-gray-700">
          Credit Card Statement CSV
        </label>
        <input
          type="file"
          id="statement"
          name="statement"
          accept=".csv"
          className="mt-1 block w-full"
          required
        />
      </div>

      <button
        type="submit"
        disabled={loading}
        className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
      >
        {loading ? 'Processing...' : 'Reconcile Files'}
      </button>

      {error && (
        <div className="text-red-600 text-sm mt-2">
          Error: {error}
        </div>
      )}
    </form>
  )
}
