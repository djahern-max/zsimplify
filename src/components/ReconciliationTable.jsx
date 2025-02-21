import React from 'react'

export default function ReconciliationTable({ results }) {
  if (!results) return null

  const totalTransactions = results.totalTransactions
  const matchedCount = results.matches.length
  const unmatchedCount = results.unmatched.length

  return (
    <div className="mt-6">
      <h2 className="text-xl font-semibold mb-4">Reconciliation Results</h2>

      {/* Summary */}
      <div className="mb-4 p-4 bg-gray-50 rounded">
        <p>Total Credit Card Transactions: {totalTransactions}</p>
        <p>Matched: {matchedCount}</p>
        <p>Unmatched: {unmatchedCount}</p>
      </div>

      {/* Unmatched Transactions */}
      {unmatchedCount > 0 && (
        <div className="mb-8">
          <h3 className="font-medium mb-2">Unmatched Credit Card Transactions</h3>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead>
                <tr>
                  <th className="px-6 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase">Name</th>
                  <th className="px-6 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase">Amount</th>
                  <th className="px-6 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase">Last 4</th>
                  <th className="px-6 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase">Description</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {results.unmatched.map((item, index) => (
                  <tr key={index} className="bg-red-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      {item.Name}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      ${parseFloat(item.Amount).toFixed(2)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      {item[' Remark ']}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      {item.Description}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}