import React from 'react'

export default function FileUpload({ onSubmit }) {
  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <div>
        <label className="block mb-2">Screenshots Excel File</label>
        <input
          type="file"
          name="screenshots"
          accept=".xlsx,.xls"
          className="block w-full"
        />
      </div>

      <div>
        <label className="block mb-2">Credit Card Statement File</label>
        <input
          type="file"
          name="creditCard"
          accept=".xlsx,.xls"
          className="block w-full"
        />
      </div>

      <button
        type="submit"
        className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
      >
        Reconcile Files
      </button>
    </form>
  )
}
