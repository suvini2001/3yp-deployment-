import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Train, Eye, EyeOff, Shield, Lock, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { supabase } from "@/lib/supabase";

const Login = () => {
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const checkSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) navigate("/dashboard", { replace: true });
    };
    checkSession();
  }, [navigate]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) throw error;
      if (data.session) {
        localStorage.setItem('adminToken', data.session.access_token);
        toast.success("Welcome back!");
        navigate("/dashboard");
      }
    } catch (error: any) {
      toast.error(error.message || "Invalid credentials. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-background mesh-bg">

      {/* ─── Hero header ─── */}
      <div className="header-gradient h-64 rounded-b-[3rem] flex items-end justify-center pb-8 relative overflow-hidden">
        {/* Decorative orbs */}
        <div className="absolute top-0 right-0 w-64 h-64 rounded-full bg-glow-cyan -translate-y-24 translate-x-24 pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-48 h-48 rounded-full bg-glow-blue translate-y-16 -translate-x-16 pointer-events-none" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-32 h-32 rounded-full bg-white/[0.03] pointer-events-none" />

        <div className="text-center relative z-10 animate-fade-in-up">
          {/* Logo icon */}
          <div className="
            w-20 h-20 mx-auto mb-4 rounded-3xl
            bg-white/12 backdrop-blur-sm
            border border-white/20 shadow-xl
            flex items-center justify-center
            transition-transform duration-300 hover:scale-105
          ">
            <Train className="text-white" size={38} strokeWidth={1.8} />
          </div>
          <h1 className="text-2xl font-extrabold text-white tracking-tight leading-tight">RailSafe Monitor</h1>
          <p className="text-[13px] text-blue-200/75 mt-1 font-medium">Track Crack Detection System</p>
        </div>
      </div>

      {/* ─── Form card ─── */}
      <div className="flex-1 px-5 -mt-8 pb-10">
        <div className="
          bg-card rounded-3xl p-6 shadow-xl border border-blue-100/60
          max-w-sm mx-auto
          animate-scale-in
        ">
          {/* Card header */}
          <div className="flex items-center gap-2.5 mb-6 pb-5 border-b border-border">
            <div className="p-2 bg-blue-50 rounded-xl">
              <Shield className="text-blue-600" size={16} />
            </div>
            <div>
              <h2 className="font-bold text-foreground text-[15px] tracking-tight">Operator Login</h2>
              <p className="text-[11px] text-muted-foreground font-medium">Authorized personnel only</p>
            </div>
          </div>

          <form onSubmit={handleLogin} className="space-y-4">
            {/* Email field */}
            <div className="space-y-1.5">
              <label className="text-[11px] font-bold text-muted-foreground uppercase tracking-widest">
                Email Address
              </label>
              <div className="relative">
                <Input
                  type="email"
                  placeholder="admin@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="h-12 bg-blue-50/50 border-blue-100 focus:border-blue-400 focus:ring-2 focus:ring-blue-400/20 rounded-xl pl-4 text-[14px] font-medium transition-all duration-200"
                  required
                />
              </div>
            </div>

            {/* Password field */}
            <div className="space-y-1.5">
              <label className="text-[11px] font-bold text-muted-foreground uppercase tracking-widest">
                Password
              </label>
              <div className="relative">
                <Input
                  type={showPassword ? "text" : "password"}
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="h-12 bg-blue-50/50 border-blue-100 focus:border-blue-400 focus:ring-2 focus:ring-blue-400/20 rounded-xl pl-4 pr-12 text-[14px] font-medium transition-all duration-200"
                  required
                  minLength={6}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-blue-600 transition-colors duration-200 p-0.5 rounded-md hover:bg-blue-50"
                >
                  {showPassword ? <EyeOff size={17} /> : <Eye size={17} />}
                </button>
              </div>
            </div>

            {/* Submit button */}
            <Button
              type="submit"
              disabled={loading}
              className="
                w-full h-12 text-[14px] font-bold mt-2 rounded-xl
                btn-premium
                flex items-center justify-center gap-2
                disabled:opacity-60 disabled:cursor-not-allowed disabled:transform-none
              "
            >
              {loading ? (
                <span className="flex items-center gap-2">
                  <span className="w-4 h-4 rounded-full border-2 border-white/30 border-t-white animate-spin" />
                  Authenticating...
                </span>
              ) : (
                <span className="flex items-center gap-2">
                  <Lock size={15} />
                  Sign In
                  <ArrowRight size={15} />
                </span>
              )}
            </Button>
          </form>
        </div>

        <p className="text-center text-[11px] text-muted-foreground mt-5 flex items-center justify-center gap-1.5">
          <Lock size={11} />
          Authorized railway personnel only
        </p>
      </div>
    </div>
  );
};

export default Login;