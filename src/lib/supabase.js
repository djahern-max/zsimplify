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

// Initialize storage bucket
export const initializeStorage = async () => {
    const bucketName = 'documents'

    try {
        // First, check if bucket exists
        const { data: buckets } = await supabase
            .storage
            .listBuckets()

        const bucketExists = buckets?.some(b => b.name === bucketName)

        if (!bucketExists) {
            // Create the bucket if it doesn't exist
            const { data, error } = await supabase
                .storage
                .createBucket(bucketName, {
                    public: false,
                    fileSizeLimit: 52428800, // 50MB
                    allowedMimeTypes: [
                        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
                        'application/vnd.ms-excel',
                        'text/csv'
                    ]
                })

            if (error) throw error
        }

        // Verify we can access the bucket
        const { data, error } = await supabase
            .storage
            .from(bucketName)
            .list('')

        if (error) throw error

        console.log('Storage bucket initialized successfully')
        return { bucketName }
    } catch (error) {
        console.error('Storage initialization error:', error)
        throw error
    }
}

// Helper function to upload a file
export const uploadFile = async (file, path) => {
    try {
        const { data, error } = await supabase
            .storage
            .from('documents')
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