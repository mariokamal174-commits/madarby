import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { PhoneShell } from "@/components/PhoneShell";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable";
import { toast } from "sonner";
import { ArrowRight, Mail, Lock, User as UserIcon, Phone, Calendar, Zap, Award, MapPin } from "lucide-react";

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
  const [phone, setPhone] = useState("");
  const [city, setCity] = useState("");
  const [coachSpecialty, setCoachSpecialty] = useState<string>("");
  const [coachExperience, setCoachExperience] = useState("");
  const [coachLevel, setCoachLevel] = useState("بداية");
  const [playerAge, setPlayerAge] = useState("");
  const [playerLevel, setPlayerLevel] = useState("بداية");
  const [playerSport, setPlayerSport] = useState("");
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
        const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: `${window.location.origin}/home`,
            data: { 
              full_name: fullName,
              primary_role: role,
              phone,
              city,
              // Role-specific data
              ...(role === "coach" && { specialty: coachSpecialty, experience: coachExperience, level: coachLevel }),
              ...(role === "player" && { age: playerAge, level: playerLevel, sport: playerSport }),
            },
          },
        });
        if (signUpError) throw signUpError;

        // Create profile
        if (signUpData.user) {
          const { error: profileError } = await supabase.from("profiles").insert({
            id: signUpData.user.id,
            full_name: fullName,
            phone,
            city,
            primary_role: role,
          });
          if (profileError) throw profileError;

          // Create role-specific profile
          if (role === "coach") {
            const { error: coachError } = await supabase.from("coaches").insert({
              user_id: signUpData.user.id,
              full_name: fullName,
              title_ar: coachSpecialty,
              city,
              experience_years: parseInt(coachExperience) || 0,
              approved: true,
            });
            if (coachError) throw coachError;
          }
        }

        toast.success("تم إنشاء الحساب — تحقق من بريدك");
        // Redirect coaches to verification page
        if (role === "coach") {
          navigate({ to: "/coach-verification" });
        } else {
          navigate({ to: "/onboarding-complete" });
        }
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
      <div className="min-h-screen flex flex-col px-5 pt-6 pb-8">
        <Link to="/" className="size-10 rounded-full bg-surface flex items-center justify-center">
          <ArrowRight className="size-5" />
        </Link>

        <div className="mt-6">
          <h1 className="font-display font-bold text-3xl mb-2">
            {mode === "login" ? "أهلاً بعودتك" : "أنشئ حسابك"}
          </h1>
          <p className="text-muted-foreground text-xs">
            {mode === "login" ? "سجّل دخولك للمتابعة" : role === "player" ? "لاعب يبحث عن تدريب" : role === "coach" ? "مدرب معتمد" : "أكاديمية رياضية"}
          </p>
        </div>

        {mode === "signup" && (
          <div className="mt-6 bg-surface rounded-3xl p-4">
            <p className="text-xs font-bold text-muted-foreground mb-3">اختر نوع حسابك</p>
            <div className="space-y-2">
              {(["player", "coach", "academy"] as Role[]).map((r) => (
                <button
                  key={r}
                  type="button"
                  onClick={() => setRole(r)}
                  className={`w-full h-12 rounded-2xl font-display font-bold text-sm transition-all ${
                    role === r 
                      ? "bg-primary text-primary-foreground shadow-lg shadow-primary/30" 
                      : "bg-background text-foreground border border-border hover:bg-surface"
                  }`}
                >
                  {r === "player" ? "🎮 لاعب / متدرب" : r === "coach" ? "👨‍🏫 مدرب معتمد" : "🏢 أكاديمية رياضية"}
                </button>
              ))}
            </div>
          </div>
        )}

        <form onSubmit={handleEmail} className="mt-8 space-y-3 flex-1">
          {mode === "signup" && (
            <>
              <div className="relative">
                <UserIcon className="absolute right-4 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                <input
                  required
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="الاسم الكامل"
                  className="w-full h-12 bg-surface rounded-2xl pr-11 pl-4 text-sm outline-none focus:ring-2 focus:ring-primary/30"
                />
              </div>
              <div className="relative">
                <Mail className="absolute right-4 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                <input
                  required
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="البريد الإلكتروني"
                  className="w-full h-12 bg-surface rounded-2xl pr-11 pl-4 text-sm outline-none focus:ring-2 focus:ring-primary/30"
                  dir="ltr"
                />
              </div>
              <div className="relative">
                <Phone className="absolute right-4 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                <input
                  required
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="رقم الهاتف"
                  className="w-full h-12 bg-surface rounded-2xl pr-11 pl-4 text-sm outline-none focus:ring-2 focus:ring-primary/30"
                  dir="ltr"
                />
              </div>
              <div className="relative">
                <MapPin className="absolute right-4 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                <select
                  required
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  className="w-full h-12 bg-surface rounded-2xl pr-11 pl-4 text-sm outline-none focus:ring-2 focus:ring-primary/30"
                >
                  <option value="">اختر المدينة</option>
                  <option value="الرياض">الرياض</option>
                  <option value="جدة">جدة</option>
                  <option value="الدمام">الدمام</option>
                  <option value="الخبر">الخبر</option>
                  <option value="الظهران">الظهران</option>
                  <option value="الإحساء">الإحساء</option>
                  <option value="مكة">مكة</option>
                  <option value="المدينة">المدينة</option>
                </select>
              </div>

              {/* Player-specific fields */}
              {role === "player" && (
                <>
                  <div className="relative">
                    <Calendar className="absolute right-4 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                    <input
                      required
                      type="number"
                      min="5"
                      max="100"
                      value={playerAge}
                      onChange={(e) => setPlayerAge(e.target.value)}
                      placeholder="العمر"
                      className="w-full h-12 bg-surface rounded-2xl pr-11 pl-4 text-sm outline-none focus:ring-2 focus:ring-primary/30"
                    />
                  </div>
                  <div className="relative">
                    <Zap className="absolute right-4 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                    <select
                      required
                      value={playerLevel}
                      onChange={(e) => setPlayerLevel(e.target.value)}
                      className="w-full h-12 bg-surface rounded-2xl pr-11 pl-4 text-sm outline-none focus:ring-2 focus:ring-primary/30"
                    >
                      <option value="بداية">بداية</option>
                      <option value="متوسط">متوسط</option>
                      <option value="متقدم">متقدم</option>
                      <option value="احترافي">احترافي</option>
                    </select>
                  </div>
                  <div className="relative">
                    <Award className="absolute right-4 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                    <input
                      type="text"
                      value={playerSport}
                      onChange={(e) => setPlayerSport(e.target.value)}
                      placeholder="الرياضة المفضلة"
                      className="w-full h-12 bg-surface rounded-2xl pr-11 pl-4 text-sm outline-none focus:ring-2 focus:ring-primary/30"
                    />
                  </div>
                </>
              )}

              {/* Coach-specific fields */}
              {role === "coach" && (
                <>
                  <div className="relative">
                    <Award className="absolute right-4 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                    <input
                      required
                      type="text"
                      value={coachSpecialty}
                      onChange={(e) => setCoachSpecialty(e.target.value)}
                      placeholder="التخصص (كرة قدم، سباحة، إلخ)"
                      className="w-full h-12 bg-surface rounded-2xl pr-11 pl-4 text-sm outline-none focus:ring-2 focus:ring-primary/30"
                    />
                  </div>
                  <div className="relative">
                    <Calendar className="absolute right-4 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                    <input
                      required
                      type="number"
                      min="0"
                      value={coachExperience}
                      onChange={(e) => setCoachExperience(e.target.value)}
                      placeholder="سنوات الخبرة"
                      className="w-full h-12 bg-surface rounded-2xl pr-11 pl-4 text-sm outline-none focus:ring-2 focus:ring-primary/30"
                    />
                  </div>
                  <div className="relative">
                    <Zap className="absolute right-4 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                    <select
                      value={coachLevel}
                      onChange={(e) => setCoachLevel(e.target.value)}
                      className="w-full h-12 bg-surface rounded-2xl pr-11 pl-4 text-sm outline-none focus:ring-2 focus:ring-primary/30"
                    >
                      <option value="بداية">بداية</option>
                      <option value="متوسط">متوسط</option>
                      <option value="متقدم">متقدم</option>
                      <option value="احترافي">احترافي</option>
                    </select>
                  </div>
                </>
              )}

              <div className="relative">
                <Lock className="absolute right-4 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                <input
                  required
                  type="password"
                  minLength={6}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="كلمة المرور"
                  className="w-full h-12 bg-surface rounded-2xl pr-11 pl-4 text-sm outline-none focus:ring-2 focus:ring-primary/30"
                  dir="ltr"
                />
              </div>
            </>
          )}

          {mode === "login" && (
            <>
              <div className="relative">
                <Mail className="absolute right-4 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                <input
                  required
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="البريد الإلكتروني"
                  className="w-full h-12 bg-surface rounded-2xl pr-11 pl-4 text-sm outline-none focus:ring-2 focus:ring-primary/30"
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
                  className="w-full h-12 bg-surface rounded-2xl pr-11 pl-4 text-sm outline-none focus:ring-2 focus:ring-primary/30"
                  dir="ltr"
                />
              </div>
            </>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full h-12 rounded-2xl bg-primary text-primary-foreground font-display font-bold shadow-lg shadow-primary/30 disabled:opacity-60 mt-4"
          >
            {loading ? "جارٍ..." : mode === "login" ? "دخول" : "إنشاء حساب"}
          </button>
        </form>

        <div className={mode === "login" ? "flex items-center gap-3 my-6" : "hidden"}>
          <div className="h-px flex-1 bg-border" />
          <span className="text-xs text-muted-foreground">أو</span>
          <div className="h-px flex-1 bg-border" />
        </div>

        <button
          onClick={handleGoogle}
          disabled={loading}
          className={mode === "login" ? "w-full h-12 rounded-2xl bg-surface border border-border font-display font-bold flex items-center justify-center gap-2 text-sm" : "hidden"}
        >
          <svg viewBox="0 0 24 24" className="size-5"><path fill="#4285F4" d="M22.5 12.3c0-.8-.1-1.6-.2-2.3H12v4.5h5.9c-.3 1.4-1 2.5-2.2 3.3v2.7h3.5c2-1.9 3.3-4.7 3.3-8.2z"/><path fill="#34A853" d="M12 23c2.9 0 5.4-1 7.2-2.6l-3.5-2.7c-1 .7-2.2 1.1-3.7 1.1-2.9 0-5.3-1.9-6.2-4.5H2.2v2.8C4 20.4 7.7 23 12 23z"/><path fill="#FBBC05" d="M5.8 14.3c-.2-.7-.4-1.4-.4-2.3s.1-1.5.4-2.3V6.9H2.2C1.4 8.4 1 10.2 1 12s.4 3.6 1.2 5.1l3.6-2.8z"/><path fill="#EA4335" d="M12 5.4c1.6 0 3.1.6 4.2 1.6l3.1-3.1C17.4 2 14.9 1 12 1 7.7 1 4 3.6 2.2 6.9l3.6 2.8C6.7 7.3 9.1 5.4 12 5.4z"/></svg>
          تسجيل الدخول بحساب Google
        </button>

        <p className="text-center text-sm text-muted-foreground mt-6">
          {mode === "login" ? "ليس لديك حساب؟ " : "لديك حساب بالفعل؟ "}
          <button
            type="button"
            onClick={() => {
              setMode(mode === "login" ? "signup" : "login");
              // Reset form when switching modes
              if (mode === "login") {
                setEmail("");
                setPassword("");
              }
            }}
            className="text-primary font-bold"
          >
            {mode === "login" ? "إنشاء حساب" : "تسجيل دخول"}
          </button>
        </p>
      </div>
    </PhoneShell>
  );
}