import { useState, FormEvent, ChangeEvent } from "react";
import { ThemeConfig } from "../theme";
import { CreditCard, ArrowRight, CheckCircle2, Loader2, ArrowLeft } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

interface OrderFormProps {
  theme: ThemeConfig;
  onNavigate: (view: string) => void;
}

export default function OrderForm({ theme, onNavigate }: OrderFormProps) {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    plan: "Pro Membership ($9.99)"
  });
  
  const [status, setStatus] = useState<"idle" | "submitting" | "success" | "error">("idle");
  const [errorMessage, setErrorMessage] = useState("");
  
  const isDark = theme.id !== "arctic";

  const handleChange = (e: ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }));
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.email) return;

    setStatus("submitting");
    setErrorMessage("");

    try {
      const response = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        // Construct the checkout object for Supabase insertion
        body: JSON.stringify({
          customer_name: formData.name,
          customer_email: formData.email,
          item: formData.plan,
          status: "completed",
          created_at: new Date().toISOString()
        })
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to process checkout");
      }

      setStatus("success");
      
      // Global toast
      window.dispatchEvent(new CustomEvent("promptverse-toast", {
        detail: { message: "🎉 Order processed via Supabase!" }
      }));
      
    } catch (err: any) {
      console.error(err);
      setStatus("error");
      setErrorMessage(err.message || "Something went wrong.");
    }
  };

  if (status === "success") {
    return (
      <div className="mx-auto w-full max-w-lg px-4 py-16 pb-32 text-center min-h-screen flex flex-col items-center justify-center">
        <motion.div
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="h-24 w-24 rounded-full bg-emerald-500/10 flex items-center justify-center mb-6"
        >
          <CheckCircle2 className="h-12 w-12 text-emerald-500" />
        </motion.div>
        <h2 className={`text-2xl font-black uppercase tracking-tight mb-2 ${theme.textPrimary}`}>
          Order Complete!
        </h2>
        <p className="text-zinc-500 text-sm mb-8 max-w-sm">
          Your purchase has been securely saved to our Supabase vector records. Thank you for upgrading.
        </p>
        <button
          onClick={() => onNavigate("home")}
          className={`px-8 py-4 rounded-full text-xs font-black uppercase tracking-widest text-white shadow-xl ${theme.accent} hover:opacity-90 transition`}
        >
          Return to Stream
        </button>
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-lg px-4 py-6 pb-32 text-left min-h-screen">
      
      <button 
        onClick={() => onNavigate("profile")}
        className="flex items-center space-x-2 text-xs font-black uppercase tracking-wider text-zinc-500 hover:text-zinc-300 mb-6 transition"
      >
        <ArrowLeft className="h-4 w-4" />
        <span>Back</span>
      </button>

      <header className="mb-8 border-b border-white/5 pb-4">
        <h1 className={`text-xl font-black uppercase tracking-tight ${theme.textPrimary}`}>
          Secure Checkout
        </h1>
        <p className="text-zinc-500 text-xs mt-1">
          Unlock premium generative features securely backed by Supabase.
        </p>
      </header>
      
      {status === "error" && (
        <div className="mb-5 rounded-[16px] bg-red-500/10 border border-red-500/20 p-4 text-xs font-bold text-red-400 text-center">
          ⚠️ {errorMessage}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        
        {/* Plan Selection */}
        <div className="space-y-1.5">
          <label className="text-[10px] font-black uppercase tracking-widest text-zinc-500">
            Selected Tier
          </label>
          <select
            name="plan"
            value={formData.plan}
            onChange={handleChange}
            className={`w-full rounded-[16px] border ${theme.border} bg-black/35 px-4 py-3.5 text-sm outline-none focus:border-purple-500/50 transition-all cursor-pointer`}
            style={{
              backgroundColor: isDark ? "rgba(10, 10, 15, 0.45)" : "#ffffff",
              color: isDark ? "#ffffff" : "#0f172a"
            }}
          >
            <option value="Pro Membership ($9.99)">Pro Membership ($9.99)</option>
            <option value="Creator Bundle ($24.99)">Creator Bundle ($24.99)</option>
            <option value="Lifetime Pioneer ($99.00)">Lifetime Pioneer ($99.00)</option>
          </select>
        </div>

        <div className="space-y-1.5">
          <label className="text-[10px] font-black uppercase tracking-widest text-zinc-500">
            Full Name
          </label>
          <input
            type="text"
            name="name"
            required
            value={formData.name}
            onChange={handleChange}
            placeholder="Nomad Name"
            className={`w-full rounded-[16px] border ${theme.border} bg-black/35 px-4 py-3.5 text-sm outline-none focus:border-purple-500/50 transition-all`}
            style={{
              backgroundColor: isDark ? "rgba(10, 10, 15, 0.45)" : "#ffffff",
              color: isDark ? "#ffffff" : "#0f172a"
            }}
          />
        </div>

        <div className="space-y-1.5">
          <label className="text-[10px] font-black uppercase tracking-widest text-zinc-500">
            Email Address
          </label>
          <input
            type="email"
            name="email"
            required
            value={formData.email}
            onChange={handleChange}
            placeholder="nomad@neural.net"
            className={`w-full rounded-[16px] border ${theme.border} bg-black/35 px-4 py-3.5 text-sm outline-none focus:border-purple-500/50 transition-all`}
            style={{
              backgroundColor: isDark ? "rgba(10, 10, 15, 0.45)" : "#ffffff",
              color: isDark ? "#ffffff" : "#0f172a"
            }}
          />
        </div>

        {/* Dummy Card styling since there isn't a real payment gateway integrated per user prompt yet */}
        <div className="p-4 rounded-[20px] bg-white/5 border border-white/10 flex items-center space-x-4">
          <div className="h-10 w-10 rounded-full bg-white/10 flex items-center justify-center shrink-0">
            <CreditCard className="h-5 w-5 text-gray-400" />
          </div>
          <div>
            <p className={`text-sm font-bold ${theme.textPrimary}`}>Supabase Processing</p>
            <p className="text-xs text-zinc-500">Order gets written transparently to xnqwawwh... Supabase project.</p>
          </div>
        </div>

        <div className="pt-4">
          <button
            type="submit"
            disabled={status === "submitting" || !formData.name || !formData.email}
            className={`w-full flex items-center justify-center space-x-2 rounded-[24px] py-4 text-xs font-black uppercase tracking-widest text-white shadow-xl transition-all duration-300 ${
              status === "submitting" 
                ? "opacity-50 cursor-wait bg-purple-500"
                : formData.name && formData.email 
                  ? `${theme.accent} hover:shadow-purple-500/20 cursor-pointer` 
                  : "bg-zinc-800 text-zinc-500 cursor-not-allowed opacity-50"
            }`}
          >
            {status === "submitting" ? (
              <>
                <Loader2 className="h-4.5 w-4.5 animate-spin" />
                <span>Processing Record...</span>
              </>
            ) : (
              <>
                <span>Complete Purchase via Supabase</span>
                <ArrowRight className="h-4.5 w-4.5" />
              </>
            )}
          </button>
        </div>

      </form>
    </div>
  );
}
