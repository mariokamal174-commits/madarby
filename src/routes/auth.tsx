import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { PhoneShell } from "@/components/PhoneShell";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable";
import { toast } from "sonner";
import { ArrowRight, Mail, Lock, User as UserIcon } from "lucide-react";

export const Route = createFileRoute("/auth")({
  component: AuthPage,
});

type Role = "player" | "coach" | "academy";

function AuthPage() {
  const navigate = useNavigate();
  const [mode, setMode] = useState<"login" | "signup">("login");
  const [role, setRole] = useState<Role>("player");
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) navigate({ to: "/home" });
    });
  }, [navigate]);

  async function handleEmail(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      if (mode === "signup") {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: `${window.location.origin}/home`,
            data: { full_name: fullName, role },
          },
        });
        if (error) throw error;
        toast.success("تم إنشاء الحساب — تحقق من بريدك");
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        navigate({ to: "/home" });
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "حدث خطأ");
    } finally {
      setLoading(false);
    }
  }

  async function handleGoogle() {
    setLoading(true);
    try {
      const result = await lovable.auth.signInWithOAuth("google", {
        redirect_uri: window.location.origin,
      });
      if (result.error) throw new Error(String(result.error));
      if (!result.redirected) navigate({ to: "/home" });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "فشل تسجيل الدخول");
      setLoading(false);
    }
  }

  return (
    <PhoneShell>
      <div className="min-h-screen flex flex-col px-6 pt-6 pb-8">
        <Link to="/" className="size-10 rounded-full bg-surface flex items-center justify-center">
          <ArrowRight className="size-5" />
        </Link>

        <div className="mt-6">
          <h1 className="font-display font-bold text-4xl mb-2">
            {mode === "login" ? "أهلاً بعودتك" : "أنشئ حسابك"}
          </h1>
          <p className="text-muted-foreground text-sm">
            {mode === "login" ? "سجّل دخولك للمتابعة" : "اختر نوع حسابك للبدء"}
          </p>
        </div>

        {mode === "signup" && (
          <div className="mt-6">
            <p className="text-xs font-bold text-muted-foreground mb-2">أنا</p>
            <div className="grid grid-cols-3 gap-2">
              {(["player", "coach", "academy"] as Role[]).map((r) => (
                <button
                  key={r}
                  type="button"
                  onClick={() => setRole(r)}
                  className={`h-14 rounded-2xl font-display font-bold text-sm transition-colors ${
                    role === r ? "bg-primary text-primary-foreground" : "bg-surface text-foreground"
                  }`}
                >
                  {r === "player" ? "لاعب" : r === "coach" ? "مدرب" : "أكاديمية"}
                </button>
              ))}
            </div>
          </div>
        )}

        <form onSubmit={handleEmail} className="mt-6 space-y-3">
          {mode === "signup" && (
            <div className="relative">
              <UserIcon className="absolute right-4 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
              <input
                required
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="الاسم الكامل"
                className="w-full h-14 bg-surface rounded-2xl pr-11 pl-4 text-sm font-medium outline-none focus:ring-2 focus:ring-primary/30"
              />
            </div>
          )}
          <div className="relative">
            <Mail className="absolute right-4 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
            <input
              required
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="البريد الإلكتروني"
              className="w-full h-14 bg-surface rounded-2xl pr-11 pl-4 text-sm font-medium outline-none focus:ring-2 focus:ring-primary/30"
              dir="ltr"
            />
          </div>
          <div className="relative">
            <Lock className="absolute right-4 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
            <input
              required
              type="password"
              minLength={6}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="كلمة المرور"
              className="w-full h-14 bg-surface rounded-2xl pr-11 pl-4 text-sm font-medium outline-none focus:ring-2 focus:ring-primary/30"
              dir="ltr"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full h-14 rounded-2xl bg-primary text-primary-foreground font-display font-bold shadow-lg shadow-primary/30 disabled:opacity-60"
          >
            {loading ? "جارٍ..." : mode === "login" ? "دخول" : "إنشاء حساب"}
          </button>
        </form>

        <div className="flex items-center gap-3 my-6">
          <div className="h-px flex-1 bg-border" />
          <span className="text-xs text-muted-foreground">أو</span>
          <div className="h-px flex-1 bg-border" />
        </div>

        <button
          onClick={handleGoogle}
          disabled={loading}
          className="w-full h-14 rounded-2xl bg-surface border border-border font-display font-bold flex items-center justify-center gap-2 text-sm"
        >
          <svg viewBox="0 0 24 24" className="size-5"><path fill="#4285F4" d="M22.5 12.3c0-.8-.1-1.6-.2-2.3H12v4.5h5.9c-.3 1.4-1 2.5-2.2 3.3v2.7h3.5c2-1.9 3.3-4.7 3.3-8.2z"/><path fill="#34A853" d="M12 23c2.9 0 5.4-1 7.2-2.6l-3.5-2.7c-1 .7-2.2 1.1-3.7 1.1-2.9 0-5.3-1.9-6.2-4.5H2.2v2.8C4 20.4 7.7 23 12 23z"/><path fill="#FBBC05" d="M5.8 14.3c-.2-.7-.4-1.4-.4-2.3s.1-1.5.4-2.3V6.9H2.2C1.4 8.4 1 10.2 1 12s.4 3.6 1.2 5.1l3.6-2.8z"/><path fill="#EA4335" d="M12 5.4c1.6 0 3.1.6 4.2 1.6l3.1-3.1C17.4 2 14.9 1 12 1 7.7 1 4 3.6 2.2 6.9l3.6 2.8C6.7 7.3 9.1 5.4 12 5.4z"/></svg>
          تسجيل الدخول بحساب Google
        </button>

        <p className="text-center text-sm text-muted-foreground mt-6">
          {mode === "login" ? "ليس لديك حساب؟ " : "لديك حساب بالفعل؟ "}
          <button
            type="button"
            onClick={() => setMode(mode === "login" ? "signup" : "login")}
            className="text-primary font-bold"
          >
            {mode === "login" ? "إنشاء حساب" : "تسجيل دخول"}
          </button>
        </p>
      </div>
    </PhoneShell>
  );
}