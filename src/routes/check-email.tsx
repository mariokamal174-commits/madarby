import { createFileRoute, Link } from "@tanstack/react-router";
import { PhoneShell } from "@/components/PhoneShell";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export const Route = createFileRoute("/check-email")({
  component: CheckEmailPage,
});

export default function CheckEmailPage() {
  const [email, setEmail] = useState<string>("");
  const [sending, setSending] = useState(false);

  useEffect(() => {
    try {
      const e = localStorage.getItem("pendingEmail");
      if (e) setEmail(e);
    } catch {}
  }, []);

  async function handleResend() {
    if (!email) return toast.error("البريد غير متوفر لإعادة الإرسال");
    setSending(true);
    try {
      // Try sending a magic link/OTP as a generic resend attempt. Works if your Supabase project
      // has email OTP / magic link enabled. If not, user should use dashboard to enable auto-confirm.
      const { error } = await supabase.auth.signInWithOtp({ email });
      if (error) throw error;
      toast.success("تم إرسال رسالة تحقق جديدة إلى بريدك إذا كان مسجلاً");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "فشل إعادة الإرسال. تحقق من إعدادات Supabase.");
    } finally {
      setSending(false);
    }
  }

  function openProvider(provider: "gmail" | "outlook" | "yahoo") {
    const urls: Record<string, string> = {
      gmail: "https://mail.google.com",
      outlook: "https://outlook.live.com/mail/",
      yahoo: "https://mail.yahoo.com",
    };
    window.open(urls[provider], "_blank");
  }

  return (
    <PhoneShell>
      <div className="min-h-screen flex flex-col px-5 pt-6 pb-8 items-center text-center">
        <h1 className="font-display font-bold text-2xl mb-2">تحقق من بريدك</h1>
        <p className="text-muted-foreground text-sm mb-4">لقد أرسلنا رسالة تفعيل إلى البريد التالي:</p>
        <p className="font-bold mb-4">{email || "(لم يتم العثور على بريد)"}</p>

        <div className="w-full max-w-xs mb-4">
          <button onClick={() => openProvider("gmail")} className="w-full h-12 rounded-2xl bg-surface border border-border mb-2">فتح Gmail</button>
          <button onClick={() => openProvider("outlook")} className="w-full h-12 rounded-2xl bg-surface border border-border mb-2">فتح Outlook</button>
          <button onClick={() => openProvider("yahoo")} className="w-full h-12 rounded-2xl bg-surface border border-border">فتح Yahoo Mail</button>
        </div>

        <div className="w-full max-w-xs mb-4">
          <button onClick={handleResend} disabled={sending} className="w-full h-12 rounded-2xl bg-primary text-primary-foreground font-display font-bold flex items-center justify-center mb-2">
            {sending ? "جارٍ الإرسال..." : "إعادة إرسال رسالة التحقق"}
          </button>
          <Link to="/auth" className="w-full h-12 rounded-2xl bg-background border border-border font-display font-bold flex items-center justify-center">لقد فعلت البريد، اذهب لتسجيل الدخول</Link>
        </div>
      </div>
    </PhoneShell>
  );
}
