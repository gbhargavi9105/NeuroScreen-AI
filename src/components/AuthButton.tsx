import React, { useState, useEffect } from 'react';
import {
  GoogleAuthProvider,
  signInWithPopup,
  signOut,
  onAuthStateChanged,
  User,
} from 'firebase/auth';
import { auth } from '../firebase/config';
import { useAuth } from '../firebase/AuthContext';
import { LogOut, Cloud, ShieldCheck, Loader2 } from 'lucide-react';

interface AuthButtonProps {
  onRunDiagnostic?: () => void;
  isRunningDiagnostic?: boolean;
}

/**
 * AuthButton Component
 * Uses the 'firebase/auth' module to implement Google Sign-In.
 * Checks if the user is authenticated:
 * - If authenticated: displays their display name and avatar (using user.displayName and user.photoURL).
 * - If not authenticated: shows a 'Continue with Google' button that triggers signInWithPopup with GoogleAuthProvider.
 */
export const AuthButton: React.FC<AuthButtonProps> = ({
  onRunDiagnostic,
  isRunningDiagnostic = false,
}) => {
  const contextAuth = useAuth();
  const [currentUser, setCurrentUser] = useState<User | null>(auth.currentUser || contextAuth?.user || null);
  const [showDropdown, setShowDropdown] = useState(false);
  const [isSigningIn, setIsSigningIn] = useState(false);

  // Synchronize with Firebase Auth state directly via onAuthStateChanged
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setCurrentUser(user);
    });
    return () => unsubscribe();
  }, []);

  // Update if context changes
  useEffect(() => {
    if (contextAuth?.user !== undefined) {
      setCurrentUser(contextAuth.user);
    }
  }, [contextAuth?.user]);

  // Triggers Google Sign-In with GoogleAuthProvider via signInWithPopup
  const handleGoogleSignIn = async () => {
    setIsSigningIn(true);
    try {
      if (contextAuth?.signInWithGoogle) {
        await contextAuth.signInWithGoogle();
      } else {
        const provider = new GoogleAuthProvider();
        provider.setCustomParameters({ prompt: 'select_account' });
        await signInWithPopup(auth, provider);
      }
    } catch (error) {
      console.error('Google Sign-In failed:', error);
    } finally {
      setIsSigningIn(false);
    }
  };

  const handleSignOut = async () => {
    try {
      if (contextAuth?.signOutUser) {
        await contextAuth.signOutUser();
      } else {
        await signOut(auth);
      }
      setShowDropdown(false);
    } catch (error) {
      console.error('Sign-out error:', error);
    }
  };

  // Authenticated State: Displays user's name and avatar using user.displayName and user.photoURL
  if (currentUser) {
    const displayName = currentUser.displayName || currentUser.email?.split('@')[0] || 'Researcher';
    const photoURL = currentUser.photoURL;

    return (
      <div className="relative inline-block">
        <button
          onClick={() => setShowDropdown(!showDropdown)}
          className="flex items-center gap-2.5 bg-slate-900 hover:bg-slate-850 border border-slate-700/90 hover:border-cyan-500/60 px-2.5 py-1.5 rounded-lg text-xs text-slate-200 transition-colors shadow-sm"
          title="Account & Cloud Sync Active"
        >
          {photoURL ? (
            <img
              src={photoURL}
              alt={displayName}
              className="w-6 h-6 rounded-full border border-cyan-400/60 object-cover"
            />
          ) : (
            <div className="w-6 h-6 rounded-full bg-cyan-950 border border-cyan-700 text-cyan-300 flex items-center justify-center font-bold text-[11px]">
              {displayName[0].toUpperCase()}
            </div>
          )}
          <div className="hidden sm:flex flex-col text-left">
            <span className="font-semibold text-slate-100 max-w-[130px] truncate leading-tight">
              {displayName}
            </span>
            <span className="text-[10px] text-slate-400 font-mono max-w-[130px] truncate">
              {currentUser.email}
            </span>
          </div>
          <div className="flex items-center gap-1 pl-1">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" title="Cloud Firestore Connected" />
            <Cloud className="w-3.5 h-3.5 text-cyan-400" />
          </div>
        </button>

        {showDropdown && (
          <div className="absolute right-0 top-full mt-1.5 w-72 bg-slate-900 border border-slate-700 rounded-xl shadow-2xl p-3.5 z-50 text-xs">
            <div className="flex items-start gap-3 mb-3 pb-3 border-b border-slate-800">
              {photoURL ? (
                <img
                  src={photoURL}
                  alt={displayName}
                  className="w-9 h-9 rounded-full border border-cyan-500/60 object-cover mt-0.5"
                />
              ) : (
                <div className="w-9 h-9 rounded-full bg-cyan-950 border border-cyan-700 text-cyan-300 flex items-center justify-center font-bold text-sm mt-0.5">
                  {displayName[0].toUpperCase()}
                </div>
              )}
              <div className="overflow-hidden flex-1">
                <div className="font-bold text-slate-100 text-sm truncate">{displayName}</div>
                <div className="text-[11px] text-cyan-400 font-mono truncate">{currentUser.email}</div>
                <div className="text-[10px] text-slate-400 mt-0.5 font-mono">UID: {currentUser.uid.slice(0, 10)}...</div>
              </div>
            </div>

            <div className="text-[11px] text-emerald-400 flex items-center justify-between gap-1.5 mb-2.5 bg-emerald-950/40 border border-emerald-900/60 px-2.5 py-1.5 rounded-lg">
              <div className="flex items-center gap-1.5">
                <Cloud className="w-3.5 h-3.5 shrink-0" />
                <span>Cloud Firestore Synced</span>
              </div>
              <span className="text-[10px] uppercase font-mono text-emerald-300 bg-emerald-900/60 px-1.5 py-0.5 rounded">Active</span>
            </div>

            {onRunDiagnostic && (
              <button
                onClick={() => {
                  onRunDiagnostic();
                  setShowDropdown(false);
                }}
                disabled={isRunningDiagnostic}
                className="w-full text-left px-2.5 py-2 rounded-lg bg-slate-800/90 hover:bg-slate-750 text-cyan-300 flex items-center justify-between mb-2 transition-colors disabled:opacity-50"
              >
                <div className="flex items-center gap-2">
                  {isRunningDiagnostic ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin text-cyan-400" />
                  ) : (
                    <ShieldCheck className="w-3.5 h-3.5 text-cyan-400" />
                  )}
                  <span className="font-medium">{isRunningDiagnostic ? 'Verifying Rules...' : 'Run Rules Diagnostic'}</span>
                </div>
                <span className="text-[10px] text-slate-400 font-mono">Test Write</span>
              </button>
            )}

            <button
              onClick={handleSignOut}
              className="w-full text-left px-2.5 py-2 rounded-lg bg-slate-800 hover:bg-rose-950/40 hover:text-rose-300 text-slate-300 flex items-center gap-2 transition-colors"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span className="font-medium">Sign Out</span>
            </button>
          </div>
        )}
      </div>
    );
  }

  // Unauthenticated State: Displays 'Continue with Google'
  return (
    <button
      onClick={handleGoogleSignIn}
      disabled={isSigningIn}
      className="flex items-center gap-2 bg-slate-900 hover:bg-slate-850 text-slate-100 hover:text-white border border-slate-700 hover:border-cyan-400/80 px-3.5 py-1.5 rounded-lg text-xs font-medium shadow-sm transition-all group disabled:opacity-50"
      title="Sign in with Google to sync sessions and longitudinal data to Cloud Firestore"
    >
      {isSigningIn ? (
        <Loader2 className="w-3.5 h-3.5 animate-spin text-cyan-400" />
      ) : (
        <svg className="w-3.5 h-3.5 shrink-0" viewBox="0 0 24 24">
          <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
          <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
          <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
          <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
        </svg>
      )}
      <span className="whitespace-nowrap font-medium group-hover:text-cyan-200">Continue with Google</span>
    </button>
  );
};

export default AuthButton;
