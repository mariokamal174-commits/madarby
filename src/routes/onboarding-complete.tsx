import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { PhoneShell } from "@/components/PhoneShell";
import { CheckCircle, ArrowRight } from "lucide-react";

export const Route = createFileRoute("/onboarding-complete")({
  component: OnboardingComplete,
});

function OnboardingComplete() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);

  async function handleContinue() {
    setLoading(true);
    try {
      const { data } = await supabase.auth.getUser();
      if (data.user) {
        // Mark profile as onboarded
        await supabase
          .from("profiles")
          .update({ onboarded: true })
          .eq("id", data.user.id);
      }
      navigate({ to: "/home" });
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  return (
    <PhoneShell>
      <div className="min-h-screen flex flex-col items-center justify-center px-5">
        <div className="text-center">
          <div className="relative inline-block mb-6">
            <div className="absolute inset-0 bg-primary/20 rounded-full blur-xl animate-pulse" />
            <CheckCircle className="relative size-20 text-primary" />
          </div>

          <h1 className="font-display font-bold text-3xl mb-3">مرحباً بك! 🎉</h1>
          <p className="text-muted-foreground text-sm mb-8 leading-relaxed">
            تم إنشاء حسابك بنجاح. ستجد هنا كل ما تحتاجه للبدء في رحلتك الرياضية
          </p>

          <div className="bg-surface rounded-3xl p-6 mb-8 text-right">
            <h2 className="font-display font-bold text-lg mb-4">الخطوات التالية</h2>
            <div className="space-y-3">
              <div className="flex gap-3">
                <span className="text-primary font-bold">1</span>
                <div className="text-sm">استكمل بيانات ملفك الشخصي</div>
              </div>
              <div className="flex gap-3">
                <span className="text-primary font-bold">2</span>
                <div className="text-sm">ابحث عن المدربين والأكاديميات المفضلين</div>
              </div>
              <div className="flex gap-3">
                <span className="text-primary font-bold">3</span>
                <div className="text-sm">احجز جلسة تدريبية وابدأ تدريبك</div>
              </div>
            </div>
          </div>

          <button
            onClick={handleContinue}
            disabled={loading}
            className="w-full h-12 rounded-2xl bg-primary text-primary-foreground font-display font-bold shadow-lg shadow-primary/30 disabled:opacity-60 flex items-center justify-center gap-2"
          >
            {loading ? "جارٍ..." : "ابدأ الآن"}
            <ArrowRight className="size-4" />
          </button>
        </div>
      </div>
    </PhoneShell>
  );
}
