import { createClient } from '@supabase/supabase-js';

// Update user credentials (personal info, address, security pin, email)
export async function PATCH(request, { params }) {
  try {
    const resolvedParams = await params;
    const { userId } = resolvedParams;
    
    // Validate userId
    if (!userId || userId === 'undefined' || userId === 'null') {
      return Response.json(
        { error: 'Invalid user ID provided' },
        { status: 400 }
      );
    }

    // Validate UUID format
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(userId)) {
      return Response.json(
        { error: 'Invalid user ID format' },
        { status: 400 }
      );
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseServiceKey) {
      return Response.json(
        { error: 'Service role key not configured' },
        { status: 500 }
      );
    }

    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    });

    const body = await request.json();
    const { 
      email,
      full_name, 
      phone, 
      date_of_birth, 
      address, 
      city, 
      state, 
      zip_code, 
      country, 
      security_pin 
    } = body;

    // Validate email format if provided
    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return Response.json(
        { error: 'Invalid email format' },
        { status: 400 }
      );
    }

    // Validate phone format if provided (basic validation)
    if (phone && phone.trim() !== '' && !/^[\d\s\-\+\(\)]+$/.test(phone)) {
      return Response.json(
        { error: 'Invalid phone number format' },
        { status: 400 }
      );
    }

    // Validate date_of_birth format if provided
    if (date_of_birth && date_of_birth.trim() !== '') {
      const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
      if (!dateRegex.test(date_of_birth)) {
        return Response.json(
          { error: 'Invalid date format. Use YYYY-MM-DD' },
          { status: 400 }
        );
      }
    }

    // Validate security_pin if provided (should be 4 digits)
    if (security_pin !== undefined && security_pin !== null && security_pin !== '') {
      if (!/^\d{4}$/.test(security_pin)) {
        return Response.json(
          { error: 'Security PIN must be exactly 4 digits' },
          { status: 400 }
        );
      }
    }

    // Check if email already exists (if changing email)
    if (email) {
      const { data: authUser } = await supabaseAdmin.auth.admin.getUserById(userId);
      if (authUser?.user && authUser.user.email !== email) {
        // Check if new email is already in use
        const { data: existingUser } = await supabaseAdmin.auth.admin.listUsers();
        const emailExists = existingUser?.users?.some(u => u.email === email && u.id !== userId);
        
        if (emailExists) {
          return Response.json(
            { error: 'Email already in use by another user' },
            { status: 400 }
          );
        }
      }
    }

    // Update profile table
    const profileUpdateData = {};
    if (full_name !== undefined) profileUpdateData.full_name = full_name || null;
    if (phone !== undefined) profileUpdateData.phone = phone || null;
    if (date_of_birth !== undefined) {
      profileUpdateData.date_of_birth = date_of_birth && date_of_birth.trim() !== '' 
        ? date_of_birth 
        : null;
    }
    if (address !== undefined) profileUpdateData.address = address || null;
    if (city !== undefined) profileUpdateData.city = city || null;
    if (state !== undefined) profileUpdateData.state = state || null;
    if (zip_code !== undefined) profileUpdateData.zip_code = zip_code || null;
    if (country !== undefined) profileUpdateData.country = country || null;
    if (security_pin !== undefined) profileUpdateData.security_pin = security_pin || null;

    // Update profile if there's data to update
    if (Object.keys(profileUpdateData).length > 0) {
      const { error: profileError } = await supabaseAdmin
        .from('profiles')
        .update(profileUpdateData)
        .eq('id', userId);

      if (profileError) {
        console.error('Error updating profile:', profileError);
        return Response.json(
          { error: profileError.message || 'Failed to update profile' },
          { status: 500 }
        );
      }
    }

    // Update auth.users (email and user_metadata)
    const authUpdateData = {};
    if (email) {
      authUpdateData.email = email;
    }

    // Update user_metadata for consistency
    const { data: authUser } = await supabaseAdmin.auth.admin.getUserById(userId);
    if (authUser?.user) {
      const updatedMetadata = {
        ...authUser.user.user_metadata,
        ...(full_name !== undefined && { full_name: full_name || null }),
        ...(phone !== undefined && { phone: phone || null }),
        ...(date_of_birth !== undefined && { 
          date_of_birth: date_of_birth && date_of_birth.trim() !== '' ? date_of_birth : null 
        }),
        ...(address !== undefined && { address: address || null }),
        ...(city !== undefined && { city: city || null }),
        ...(state !== undefined && { state: state || null }),
        ...(zip_code !== undefined && { zip_code: zip_code || null }),
        ...(country !== undefined && { country: country || null }),
        ...(security_pin !== undefined && { security_pin: security_pin || null }),
      };

      authUpdateData.user_metadata = updatedMetadata;
    }

    // Update auth user if there's data to update
    if (Object.keys(authUpdateData).length > 0) {
      const { error: authError } = await supabaseAdmin.auth.admin.updateUserById(userId, authUpdateData);

      if (authError) {
        console.error('Error updating auth user:', authError);
        return Response.json(
          { error: authError.message || 'Failed to update user authentication data' },
          { status: 500 }
        );
      }
    }

    // Fetch updated profile data
    const { data: updatedProfile, error: fetchError } = await supabaseAdmin
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();

    if (fetchError) {
      console.error('Error fetching updated profile:', fetchError);
    }

    return Response.json({ 
      success: true, 
      data: updatedProfile,
      message: 'User credentials updated successfully' 
    });
  } catch (error) {
    console.error('Error in PATCH /api/admin/users/[userId]/credentials:', error);
    return Response.json(
      { error: error.message || 'Failed to update user credentials' },
      { status: 500 }
    );
  }
}

