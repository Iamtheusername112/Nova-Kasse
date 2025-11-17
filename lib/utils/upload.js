import { supabase } from "@/lib/supabase/client";

/**
 * Upload a file to Supabase Storage
 * @param {File} file - The file to upload
 * @param {string} bucket - The storage bucket name
 * @param {string} path - The path where the file should be stored
 * @returns {Promise<{success: boolean, url?: string, error?: string}>}
 */
export async function uploadFile(file, bucket, path) {
  try {
    // Check if we have an active session
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      console.error("No active session for file upload");
      return { success: false, error: "Authentication required. Please sign in first." };
    }

    console.log("Uploading file:", { bucket, path, fileName: file.name, fileSize: file.size });

    // First, verify the bucket exists
    const { data: buckets, error: listError } = await supabase.storage.listBuckets();
    if (listError) {
      console.error("Failed to list buckets:", listError);
    } else {
      const bucketExists = buckets?.some(b => b.name === bucket);
      if (!bucketExists) {
        console.error(`Bucket '${bucket}' does not exist. Available buckets:`, buckets?.map(b => b.name) || []);
        return { 
          success: false, 
          error: `Storage bucket '${bucket}' does not exist. Please create it in Supabase Dashboard → Storage → New Bucket.` 
        };
      }
      console.log(`✓ Bucket '${bucket}' exists`);
    }

    // Upload file to Supabase Storage
    const { data, error } = await supabase.storage
      .from(bucket)
      .upload(path, file, {
        cacheControl: '3600',
        upsert: false
      });

    if (error) {
      console.error("Upload error:", error);
      console.error("Error details:", {
        message: error.message,
        statusCode: error.statusCode,
        error: error.error,
        name: error.name
      });
      
      // Provide helpful error messages
      if (error.message?.includes('row-level security') || error.message?.includes('policy') || error.message?.includes('RLS')) {
        return { 
          success: false, 
          error: "Storage policies not configured. Please run storage-policies.sql in Supabase SQL Editor." 
        };
      }
      
      if (error.message?.includes('not found') || error.message?.includes('Object not found')) {
        return { 
          success: false, 
          error: `Bucket '${bucket}' not found. Please create it in Supabase Dashboard → Storage → New Bucket with name '${bucket}'.` 
        };
      }
      
      if (error.message?.includes('new row violates row-level security') || error.statusCode === 403) {
        return { 
          success: false, 
          error: "Permission denied. Check storage policies - run storage-policies.sql in Supabase SQL Editor." 
        };
      }
      
      return { success: false, error: error.message || "Failed to upload file" };
    }

    // For private buckets, we store the path and can generate signed URLs when needed
    // For now, return the path - we'll generate signed URLs when displaying documents
    return { 
      success: true, 
      path: data.path,
      // Store the full path for reference
      fullPath: `${bucket}/${data.path}`
    };
  } catch (error) {
    console.error("Upload exception:", error);
    return { success: false, error: error.message || "Failed to upload file" };
  }
}

/**
 * Upload multiple files
 * @param {File[]} files - Array of files to upload
 * @param {string} bucket - The storage bucket name
 * @param {string} basePath - Base path for files (e.g., 'documents/user-id/')
 * @returns {Promise<{success: boolean, urls?: string[], errors?: string[]}>}
 */
export async function uploadFiles(files, bucket, basePath) {
  const results = await Promise.all(
    files.map((file, index) => 
      uploadFile(file, bucket, `${basePath}${file.name}`)
    )
  );

  const successful = results.filter(r => r.success);
  const failed = results.filter(r => !r.success);

  if (failed.length > 0) {
    return {
      success: false,
      urls: successful.map(r => r.url),
      errors: failed.map(r => r.error)
    };
  }

  return {
    success: true,
    urls: results.map(r => r.url),
    paths: results.map(r => r.path)
  };
}

