import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl) throw new Error('Missing VITE_SUPABASE_URL')
if (!supabaseKey) throw new Error('Missing VITE_SUPABASE_ANON_KEY')

export const supabase = createClient(supabaseUrl, supabaseKey, {
    auth: {
        persistSession: false
    }
})

// Initialize storage bucket
export const initializeStorage = async () => {
    const bucketName = 'documents'

    try {
        // First, try to create the bucket
        const { data: createData, error: createError } = await supabase
            .storage
            .createBucket(bucketName, {
                public: false,
                fileSizeLimit: 52428800, // 50MB
                allowedMimeTypes: ['application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', 'text/csv']
            })

        if (createError && createError.message !== 'Duplicate name') {
            console.error('Error creating bucket:', createError)
            throw createError
        }

        // Now the bucket should exist, let's try to list files to verify access
        const { data: listData, error: listError } = await supabase
            .storage
            .from(bucketName)
            .list()

        if (listError) {
            console.error('Error accessing bucket:', listError)
            throw listError
        }

        console.log('Storage bucket initialized successfully')
        return { bucketName }

    } catch (error) {
        console.error('Storage initialization error:', error)
        if (error.message?.includes('duplicate name')) {
            // Bucket already exists, this is fine
            return { bucketName }
        }
        throw new Error(`Failed to initialize storage: ${error.message}`)
    }
}

// Helper function to upload a file
export const uploadFile = async (bucketName, file, path) => {
    try {
        const { data, error } = await supabase
            .storage
            .from(bucketName)
            .upload(path, file, {
                cacheControl: '3600',
                upsert: false
            })

        if (error) throw error
        return data
    } catch (error) {
        console.error('Upload error:', error)
        throw error
    }
}