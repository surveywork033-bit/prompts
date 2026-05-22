import { useState, FormEvent } from "react";
import { Shield, Key, Mail, RefreshCw, AlertTriangle } from "lucide-react";
import { UserProfile } from "../types";

interface AdminLoginProps {
  onLoginSuccess: (user: UserProfile) => void;
  onNavigate: (view: string) => void;
}

export default function AdminLogin({ onLoginSuccess, onNavigate }: AdminLoginProps) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errorText, setErrorText] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleAdminSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password.trim()) {
      setErrorText("Please provide both administrator email and vault password.");
      return;
    }

    setLoading(true);
    setErrorText("");

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim(), password: password.trim() })
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || "Administrative override rejected.");
      }

      const data = await res.json();
      
      if (data.user) {
        if (data.user.role !== "admin") {
          throw new Error("Privilege mismatch. Voyager does not hold supervisor clearance.");
        }

        // Save credential details securely in client sandbox
        localStorage.setItem("promptverse_user_profile", JSON.stringify(data.user));
        localStorage.setItem("promptverse_token", data.token);

        setSuccess(true);
        onLoginSuccess(data.user);
        
        setTimeout(() => {
          onNavigate("admin");
        }, 1200);
      }
    } catch (err: any) {
      console.error(err);
      setErrorText(err.message || "Vault authority rejected.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mx-auto max-w-md px-4 py-16 text-zinc-101 min-h-[80vh] flex flex-col justify-center text-left">
      <div className="rounded-[32px] border border-rose-500/10 bg-black/5 p-8 backdrop-blur-md space-y-6 relative overflow-hidden">
        
        {/* Animated Security Backdrop Indicator */}
        <div className="absolute top-0 right-0 h-28 w-28 bg-rose-500/5 rounded-full blur-2xl pointer-events-none select-none" />

        <div className="text-center space-y-2 relative">
          <div className="h-12 w-12 rounded-2xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center mx-auto text-rose-500 mb-3">
            <Shield className="h-6 w-6" />
          </div>
          <h2 className="text-xl font-black uppercase text-white tracking-widest">Administrator Login</h2>
          <p className="text-xs text-zinc-550 max-w-xs mx-auto leading-relaxed">
            Authorized personnel only. Access logging is active for this node.
          </p>
        </div>

        {errorText && (
          <div className="p-3.5 rounded-2xl bg-rose-950/20 border border-rose-500/15 text-xs text-rose-400 font-bold flex items-start space-x-2">
            <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5" />
            <span>{errorText}</span>
          </div>
        )}

        {success && (
          <div className="p-3.5 rounded-2xl bg-emerald-950/20 border border-emerald-500/15 text-xs text-emerald-400 font-bold">
            ✨ Overseer token established. Connecting matrix link...
          </div>
        )}

        <form onSubmit={handleAdminSubmit} className="space-y-4">
          <div className="space-y-1">
            <label className="text-[10px] font-black uppercase text-zinc-500 tracking-wider">SECURE EMAIL</label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 text-zinc-500">
                <Mail className="h-4 w-4" />
              </span>
              <input
                type="email"
                required
                disabled={loading || success}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="developer@promptverse.ai"
                className="w-full rounded-2xl border border-white/5 bg-black/15 py-3 pl-11 pr-4 text-xs text-white outline-none focus:border-rose-500 transition-all font-mono"
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-[10px] font-black uppercase text-zinc-500 tracking-wider">AUTHORIZATION KEY (PASSWORD)</label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 text-zinc-500">
                <Key className="h-4 w-4" />
              </span>
              <input
                type="password"
                required
                disabled={loading || success}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••••••"
                className="w-full rounded-2xl border border-white/5 bg-black/15 py-3 pl-11 pr-4 text-xs text-white outline-none focus:border-rose-500 transition-all font-mono"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading || success}
            className="w-full rounded-full bg-rose-600 hover:bg-rose-550 py-3.5 text-xs font-black tracking-widest text-white uppercase transition-all flex items-center justify-center space-x-2 shadow-lg shadow-rose-950/20 disabled:opacity-50 select-none cursor-pointer"
          >
            {loading ? (
              <>
                <RefreshCw className="h-4 w-4 animate-spin" />
                <span>Validating credentials Vault...</span>
              </>
            ) : (
              <span>Unlock Console</span>
            )}
          </button>
        </form>

        <div className="text-center pt-2">
          <button
            type="button"
            onClick={() => onNavigate("home")}
            className="text-[10px] uppercase font-black tracking-widest text-zinc-550 hover:text-zinc-450 transition cursor-pointer"
          >
            ← Return to flight deck
          </button>
        </div>

      </div>
    </div>
  );
}
