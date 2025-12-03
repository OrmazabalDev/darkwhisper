/**
 * Auth Service - Firebase Auth wrapper
 * Pure service with no React dependencies
 */

import { auth } from '../firebase';
import { signInAnonymously, User } from 'firebase/auth';
import { getStorageItem, setStorageItem } from '../utils/storage.utils';
import { generateAnonymousId, generateEphemeralId } from '../utils/validation.utils';

class AuthService {
  private static instance: AuthService;

  private constructor() {}

  static getInstance(): AuthService {
    if (!AuthService.instance) {
      AuthService.instance = new AuthService();
    }
    return AuthService.instance;
  }

  /**
   * Sign in anonymously to Firebase
   */
  async signInAnonymous(): Promise<User> {
    const userCredential = await signInAnonymously(auth);
    return userCredential.user;
  }

  /**
   * Get current Firebase user
   */
  getCurrentUser(): User | null {
    return auth.currentUser;
  }

  /**
   * Get or create ephemeral session ID
   */
  getSessionId(): string {
    let sessionId = getStorageItem('ephemeral_session_id');
    if (!sessionId) {
      sessionId = generateEphemeralId();
      setStorageItem('ephemeral_session_id', sessionId);
    }
    return sessionId;
  }

  /**
   * Get or generate user nickname
   */
  getUserNickname(): string {
    const stored = getStorageItem('chatNickname');
    if (stored) return stored.toLowerCase(); // Normalizar a minúsculas
    
    const sessionId = this.getSessionId();
    const generated = generateAnonymousId(sessionId).toLowerCase();
    setStorageItem('chatNickname', generated);
    return generated;
  }

  /**
   * Set user nickname
   */
  setUserNickname(nickname: string): void {
    const sessionId = this.getSessionId();
    const displayName = (nickname?.trim() || generateAnonymousId(sessionId)).toLowerCase(); // Normalizar a minúsculas
    setStorageItem('chatNickname', displayName);
  }

  /**
   * Subscribe to auth state changes
   */
  onAuthStateChanged(callback: (user: User | null) => void): () => void {
    return auth.onAuthStateChanged(callback);
  }
}

// Export singleton instance
export const authService = AuthService.getInstance();
