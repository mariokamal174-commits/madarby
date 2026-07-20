import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { ArrowRight, CheckCircle2, CreditCard, CalendarDays, Clock3, ShieldCheck, LoaderCircle, Star, MapPin } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/booking-flow")({
  validateSearch: (s: Record<string, unknown>) => ({ coach: (s.coach as string) || "" }),
  component: BookingFlowPage,
});

const WEEK_AR = ["الأحد", "الاثنين", "الثلاثاء", "الأربعاء", "الخميس", "الجمعة", "السبت"];
const BOOKING_TYPES = [
  { id: "single", label: "جلسة فردية", emoji: "👤" },
  { id: "group", label: "جلسة جماعية", emoji: "👥" },
  { id: "monthly", label: "اشتراك شهري", emoji: "📅" },
  { id: "12sessions", label: "اشتراك 12 حصة", emoji: "📊" },
  { id: "home", label: "تدريب منزلي", emoji: "🏠" },
  { id: "online", label: "أونلاين", emoji: "💻" },
];

function toMin(t: string) { const [h, m] = t.split(":").map(Number); return h * 60 + m; }
function fromMin(m: number) { return `${String(Math.floor(m / 60)).padStart(2, "0")}:${String(m % 60).padStart(2, "0")}`; }

function BookingFlowPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { coach: coachId } = Route.useSearch();
  const [step, setStep] = useState(0);
  const [bookingType, setBookingType] = useState("single");
  const today = new Date().toISOString().slice(0, 10);
  const [date, setDate] = useState(today);
  const [time, setTime] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("visa");
  const [isProcessing, setIsProcessing] = useState(false);

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
  const coachBasePrice = Number(coachQ.data?.price_per_session ?? 0);
  const [selectedSlot, setSelectedSlot] = useState<string | null>(null);
  const [selectedSlotPrice, setSelectedSlotPrice] = useState<number | null>(null);

  const getPriceMultiplier = () => {
    switch(bookingType) {
      case "monthly": return 20;
      case "12sessions": return 11;
      case "home": return 1.2;
      case "online": return 0.8;
      default: return 1;
    }
  };

  const effectiveBasePrice = selectedSlotPrice ?? coachBasePrice;
  const price = Math.round(effectiveBasePrice * getPriceMultiplier());

  const slots = (() => {
    if (!availQ.data || !date) return [] as Array<{ time: string; price: number }>;
    const dow = new Date(date + "T00:00:00").getDay();
    const windows = availQ.data.filter((a) => a.day_of_week === dow);
    const out: Array<{ time: string; price: number }> = [];
    for (const w of windows) {
      const s = toMin(w.start_time.slice(0, 5));
      const e = toMin(w.end_time.slice(0, 5));
      const windowPrice = Number(w.price ?? coachBasePrice);
      for (let m = s; m + duration <= e; m += duration) {
        out.push({ time: fromMin(m), price: windowPrice });
      }
    }
    return out;
  })();

  const takenSet = new Set(bookedQ.data ?? []);

  async function submitBooking() {
    if (!coachId || !time || !user?.id) { toast.error("بيانات ناقصة"); return; }
    setIsProcessing(true);
    try {
      const { error } = await supabase.from("bookings").insert({
        player_id: user.id,
        coach_id: coachId,
        booking_date: date,
        start_time: time,
        duration_min: duration,
        price,
        status: "pending",
      });
      if (error) throw error;
      toast.success("تم إنشاء الحجز بنجاح! في انتظار موافقة المدرب");
      navigate({ to: "/bookings" });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "خطأ في الحجز");
    } finally {
      setIsProcessing(false);
    }
  }

  const steps = [
    { title: "تفاصيل المدرب", icon: "ℹ️" },
    { title: "نوع الجلسة", icon: "📋" },
    { title: "الموعد", icon: CalendarDays },
    { title: "التأكيد", icon: CheckCircle2 },
  ];

  if (coachQ.isLoading) return <div className="px-5 pt-6 text-center text-muted-foreground">جارٍ التحميل...</div>;
  if (!coachQ.data) return <div className="px-5 pt-6 text-center text-muted-foreground">المدرب غير موجود</div>;

  const c = coachQ.data;

  return (
    <div className="px-5 pt-6 pb-28">
      {/* Header */}
      <div className="mb-4 flex items-center gap-2">
        <button onClick={() => step > 0 ? setStep(step - 1) : navigate({ to: "/home" })} className="size-10 rounded-full bg-surface flex items-center justify-center">
          <ArrowRight className="size-5" />
        </button>
        <div>
          <h1 className="font-display font-bold text-2xl">احجز جلسة تدريب</h1>
        </div>
      </div>

      {/* Progress */}
      <div className="mb-6 flex gap-2">
        {steps.map((item, index) => {
          const Icon = typeof item.icon === "string" ? null : item.icon;
          return (
            <div key={index} className={`flex-1 rounded-2xl border px-2 py-2 text-center text-[10px] font-bold transition-all ${
              index < step ? "bg-green-500/20 border-green-500/50 text-green-600" :
              index === step ? "border-primary bg-primary/10 text-primary" :
              "border-border bg-surface text-muted-foreground"
            }`}>
              {typeof item.icon === "string" ? item.icon : <Icon className="size-3 mx-auto" />}
              <div className="text-[9px] mt-1">{item.title}</div>
            </div>
          );
        })}
      </div>

      {/* Step 0: Coach Details */}
      {step === 0 && (
        <div className="space-y-4">
          {c.avatar_url && (
            <img src={c.avatar_url} alt={c.full_name} className="w-full h-64 object-cover rounded-3xl" />
          )}
          
          <div className="rounded-3xl bg-surface border border-border p-4">
            <h2 className="font-display font-bold text-2xl mb-1">{c.full_name}</h2>
            <p className="text-sm text-primary font-bold mb-2">{c.title_ar}</p>
            
            <div className="grid grid-cols-3 gap-3 mb-4">
              <div className="rounded-2xl bg-primary/10 p-3 text-center">
                <p className="text-2xl font-bold text-primary">{c.rating}</p>
                <p className="text-[10px] text-muted-foreground flex items-center justify-center gap-1 mt-1">
                  <Star className="size-3 fill-primary text-primary" /> تقييم
                </p>
              </div>
              <div className="rounded-2xl bg-blue-500/10 p-3 text-center">
                <p className="text-2xl font-bold text-blue-600">{c.experience_years}</p>
                <p className="text-[10px] text-muted-foreground">سنة خبرة</p>
              </div>
              <div className="rounded-2xl bg-green-500/10 p-3 text-center">
                <p className="text-2xl font-bold text-green-600">{price}</p>
                <p className="text-[10px] text-muted-foreground">ج.م</p>
              </div>
            </div>

            <div className="space-y-3">
              <div>
                <p className="text-xs font-bold text-muted-foreground mb-1">📍 الموقع</p>
                <p className="text-sm">{c.city}</p>
              </div>
              
              <div>
                <p className="text-xs font-bold text-muted-foreground mb-1">📝 النبذة</p>
                <p className="text-sm">{c.bio_ar || "لا توجد نبذة"}</p>
              </div>

              <div>
                <p className="text-xs font-bold text-muted-foreground mb-2">🎓 الشهادات</p>
                <p className="text-sm">معتمد من الجهات الرياضية الرسمية</p>
              </div>
            </div>
          </div>

          <button onClick={() => setStep(1)} className="w-full h-12 rounded-2xl bg-primary text-primary-foreground font-bold flex items-center justify-center gap-2">
            متابعة الحجز <ArrowRight className="size-4" />
          </button>
        </div>
      )}

      {/* Step 1: Booking Type */}
      {step === 1 && (
        <div>
          <h2 className="font-display font-bold text-lg mb-4">اختر نوع الجلسة</h2>
          <div className="grid grid-cols-2 gap-3 mb-4">
            {BOOKING_TYPES.map((type) => (
              <button
                key={type.id}
                onClick={() => setBookingType(type.id)}
                className={`rounded-2xl border p-3 font-bold text-sm transition-all ${
                  bookingType === type.id
                    ? "border-primary bg-primary/10 text-primary"
                    : "border-border bg-surface hover:bg-background"
                }`}
              >
                <div className="text-2xl mb-1">{type.emoji}</div>
                {type.label}
              </button>
            ))}
          </div>
          
          <button onClick={() => setStep(2)} className="w-full h-12 rounded-2xl bg-primary text-primary-foreground font-bold flex items-center justify-center gap-2">
            التالي <ArrowRight className="size-4" />
          </button>
        </div>
      )}

      {/* Step 2: Date & Time */}
      {step === 2 && (
        <div className="space-y-4">
          <div>
            <label className="text-xs font-bold text-muted-foreground mb-2 block">📅 اختر التاريخ</label>
            <input
              type="date"
              min={today}
              value={date}
              onChange={(e) => {
                setDate(e.target.value);
                setTime("");
                setSelectedSlot(null);
                setSelectedSlotPrice(null);
              }}
              className="w-full h-12 rounded-2xl border border-border bg-background px-4 text-sm font-bold"
            />
            <p className="text-xs text-muted-foreground mt-2">
              {WEEK_AR[new Date(date + "T00:00:00").getDay()]} • {new Date(date + "T00:00:00").toLocaleDateString("ar-EG")}
            </p>
          </div>

          <div>
            <label className="text-xs font-bold text-muted-foreground mb-2 block">⏰ اختر الساعة</label>
            {slots.length === 0 ? (
              <div className="rounded-2xl bg-background border border-border p-4 text-center text-sm text-muted-foreground">
                لا توجد مواعيد متاحة في هذا اليوم
              </div>
            ) : (
              <div className="grid grid-cols-4 gap-2">
                {slots.map((slot) => {
                  const taken = takenSet.has(slot.time);
                  const active = time === slot.time;
                  return (
                    <button
                      key={slot.time}
                      disabled={taken}
                      onClick={() => {
                        setTime(slot.time);
                        setSelectedSlot(slot.time);
                        setSelectedSlotPrice(slot.price);
                      }}
                      className={`h-10 rounded-xl border font-bold text-sm transition-all ${
                        taken
                          ? "border-border bg-surface text-muted-foreground opacity-50 cursor-not-allowed"
                          : active
                          ? "border-primary bg-primary text-primary-foreground"
                          : "border-border bg-surface hover:border-primary"
                      }`}
                    >
                      <div>{slot.time}</div>
                      <div className="text-[10px] text-muted-foreground">{slot.price} ج.م</div>
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          <button
            onClick={() => setStep(3)}
            disabled={!time}
            className="w-full h-12 rounded-2xl bg-primary text-primary-foreground font-bold flex items-center justify-center gap-2 disabled:opacity-50"
          >
            التالي <ArrowRight className="size-4" />
          </button>
        </div>
      )}

      {/* Step 3: Confirmation */}
      {step === 3 && (
        <div className="space-y-4">
          <div className="rounded-3xl bg-surface border border-border overflow-hidden">
            {c.avatar_url && <img src={c.avatar_url} alt="" className="w-full h-48 object-cover" />}
            <div className="p-4">
              <h3 className="font-display font-bold text-xl mb-2">{c.full_name}</h3>
              <p className="text-primary font-bold mb-4">{c.title_ar}</p>

              <div className="space-y-3 bg-background/50 rounded-2xl p-3 mb-4">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">نوع الجلسة</span>
                  <span className="font-bold">{BOOKING_TYPES.find(t => t.id === bookingType)?.label}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">التاريخ والوقت</span>
                  <span className="font-bold">{date} • {time}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">المدة</span>
                  <span className="font-bold">{duration} دقيقة</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">سعر النافذة</span>
                  <span className="font-bold">{selectedSlotPrice !== null ? `${selectedSlotPrice} ج.م` : `${coachBasePrice} ج.م`}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">الموقع</span>
                  <span className="font-bold flex items-center gap-1">
                    <MapPin className="size-3" /> {c.city}
                  </span>
                </div>
              </div>

              <div className="space-y-2 mb-4 border-t border-border pt-4">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">السعر الأساسي</span>
                  <span className="font-bold">{effectiveBasePrice} ج.م</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">الرسوم (15%)</span>
                  <span className="font-bold">{Math.round(price * 0.15)} ج.م</span>
                </div>
                <div className="flex justify-between font-bold text-lg border-t border-border pt-2 mt-2">
                  <span>الإجمالي</span>
                  <span className="text-primary">{Math.round(price * 1.15)} ج.م</span>
                </div>
              </div>

              <div>
                <p className="text-xs font-bold text-muted-foreground mb-2">💳 طريقة الدفع</p>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { id: "visa", label: "💳 فيزا" },
                    { id: "apple", label: "🍎 Apple Pay" },
                    { id: "wallet", label: "💰 المحفظة" },
                    { id: "bank", label: "🏦 تحويل بنكي" },
                  ].map((method) => (
                    <button
                      key={method.id}
                      onClick={() => setPaymentMethod(method.id)}
                      className={`rounded-xl border p-2 text-sm font-bold transition-all ${
                        paymentMethod === method.id
                          ? "border-primary bg-primary/10 text-primary"
                          : "border-border bg-background"
                      }`}
                    >
                      {method.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          <div className="flex gap-2">
            <button
              onClick={() => setStep(2)}
              className="flex-1 h-12 rounded-2xl border border-border bg-background font-bold"
            >
              رجوع
            </button>
            <button
              onClick={submitBooking}
              disabled={isProcessing}
              className="flex-1 h-12 rounded-2xl bg-green-600 text-white font-bold flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {isProcessing ? (
                <>
                  <LoaderCircle className="size-4 animate-spin" /> جارٍ المعالجة...
                </>
              ) : (
                <>
                  <CheckCircle2 className="size-4" /> تأكيد الحجز
                </>
              )}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
