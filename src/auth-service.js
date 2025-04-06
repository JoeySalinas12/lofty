// auth-service.js - Handle authentication with Supabase
const { supabase } = require('./client');

class AuthService {
  constructor() {
    this.currentUser = null;

    // Setup auth state change listener
    supabase.auth.onAuthStateChange((event, session) => {
      console.log(`Auth state changed: ${event}`);
      if (event === 'SIGNED_IN' && session) {
        this.currentUser = session.user;
      } else if (event === 'SIGNED_OUT') {
        this.currentUser = null;
      }
    });
  }

  /**
   * Initialize the auth service and check for existing session
   * @returns {Promise<object|null>} The current user or null
   */
  async initialize() {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        this.currentUser = session.user;
        return this.currentUser;
      }
      return null;
    } catch (error) {
      console.error('Error initializing auth:', error);
      return null;
    }
  }

  /**
   * Sign in with email and password
   * @param {string} email - User's email
   * @param {string} password - User's password
   * @returns {Promise<object>} Authentication result
   */
  async signInWithEmail(email, password) {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
      });

      if (error) throw error;
      this.currentUser = data.user;
      return { user: data.user };
    } catch (error) {
      console.error('Sign in error:', error);
      return { error: error.message || 'Failed to sign in' };
    }
  }

  /**
   * Sign up with email and password
   * @param {string} email - User's email
   * @param {string} password - User's password
   * @param {object} userData - Additional user data (name, etc.)
   * @returns {Promise<object>} Authentication result
   */
  async signUpWithEmail(email, password, userData = {}) {
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: userData // Store additional user metadata
        }
      });

      if (error) throw error;
      
      // If there's no error but also no user, it likely means the confirmation email was sent
      if (!data.user) {
        return { message: 'Please check your email for confirmation link' };
      }
      
      return { user: data.user, session: data.session };
    } catch (error) {
      console.error('Sign up error:', error);
      return { error: error.message || 'Failed to create account' };
    }
  }

  /**
   * Sign out the current user
   * @returns {Promise<object>} Sign out result
   */
  async signOut() {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      this.currentUser = null;
      return { success: true };
    } catch (error) {
      console.error('Sign out error:', error);
      return { error: error.message || 'Failed to sign out' };
    }
  }

  /**
   * Get the current user
   * @returns {object|null} The current user or null
   */
  getCurrentUser() {
    return this.currentUser;
  }

  /**
   * Check if user is authenticated
   * @returns {boolean} True if user is authenticated
   */
  isAuthenticated() {
    return !!this.currentUser;
  }
}

module.exports = new AuthService();