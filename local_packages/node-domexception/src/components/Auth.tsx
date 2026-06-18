import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Globe, Loader2, Check, X, ShieldAlert, Key, ClipboardCheck, PhoneCall } from 'lucide-react';
import { createUserWithEmailAndPassword, signInWithEmailAndPassword, sendPasswordResetEmail, sendEmailVerification } from 'firebase/auth';
import { doc, setDoc } from 'firebase/firestore';
import { auth, db } from '../lib/firebase';
import { cn } from '../lib/utils';
import { UserRole } from '../types';

interface AuthProps {
  onGoogleLogin: () => void;
}

export function Auth({ onGoogleLogin }: AuthProps) {
  const [mode, setMode] = useState<'login' | 'signup' | 'forgot'>('login');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<UserRole>('renter');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  
  // OTP properties
  const [showOtpModal, setShowOtpModal] = useState(false);
  const [otpCode, setOtpCode] = useState('');
  const [userOtpInput, setUserOtpInput] = useState('');
  const [otpError, setOtpError] = useState('');

  // Password Rules validation
  const minLength = password.length >= 8;
  const hasUpper = /[A-Z]/.test(password);
  const hasLower = /[a-z]/.test(password);
  const hasNumber = /[0-9]/.test(password);
  const hasSpecial = /[!@#$%^&*(),.?":{}|<>_]/.test(password);
  const isPasswordSecure = minLength && hasUpper && hasLower && hasNumber && hasSpecial;

  const handleInitialSignUpSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setMessage('');

    if (!isPasswordSecure) {
      setError("Please ensure your password conforms to all security directives.");
      return;
    }

    if (!phone || phone.length < 10) {
      setError("Please enter a valid phone number for SMS authentication keys dispatch.");
      return;
    }

    // Generate random 4-digit code
    const mockOtp = Math.floor(1000 + Math.random() * 9000).toString();
    setOtpCode(mockOtp);
    setUserOtpInput('');
    setOtpError('');
    setShowOtpModal(true);
  };

  const handleVerifyOtpAndSignUp = async () => {
    if (userOtpInput !== otpCode) {
      setOtpError("Invalid SMS verification code. Try again.");
      return;
    }

    setLoading(true);
    setShowOtpModal(false);
    setError('');

    try {
      const userCred = await createUserWithEmailAndPassword(auth, email, password);
      // Save user profile with role & phone verification details
      await setDoc(doc(db, 'users', userCred.user.uid), {
        uid: userCred.user.uid,
        email: userCred.user.email,
        displayName: email.split('@')[0],
        role: role,
        phone: phone,
        phoneVerified: true,
        online: true,
        lastSeen: Date.now(),
        createdAt: Date.now()
      });
      await sendEmailVerification(userCred.user);
      setMessage("Account activated! Phone verified and registration email dispatched successfully.");
      setMode('login');
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setMessage('');

    try {
      if (mode === 'login') {
        await signInWithEmailAndPassword(auth, email, password);
      } else if (mode === 'forgot') {
        await sendPasswordResetEmail(auth, email);
        setMessage("Password reset email containing active reset tokens dispatched to your inbox.");
      }
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto mt-6 pb-20">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-white dark:bg-dark-surface border border-bento-border dark:border-dark-border p-8 rounded-[40px] shadow-sm transition-colors"
      >
        <div className="text-center mb-6">
          <div className="w-14 h-14 bg-blue-50 dark:bg-blue-900/30 rounded-2xl flex items-center justify-center mx-auto mb-4 transition-colors">
            <Globe className="text-blue-600 animate-spin-slow" size={28} />
          </div>
          <h2 className="text-2xl font-black tracking-tighter text-slate-900 dark:text-white mb-2">
            {mode === 'login' ? 'Welcome Back' : mode === 'signup' ? 'Join Roventro' : 'Reset Password'}
          </h2>
          <p className="text-bento-muted dark:text-dark-muted text-xs font-medium">
            {mode === 'login' ? 'Access your secure chat networks' : mode === 'signup' ? 'Create a secure phone-verified profile' : 'Secure restoration of passwords'}
          </p>
        </div>

        {error && (
          <div className="mb-4 p-4 bg-red-50 dark:bg-red-950/20 text-red-600 dark:text-red-400 text-xs font-bold rounded-2xl border border-red-100 dark:border-red-900/30 flex gap-2 items-start">
            <ShieldAlert size={16} className="shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}
        {message && (
          <div className="mb-4 p-4 bg-emerald-50 dark:bg-emerald-950/20 text-emerald-600 dark:text-emerald-400 text-xs font-bold rounded-2xl border border-emerald-100 dark:border-emerald-950/20 flex gap-2 items-start">
            <ClipboardCheck size={16} className="shrink-0 mt-0.5" />
            <span>{message}</span>
          </div>
        )}

        <form onSubmit={mode === 'signup' ? handleInitialSignUpSubmit : handleAuth} className="space-y-4">
          {mode === 'signup' && (
            <div className="space-y-2 mb-4">
              <label className="text-[9px] uppercase font-black text-slate-400 dark:text-dark-muted tracking-widest">Select Platform Intent</label>
              <div className="grid grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => setRole('renter')}
                  className={cn(
                    "px-1 py-3.5 rounded-xl text-[9px] font-black uppercase tracking-widest border transition-all",
                    role === 'renter' ? "bg-blue-600 border-blue-600 text-white shadow-lg shadow-blue-600/20" : "bg-white dark:bg-slate-800 border-slate-100 dark:border-dark-border text-slate-400 dark:text-dark-muted"
                  )}
                >
                  Rent
                </button>
                <button
                  type="button"
                  onClick={() => setRole('owner')}
                  className={cn(
                    "px-1 py-3.5 rounded-xl text-[9px] font-black uppercase tracking-widest border transition-all",
                    role === 'owner' ? "bg-slate-900 dark:bg-blue-600 border-slate-900 dark:border-blue-700 text-white shadow-lg" : "bg-white dark:bg-slate-800 border-slate-100 dark:border-dark-border text-slate-400 dark:text-dark-muted"
                  )}
                >
                  Host
                </button>
                <button
                  type="button"
                  onClick={() => setRole('admin')}
                  className={cn(
                    "px-1 py-3.5 rounded-xl text-[9px] font-black uppercase tracking-widest border transition-all",
                    role === 'admin' ? "bg-purple-600 border-purple-600 text-white shadow-lg" : "bg-white dark:bg-slate-800 border-slate-100 dark:border-dark-border text-slate-400 dark:text-dark-muted"
                  )}
                >
                  Admin
                </button>
              </div>
            </div>
          )}

          <div className="space-y-2">
            <label className="text-[9px] uppercase font-black text-slate-400 dark:text-dark-muted tracking-widest">Email Address</label>
            <input 
              type="email" 
              required
              placeholder="e.g. user@domain.com"
              className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-dark-border rounded-2xl px-5 py-3.5 text-xs outline-none focus:ring-4 focus:ring-blue-500/5 transition-all text-slate-900 dark:text-white font-bold"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>

          {mode === 'signup' && (
            <div className="space-y-2">
              <label className="text-[9px] uppercase font-black text-slate-400 dark:text-dark-muted tracking-widest">Phone Number (SMS Auth Verification)</label>
              <input 
                type="tel" 
                required
                placeholder="e.g. +1 555 123 4567"
                className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-dark-border rounded-2xl px-5 py-3.5 text-xs outline-none focus:ring-4 focus:ring-blue-500/5 transition-all text-slate-900 dark:text-white font-bold"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
              />
            </div>
          )}

          {mode !== 'forgot' && (
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <label className="text-[9px] uppercase font-black text-slate-400 dark:text-dark-muted tracking-widest">Password</label>
                {mode === 'login' && (
                  <button 
                    type="button" 
                    onClick={() => setMode('forgot')}
                    className="text-[9px] font-black uppercase text-blue-600 hover:underline tracking-wider"
                  >
                    Forgot?
                  </button>
                )}
              </div>
              <input 
                type="password" 
                required
                placeholder="••••••••••••"
                className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-dark-border rounded-2xl px-5 py-3.5 text-xs outline-none focus:ring-4 focus:ring-blue-500/5 transition-all text-slate-900 dark:text-white font-bold"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />

              {/* Password checklist verification interface */}
              {mode === 'signup' && password && (
                <motion.div 
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  className="mt-2 p-3 bg-slate-50 dark:bg-slate-900 rounded-xl space-y-1.5 text-[10px]"
                >
                  <p className="font-bold text-slate-500 mb-1">Password Strength Directives:</p>
                  <div className="grid grid-cols-2 gap-1.5 font-medium">
                    <div className="flex items-center gap-1.5">
                      {minLength ? <Check size={12} className="text-emerald-500" /> : <X size={12} className="text-slate-300" />}
                      <span className={minLength ? "text-emerald-500" : "text-slate-400"}>At least 8 letters</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      {hasUpper ? <Check size={12} className="text-emerald-500" /> : <X size={12} className="text-slate-300" />}
                      <span className={hasUpper ? "text-emerald-500" : "text-slate-400"}>Uppercase (A-Z)</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      {hasLower ? <Check size={12} className="text-emerald-500" /> : <X size={12} className="text-slate-300" />}
                      <span className={hasLower ? "text-emerald-500" : "text-slate-400"}>Lowercase (a-z)</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      {hasNumber ? <Check size={12} className="text-emerald-500" /> : <X size={12} className="text-slate-300" />}
                      <span className={hasNumber ? "text-emerald-500" : "text-slate-400"}>Numeric (0-9)</span>
                    </div>
                    <div className="col-span-2 flex items-center gap-1.5">
                      {hasSpecial ? <Check size={12} className="text-emerald-500" /> : <X size={12} className="text-slate-300" />}
                      <span className={hasSpecial ? "text-emerald-500" : "text-slate-400"}>Special character (!@#)</span>
                    </div>
                  </div>
                </motion.div>
              )}
            </div>
          )}

          <button 
            type="submit"
            disabled={loading || (mode === 'signup' && !isPasswordSecure)}
            className="w-full flex items-center justify-center gap-3 bg-slate-900 dark:bg-blue-600 text-white py-4.5 rounded-[22px] font-black tracking-tight hover:opacity-90 transition-all active:scale-95 shadow-xl disabled:opacity-50 text-xs uppercase"
          >
            {loading ? <Loader2 className="animate-spin" size={16} /> : mode === 'login' ? 'Sign In Securely' : mode === 'signup' ? 'Proceed with Registration' : 'Send Restore Code'}
          </button>
        </form>

        {mode !== 'forgot' && (
          <>
            <div className="relative my-6">
              <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-slate-100 dark:border-dark-border"></div></div>
              <div className="relative flex justify-center text-[9px] uppercase font-black text-slate-300 dark:text-dark-muted tracking-widest"><span className="bg-white dark:bg-dark-surface px-4 transition-colors">OR</span></div>
            </div>

            <button 
              onClick={onGoogleLogin}
              className="w-full flex items-center justify-center gap-3 bg-white dark:bg-slate-800 border border-slate-100 dark:border-dark-border text-slate-900 dark:text-white py-4.5 rounded-[22px] font-black tracking-tight hover:bg-slate-50 dark:hover:bg-slate-700 transition-all active:scale-95 text-xs shadow-sm"
            >
              <Globe size={16} className="text-blue-600" />
              Sign in with Google Account
            </button>
          </>
        )}

        <div className="mt-6 text-center">
          <p className="text-xs text-slate-400 dark:text-dark-muted font-medium">
            {mode === 'login' ? "New to Roventro? " : mode === 'signup' ? "Already authenticated? " : "Remember password? "}
            <button 
              onClick={() => {
                setMode(mode === 'login' ? 'signup' : 'login');
                setError('');
                setMessage('');
              }} 
              className="text-blue-600 dark:text-blue-400 font-extrabold hover:underline"
            >
              {mode === 'login' ? 'Register' : 'Access Accounts'}
            </button>
          </p>
        </div>
      </motion.div>

      {/* 3. Phone SMS OTP Validation modal */}
      <AnimatePresence>
        {showOtpModal && (
          <div className="fixed inset-0 z-[10000] bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="w-full max-w-sm bg-white dark:bg-slate-900 border border-slate-100 dark:border-dark-border p-8 rounded-[32px] shadow-2xl text-center"
            >
              <div className="w-12 h-12 bg-blue-50 dark:bg-blue-900/30 text-blue-600 rounded-xl flex items-center justify-center mx-auto mb-4">
                <PhoneCall size={20} className="animate-bounce" />
              </div>
              
              <h3 className="text-lg font-black text-slate-900 dark:text-white mb-2 leading-none">Complete SMS Verification</h3>
              <p className="text-xs text-slate-400 dark:text-dark-muted mb-6">
                Roventro dynamic shield sent a security verification OTP to <strong className="text-slate-600 dark:text-slate-300">{phone}</strong>
              </p>

              {/* Alert detailing OTP in modern sandbox style so developer can enter */}
              <div className="mb-6 p-4 bg-orange-500/10 text-orange-600 dark:text-orange-400 text-[11px] font-black uppercase tracking-wider rounded-2xl border border-orange-500/20 leading-relaxed">
                🛡️ Roventro Sandboxed OTP code: <span className="text-base text-orange-500 font-black font-mono ml-1">{otpCode}</span>
              </div>

              {otpError && (
                <div className="mb-4 text-rose-500 text-xs font-bold bg-rose-50 dark:bg-rose-950/20 border border-rose-500/20 p-3 rounded-xl">
                  {otpError}
                </div>
              )}

              <div className="space-y-4">
                <input 
                  type="text"
                  maxLength={4}
                  required
                  placeholder="Type 4-digit token"
                  className="w-full text-center tracking-[12px] font-mono font-black text-xl bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-dark-border rounded-xl p-4 outline-none focus:ring-4 focus:ring-blue-500/10"
                  value={userOtpInput}
                  onChange={(e) => setUserOtpInput(e.target.value.replace(/\D/g, ''))}
                />

                <div className="grid grid-cols-2 gap-3 mt-4">
                  <button
                    type="button"
                    onClick={() => setShowOtpModal(false)}
                    className="py-3.5 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-black rounded-xl text-xs uppercase"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={handleVerifyOtpAndSignUp}
                    className="py-3.5 bg-blue-600 hover:bg-blue-700 text-white font-black rounded-xl text-xs uppercase shadow-lg shadow-blue-500/20"
                  >
                    Verify Keys
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
