import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { PhoneShell } from "@/components/PhoneShell";
import { Upload, FileCheck, Check, Loader } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/coach-verification")({
  component: CoachVerification,
});

function CoachVerification() {
  const navigate = useNavigate();
  const [user, setUser] = useState<any>(null);
  const [certificates, setCertificates] = useState<File[]>([]);
  const [licenseCard, setLicenseCard] = useState<File | null>(null);
  const [bio, setBio] = useState("");
  const [pricePerSession, setPricePerSession] = useState("150");
  const [loading, setLoading] = useState(false);
  const [completed, setCompleted] = useState(false);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (data.user) {
        setUser(data.user);
      } else {
        navigate({ to: "/auth" });
      }
    });
  }, [navigate]);

  const handleCertificateUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setCertificates([...certificates, ...Array.from(e.target.files)]);
    }
  };

  const handleLicenseUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.[0]) {
      setLicenseCard(e.target.files[0]);
    }
  };

  const removeCertificate = (index: number) => {
    setCertificates(certificates.filter((_, i) => i !== index));
  };

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!user?.id) return;

    if (certificates.length === 0) {
      toast.error("يجب تحميل شهادة واحدة على الأقل");
      return;
    }
    if (!licenseCard) {
      toast.error("يجب تحميل كارنيه النقابة");
      return;
    }

    setLoading(true);
    try {
      // Upload certificates
      const certUrls: string[] = [];
      for (const cert of certificates) {
        const fileName = `${user.id}/certs/${Date.now()}-${cert.name}`;
        const { error: uploadError } = await supabase.storage
          .from("coach-documents")
          .upload(fileName, cert);
        if (uploadError) throw uploadError;

        const { data } = supabase.storage.from("coach-documents").getPublicUrl(fileName);
        certUrls.push(data.publicUrl);
      }

      // Upload license card
      const licenseFileName = `${user.id}/license/${Date.now()}-${licenseCard.name}`;
      const { error: licenseError } = await supabase.storage
        .from("coach-documents")
        .upload(licenseFileName, licenseCard);
      if (licenseError) throw licenseError;

      const { data: licenseData } = supabase.storage
        .from("coach-documents")
        .getPublicUrl(licenseFileName);

      // Update coach profile
      const { error: updateError } = await supabase
        .from("coaches")
        .update({
          bio_ar: bio,
          price_per_session: parseFloat(pricePerSession),
          verified: false, // Waiting for admin approval
        })
        .eq("user_id", user.id);

      if (updateError) throw updateError;

      // Store verification documents
      const { error: docsError } = await supabase
        .from("coach_verifications")
        .insert({
          coach_id: user.id,
          certificates: certUrls,
          status: "pending",
          submitted_at: new Date().toISOString(),
        });

      if (docsError) throw docsError;

      toast.success("تم تقديم وثائقك للمراجعة. سيتم التحقق منها قريباً");
      setCompleted(true);
      setTimeout(() => navigate({ to: "/home" }), 2000);
    } catch (err) {
      console.error(err);
      toast.error(err instanceof Error ? err.message : "خطأ في التحميل");
    } finally {
      setLoading(false);
    }
  }

  if (completed) {
    return (
      <PhoneShell>
        <div className="min-h-screen flex flex-col items-center justify-center px-5">
          <div className="text-center">
            <div className="relative inline-block mb-6">
              <div className="absolute inset-0 bg-green-500/20 rounded-full blur-xl animate-pulse" />
              <Check className="relative size-20 text-green-600" />
            </div>
            <h1 className="font-display font-bold text-3xl mb-3">تم التقديم! ✓</h1>
            <p className="text-muted-foreground text-sm">
              شكراً لتقديمك وثائقك. سيتم مراجعتها من قبل فريقنا قريباً
            </p>
          </div>
        </div>
      </PhoneShell>
    );
  }

  return (
    <PhoneShell>
      <div className="px-5 pt-6 pb-8">
        <h1 className="font-display font-bold text-2xl mb-2">التحقق من الحساب</h1>
        <p className="text-muted-foreground text-xs mb-6">
          قم بتحميل وثائقك للتحقق من حسابك
        </p>

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Bio */}
          <div>
            <label className="block text-xs font-bold text-muted-foreground mb-2">
              نبذة مهنية عنك
            </label>
            <textarea
              required
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              placeholder="اكتب نبذة عن خبرتك وتخصصاتك..."
              className="w-full h-24 bg-surface rounded-2xl p-4 text-sm outline-none focus:ring-2 focus:ring-primary/30 resize-none"
            />
          </div>

          {/* Price per session */}
          <div>
            <label className="block text-xs font-bold text-muted-foreground mb-2">
              سعر الجلسة (جنيه مصري)
            </label>
            <div className="relative">
              <input
                required
                type="number"
                min="50"
                step="10"
                value={pricePerSession}
                onChange={(e) => setPricePerSession(e.target.value)}
                className="w-full h-12 bg-surface rounded-2xl px-4 text-sm outline-none focus:ring-2 focus:ring-primary/30"
              />
            </div>
          </div>

          {/* Certificates */}
          <div>
            <label className="block text-xs font-bold text-muted-foreground mb-2">
              📜 الشهادات والدورات
            </label>
            <label className="flex flex-col items-center justify-center w-full h-32 bg-surface border-2 border-dashed border-border rounded-2xl cursor-pointer hover:bg-background transition-colors">
              <div className="flex flex-col items-center justify-center pt-5 pb-6">
                <Upload className="size-5 text-primary mb-2" />
                <p className="text-xs font-bold">أضفِ الشهادات</p>
                <p className="text-[10px] text-muted-foreground">PNG أو JPG</p>
              </div>
              <input
                type="file"
                multiple
                accept="image/*"
                onChange={handleCertificateUpload}
                className="hidden"
              />
            </label>
            {certificates.length > 0 && (
              <div className="mt-3 space-y-2">
                {certificates.map((cert, idx) => (
                  <div
                    key={idx}
                    className="flex items-center justify-between bg-surface rounded-2xl p-3"
                  >
                    <div className="flex items-center gap-2">
                      <FileCheck className="size-4 text-green-600" />
                      <span className="text-xs font-bold truncate">{cert.name}</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => removeCertificate(idx)}
                      className="text-xs text-red-600 font-bold hover:underline"
                    >
                      حذف
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* License Card */}
          <div>
            <label className="block text-xs font-bold text-muted-foreground mb-2">
              🏢 كارنيه النقابة / الترخيص
            </label>
            <label className="flex flex-col items-center justify-center w-full h-32 bg-surface border-2 border-dashed border-border rounded-2xl cursor-pointer hover:bg-background transition-colors">
              <div className="flex flex-col items-center justify-center pt-5 pb-6">
                <Upload className="size-5 text-primary mb-2" />
                <p className="text-xs font-bold">أضفِ كارنيه النقابة</p>
                <p className="text-[10px] text-muted-foreground">PNG أو JPG</p>
              </div>
              <input
                type="file"
                accept="image/*"
                onChange={handleLicenseUpload}
                className="hidden"
              />
            </label>
            {licenseCard && (
              <div className="mt-3 flex items-center gap-2 bg-surface rounded-2xl p-3">
                <FileCheck className="size-4 text-green-600" />
                <span className="text-xs font-bold truncate">{licenseCard.name}</span>
                <button
                  type="button"
                  onClick={() => setLicenseCard(null)}
                  className="mr-auto text-xs text-red-600 font-bold hover:underline"
                >
                  حذف
                </button>
              </div>
            )}
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full h-12 rounded-2xl bg-primary text-primary-foreground font-display font-bold shadow-lg shadow-primary/30 disabled:opacity-60 flex items-center justify-center gap-2 mt-6"
          >
            {loading ? (
              <>
                <Loader className="size-4 animate-spin" />
                جارٍ الرفع...
              </>
            ) : (
              <>
                <Check className="size-4" />
                تقديم الوثائق
              </>
            )}
          </button>
        </form>
      </div>
    </PhoneShell>
  );
}
