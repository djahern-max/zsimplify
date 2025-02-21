// App.jsx
import React, { useEffect, useState } from 'react'
import FileUpload from './components/FileUpload'
import ReconciliationTable from './components/ReconciliationTable'
import ExportButtons from './components/ExportButtons'
import { useReconciliation } from './hooks/useReconciliation'
import { supabase } from './lib/supabase'

export default function App() {
    const { results, error, loading, handleFileUpload } = useReconciliation()
    const [user, setUser] = useState(null)
    const [authLoading, setAuthLoading] = useState(true)

    useEffect(() => {
        // Check for existing session
        supabase.auth.getSession().then(({ data: { session } }) => {
            setUser(session?.user ?? null)
            setAuthLoading(false)
        })

        // Set up auth state listener
        const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
            setUser(session?.user ?? null)
        })

        return () => subscription.unsubscribe()
    }, [])

    if (authLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <p>Loading...</p>
            </div>
        )
    }

    if (!user) {
        return <Auth onSignIn={setUser} />
    }

    return (
        <div className="min-h-screen bg-gray-100 py-6 flex flex-col justify-center sm:py-12">
            <div className="relative py-3 sm:max-w-xl sm:mx-auto">
                <div className="relative px-4 py-10 bg-white shadow-lg sm:rounded-3xl sm:p-20">
                    <div className="max-w-md mx-auto">
                        <div className="divide-y divide-gray-200">
                            <div className="py-8 text-base leading-6 space-y-4 text-gray-700 sm:text-lg sm:leading-7">
                                <div className="flex justify-between items-center mb-8">
                                    <h1 className="text-2xl font-bold">zSimplify</h1>
                                    <button
                                        onClick={() => supabase.auth.signOut()}
                                        className="text-sm text-gray-500 hover:text-gray-700"
                                    >
                                        Sign Out
                                    </button>
                                </div>

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