import React, { useState } from 'react'
import { useFileSetup } from '../hooks/useFileSetup'

export default function SetupWizard({ onComplete }) {
    const { fileStructure, loading, error, analyzeFiles, setMatchingConfig } = useFileSetup()
    const [step, setStep] = useState(1)

    const handleFileUpload = async (e) => {
        e.preventDefault()
        const file1 = e.target.file1.files[0]
        const file2 = e.target.file2.files[0]
        await analyzeFiles(file1, file2)
        setStep(2)
    }

    const handleMatchingConfig = (config) => {
        setMatchingConfig(config)
        onComplete(config)
    }

    if (loading) return <div>Analyzing files...</div>
    if (error) return <div>Error: {error}</div>

    return (
        <div className="space-y-6">
            {step === 1 && (
                <div>
                    <h2 className="text-xl font-semibold mb-4">Upload Files</h2>
                    <form onSubmit={handleFileUpload} className="space-y-4">
                        <div>
                            <label className="block mb-2">First File</label>
                            <input type="file" name="file1" accept=".xlsx,.xls,.csv" className="block w-full" />
                        </div>
                        <div>
                            <label className="block mb-2">Second File</label>
                            <input type="file" name="file2" accept=".xlsx,.xls,.csv" className="block w-full" />
                        </div>
                        <button type="submit" className="bg-blue-500 text-white px-4 py-2 rounded">
                            Analyze Files
                        </button>
                    </form>
                </div>
            )}

            {step === 2 && fileStructure && (
                <div>
                    <h2 className="text-xl font-semibold mb-4">Configure Matching</h2>

                    {/* Show AI suggestions */}
                    <div className="mb-6 p-4 bg-gray-50 rounded">
                        <h3 className="font-medium mb-2">AI Suggestions</h3>
                        <div className="space-y-2">
                            <p>Suggested matching columns:</p>
                            <ul className="list-disc pl-5">
                                {fileStructure.suggestedMatching.matchingColumns.file1.map((col, i) => (
                                    <li key={i}>{col}</li>
                                ))}
                            </ul>
                        </div>
                    </div>

                    {/* Configuration form */}
                    <form onSubmit={(e) => {
                        e.preventDefault()
                        const config = {
                            // Get values from form
                            primaryMatch: e.target.primaryMatch.value,
                            secondaryMatch: e.target.secondaryMatch.value,
                            tolerance: parseFloat(e.target.tolerance.value),
                            dateFormat: e.target.dateFormat.value
                        }
                        handleMatchingConfig(config)
                    }} className="space-y-4">
                        {/* Add form fields based on AI suggestions */}
                        {fileStructure.suggestedMatching.questions.map((question, i) => (
                            <div key={i}>
                                <label className="block mb-2">{question}</label>
                                <input type="text" name={`q${i}`} className="block w-full border rounded px-3 py-2" />
                            </div>
                        ))}
                        <button type="submit" className="bg-green-500 text-white px-4 py-2 rounded">
                            Start Reconciliation
                        </button>
                    </form>
                </div>
            )}
        </div>
    )
}