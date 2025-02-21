// App.jsx
import React, { useEffect } from 'react'
import FileUpload from './components/FileUpload'
import ReconciliationTable from './components/ReconciliationTable'
import ExportButtons from './components/ExportButtons'
import { useReconciliation } from './hooks/useReconciliation'
import { initializeStorage } from './lib/supabase'

export default function App() {
  const { results, error, loading, handleFileUpload } = useReconciliation()

  useEffect(() => {
    // Initialize storage bucket when app loads
    initializeStorage().catch(console.error)
  }, [])

  return (
    <div className="min-h-screen bg-gray-100 py-6 flex flex-col justify-center sm:py-12">
      <div className="relative py-3 sm:max-w-xl sm:mx-auto">
        <div className="relative px-4 py-10 bg-white shadow-lg sm:rounded-3xl sm:p-20">
          <div className="max-w-md mx-auto">
            <div className="divide-y divide-gray-200">
              <div className="py-8 text-base leading-6 space-y-4 text-gray-700 sm:text-lg sm:leading-7">
                <h1 className="text-2xl font-bold mb-8">zSimplify</h1>
                <FileUpload onSubmit={handleFileUpload} />

                {loading && (
                  <div className="text-center py-4">
                    <p>Processing...</p>
                  </div>
                )}

                {error && (
                  <div className="text-red-500 py-4">
                    <p>{error}</p>
                  </div>
                )}

                <ReconciliationTable results={results} />
                {results && <ExportButtons results={results} />}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}