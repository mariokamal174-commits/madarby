import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { PhoneShell } from "@/components/PhoneShell";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable";
import { getDefaultRouteForRole } from "@/lib/role-routing";
import { toast } from "sonner";
import { ArrowRight, Mail, Lock, User as UserIcon, Phone, Calendar, Zap, Award, MapPin, Upload, FileCheck, Image as ImageIcon } from "lucide-react";

export const Route = createFileRoute("/auth")({
  component: AuthPage,
});

type Role = "player" | "coach" | "academy";

async function ensureProfileAndRole(userId: string, role: string, metadata: Record<string, any> = {}) {
  const fullName = metadata.full_name ?? metadata.fullName ?? "";
  const phone = metadata.phone ?? "";
  const city = metadata.city ?? "";

  const { error: profileError } = await supabase.from("profiles").upsert(
    {
      id: userId,
      full_name: fullName,
      phone,
      city,
      primary_role: role,
    },
    { onConflict: "id" }
  );
  if (profileError) {
    console.error("Profile upsert failed", profileError);
  }

  const { error: roleError } = await supabase.from("user_roles").upsert(
    { user_id: userId, role },
    { onConflict: "user_id,role" }
  );
  if (roleError) {
    console.error("Role upsert failed", roleError);
  }
}

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
  const [coachPhoto, setCoachPhoto] = useState<File | null>(null);
  const [coachCertificates, setCoachCertificates] = useState<File[]>([]);
  const [coachLicense, setCoachLicense] = useState<File | null>(null);
  const [playerAge, setPlayerAge] = useState("");
  const [playerLevel, setPlayerLevel] = useState("بداية");
  const [playerSport, setPlayerSport] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(async ({ data }) => {
      if (!data.session) return;

      const { data: profile } = await supabase
        .from("profiles")
        .select("primary_role")
        .eq("id", data.session.user.id)
        .single();

      navigate({ to: getDefaultRouteForRole(profile?.primary_role) as any });
    });
  }, [navigate]);

  const { data: sports = [] } = useQuery({
    queryKey: ["sports"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("sports")
        .select("id, name_ar, emoji")
        .order("sort_order");
      if (error) throw error;
      return data || [];
    },
  });

  async function handleEmail(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      if (mode === "signup") {
        if (!email.trim() || !password.trim()) {
          toast.error("يرجى إدخال البريد وكلمة المرور");
          setLoading(false);
          return;
        }

        if (password.length < 6) {
          toast.error("كلمة المرور يجب أن تكون 6 أحرف على الأقل");
          setLoading(false);
          return;
        }

        if (role === "coach") {
          if (!coachPhoto) { toast.error("يجب رفع صورة شخصية"); setLoading(false); return; }
          if (coachCertificates.length === 0) { toast.error("يجب رفع شهادة واحدة على الأقل"); setLoading(false); return; }
          if (!coachLicense) { toast.error("يجب رفع كارنيه النقابة"); setLoading(false); return; }
        }

        const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
          email: email.trim(),
          password,
          options: {
            emailRedirectTo: `${window.location.origin}/home`,
            data: {
              full_name: fullName,
              primary_role: role,
              phone,
              city,
              ...(role === "coach" && { specialty: coachSpecialty, experience: coachExperience, level: coachLevel }),
              ...(role === "player" && { age: playerAge, level: playerLevel, sport: playerSport }),
            },
          },
        });
        if (signUpError) throw signUpError;

        const userId = signUpData.user?.id;
        if (userId) {
          await ensureProfileAndRole(userId, role, { full_name: fullName, phone, city });

          if (role === "coach") {
            let avatarUrl: string | null = null;
            if (coachPhoto) {
              const path = `${userId}/avatar/${Date.now()}-${coachPhoto.name}`;
              const { error: upErr } = await supabase.storage.from("coach-documents").upload(path, coachPhoto);
              if (upErr) {
                console.error("Avatar upload failed", upErr);
              } else {
                avatarUrl = supabase.storage.from("coach-documents").getPublicUrl(path).data.publicUrl;
                await supabase.from("profiles").update({ avatar_url: avatarUrl }).eq("id", userId);
              }
            }

            const { error: coachError } = await supabase.from("coaches").upsert({
              user_id: userId,
              full_name: fullName,
              title_ar: coachSpecialty,
              city,
              experience_years: parseInt(coachExperience) || 0,
              approved: false,
              verified: false,
              avatar_url: avatarUrl,
            }, { onConflict: "user_id" });
            if (coachError) {
              console.error("Coach upsert failed", coachError);
            }

            const { data: existingVerification } = await supabase
              .from("coach_verifications")
              .select("id")
              .eq("coach_id", userId)
              .limit(1)
              .maybeSingle();

            if (!existingVerification) {
              const certUrls: string[] = [];
              for (const cert of coachCertificates) {
                const path = `${userId}/certs/${Date.now()}-${cert.name}`;
                const { error: e } = await supabase.storage.from("coach-documents").upload(path, cert);
                if (e) {
                  console.error("Certificate upload failed", e);
                  continue;
                }
                certUrls.push(supabase.storage.from("coach-documents").getPublicUrl(path).data.publicUrl);
              }

              if (coachLicense) {
                const licPath = `${userId}/license/${Date.now()}-${coachLicense.name}`;
                const { error: licErr } = await supabase.storage.from("coach-documents").upload(licPath, coachLicense);
                if (licErr) {
                  console.error("License upload failed", licErr);
                } else {
                  const licenseUrl = supabase.storage.from("coach-documents").getPublicUrl(licPath).data.publicUrl;
                  const { error: vErr } = await supabase.from("coach_verifications").insert({
                    coach_id: userId,
                    certificates: certUrls,
                    license_card_url: licenseUrl,
                    status: "pending",
                  });
                  if (vErr) {
                    console.error("Verification insert failed", vErr);
                  }
                }
              }
            }
          }
        }

        toast.success("تم إنشاء الحساب بنجاح — راجع بريدك إذا كان التحقق مطلوبًا");
        navigate({ to: "/onboarding-complete" });
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;

        const { data: { user } } = await supabase.auth.getUser();
        if (!user?.id) throw new Error("لم يتم العثور على المستخدم");

        await ensureProfileAndRole(user.id, user.user_metadata?.primary_role ?? "player", {
          full_name: user.user_metadata?.full_name,
          phone: user.user_metadata?.phone,
          city: user.user_metadata?.city,
        });

        const { data: profile, error: profileError } = await supabase
          .from("profiles")
          .select("primary_role")
          .eq("id", user.id)
          .maybeSingle();

        if (profileError) throw profileError;

        navigate({ to: getDefaultRouteForRole(profile?.primary_role) as any });
      }
    } catch (err) {
      const errorMessage = err instanceof Error
        ? err.message
        : "حدث خطأ أثناء معالجة الطلب";
      const friendlyMessage = errorMessage.includes("Password")
        ? "كلمة المرور غير مناسبة. جرّب كلمة مرور أطول من 6 أحرف."
        : errorMessage.includes("already")
          ? "هذا البريد مستخدم بالفعل"
          : errorMessage;
      toast.error(friendlyMessage);
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
                  <option value="القاهرة">القاهرة</option>
                  <option value="الإسكندرية">الإسكندرية</option>
                  <option value="الجيزة">الجيزة</option>
                  <option value="الدقهلية">الدقهلية</option>
                  <option value="الغربية">الغربية</option>
                  <option value="المنيا">المنيا</option>
                  <option value="الفيوم">الفيوم</option>
                  <option value="بني سويف">بني سويف</option>
                  <option value="أسيوط">أسيوط</option>
                  <option value="سوهاج">سوهاج</option>
                  <option value="قنا">قنا</option>
                  <option value="الأقصر">الأقصر</option>
                  <option value="أسوان">أسوان</option>
                  <option value="البحر الأحمر">البحر الأحمر</option>
                  <option value="الإسماعيلية">الإسماعيلية</option>
                  <option value="بورسعيد">بورسعيد</option>
                  <option value="شمال سيناء">شمال سيناء</option>
                  <option value="جنوب سيناء">جنوب سيناء</option>
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
                    <select
                      required
                      value={playerSport}
                      onChange={(e) => setPlayerSport(e.target.value)}
                      className="w-full h-12 bg-surface rounded-2xl pr-11 pl-4 text-sm outline-none focus:ring-2 focus:ring-primary/30"
                    >
                      <option value="">اختر الرياضة المفضلة</option>
                      {sports.map((sport: any) => (
                        <option key={sport.id} value={sport.name_ar}>
                          {sport.emoji} {sport.name_ar}
                        </option>
                      ))}
                    </select>
                  </div>
                </>
              )}

              {/* Coach-specific fields */}
              {role === "coach" && (
                <>
                  <div className="relative">
                    <Award className="absolute right-4 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                    <select
                      required
                      value={coachSpecialty}
                      onChange={(e) => setCoachSpecialty(e.target.value)}
                      className="w-full h-12 bg-surface rounded-2xl pr-11 pl-4 text-sm outline-none focus:ring-2 focus:ring-primary/30"
                    >
                      <option value="">اختر التخصص</option>
                      {sports.map((sport: any) => (
                        <option key={sport.id} value={sport.name_ar}>
                          {sport.emoji} {sport.name_ar}
                        </option>
                      ))}
                    </select>
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

                  {/* Personal photo */}
                  <div>
                    <p className="text-xs font-bold text-muted-foreground mb-2">📸 صورة شخصية</p>
                    <label className="flex items-center justify-center w-full h-24 bg-surface border-2 border-dashed border-border rounded-2xl cursor-pointer hover:bg-background transition-colors">
                      {coachPhoto ? (
                        <div className="flex items-center gap-2">
                          <ImageIcon className="size-4 text-green-600" />
                          <span className="text-xs font-bold truncate max-w-[200px]">{coachPhoto.name}</span>
                        </div>
                      ) : (
                        <div className="flex flex-col items-center">
                          <Upload className="size-4 text-primary mb-1" />
                          <p className="text-xs font-bold">ارفع صورتك الشخصية</p>
                        </div>
                      )}
                      <input type="file" accept="image/*" className="hidden"
                        onChange={(e) => e.target.files?.[0] && setCoachPhoto(e.target.files[0])} />
                    </label>
                  </div>

                  {/* Certificates */}
                  <div>
                    <p className="text-xs font-bold text-muted-foreground mb-2">📜 صور الشهادات</p>
                    <label className="flex flex-col items-center justify-center w-full h-24 bg-surface border-2 border-dashed border-border rounded-2xl cursor-pointer hover:bg-background transition-colors">
                      <Upload className="size-4 text-primary mb-1" />
                      <p className="text-xs font-bold">
                        {coachCertificates.length > 0 ? `${coachCertificates.length} شهادة مرفقة` : "أضف الشهادات"}
                      </p>
                      <input type="file" multiple accept="image/*" className="hidden"
                        onChange={(e) => e.target.files && setCoachCertificates([...coachCertificates, ...Array.from(e.target.files)])} />
                    </label>
                    {coachCertificates.length > 0 && (
                      <div className="mt-2 space-y-1">
                        {coachCertificates.map((f, i) => (
                          <div key={i} className="flex items-center justify-between bg-surface rounded-xl px-3 py-2">
                            <div className="flex items-center gap-2 min-w-0">
                              <FileCheck className="size-3 text-green-600 shrink-0" />
                              <span className="text-[11px] truncate">{f.name}</span>
                            </div>
                            <button type="button" onClick={() => setCoachCertificates(coachCertificates.filter((_, x) => x !== i))} className="text-[11px] text-red-600 font-bold">حذف</button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* License card */}
                  <div>
                    <p className="text-xs font-bold text-muted-foreground mb-2">🏢 كارنيه النقابة</p>
                    <label className="flex items-center justify-center w-full h-24 bg-surface border-2 border-dashed border-border rounded-2xl cursor-pointer hover:bg-background transition-colors">
                      {coachLicense ? (
                        <div className="flex items-center gap-2">
                          <FileCheck className="size-4 text-green-600" />
                          <span className="text-xs font-bold truncate max-w-[200px]">{coachLicense.name}</span>
                        </div>
                      ) : (
                        <div className="flex flex-col items-center">
                          <Upload className="size-4 text-primary mb-1" />
                          <p className="text-xs font-bold">ارفع كارنيه النقابة</p>
                        </div>
                      )}
                      <input type="file" accept="image/*" className="hidden"
                        onChange={(e) => e.target.files?.[0] && setCoachLicense(e.target.files[0])} />
                    </label>
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