import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { PhoneShell } from "@/components/PhoneShell";
import { CheckCircle, ArrowRight, Heart, Target, Calendar } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/player-onboarding")({
  component: PlayerOnboarding,
});

function PlayerOnboarding() {
  const navigate = useNavigate();
  const [user, setUser] = useState<any>(null);
  const [step, setStep] = useState(0);
  const [age, setAge] = useState("");
  const [level, setLevel] = useState("بداية");
  const [favoriteSports, setFavoriteSports] = useState<string[]>([]);
  const [goals, setGoals] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (data.user) {
        setUser(data.user);
      } else {
        navigate({ to: "/auth" });
      }
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

  const toggleSport = (sportName: string) => {
    if (favoriteSports.includes(sportName)) {
      setFavoriteSports(favoriteSports.filter((s) => s !== sportName));
    } else {
      setFavoriteSports([...favoriteSports, sportName]);
    }
  };

  async function handleComplete(e: React.FormEvent) {
    e.preventDefault();
    if (!user?.id) return;

    if (!age) {
      toast.error("يرجى إدخال العمر");
      return;
    }
    if (favoriteSports.length === 0) {
      toast.error("اختر رياضة واحدة على الأقل");
      return;
    }

    setLoading(true);
    try {
      // Update profile with player-specific data
      const { error: profileError } = await supabase
        .from("profiles")
        .update({
          onboarded: true,
          birth_date: new Date(new Date().getFullYear() - parseInt(age), 0, 1)
            .toISOString()
            .split("T")[0],
        })
        .eq("id", user.id);

      if (profileError) throw profileError;

      // Store player preferences
      const { error: playerError } = await supabase
        .from("player_preferences")
        .upsert({
          player_id: user.id,
          level,
          favorite_sports: favoriteSports,
          fitness_goals: goals,
        });

      if (playerError && playerError.code !== "PGRST116") throw playerError;

      toast.success("تم إنهاء الإعداد بنجاح!");
      setTimeout(() => navigate({ to: "/home" }), 1500);
    } catch (err) {
      console.error(err);
      toast.error(err instanceof Error ? err.message : "خطأ في الحفظ");
    } finally {
      setLoading(false);
    }
  }

  return (
    <PhoneShell>
      <div className="px-5 pt-6 pb-8 min-h-screen flex flex-col">
        {/* Progress Indicator */}
        <div className="mb-8">
          <div className="flex justify-between mb-2">
            {[0, 1, 2].map((s) => (
              <div
                key={s}
                className={`h-1 flex-1 rounded-full mx-1 transition-colors ${
                  s <= step ? "bg-primary" : "bg-border"
                }`}
              />
            ))}
          </div>
          <p className="text-xs text-muted-foreground text-center">
            الخطوة {step + 1} من 3
          </p>
        </div>

        {/* Step 0: Age & Level */}
        {step === 0 && (
          <div className="flex-1 flex flex-col justify-center">
            <h1 className="font-display font-bold text-3xl mb-2">معلوماتك الأساسية</h1>
            <p className="text-muted-foreground text-sm mb-8">
              ساعدنا نفهمك أحسن عشان نقدملك الخيارات الأنسب
            </p>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                if (age) setStep(1);
              }}
              className="space-y-4 flex-1 flex flex-col justify-center"
            >
              <div>
                <label className="block text-xs font-bold text-muted-foreground mb-2">
                  <Calendar className="inline size-4 mr-1" />
                  العمر
                </label>
                <input
                  required
                  type="number"
                  min="5"
                  max="100"
                  value={age}
                  onChange={(e) => setAge(e.target.value)}
                  placeholder="مثلاً: 25"
                  className="w-full h-12 bg-surface rounded-2xl px-4 text-sm outline-none focus:ring-2 focus:ring-primary/30"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-muted-foreground mb-2">
                  <Target className="inline size-4 mr-1" />
                  مستوى المهارة الحالي
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {["بداية", "متوسط", "متقدم", "احترافي"].map((l) => (
                    <button
                      key={l}
                      type="button"
                      onClick={() => setLevel(l)}
                      className={`h-11 rounded-2xl font-display font-bold text-sm transition-all ${
                        level === l
                          ? "bg-primary text-primary-foreground shadow-lg shadow-primary/30"
                          : "bg-surface hover:bg-background"
                      }`}
                    >
                      {l}
                    </button>
                  ))}
                </div>
              </div>

              <button
                type="submit"
                className="h-12 rounded-2xl bg-primary text-primary-foreground font-display font-bold shadow-lg shadow-primary/30 flex items-center justify-center gap-2 mt-auto"
              >
                التالي
                <ArrowRight className="size-4" />
              </button>
            </form>
          </div>
        )}

        {/* Step 1: Sports Selection */}
        {step === 1 && (
          <div className="flex-1 flex flex-col justify-center">
            <h1 className="font-display font-bold text-3xl mb-2">رياضاتك المفضلة</h1>
            <p className="text-muted-foreground text-sm mb-8">
              اختر رياضة واحدة أو أكتر اللي تحب
            </p>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                if (favoriteSports.length > 0) setStep(2);
              }}
              className="space-y-4 flex-1 flex flex-col justify-center"
            >
              <div className="grid grid-cols-2 gap-2">
                {sports.map((sport: any) => (
                  <button
                    key={sport.id}
                    type="button"
                    onClick={() => toggleSport(sport.name_ar)}
                    className={`h-12 rounded-2xl font-display font-bold text-sm transition-all truncate px-2 ${
                      favoriteSports.includes(sport.name_ar)
                        ? "bg-primary text-primary-foreground shadow-lg shadow-primary/30"
                        : "bg-surface hover:bg-background"
                    }`}
                  >
                    {sport.emoji} {sport.name_ar}
                  </button>
                ))}
              </div>

              <div className="flex gap-2 mt-auto">
                <button
                  type="button"
                  onClick={() => setStep(0)}
                  className="flex-1 h-12 rounded-2xl bg-background border border-border font-display font-bold text-sm hover:bg-surface transition-colors"
                >
                  رجوع
                </button>
                <button
                  type="submit"
                  disabled={favoriteSports.length === 0}
                  className="flex-1 h-12 rounded-2xl bg-primary text-primary-foreground font-display font-bold shadow-lg shadow-primary/30 disabled:opacity-60 flex items-center justify-center gap-2"
                >
                  التالي
                  <ArrowRight className="size-4" />
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Step 2: Goals */}
        {step === 2 && (
          <div className="flex-1 flex flex-col justify-center">
            <h1 className="font-display font-bold text-3xl mb-2">أهدافك</h1>
            <p className="text-muted-foreground text-sm mb-8">
              حدثنا عن أهدافك الرياضية (اختياري)
            </p>

            <form
              onSubmit={handleComplete}
              className="space-y-4 flex-1 flex flex-col justify-center"
            >
              <div>
                <textarea
                  value={goals}
                  onChange={(e) => setGoals(e.target.value)}
                  placeholder="مثلاً: أريد أن أنقص وزني وأصبح أقوى..."
                  className="w-full h-24 bg-surface rounded-2xl p-4 text-sm outline-none focus:ring-2 focus:ring-primary/30 resize-none"
                />
              </div>

              <div className="flex gap-2 mt-auto">
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  className="flex-1 h-12 rounded-2xl bg-background border border-border font-display font-bold text-sm hover:bg-surface transition-colors"
                >
                  رجوع
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 h-12 rounded-2xl bg-primary text-primary-foreground font-display font-bold shadow-lg shadow-primary/30 disabled:opacity-60 flex items-center justify-center gap-2"
                >
                  {loading ? "جارٍ..." : "إنهاء الإعداد"}
                  <CheckCircle className="size-4" />
                </button>
              </div>
            </form>
          </div>
        )}
      </div>
    </PhoneShell>
  );
}
