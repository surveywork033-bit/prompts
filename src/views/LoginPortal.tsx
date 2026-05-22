import { useState, FormEvent } from "react";
import { User, Mail, Shield, Check, FileText, Cpu, UserCheck } from "lucide-react";
import { UserProfile } from "../types";

interface LoginPortalProps {
  onLoginSuccess: (user: UserProfile) => void;
  onNavigate: (view: string) => void;
}

export default function LoginPortal({ onLoginSuccess, onNavigate }: LoginPortalProps) {
  const [email, setEmail] = useState("");
  const [username, setUsername] = useState("");
  const [isSignup, setIsSignup] = useState(false);
  const [feedback, setFeedback] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;

    setLoading(true);
    setFeedback("");

    try {
      const endpoint = isSignup ? "/api/auth/signup" : "/api/auth/login";
      const body = isSignup 
        ? { username: username.trim(), email: email.trim() } 
        : { email: email.trim() };

      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body)
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || "Authentication failed");
      }

      const data = await res.json();
      if (data.user) {
        // Save to localStorage for quick retrieval
        localStorage.setItem("promptverse_user_profile", JSON.stringify(data.user));
        localStorage.setItem("promptverse_token", data.token);
        
        onLoginSuccess(data.user);
        setFeedback("✨ Authentication verified. Booting matrix interface...");
        setTimeout(() => {
          onNavigate("home");
        }, 1200);
      }
    } catch (err: any) {
      console.error(err);
      setFeedback(`Error: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  // Immediate simulation logins for rich UX testing
  const handleSimulatedProfile = async (simEmail: string) => {
    setLoading(true);
    setFeedback("");
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: simEmail })
      });
      if (res.ok) {
        const data = await res.json();
        localStorage.setItem("promptverse_user_profile", JSON.stringify(data.user));
        localStorage.setItem("promptverse_token", data.token);
        onLoginSuccess(data.user);
        setFeedback(`✨ Logged in successfully as @${data.user.username}`);
        setTimeout(() => onNavigate("home"), 1200);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mx-auto max-w-md px-4 py-16 text-zinc-101 text-center">
      
      {/* Glow visual background effects */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -z-10 h-72 w-72 rounded-full bg-purple-600/5 blur-[90px] pointer-events-none" />

      <div className="rounded-2xl border border-zinc-850 p-6 sm:p-8 bg-zinc-900/10 backdrop-blur-md space-y-6">
        
        <div className="flex flex-col items-center space-y-2">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-tr from-purple-600 to-indigo-600 shadow-md shadow-purple-900/10">
            <Cpu className="h-6 w-6 text-white" />
          </div>
          <h2 className="text-xl font-extrabold text-white">
            {isSignup ? "Initialize New Cadet" : "Verified Node Authentication"}
          </h2>
          <p className="text-xs text-zinc-500">
            {isSignup ? "Register public credentials in the Promptverse ledger" : "Provide registered email credentials to override state permissions"}
          </p>
        </div>

        {feedback && (
          <div className="p-3 text-[11px] font-bold border border-purple-500/15 bg-purple-950/20 text-purple-400 rounded-lg">
            {feedback}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4 text-left">
          {isSignup && (
            <div className="flex flex-col space-y-1">
              <label className="text-[10px] font-bold uppercase text-zinc-500">Public Alias (username)</label>
              <div className="relative flex items-center">
                <User className="absolute left-3 h-4 w-4 text-zinc-650" />
                <input
                  type="text"
                  required
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="e.g. prompt_wizard"
                  className="w-full rounded-lg border border-zinc-805 bg-zinc-950/40 py-2.5 pl-10 pr-4 text-xs text-white placeholder-zinc-700 outline-none focus:border-purple-500 transition"
                />
              </div>
            </div>
          )}

          <div className="flex flex-col space-y-1">
            <label className="text-[10px] font-bold uppercase text-zinc-500">Registered Email Address</label>
            <div className="relative flex items-center">
              <Mail className="absolute left-3 h-4 w-4 text-zinc-650" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="e.g. alex@promptverse.ai"
                className="w-full rounded-lg border border-zinc-805 bg-zinc-950/40 py-2.5 pl-10 pr-4 text-xs text-white placeholder-zinc-700 outline-none focus:border-purple-500 transition"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-xl bg-purple-650 hover:bg-purple-600 py-3 text-xs font-bold uppercase text-white shadow-md shadow-purple-900/10 active:scale-98 transition disabled:opacity-55"
          >
            {loading ? "TRANSMITTING..." : isSignup ? "Create Ledger Identity" : "Verify Authority Slot"}
          </button>
        </form>

        <div className="text-xs text-zinc-550 border-t border-zinc-900 pt-4 flex flex-col space-y-2">
          <span>
            {isSignup ? "Cadet already registered?" : "Ready to register credentials?"}{" "}
            <span
              onClick={() => setIsSignup(!isSignup)}
              className="text-purple-400 font-bold hover:underline cursor-pointer"
            >
              {isSignup ? "Access existing authorization" : "Create ledger slot"}
            </span>
          </span>

          <span className="text-[10px] uppercase font-mono tracking-wider font-bold pt-1.5 text-zinc-600">
            ⚡ Quick Simulation Login Slots ⚡
          </span>
          <div className="grid grid-cols-2 gap-2 text-center text-[10.5px] font-mono select-none">
            <button
              onClick={() => handleSimulatedProfile("sophie@growth.co")}
              disabled={loading}
              className="p-1 px-2 border border-zinc-850 hover:border-zinc-700 rounded-lg hover:bg-zinc-900/40 text-purple-400 flex items-center justify-center space-x-1"
            >
              <UserCheck className="h-3.5 w-3.5" />
              <span>Sophie (Writer)</span>
            </button>

            <button
              onClick={() => handleSimulatedProfile("dev@promptverse.ai")}
              disabled={loading}
              className="p-1 px-2 border border-zinc-850 hover:border-zinc-700 rounded-lg hover:bg-zinc-900/40 text-rose-450 flex items-center justify-center space-x-1"
            >
              <Shield className="h-3.5 w-3.5" />
              <span>Admin Dev (Full)</span>
            </button>
          </div>
        </div>

      </div>

    </div>
  );
}
