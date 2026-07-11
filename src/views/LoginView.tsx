/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { ShieldCheck, ShieldAlert, Key, Terminal, Mail, Info } from 'lucide-react';
import { RetroInput } from '../components/ui/Input';
import { Button } from '../components/ui/Button';
import { supabase, isSupabaseConfigured } from '../lib/supabase';

interface LoginViewProps {
  onLoginSuccess: (email: string) => void;
  onBackToStorefront?: () => void;
}

export const LoginView: React.FC<LoginViewProps> = ({ onLoginSuccess, onBackToStorefront }) => {
  const [email, setEmail] = useState('uchichinyama@gmail.com');
  const [password, setPassword] = useState('cosmic-ops-2026'); // Seeded safe default password for easy testing
  const [error, setError] = useState<string | null>(null);
  
  // Rate limiting lock states
  const [failedAttempts, setFailedAttempts] = useState(0);
  const [lockUntil, setLockUntil] = useState<number | null>(null);
  const [timeLeft, setTimeLeft] = useState(0);

  useEffect(() => {
    // Load security tracking parameters
    if (typeof window !== 'undefined') {
      const attempts = parseInt(localStorage.getItem('login_fail_attempts') || '0', 10);
      const lockedTimeStr = localStorage.getItem('login_locked_until');
      setFailedAttempts(attempts);

      if (lockedTimeStr) {
        const lockedTime = parseInt(lockedTimeStr, 10);
        if (lockedTime > Date.now()) {
          setLockUntil(lockedTime);
          setTimeLeft(Math.ceil((lockedTime - Date.now()) / 1000));
        } else {
          localStorage.removeItem('login_locked_until');
          localStorage.setItem('login_fail_attempts', '0');
          setFailedAttempts(0);
        }
      }
    }
  }, []);

  // Sync lockout ticking timer
  useEffect(() => {
    if (!lockUntil) return;
    
    const interval = setInterval(() => {
      const remaining = Math.ceil((lockUntil - Date.now()) / 1000);
      if (remaining <= 0) {
        setLockUntil(null);
        setFailedAttempts(0);
        localStorage.setItem('login_fail_attempts', '0');
        localStorage.removeItem('login_locked_until');
        setError(null);
        clearInterval(interval);
      } else {
        setTimeLeft(remaining);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [lockUntil]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Security Check: Is operator locked out?
    if (lockUntil && lockUntil > Date.now()) {
      setError(`RATE LIMIT POLICY ACTIVATED: Login panel strictly locked for safety. Retry in ${timeLeft} seconds.`);
      return;
    }

    // Secure input validation
    if (!email || !password) {
      setError('INPUT EXCEPTION: All fields are strictly required.');
      return;
    }

    if (isSupabaseConfigured() && supabase) {
      try {
        const { data, error: authError } = await supabase.auth.signInWithPassword({
          email: email.trim(),
          password: password,
        });

        if (authError) {
          throw authError;
        }

        // Verify if user is also registered as an authorized administrator
        const { data: adminUser, error: adminError } = await supabase
          .from('admin_users')
          .select('*')
          .eq('email', email.trim().toLowerCase())
          .maybeSingle();

        if (adminError) {
          throw new Error(`Database verification failure: ${adminError.message}`);
        }

        if (!adminUser) {
          // Immediately sign out unauthorized user
          await supabase.auth.signOut();
          throw new Error('ACCESS DENIED: Operator is not registered in the admin_users database registry.');
        }

        // Clear security flags on success
        localStorage.setItem('login_fail_attempts', '0');
        localStorage.removeItem('login_locked_until');
        onLoginSuccess(email.trim());

      } catch (err: any) {
        const nextAttempts = failedAttempts + 1;
        setFailedAttempts(nextAttempts);
        localStorage.setItem('login_fail_attempts', nextAttempts.toString());

        if (nextAttempts >= 5) {
          const lockoutDurationMs = 15 * 60 * 1000; // 15 Minutes
          const until = Date.now() + lockoutDurationMs;
          setLockUntil(until);
          localStorage.setItem('login_locked_until', until.toString());
          setError(`SECURITY BREACH COUNTERMEASURES ENGAGED: 5 consecutive failures recorded. UI strictly locked down for 15 minutes.`);
          setTimeLeft(15 * 60);
        } else {
          setError(`ACCESS DENIED: ${err.message || 'Invalid operator credentials'}. Attempt ${nextAttempts} of 5 before lockout.`);
        }
      }
    } else {
      // Offline/Sandbox Mode Fallback
      const isSuccess = email.trim().toLowerCase() === 'uchichinyama@gmail.com' && password === 'cosmic-ops-2026';

      if (isSuccess) {
        // Clear security flags on success
        localStorage.setItem('login_fail_attempts', '0');
        localStorage.removeItem('login_locked_until');
        onLoginSuccess(email.trim());
      } else {
        const nextAttempts = failedAttempts + 1;
        setFailedAttempts(nextAttempts);
        localStorage.setItem('login_fail_attempts', nextAttempts.toString());

        if (nextAttempts >= 5) {
          const lockoutDurationMs = 15 * 60 * 1000; // 15 Minutes
          const until = Date.now() + lockoutDurationMs;
          setLockUntil(until);
          localStorage.setItem('login_locked_until', until.toString());
          setError(`SECURITY BREACH COUNTERMEASURES ENGAGED: 5 consecutive failures recorded. UI strictly locked down for 15 minutes.`);
          setTimeLeft(15 * 60);
        } else {
          setError(`ACCESS DENIED: Invalid operator credential combination. Attempt ${nextAttempts} of 5 before lockout.`);
        }
      }
    }
  };

  return (
    <div className="min-h-screen bg-space-black flex flex-col justify-center items-center p-4 select-none font-body-mono text-cream relative overflow-hidden">
      
      {/* Decorative cybernetic background elements */}
      <div className="absolute top-10 left-10 text-[9px] text-cream-muted/10 font-mono leading-relaxed hidden md:block">
        SYS_STATUS: READY<br />
        IP_PORT_INBOUND: 3000<br />
        SECURE_CIPHER: TLS_AES_256_GCM_SHA384
      </div>
      <div className="absolute bottom-10 right-10 text-[9px] text-cream-muted/10 font-mono leading-relaxed hidden md:block">
        BUILD_REV: v1.4.2<br />
        ROOT_ACCESS: RESTRICTED<br />
        SHADOW_ROOT_SECURITY_SYS
      </div>

      <div className="w-full max-w-md bg-retro-surface border-4 border-retro-border p-6 shadow-[0_0_25px_rgba(42,31,69,0.5)] md:p-8 relative">
        {/* Terminal Title Header */}
        <div className="flex items-center justify-between border-b-2 border-retro-border pb-4 mb-6">
          <div className="flex items-center gap-2">
            <Terminal size={18} className="text-accent-purple animate-pulse" />
            <h1 className="font-retro-heading text-xs tracking-wider text-cream leading-none">
              COSMIC DEPT
            </h1>
          </div>
          <span className="text-xs bg-accent-purple/20 text-accent-purple border border-accent-purple/30 px-2 py-0.5 font-retro-mono">
            SECURE PORTAL
          </span>
        </div>

        {/* Informational notification */}
        <div className="mb-6 p-3 bg-accent-purple/5 border border-retro-border/50 text-cream-muted text-xs leading-relaxed flex items-start gap-2">
          <Info size={16} className="text-accent-purple shrink-0 mt-0.5" />
          <div>
            Welcome to <span className="text-cream font-bold">COSMIC DEPT</span> Admin. Authenticate using pre-populated credentials or standard developer credentials.
          </div>
        </div>

        {/* Errors / Warnings block */}
        {error && (
          <div className={`mb-6 p-4 border-2 text-xs leading-relaxed flex items-start gap-2.5 
            ${lockUntil ? 'bg-retro-red/10 border-retro-red text-retro-red animate-bounce' : 'bg-retro-gold/10 border-retro-gold text-retro-gold'}`}
          >
            <ShieldAlert size={18} className="shrink-0 mt-0.5" />
            <div className="font-mono">{error}</div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Email block */}
          <div className="relative">
            <RetroInput
              label="OPERATOR EMAIL"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={!!lockUntil}
              placeholder="operator@cosmicdept.com"
              required
            />
            <Mail size={14} className="absolute right-3.5 bottom-3.5 text-cream-muted/30" />
          </div>

          {/* Password block */}
          <div className="relative">
            <RetroInput
              label="SECURITY DECRYPT KEY"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={!!lockUntil}
              placeholder="••••••••••••••"
              required
            />
            <Key size={14} className="absolute right-3.5 bottom-3.5 text-cream-muted/30" />
          </div>

          {/* Unlock Countdown or Button */}
          {lockUntil ? (
            <div className="w-full text-center border-2 border-retro-red p-3 text-retro-red font-retro-mono text-lg tracking-wider bg-retro-red/5">
              PANEL LOCKED DOWN: {timeLeft}s
            </div>
          ) : (
            <Button
              type="submit"
              variant="primary"
              className="w-full py-3.5 mt-2"
            >
              INITIALIZE SESSION
            </Button>
          )}
        </form>

        {onBackToStorefront && (
          <button
            type="button"
            onClick={onBackToStorefront}
            className="w-full mt-4 py-2.5 border border-retro-border hover:border-accent-purple text-cream-muted hover:text-cream text-[10px] font-body-mono tracking-[0.2em] uppercase transition-colors cursor-pointer"
          >
            :: EXIT TO PUBLIC DEPT STOREFRONT
          </button>
        )}

        {/* Footer credentials reminder */}
        <div className="mt-8 pt-4 border-t border-retro-border text-center text-[10px] text-cream-muted uppercase leading-relaxed font-mono">
          AUTHENTICATION POWERED BY SHADOW ROOT CYBER LABS<br />
          LUSAKA, ZAMBIA
        </div>
      </div>
    </div>
  );
};
export default LoginView;
