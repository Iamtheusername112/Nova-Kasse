import { supabase } from "@/lib/supabase/client";

/**
 * Generate a signed URL for a private storage file
 * @param {string} bucket - The storage bucket name
 * @param {string} path - The path to the file in storage
 * @param {number} expiresIn - Expiration time in seconds (default: 3600 = 1 hour)
 * @returns {Promise<{success: boolean, url?: string, error?: string}>}
 */
export async function getSignedUrl(bucket, path, expiresIn = 3600) {
  try {
    if (!path) {
      return { success: false, error: "No file path provided" };
    }

    const { data, error } = await supabase.storage
      .from(bucket)
      .createSignedUrl(path, expiresIn);

    if (error) {
      console.error("Error generating signed URL:", error);
      return { success: false, error: error.message || "Failed to generate URL" };
    }

    return { success: true, url: data.signedUrl };
  } catch (error) {
    console.error("Exception generating signed URL:", error);
    return { success: false, error: error.message || "Failed to generate URL" };
  }
}

/**
 * Get multiple signed URLs at once
 * @param {string} bucket - The storage bucket name
 * @param {string[]} paths - Array of file paths
 * @param {number} expiresIn - Expiration time in seconds
 * @returns {Promise<{success: boolean, urls?: {path: string, url: string}[], errors?: string[]}>}
 */
export async function getSignedUrls(bucket, paths, expiresIn = 3600) {
  const results = await Promise.all(
    paths.map(async (path) => {
      const result = await getSignedUrl(bucket, path, expiresIn);
      return { path, ...result };
    })
  );

  const successful = results.filter(r => r.success);
  const failed = results.filter(r => !r.success);

  if (failed.length > 0) {
    return {
      success: false,
      urls: successful.map(r => ({ path: r.path, url: r.url })),
      errors: failed.map(r => r.error)
    };
  }

  return {
    success: true,
    urls: results.map(r => ({ path: r.path, url: r.url }))
  };
}

