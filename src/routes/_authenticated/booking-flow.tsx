import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { ArrowRight, CheckCircle2, CreditCard, CalendarDays, Clock3, ShieldCheck, LoaderCircle } from "lucide-react";
import { getBookingFlowOptions } from "@/lib/mock-platform";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/booking-flow")({
  component: BookingFlowPage,
});

function BookingFlowPage() {
  const navigate = useNavigate();
  const [step, setStep] = useState(0);
  const [option, setOption] = useState("individual");
  const [date, setDate] = useState("2026-07-25");
  const [time, setTime] = useState("18:30");
  const [paymentMethod, setPaymentMethod] = useState("visa");
  const [isProcessing, setIsProcessing] = useState(false);

  const options = useMemo(() => getBookingFlowOptions(), []);

  function submitBooking() {
    setIsProcessing(true);
    window.setTimeout(() => {
      setIsProcessing(false);
      toast.success("تمت معالجة الدفع بنجاح وتم إنشاء الحجز");
      navigate({ to: "/bookings" });
    }, 900);
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
          <input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="mb-3 w-full rounded-2xl border border-border bg-background px-3 py-3 text-sm" />
          <input type="time" value={time} onChange={(e) => setTime(e.target.value)} className="w-full rounded-2xl border border-border bg-background px-3 py-3 text-sm" />
          <button onClick={() => setStep(2)} className="mt-5 flex w-full items-center justify-center gap-2 rounded-2xl bg-primary px-4 py-3 text-sm font-bold text-primary-foreground">
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
            <div className="flex justify-between"><span>السعر</span><span className="font-bold text-foreground">300 ر.س</span></div>
            <div className="flex justify-between"><span>الرسوم</span><span className="font-bold text-foreground">15 ر.س</span></div>
            <div className="flex justify-between border-t border-border pt-2 mt-2"><span>الإجمالي</span><span className="font-bold text-foreground">315 ر.س</span></div>
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
