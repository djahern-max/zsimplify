import { useState } from 'react'
import * as XLSX from 'xlsx'

export function useFileSetup() {
    const [fileStructure, setFileStructure] = useState(null)
    const [matchingConfig, setMatchingConfig] = useState(null)
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState(null)

    const analyzeFiles = async (file1, file2) => {
        try {
            setLoading(true)
            const [data1, data2] = await Promise.all([
                readExcelFile(file1),
                readExcelFile(file2)
            ])

            // Get column headers from both files
            const headers1 = Object.keys(data1[0])
            const headers2 = Object.keys(data2[0])

            // Sample data
            const sample1 = data1.slice(0, 3)
            const sample2 = data2.slice(0, 3)

            // Ask OpenAI to analyze the structure
            const response = await fetch('/api/analyze-structure', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    file1: {
                        name: file1.name,
                        headers: headers1,
                        sample: sample1
                    },
                    file2: {
                        name: file2.name,
                        headers: headers2,
                        sample: sample2
                    }
                })
            })

            const analysis = await response.json()

            // Store the analysis result
            setFileStructure({
                file1: { headers: headers1, sample: sample1 },
                file2: { headers: headers2, sample: sample2 },
                suggestedMatching: analysis.suggestions
            })

        } catch (err) {
            setError(err.message)
        } finally {
            setLoading(false)
        }
    }

    const readExcelFile = (file) => {
        return new Promise((resolve, reject) => {
            const reader = new FileReader()
            reader.onload = (e) => {
                try {
                    const data = new Uint8Array(e.target.result)
                    const workbook = XLSX.read(data, { type: 'array' })
                    const firstSheet = workbook.Sheets[workbook.SheetNames[0]]
                    resolve(XLSX.utils.sheet_to_json(firstSheet))
                } catch (err) {
                    reject(new Error('Error reading file: ' + err.message))
                }
            }
            reader.onerror = () => reject(new Error('Error reading file'))
            reader.readAsArrayBuffer(file)
        })
    }

    return {
        fileStructure,
        matchingConfig,
        loading,
        error,
        analyzeFiles,
        setMatchingConfig
    }
}