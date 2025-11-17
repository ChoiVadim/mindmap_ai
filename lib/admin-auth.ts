import { createClient } from '@/lib/supabase/server';

/**
 * Check if a user is an admin
 * Uses ADMIN_EMAILS environment variable (comma-separated list of admin emails)
 * Or checks admin_users table in Supabase if it exists
 */
export async function isAdmin(userId: string, userEmail?: string): Promise<boolean> {
  // First check: Environment variable ADMIN_EMAILS
  const adminEmails = process.env.ADMIN_EMAILS?.split(',').map(email => email.trim().toLowerCase()) || [];
  
  if (userEmail && adminEmails.includes(userEmail.toLowerCase())) {
    return true;
  }

  // Second check: admin_users table in Supabase (if it exists)
  try {
    const supabase = await createClient();
    
    // Check if admin_users table exists by trying to query it
    const { data, error } = await supabase
      .from('admin_users')
      .select('user_id')
      .eq('user_id', userId)
      .single();

    // If table doesn't exist, error will be thrown, but we'll catch it
    if (!error && data) {
      return true;
    }
  } catch (error) {
    // Table might not exist yet, that's okay
    // Fall through to return false
  }

  return false;
}

/**
 * Get admin status for a user (server-side)
 */
export async function getAdminStatus(userId: string, userEmail?: string): Promise<{ isAdmin: boolean; method: string }> {
  const adminEmails = process.env.ADMIN_EMAILS?.split(',').map(email => email.trim().toLowerCase()) || [];
  
  if (userEmail && adminEmails.includes(userEmail.toLowerCase())) {
    return { isAdmin: true, method: 'env' };
  }

  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from('admin_users')
      .select('user_id')
      .eq('user_id', userId)
      .single();

    if (!error && data) {
      return { isAdmin: true, method: 'database' };
    }
  } catch (error) {
    // Table might not exist
  }

  return { isAdmin: false, method: 'none' };
}

