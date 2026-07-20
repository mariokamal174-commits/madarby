import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { ArrowRight, CheckCircle2, CreditCard, CalendarDays, Clock3, ShieldCheck, LoaderCircle } from "lucide-react";
import { getBookingFlowOptions } from "@/lib/mock-platform";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/booking-flow")({
  validateSearch: (s: Record<string, unknown>) => ({ coach: (s.coach as string) || "" }),
  component: BookingFlowPage,
});

const WEEK_AR = ["الأحد", "الاثنين", "الثلاثاء", "الأربعاء", "الخميس", "الجمعة", "السبت"];

function toMin(t: string) { const [h, m] = t.split(":").map(Number); return h * 60 + m; }
function fromMin(m: number) { return `${String(Math.floor(m / 60)).padStart(2, "0")}:${String(m % 60).padStart(2, "0")}`; }

function BookingFlowPage() {
  const navigate = useNavigate();
  const { coach: coachId } = Route.useSearch();
  const [step, setStep] = useState(0);
  const [option, setOption] = useState("individual");
  const today = new Date().toISOString().slice(0, 10);
  const [date, setDate] = useState(today);
  const [time, setTime] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("visa");
  const [isProcessing, setIsProcessing] = useState(false);

  const options = useMemo(() => getBookingFlowOptions(), []);

  const coachQ = useQuery({
    enabled: !!coachId,
    queryKey: ["coach", coachId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("coaches")
        .select("*")
        .eq("id", coachId)
        .eq("approved", true)
        .eq("verified", true)
        .single();
      if (error) throw error;
      return data;
    },
  });

  const availQ = useQuery({
    enabled: !!coachId,
    queryKey: ["coach_availability", coachId],
    queryFn: async () => {
      const { data, error } = await supabase.from("coach_availability").select("*").eq("coach_id", coachId);
      if (error) throw error;
      return data ?? [];
    },
  });

  const bookedQ = useQuery({
    enabled: !!coachId && !!date,
    queryKey: ["bookings_taken", coachId, date],
    queryFn: async () => {
      const { data, error } = await supabase.from("bookings").select("start_time").eq("coach_id", coachId).eq("booking_date", date).in("status", ["pending", "confirmed"]);
      if (error) throw error;
      return (data ?? []).map((b) => b.start_time.slice(0, 5));
    },
  });

  const duration = coachQ.data?.session_duration_min ?? 60;
  const price = Number(coachQ.data?.price_per_session ?? 0);

  const slots = useMemo(() => {
    if (!availQ.data || !date) return [] as string[];
    const dow = new Date(date + "T00:00:00").getDay();
    const windows = availQ.data.filter((a) => a.day_of_week === dow);
    const out: string[] = [];
    for (const w of windows) {
      const s = toMin(w.start_time.slice(0, 5));
      const e = toMin(w.end_time.slice(0, 5));
      for (let m = s; m + duration <= e; m += duration) out.push(fromMin(m));
    }
    return out;
  }, [availQ.data, date, duration]);

  const takenSet = new Set(bookedQ.data ?? []);

  async function submitBooking() {
    if (!coachId || !time) { toast.error("اختر موعدًا متاحًا"); return; }
    setIsProcessing(true);
    try {
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) throw new Error("غير مسجل الدخول");
      const { error } = await supabase.from("bookings").insert({
        player_id: userData.user.id,
        coach_id: coachId,
        booking_date: date,
        start_time: time,
        duration_min: duration,
        price,
        status: "pending",
      });
      if (error) {
        console.error("Booking insert error:", error);
        throw error;
      }
      toast.success("تم إنشاء الحجز بنجاح! في انتظار موافقة المدرب");
      navigate({ to: "/bookings" });
    } catch (err) {
      console.error("Booking error:", err);
      toast.error(err instanceof Error ? err.message : "خطأ في الحجز");
    } finally {
      setIsProcessing(false);
    }
  }

  const steps = [
    { title: "اختر نوع الجلسة", icon: CalendarDays },
    { title: "اختر التاريخ", icon: Clock3 },
    { title: "أكمل الدفع", icon: CreditCard },
  ];

  return (
    <div className="px-5 pt-6 pb-28">
      <div className="mb-6">
        <p className="text-xs text-muted-foreground">تدفق الحجز</p>
        <h1 className="font-display font-bold text-2xl">احجز الآن</h1>
      </div>

      <div className="mb-6 flex gap-2">
        {steps.map((item, index) => {
          const Icon = item.icon;
          return (
            <div key={item.title} className={`flex-1 rounded-2xl border px-3 py-3 text-center text-[11px] font-bold ${index <= step ? "border-primary bg-primary/10 text-primary" : "border-border bg-surface text-muted-foreground"}`}>
              <div className="flex items-center justify-center gap-1 mb-1"><Icon className="size-3.5" /> {index + 1}</div>
              {item.title}
            </div>
          );
        })}
      </div>

      {step === 0 && (
        <div className="rounded-3xl border border-border bg-surface p-4">
          <h2 className="font-display font-bold text-lg mb-4">اختر نوع الجلسة</h2>
          <div className="grid grid-cols-2 gap-3">
            {options.map((item) => (
              <button key={item.id} onClick={() => setOption(item.id)} className={`rounded-2xl border px-4 py-4 text-sm font-bold ${option === item.id ? "border-primary bg-primary/10 text-primary" : "border-border bg-background"}`}>
                {item.label}
              </button>
            ))}
          </div>
          <button onClick={() => setStep(1)} className="mt-5 flex w-full items-center justify-center gap-2 rounded-2xl bg-primary px-4 py-3 text-sm font-bold text-primary-foreground">
            التالي <ArrowRight className="size-4" />
          </button>
        </div>
      )}

      {step === 1 && (
        <div className="rounded-3xl border border-border bg-surface p-4">
          <h2 className="font-display font-bold text-lg mb-4">اختر التاريخ والوقت</h2>
          {!coachId && <p className="text-xs text-red-600 mb-3">لم يتم اختيار مدرب. ارجع لاختيار مدرب أولًا.</p>}
          <input type="date" min={today} value={date} onChange={(e) => { setDate(e.target.value); setTime(""); }} className="mb-3 w-full rounded-2xl border border-border bg-background px-3 py-3 text-sm" />
          <p className="text-xs text-muted-foreground mb-2">
            {WEEK_AR[new Date(date + "T00:00:00").getDay()]} • المواعيد المتاحة عند المدرب
          </p>

          {(availQ.isLoading || bookedQ.isLoading) && (
            <p className="text-xs text-muted-foreground py-4 text-center">جارٍ تحميل المواعيد...</p>
          )}

          {!availQ.isLoading && slots.length === 0 && (
            <div className="rounded-2xl bg-background border border-border p-4 text-center text-xs text-muted-foreground">
              المدرب لم يضِف مواعيد لهذا اليوم. جرّب يومًا آخر.
            </div>
          )}

          {slots.length > 0 && (
            <div className="grid grid-cols-3 gap-2">
              {slots.map((s) => {
                const taken = takenSet.has(s);
                const active = time === s;
                return (
                  <button
                    key={s}
                    type="button"
                    disabled={taken}
                    onClick={() => setTime(s)}
                    className={`rounded-2xl border px-2 py-3 text-sm font-bold transition-colors ${
                      taken ? "border-border bg-surface text-muted-foreground line-through opacity-60"
                      : active ? "border-primary bg-primary text-primary-foreground"
                      : "border-border bg-background hover:border-primary/50"
                    }`}
                  >
                    {s}
                  </button>
                );
              })}
            </div>
          )}

          <button
            onClick={() => setStep(2)}
            disabled={!time}
            className="mt-5 flex w-full items-center justify-center gap-2 rounded-2xl bg-primary px-4 py-3 text-sm font-bold text-primary-foreground disabled:opacity-50"
          >
            متابعة للدفع <ArrowRight className="size-4" />
          </button>
        </div>
      )}

      {step === 2 && (
        <div className="rounded-3xl border border-border bg-surface p-4">
          <div className="mb-4 flex items-center gap-2 rounded-2xl bg-primary/10 p-3 text-sm text-primary">
            <ShieldCheck className="size-4" />
            الدفع آمن ومشفر
          </div>
          <h2 className="font-display font-bold text-lg mb-4">ملخص الحجز والدفع</h2>
          <div className="rounded-2xl bg-background p-4 space-y-2 text-sm text-muted-foreground">
            <div className="flex justify-between"><span>النوع</span><span className="font-bold text-foreground">{options.find((item) => item.id === option)?.label}</span></div>
            <div className="flex justify-between"><span>التاريخ</span><span className="font-bold text-foreground">{date}</span></div>
            <div className="flex justify-between"><span>الوقت</span><span className="font-bold text-foreground">{time}</span></div>
            <div className="flex justify-between"><span>المدة</span><span className="font-bold text-foreground">{duration} دقيقة</span></div>
            <div className="flex justify-between"><span>السعر</span><span className="font-bold text-foreground">{price} ر.س</span></div>
            <div className="flex justify-between"><span>الرسوم</span><span className="font-bold text-foreground">15 ر.س</span></div>
            <div className="flex justify-between border-t border-border pt-2 mt-2"><span>الإجمالي</span><span className="font-bold text-foreground">{price + 15} ر.س</span></div>
          </div>

          <div className="mt-4 grid grid-cols-2 gap-2">
            {[
              { id: "visa", label: "فيزا" },
              { id: "apple", label: "Apple Pay" },
              { id: "wallet", label: "المحفظة" },
              { id: "bank", label: "تحويل بنكي" },
            ].map((method) => (
              <button
                key={method.id}
                onClick={() => setPaymentMethod(method.id)}
                className={`rounded-2xl border px-3 py-3 text-sm font-bold ${paymentMethod === method.id ? "border-primary bg-primary/10 text-primary" : "border-border bg-background text-foreground"}`}
              >
                {method.label}
              </button>
            ))}
          </div>

          <button onClick={submitBooking} disabled={isProcessing} className="mt-5 flex w-full items-center justify-center gap-2 rounded-2xl bg-primary px-4 py-3 text-sm font-bold text-primary-foreground disabled:opacity-70">
            {isProcessing ? <LoaderCircle className="size-4 animate-spin" /> : <CheckCircle2 className="size-4" />}
            {isProcessing ? "جارِ معالجة الدفع..." : "تأكيد الدفع"}
          </button>
        </div>
      )}
    </div>
  );
}
