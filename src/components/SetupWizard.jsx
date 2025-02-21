import React, { useState } from 'react'
import { useFileSetup } from '../hooks/useFileSetup'

export default function SetupWizard({ onComplete }) {
    const { fileStructure, loading, error, analyzeFiles } = useFileSetup()
    const [answers, setAnswers] = useState({})
    const [step, setStep] = useState(1)

    const handleFileUpload = async (e) => {
        e.preventDefault()
        const file1 = e.target.file1.files[0]
        const file2 = e.target.file2.files[0]
        await analyzeFiles(file1, file2)
        setStep(2)
    }

    const handleAnswer = (questionId, answer) => {
        setAnswers(prev => ({
            ...prev,
            [questionId]: answer
        }))
    }

    const handleComplete = () => {
        const config = {
            matchingFields: [],
            secondaryMatches: []
        }

        // Build configuration based on user answers
        if (answers.primary_match === 'Yes') {
            config.matchingFields.push({
                file1: fileStructure.suggestedMatching.possibleMatches[0].file1Field,
                file2: fileStructure.suggestedMatching.possibleMatches[0].file2Field
            })
        }

        if (answers.secondary_match === 'Yes') {
            config.secondaryMatches.push({
                file1: fileStructure.suggestedMatching.possibleMatches[1].file1Field,
                file2: fileStructure.suggestedMatching.possibleMatches[1].file2Field
            })
        }

        onComplete(config)
    }

    if (loading) return <div>Analyzing your files...</div>
    if (error) return <div>Error: {error}</div>

    return (
        <div className="space-y-6">
            {step === 1 && (
                <div>
                    <h2 className="text-xl font-semibold mb-4">Upload Your Files</h2>
                    <form onSubmit={handleFileUpload} className="space-y-4">
                        <div>
                            <label className="block mb-2">First File</label>
                            <input
                                type="file"
                                name="file1"
                                accept=".xlsx,.xls,.csv"
                                className="block w-full"
                            />
                        </div>
                        <div>
                            <label className="block mb-2">Second File</label>
                            <input
                                type="file"
                                name="file2"
                                accept=".xlsx,.xls,.csv"
                                className="block w-full"
                            />
                        </div>
                        <button
                            type="submit"
                            className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
                        >
                            Analyze Files
                        </button>
                    </form>
                </div>
            )}

            {step === 2 && fileStructure && (
                <div>
                    <h2 className="text-xl font-semibold mb-4">Configure Matching</h2>

                    {/* AI Analysis */}
                    <div className="mb-6 p-4 bg-gray-50 rounded">
                        <h3 className="font-medium mb-2">AI Suggestions</h3>
                        <div className="space-y-4">
                            {fileStructure.suggestedMatching.possibleMatches.map((match, i) => (
                                <div key={i} className="border-l-4 border-blue-500 pl-3">
                                    <p className="font-medium">
                                        {match.file1Field} ↔ {match.file2Field}
                                    </p>
                                    <p className="text-sm text-gray-600">{match.reason}</p>
                                    <p className="text-sm text-gray-500">
                                        Confidence: {match.confidence}
                                    </p>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Questions */}
                    <div className="space-y-4">
                        {fileStructure.suggestedMatching.questions.map((q) => (
                            <div key={q.id} className="border p-4 rounded">
                                <p className="mb-2">{q.text}</p>
                                <div className="space-x-4">
                                    {q.options.map((option) => (
                                        <button
                                            key={option}
                                            onClick={() => handleAnswer(q.id, option)}
                                            className={`px-3 py-1 rounded ${answers[q.id] === option
                                                    ? 'bg-blue-500 text-white'
                                                    : 'bg-gray-200'
                                                }`}
                                        >
                                            {option}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        ))}
                    </div>

                    <button
                        onClick={handleComplete}
                        className="mt-6 bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600"
                    >
                        Start Reconciliation
                    </button>
                </div>
            )}
        </div>
    )
}