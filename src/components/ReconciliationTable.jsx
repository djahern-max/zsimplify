import React from 'react'

export default function ReconciliationTable({ results }) {
  if (!results?.length) return null

  return (
    <div className="mt-8">
      <h2 className="text-lg font-semibold mb-4">Reconciliation Results</h2>
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Receipt Details
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Statement Details
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Confidence
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {results.map((match, idx) => (
              <tr key={idx}>
                <td className="px-6 py-4 whitespace-nowrap">
                  <pre className="text-sm">{JSON.stringify(match.receipt, null, 2)}</pre>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <pre className="text-sm">{JSON.stringify(match.statement, null, 2)}</pre>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  {match.confidence}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
