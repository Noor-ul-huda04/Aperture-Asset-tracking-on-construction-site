import React, { createContext, useContext, useEffect, useState } from 'react';
import { User as FirebaseUser, onAuthStateChanged, signInWithPopup, GoogleAuthProvider, signOut as fbSignOut } from 'firebase/auth';
import { auth } from '../lib/firebase';

interface AuthContextType {
  user: FirebaseUser | null;
  authReady: boolean;
  signInWithGoogle: () => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  authReady: false,
  signInWithGoogle: async () => {},
  signOut: async () => {},
});

export const FirebaseAuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<FirebaseUser | null>(null);
  const [authReady, setAuthReady] = useState(false);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (u) => {
      setUser(u);
      setAuthReady(true);
    });
    return () => unsubscribe();
  }, []);

  const signInWithGoogle = async () => {
    try {
      const provider = new GoogleAuthProvider();
      provider.setCustomParameters({ prompt: 'select_account' });
      await signInWithPopup(auth, provider);
    } catch (err: any) {
      if (
        err?.code === 'auth/popup-closed-by-user' ||
        err?.code === 'auth/cancelled-popup-request'
      ) {
        // User voluntarily closed or cancelled the login popup
        console.log('Google sign-in popup was closed by the user.');
        return;
      }
      console.error('Google Sign In Error:', err);
    }
  };

  const signOut = async () => {
    try {
      await fbSignOut(auth);
    } catch (err) {
      console.error('Sign Out Error:', err);
    }
  };

  return (
    <AuthContext.Provider value={{ user, authReady, signInWithGoogle, signOut }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useFirebaseAuth = () => useContext(AuthContext);
