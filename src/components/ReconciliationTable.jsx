import React from 'react'

export default function ReconciliationTable({ results }) {
  if (!results?.matches) return null

  return (
    <div className="mt-6">
      <h2 className="text-xl font-semibold mb-4">Results</h2>
      
      {/* Matches */}
      {results.matches.length > 0 && (
        <div className="mt-6">
          <h3 className="font-medium mb-2">Matched Items ({results.matches.length})</h3>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead>
                <tr>
                  <th className="px-6 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase">Amount</th>
                  <th className="px-6 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase">Remark</th>
                  <th className="px-6 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase">Description</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {results.matches.map((match, index) => (
                  <tr key={index}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">${match.creditCard.Amount}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">{match.creditCard[' Remark ']}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">{match.creditCard.Description}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Unmatched */}
      {(results.unmatched.screenshots.length > 0 || results.unmatched.creditCard.length > 0) && (
        <div className="mt-6">
          <h3 className="font-medium mb-2">Unmatched Items</h3>
          <p>Screenshots: {results.unmatched.screenshots.length}</p>
          <p>Credit Card: {results.unmatched.creditCard.length}</p>
        </div>
      )}
    </div>
  )
}
