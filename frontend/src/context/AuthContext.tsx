import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { 
  auth, 
  signInWithGoogle as firebaseSignInWithGoogle, 
  signInWithEmail as firebaseSignInWithEmail,
  signUpWithEmail as firebaseSignUpWithEmail,
  logout as firebaseLogout, 
  onIdTokenChanged,
  FirebaseUser 
} from '../services/firebase';

interface AuthContextType {
  currentUser: FirebaseUser | null;
  idToken: string | null;
  loading: boolean;
  error: string | null;
  signInWithEmail: (email: string, pass: string) => Promise<void>;
  signUpWithEmail: (email: string, pass: string, name?: string) => Promise<void>;
  signInWithGoogle: () => Promise<void>;
  signOut: () => Promise<void>;
  getFreshToken: () => Promise<string | null>;
  clearError: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<FirebaseUser | null>(null);
  const [idToken, setIdToken] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Listen to user and token changes, including automatic token refresh
  useEffect(() => {
    const unsubscribe = onIdTokenChanged(auth, async (user) => {
      setCurrentUser(user);
      if (user) {
        try {
          const token = await user.getIdToken();
          setIdToken(token);
        } catch {
          setIdToken(null);
        }
      } else {
        setIdToken(null);
      }
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  const getFreshToken = useCallback(async (): Promise<string | null> => {
    if (!auth.currentUser) return null;
    try {
      const token = await auth.currentUser.getIdToken(true);
      setIdToken(token);
      return token;
    } catch (err) {
      console.error('Error refreshing token:', err);
      return null;
    }
  }, []);

  const signInWithEmail = async (email: string, pass: string) => {
    try {
      setError(null);
      const res = await firebaseSignInWithEmail(email, pass);
      const token = await res.user.getIdToken();
      setIdToken(token);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Invalid email or password.';
      setError(formatAuthError(message));
      throw err;
    }
  };

  const signUpWithEmail = async (email: string, pass: string, name?: string) => {
    try {
      setError(null);
      const res = await firebaseSignUpWithEmail(email, pass, name);
      const token = await res.user.getIdToken();
      setIdToken(token);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to register student account.';
      setError(formatAuthError(message));
      throw err;
    }
  };

  const signInWithGoogle = async () => {
    try {
      setError(null);
      const res = await firebaseSignInWithGoogle();
      const token = await res.user.getIdToken();
      setIdToken(token);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to sign in with Google.';
      setError(formatAuthError(message));
      throw err;
    }
  };

  const signOut = async () => {
    try {
      setError(null);
      await firebaseLogout();
      setIdToken(null);
      setCurrentUser(null);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to sign out.';
      setError(message);
      throw err;
    }
  };

  const clearError = () => setError(null);

  return (
    <AuthContext.Provider
      value={{
        currentUser,
        idToken,
        loading,
        error,
        signInWithEmail,
        signUpWithEmail,
        signInWithGoogle,
        signOut,
        getFreshToken,
        clearError,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

// Formats Firebase error codes into clean user-friendly messages
function formatAuthError(msg: string): string {
  if (msg.includes('auth/invalid-credential') || msg.includes('auth/wrong-password') || msg.includes('auth/user-not-found')) {
    return 'Incorrect email or password. Please try again.';
  }
  if (msg.includes('auth/email-already-in-use')) {
    return 'An account with this email already exists. Please sign in instead.';
  }
  if (msg.includes('auth/weak-password')) {
    return 'Password should be at least 6 characters.';
  }
  if (msg.includes('auth/invalid-email')) {
    return 'Please enter a valid campus or student email address.';
  }
  return msg;
}
