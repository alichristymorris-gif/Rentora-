import { supabase } from '../lib/supabase';
import { AppUser, UserRole } from '../types';

export const authService = {
  async register(email: string, password: string, additionalData: { displayName: string; role: UserRole }) {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          displayName: additionalData.displayName,
          role: additionalData.role,
        }
      }
    });
    if (error) throw error;
    return data;
  },

  async login(email: string, password: string) {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    if (error) throw error;
    return data;
  },

  async loginWithGoogle() {
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
    });
    if (error) throw error;
    return data;
  },

  async logout() {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
  },

  async getCurrentUser(): Promise<AppUser | null> {
    const { data: { user }, error } = await supabase.auth.getUser();
    if (error || !user) return null;
    
    return {
      uid: user.id,
      email: user.email || '',
      displayName: user.user_metadata?.displayName || user.user_metadata?.full_name || 'User',
      photoURL: user.user_metadata?.avatar_url || user.user_metadata?.photoURL || '',
      role: user.email === '1286muhammadali@gmail.com' ? 'admin' : (user.user_metadata?.role as UserRole) || 'renter',
      createdAt: new Date(user.created_at).getTime(),
      emailVerified: !!user.email_confirmed_at,
    };
  },

  onAuthStateChange(callback: (user: AppUser | null) => void) {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
      if (session?.user) {
        const u = session.user;
        callback({
          uid: u.id,
          email: u.email || '',
          displayName: u.user_metadata?.displayName || u.user_metadata?.full_name || 'User',
          photoURL: u.user_metadata?.avatar_url || u.user_metadata?.photoURL || '',
          role: u.email === '1286muhammadali@gmail.com' ? 'admin' : (u.user_metadata?.role as UserRole) || 'renter',
          createdAt: new Date(u.created_at).getTime(),
          emailVerified: !!u.email_confirmed_at,
        });
      } else {
        callback(null);
      }
    });

    return () => subscription.unsubscribe();
  }
};
