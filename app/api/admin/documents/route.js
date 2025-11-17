import { createClient } from '@supabase/supabase-js';

// Admin API route to get signed URLs for user documents
// Uses service role key to bypass RLS

export async function POST(request) {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !supabaseServiceKey) {
      return Response.json(
        { error: 'Service role key not configured' },
        { status: 500 }
      );
    }

    const { paths } = await request.json();

    if (!paths || !Array.isArray(paths)) {
      return Response.json(
        { error: 'Invalid request. Expected array of paths.' },
        { status: 400 }
      );
    }

    // Create admin client with service role key
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    });

    // Generate signed URLs for all paths
    const urlPromises = paths.map(async (path) => {
      if (!path) return { path, success: false, error: 'No path provided' };
      
      try {
        const { data, error } = await supabaseAdmin.storage
          .from('user-documents')
          .createSignedUrl(path, 3600); // 1 hour expiry

        if (error) {
          return { path, success: false, error: error.message };
        }

        return { path, success: true, url: data.signedUrl };
      } catch (err) {
        return { path, success: false, error: err.message };
      }
    });

    const results = await Promise.all(urlPromises);

    return Response.json({ results });
  } catch (error) {
    console.error('Error in POST /api/admin/documents:', error);
    return Response.json(
      { error: error.message || 'Failed to generate signed URLs' },
      { status: 500 }
    );
  }
}

