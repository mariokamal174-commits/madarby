import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Users, Trophy, BarChart3, CreditCard, Gift, AlertCircle, TrendingUp, Check, X, Clock, ExternalLink } from "lucide-react";
import { toast } from "sonner";
import { useState } from "react";

export const Route = createFileRoute("/_authenticated/admin-dashboard")({
  component: AdminDashboardPage,
});

function AdminDashboardPage() {
  const [activeSection, setActiveSection] = useState<"users" | "sports" | "bookings" | "payments" | "promotions" | "reports" | "complaints">("users");
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  // Fetch pending coach verifications
  const verificationsQ = useQuery({
    queryKey: ["coach_verifications_pending"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("coach_verifications")
        .select("id, coach_id, certificates, license_card_url, status, submitted_at")
        .eq("status", "pending")
        .order("submitted_at", { ascending: false });
      
      if (error) throw error;
      
      const verificationsWithCoaches = await Promise.all(
        (data || []).map(async (v: any) => {
          const { data: coach } = await supabase
            .from("coaches")
            .select("id, full_name, title_ar, bio_ar, city, avatar_url, user_id")
            .eq("user_id", v.coach_id)
            .single();
          return { ...v, coach };
        })
      );
      
      return verificationsWithCoaches || [];
    },
  });

  // Fetch pending bookings
  const bookingsQ = useQuery({
    queryKey: ["bookings_pending"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("bookings")
        .select("*, coaches:coach_id(full_name), profiles:player_id(full_name)")
        .eq("status", "pending")
        .order("created_at", { ascending: false })
        .limit(10);
      if (error) throw error;
      return data || [];
    },
  });

  // Fetch stats
  const statsQ = useQuery({
    queryKey: ["admin_stats"],
    queryFn: async () => {
      const { data: users } = await supabase.from("profiles").select("id");
      const { data: coaches } = await supabase.from("coaches").select("id").eq("approved", true);
      const { data: bookings } = await supabase.from("bookings").select("price").eq("status", "completed");
      
      const totalRevenue = (bookings || []).reduce((sum: number, b: any) => sum + Number(b.price || 0), 0);
      
      return {
        totalUsers: users?.length || 0,
        totalCoaches: coaches?.length || 0,
        totalRevenue,
        pendingApprovals: verificationsQ.data?.length || 0,
      };
    },
  });

  async function handleApproveCoach(verificationId: string, coachId: string) {
    setActionLoading(verificationId);
    try {
      const { error: verifyError } = await supabase
        .from("coach_verifications")
        .update({ status: "approved", reviewed_at: new Date().toISOString() })
        .eq("id", verificationId);

      if (verifyError) throw verifyError;

      const { error: coachError } = await supabase
        .from("coaches")
        .update({ verified: true, approved: true })
        .eq("id", coachId);

      if (coachError) throw coachError;

      toast.success("تم قبول المدرب");
      verificationsQ.refetch();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "خطأ");
    } finally {
      setActionLoading(null);
    }
  }

  async function handleRejectCoach(verificationId: string) {
    setActionLoading(verificationId);
    try {
      const { error } = await supabase
        .from("coach_verifications")
        .update({ status: "rejected", reviewed_at: new Date().toISOString() })
        .eq("id", verificationId);

      if (error) throw error;
      toast.success("تم رفض الطلب");
      verificationsQ.refetch();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "خطأ");
    } finally {
      setActionLoading(null);
    }
  }

  const sections = [
    { id: "users", label: "إدارة المستخدمين", icon: Users },
    { id: "sports", label: "إدارة الرياضات", icon: Trophy },
    { id: "bookings", label: "إدارة الحجوزات", icon: BarChart3 },
    { id: "payments", label: "إدارة العمولات", icon: CreditCard },
    { id: "promotions", label: "الكوبونات والإعلانات", icon: Gift },
    { id: "complaints", label: "البلاغات والتقييمات", icon: AlertCircle },
    { id: "reports", label: "التقارير والإحصائيات", icon: TrendingUp },
  ] as const;

  return (
    <div className="px-5 pt-6 pb-28">
      {/* Header */}
      <div className="mb-6">
        <h1 className="font-display font-bold text-3xl mb-2">لوحة الإدارة</h1>
        <p className="text-muted-foreground text-sm">إدارة المنصة والتحكم الكامل</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-3 mb-6">
        <div className="rounded-2xl bg-primary/10 border border-primary/20 p-4">
          <p className="text-xs text-muted-foreground mb-1">إجمالي المستخدمين</p>
          <p className="text-2xl font-display font-bold text-primary">{statsQ.data?.totalUsers || 0}</p>
        </div>
        <div className="rounded-2xl bg-green-500/10 border border-green-500/20 p-4">
          <p className="text-xs text-muted-foreground mb-1">المدربون المعتمدون</p>
          <p className="text-2xl font-display font-bold text-green-600">{statsQ.data?.totalCoaches || 0}</p>
        </div>
        <div className="rounded-2xl bg-blue-500/10 border border-blue-500/20 p-4">
          <p className="text-xs text-muted-foreground mb-1">إجمالي الإيرادات</p>
          <p className="text-2xl font-display font-bold text-blue-600">{statsQ.data?.totalRevenue || 0} ج.م</p>
        </div>
        <div className="rounded-2xl bg-amber-500/10 border border-amber-500/20 p-4">
          <p className="text-xs text-muted-foreground mb-1">قيد الموافقة</p>
          <p className="text-2xl font-display font-bold text-amber-600">{statsQ.data?.pendingApprovals || 0}</p>
        </div>
      </div>

      {/* Navigation */}
      <div className="mb-6 flex gap-2 overflow-x-auto pb-2">
        {sections.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            onClick={() => setActiveSection(id)}
            className={`flex items-center gap-2 px-4 py-2 rounded-2xl whitespace-nowrap font-bold text-sm transition-all ${
              activeSection === id
                ? "bg-primary text-primary-foreground shadow-lg"
                : "bg-surface border border-border hover:bg-background"
            }`}
          >
            <Icon className="size-4" />
            {label}
          </button>
        ))}
      </div>

      {/* Content Sections */}
      
      {/* إدارة المستخدمين */}
      {activeSection === "users" && (
        <div className="space-y-4">
          <h2 className="font-display font-bold text-lg">قيد الموافقة على المدربين</h2>
          {verificationsQ.data?.length === 0 ? (
            <div className="rounded-2xl border border-border bg-surface p-6 text-center text-muted-foreground">
              لا توجد طلبات معلقة
            </div>
          ) : (
            <div className="space-y-3">
              {verificationsQ.data?.map((v: any) => (
                <div key={v.id} className="rounded-2xl border border-border bg-surface p-4">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <h3 className="font-display font-bold">{v.coach?.full_name}</h3>
                      <p className="text-xs text-muted-foreground">{v.coach?.title_ar}</p>
                      <p className="text-xs text-muted-foreground mt-1">📍 {v.coach?.city}</p>
                    </div>
                    <span className="text-xs bg-amber-500/20 text-amber-600 rounded-lg px-2 py-1 font-bold">معلق</span>
                  </div>
                  
                  {v.coach?.bio_ar && (
                    <p className="text-sm mb-3 p-2 rounded-lg bg-background/50">{v.coach.bio_ar}</p>
                  )}
                  
                  <div className="flex gap-2 mb-3 flex-wrap">
                    {v.certificates?.map((cert: string, idx: number) => (
                      <a
                        key={idx}
                        href={cert}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs bg-primary/10 text-primary rounded-lg px-2 py-1 hover:bg-primary/20 inline-flex items-center gap-1"
                      >
                        شهادة {idx + 1} <ExternalLink className="size-3" />
                      </a>
                    ))}
                    <a
                      href={v.license_card_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs bg-green-500/10 text-green-600 rounded-lg px-2 py-1 hover:bg-green-500/20 inline-flex items-center gap-1"
                    >
                      كارنيه <ExternalLink className="size-3" />
                    </a>
                  </div>
                  
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleApproveCoach(v.id, v.coach?.id)}
                      disabled={actionLoading === v.id}
                      className="flex-1 h-10 rounded-xl bg-green-600 text-white font-bold text-sm flex items-center justify-center gap-1 hover:bg-green-700 disabled:opacity-60"
                    >
                      <Check className="size-4" /> قبول
                    </button>
                    <button
                      onClick={() => handleRejectCoach(v.id)}
                      disabled={actionLoading === v.id}
                      className="flex-1 h-10 rounded-xl bg-red-600 text-white font-bold text-sm flex items-center justify-center gap-1 hover:bg-red-700 disabled:opacity-60"
                    >
                      <X className="size-4" /> رفض
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* إدارة الرياضات */}
      {activeSection === "sports" && (
        <div className="rounded-2xl border border-border bg-surface p-6 text-center">
          <Trophy className="size-12 text-primary mx-auto mb-3" />
          <h3 className="font-display font-bold text-lg mb-1">إدارة الرياضات</h3>
          <p className="text-muted-foreground text-sm">إضافة وتعديل وحذف الرياضات المتاحة على المنصة</p>
        </div>
      )}

      {/* إدارة الحجوزات */}
      {activeSection === "bookings" && (
        <div className="space-y-4">
          <h2 className="font-display font-bold text-lg">الحجوزات المعلقة</h2>
          {bookingsQ.data?.length === 0 ? (
            <div className="rounded-2xl border border-border bg-surface p-6 text-center text-muted-foreground">
              لا توجد حجوزات معلقة
            </div>
          ) : (
            <div className="space-y-2">
              {bookingsQ.data?.map((booking: any) => (
                <div key={booking.id} className="rounded-2xl border border-border bg-surface p-4">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="font-bold text-sm">{booking.profiles?.full_name} ← {booking.coaches?.full_name}</p>
                      <p className="text-xs text-muted-foreground">{booking.booking_date} | {booking.start_time}</p>
                    </div>
                    <p className="font-bold text-primary">{booking.price} ج.م</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* إدارة العمولات والمدفوعات */}
      {activeSection === "payments" && (
        <div className="rounded-2xl border border-border bg-surface p-6 text-center">
          <CreditCard className="size-12 text-primary mx-auto mb-3" />
          <h3 className="font-display font-bold text-lg mb-1">إدارة العمولات والمدفوعات</h3>
          <p className="text-muted-foreground text-sm">ضبط نسب العمولة وتتبع التحويلات والإيرادات</p>
        </div>
      )}

      {/* الكوبونات والإعلانات */}
      {activeSection === "promotions" && (
        <div className="rounded-2xl border border-border bg-surface p-6 text-center">
          <Gift className="size-12 text-primary mx-auto mb-3" />
          <h3 className="font-display font-bold text-lg mb-1">الكوبونات والإعلانات</h3>
          <p className="text-muted-foreground text-sm">حملات ترويجية وعروض خاصة وكوبونات خصم</p>
        </div>
      )}

      {/* البلاغات والتقييمات */}
      {activeSection === "complaints" && (
        <div className="rounded-2xl border border-border bg-surface p-6 text-center">
          <AlertCircle className="size-12 text-primary mx-auto mb-3" />
          <h3 className="font-display font-bold text-lg mb-1">البلاغات والتقييمات</h3>
          <p className="text-muted-foreground text-sm">مراقبة جودة الخدمة والتعامل مع شكاوى المستخدمين</p>
        </div>
      )}

      {/* التقارير والإحصائيات */}
      {activeSection === "reports" && (
        <div className="rounded-2xl border border-border bg-surface p-6 text-center">
          <TrendingUp className="size-12 text-primary mx-auto mb-3" />
          <h3 className="font-display font-bold text-lg mb-1">التقارير والإحصائيات</h3>
          <p className="text-muted-foreground text-sm">لوحة بيانات شاملة عن أداء المنصة والمستخدمين</p>
        </div>
      )}
    </div>
  );
}
