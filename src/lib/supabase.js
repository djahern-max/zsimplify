// lib/supabase.js
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl) throw new Error('Missing VITE_SUPABASE_URL')
if (!supabaseKey) throw new Error('Missing VITE_SUPABASE_ANON_KEY')

export const supabase = createClient(supabaseUrl, supabaseKey, {
    auth: {
        persistSession: false // Since this is just for file uploads
    }
})

// Helper function to upload a file
export const uploadFile = async (file, path) => {
    try {
        const { data, error } = await supabase
            .storage
            .from('Test_Reconciliation_Data') // Changed to your bucket name
            .upload(path, file, {
                cacheControl: '3600',
                upsert: true // Allow overwriting
            })

        if (error) throw error
        return data
    } catch (error) {
        console.error('Upload error:', error)
        throw error
    }
}