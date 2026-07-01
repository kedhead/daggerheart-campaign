import { createContext, useContext, useState, useEffect } from 'react';
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  sendPasswordResetEmail,
  updateProfile,
  signInWithPopup
} from 'firebase/auth';
import { auth, googleProvider } from '../config/firebase';

const AuthContext = createContext();

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

const AUTH_TIMEOUT_MS = 10000;

export function AuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [timedOut, setTimedOut] = useState(false);

  // Sign up with email and password
  async function signup(email, password, displayName) {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    if (displayName) {
      await updateProfile(userCredential.user, { displayName });
    }
    return userCredential;
  }

  // Sign in with email and password — normalize email to match signup behavior
  function login(email, password) {
    return signInWithEmailAndPassword(auth, (email || '').trim().toLowerCase(), password);
  }

  // Sign in with Google
  function signInWithGoogle() {
    return signInWithPopup(auth, googleProvider);
  }

  // Sign out
  function logout() {
    return signOut(auth);
  }

  // Reset password
  function resetPassword(email) {
    const normalizedEmail = (email || '').trim().toLowerCase();
    const actionCodeSettings = {
      // Send the user back to the app after they reset their password
      url: `${window.location.origin}/`,
      handleCodeInApp: false,
    };
    return sendPasswordResetEmail(auth, normalizedEmail, actionCodeSettings);
  }

  // Update user profile
  function updateUserProfile(updates) {
    return updateProfile(auth.currentUser, updates);
  }

  // Listen for auth state changes
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setCurrentUser(user);
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  // Safety net: if Firebase never resolves the initial auth state (flaky
  // network, blocked request, etc.), surface a retry option instead of
  // leaving the user stuck on the spinner forever.
  useEffect(() => {
    if (!loading) return;

    const timer = setTimeout(() => setTimedOut(true), AUTH_TIMEOUT_MS);
    return () => clearTimeout(timer);
  }, [loading]);

  const value = {
    currentUser,
    signup,
    login,
    signInWithGoogle,
    logout,
    resetPassword,
    updateUserProfile,
  };

  return (
    <AuthContext.Provider value={value}>
      {loading
        ? (
          <div className="loading-view">
            <div className="loading-spinner" />
            <p>Loading...</p>
            {timedOut && (
              <div style={{ marginTop: '1rem', textAlign: 'center' }}>
                <p>Taking longer than expected.</p>
                <button onClick={() => window.location.reload()}>Retry</button>
              </div>
            )}
          </div>
        )
        : children
      }
    </AuthContext.Provider>
  );
}
