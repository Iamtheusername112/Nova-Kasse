/**
 * Admin utility functions
 */

/**
 * Check if a user is an admin
 * @param {Object} user - The user object from Supabase auth
 * @returns {boolean} - True if user is admin, false otherwise
 */
export const isAdmin = (user) => {
  if (!user) return false;
  
  // Check if user has admin role in metadata
  if (user.user_metadata?.role === 'admin') {
    return true;
  }
  
  // Check if user email is admin email
  if (user.email === 'admin@novakasse.com') {
    return true;
  }
  
  return false;
};

/**
 * Get admin email
 */
export const ADMIN_EMAIL = 'admin@novakasse.com';

