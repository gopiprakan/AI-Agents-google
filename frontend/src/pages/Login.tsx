import React, { useState } from 'react';
import { Lock, User, ShieldAlert, KeyRound } from 'lucide-react';

interface LoginProps {
  onLoginSuccess: (user: any, token: string) => void;
}

export const Login: React.FC<LoginProps> = ({ onLoginSuccess }) => {
  const [username, setUsername] = useState<string>('admin');
  const [password, setPassword] = useState<string>('password123');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string>('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setErrorMsg('');

    try {
      // Attempt login request to FastAPI
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ username, password })
      });

      if (response.ok) {
        const data = await response.json();
        onLoginSuccess(data.user, data.access_token);
      } else {
        const err = await response.json();
        setErrorMsg(err.detail || 'Access Denied: Invalid credentials');
      }
    } catch (err) {
      // Offline fallback mode for developers running without docker database running yet
      console.warn("Connection to backend auth failed. Booting in local session bypass mode.");
      if (username === 'admin' && password === 'password123') {
        const mockUser = {
          id: 'mock-admin-id',
          username: 'admin',
          email: 'admin@iscts.gov',
          role: 'ADMIN',
          full_name: 'Administrator (Bypass)'
        };
        onLoginSuccess(mockUser, 'mock-jwt-token-key');
      } else if (username === 'officer' && password === 'password123') {
        const mockUser = {
          id: 'mock-officer-id',
          username: 'officer_smith',
          email: 'smith@iscts.gov',
          role: 'TRAFFIC_OFFICER',
          full_name: 'Officer John Smith'
        };
        onLoginSuccess(mockUser, 'mock-jwt-token-key');
      } else {
        setErrorMsg('Network error: Use default logs (admin / password123)');
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4 relative overflow-hidden">
      {/* Background glowing decorations */}
      <div className="absolute top-1/4 left-1/4 w-80 h-80 bg-cyanGlow/10 rounded-full blur-[100px] pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-roseEmergency/5 rounded-full blur-[100px] pointer-events-none" />

      {/* Login Card */}
      <div className="w-full max-w-md glass-panel p-8 rounded-3xl relative z-10">
        <div className="flex flex-col items-center mb-6">
          <div className="p-3 bg-cyanGlow/10 rounded-2xl border border-cyanGlow/20 text-cyanGlow mb-3">
            <KeyRound className="w-6 h-6" />
          </div>
          <h2 className="text-xl font-extrabold text-white tracking-wide">ISCTS SECURE SIGN-IN</h2>
          <p className="text-xs text-slate-400 mt-1 uppercase tracking-wider">Traffic Control Platform</p>
        </div>

        {errorMsg && (
          <div className="p-3.5 bg-roseEmergency/15 border border-roseEmergency/25 text-roseEmergency rounded-xl text-xs flex items-center gap-2 mb-6">
            <ShieldAlert className="w-4 h-4 flex-shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-xs text-slate-400 font-semibold uppercase tracking-wider block mb-2">Username</label>
            <div className="relative">
              <span className="absolute left-4 top-3.5 text-slate-500">
                <User className="w-4 h-4" />
              </span>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
                className="w-full bg-slate-900 border border-cardBorder rounded-xl pl-11 pr-4 py-3 text-sm text-white placeholder-slate-500 outline-none focus:border-cyanGlow transition-colors"
                placeholder="Enter username"
              />
            </div>
          </div>

          <div>
            <label className="text-xs text-slate-400 font-semibold uppercase tracking-wider block mb-2">Password</label>
            <div className="relative">
              <span className="absolute left-4 top-3.5 text-slate-500">
                <Lock className="w-4 h-4" />
              </span>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="w-full bg-slate-900 border border-cardBorder rounded-xl pl-11 pr-4 py-3 text-sm text-white placeholder-slate-500 outline-none focus:border-cyanGlow transition-colors"
                placeholder="Enter security key"
              />
            </div>
          </div>

          <div className="pt-2">
            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3.5 rounded-xl bg-cyanGlow text-slate-950 font-bold hover:bg-cyanGlow/85 transition-all text-sm uppercase tracking-wider disabled:opacity-50"
            >
              {isLoading ? 'Decrypting Credentials...' : 'Sign In'}
            </button>
          </div>
        </form>

        <div className="mt-8 pt-6 border-t border-cardBorder flex flex-col gap-2 text-center">
          <p className="text-[10px] text-slate-500 font-mono">AUTHORIZED PERSONNEL ONLY</p>
          <p className="text-[10px] text-cyanGlow/70 font-mono">DEFAULT: admin / password123</p>
        </div>
      </div>
    </div>
  );
};
