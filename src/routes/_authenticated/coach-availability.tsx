import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { CalendarClock, PlusCircle, Trash2, PencilLine } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { type CoachAvailabilitySlot } from "@/lib/mock-platform";

export const Route = createFileRoute("/_authenticated/coach-availability")({
  component: CoachAvailability,
});

const typeMeta: Record<CoachAvailabilitySlot["type"], { label: string; cls: string }> = {
  available: { label: "متاح", cls: "bg-emerald-100 text-emerald-800" },
  blocked: { label: "محجوب", cls: "bg-amber-100 text-amber-800" },
  vacation: { label: "إجازة", cls: "bg-violet-100 text-violet-800" },
};

function CoachAvailability() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [day, setDay] = useState("الاثنين");
  const [time, setTime] = useState("19:00");
  const [price, setPrice] = useState("300");
  const [recurring, setRecurring] = useState(true);
  const [currentPrice, setCurrentPrice] = useState<number | null>(null);

  const coachProfileQ = useQuery({
    queryKey: ["coach-profile", user?.id],
    queryFn: async () => {
      if (!user?.id) return null;
      const { data, error } = await supabase.from("coaches").select("id, price_per_session").eq("user_id", user.id).single();
      if (error) throw error;
      return data;
    },
    enabled: !!user?.id,
  });

  const coachId = coachProfileQ.data?.id;

  useEffect(() => {
    if (coachProfileQ.data?.price_per_session !== undefined) {
      setCurrentPrice(coachProfileQ.data.price_per_session);
      setPrice(String(coachProfileQ.data.price_per_session));
    }
  }, [coachProfileQ.data?.price_per_session]);

  const availabilityQ = useQuery({
    queryKey: ["coach_availability", coachId],
    queryFn: async () => {
      if (!coachId) return [] as CoachAvailabilitySlot[];
      const { data, error } = await supabase
        .from("coach_availability")
        .select("id, day_of_week, start_time, end_time")
        .eq("coach_id", coachId)
        .order("day_of_week")
        .order("start_time");
      if (error) throw error;

      const dayNames = ["الأحد", "الاثنين", "الثلاثاء", "الأربعاء", "الخميس", "الجمعة", "السبت"];
      return (data ?? []).map((row: any) => ({
        id: row.id,
        day: dayNames[row.day_of_week] ?? "غير معروف",
        time: row.start_time?.slice(0, 5) ?? "",
        recurring: true,
        available: row.end_time && row.end_time > row.start_time,
        type: row.end_time && row.end_time > row.start_time ? "available" : "blocked",
        price: currentPrice ?? 0,
      }));
    },
    enabled: !!coachId,
  });

  const slots = availabilityQ.data ?? [];

  const summary = useMemo(() => {
    const available = slots.filter((slot) => slot.type === "available").length;
    const blocked = slots.filter((slot) => slot.type === "blocked").length;
    const vacations = slots.filter((slot) => slot.type === "vacation").length;
    return { available, blocked, vacations };
  }, [slots]);

  async function addSlot() {
    if (!day || !time || !coachId) return;
    const parsedPrice = Number(price);
    const normalized = Number.isFinite(parsedPrice) ? parsedPrice : 0;

    try {
      const start = time.slice(0, 5);
      const end = addMinutes(start, 60);

      const { error } = await supabase.from("coach_availability").insert({
        coach_id: coachId,
        day_of_week: dayNameToNumber(day),
        start_time: `${start}:00`,
        end_time: `${end}:00`,
      });
      if (error) throw error;

      const { error: priceError } = await supabase.from("coaches").update({ price_per_session: normalized }).eq("user_id", user?.id);
      if (priceError) throw priceError;
      setCurrentPrice(normalized);
      setPrice(String(normalized));

      toast.success("تم حفظ النافذة وتحديث سعر الجلسة");
      queryClient.invalidateQueries({ queryKey: ["coach_availability", coachId] });
      queryClient.invalidateQueries({ queryKey: ["coach-profile", user?.id] });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "فشل حفظ الجلسة");
    }
  }

  async function removeSlot(id: string) {
    if (!coachId) return;
    try {
      const { error } = await supabase.from("coach_availability").delete().eq("id", id).eq("coach_id", coachId);
      if (error) throw error;
      toast.success("تم حذف النافذة");
      queryClient.invalidateQueries({ queryKey: ["coach_availability", coachId] });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "فشل حذف النافذة");
    }
  }

  function toggleSlot(id: string) {
    void removeSlot(id);
  }

  function addMinutes(timeValue: string, minutes: number) {
    const [hours, mins] = timeValue.split(":").map(Number);
    const total = hours * 60 + mins + minutes;
    const nextHours = Math.floor(total / 60) % 24;
    const nextMins = total % 60;
    return `${String(nextHours).padStart(2, "0")}:${String(nextMins).padStart(2, "0")}`;
  }

  function dayNameToNumber(dayName: string) {
    const mapping: Record<string, number> = {
      الأحد: 0,
      الاثنين: 1,
      الثلاثاء: 2,
      الأربعاء: 3,
      الخميس: 4,
      الجمعة: 5,
      السبت: 6,
    };
    return mapping[dayName] ?? 0;
  }

  return (
    <div className="px-5 pt-6 pb-28">
      <div className="mb-6">
        <p className="text-xs text-muted-foreground">إدارة التوافر</p>
        <h1 className="font-display font-bold text-2xl">الجدول الأسبوعي</h1>
      </div>

      <div className="grid grid-cols-3 gap-2 mb-6">
        <div className="rounded-2xl bg-surface p-3 text-center">
          <p className="text-[11px] text-muted-foreground">متاح</p>
          <p className="font-display font-bold text-lg">{summary.available}</p>
        </div>
        <div className="rounded-2xl bg-surface p-3 text-center">
          <p className="text-[11px] text-muted-foreground">محجوب</p>
          <p className="font-display font-bold text-lg">{summary.blocked}</p>
        </div>
        <div className="rounded-2xl bg-surface p-3 text-center">
          <p className="text-[11px] text-muted-foreground">إجازة</p>
          <p className="font-display font-bold text-lg">{summary.vacations}</p>
        </div>
      </div>

      <div className="rounded-3xl border border-border bg-surface p-4 mb-6">
        <div className="flex items-center gap-2 mb-3">
          <CalendarClock className="size-4 text-primary" />
          <h2 className="font-display font-bold text-base">إضافة نافذة جديدة</h2>
        </div>
        <div className="space-y-3">
          <div className="rounded-2xl border border-border bg-background p-3">
            <p className="text-sm font-semibold text-foreground">السعر الحالي للجلسة</p>
            <p className="mt-2 text-lg font-bold text-primary">{currentPrice ? `${currentPrice} ج.م` : "لم يتم ضبط السعر بعد"}</p>
            <p className="mt-1 text-xs text-muted-foreground">يمكنك تغيير السعر هنا وسيتم حفظه كالسعر الافتراضي للجلسات.</p>
          </div>
          <select value={day} onChange={(e) => setDay(e.target.value)} className="w-full rounded-2xl border border-border bg-background px-3 py-3 text-sm">
            <option value="الأحد">الأحد</option>
            <option value="الاثنين">الاثنين</option>
            <option value="الثلاثاء">الثلاثاء</option>
            <option value="الأربعاء">الأربعاء</option>
            <option value="الخميس">الخميس</option>
            <option value="الجمعة">الجمعة</option>
            <option value="السبت">السبت</option>
          </select>
          <input value={time} onChange={(e) => setTime(e.target.value)} type="time" className="w-full rounded-2xl border border-border bg-background px-3 py-3 text-sm" />
          <div>
            <label className="mb-2 block text-sm font-semibold text-foreground">سعر الجلسة (ج.م)</label>
            <input
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              type="number"
              min="0"
              step="50"
              inputMode="numeric"
              className="w-full rounded-2xl border border-border bg-background px-3 py-3 text-sm"
              placeholder="مثال: 500"
            />
            <p className="mt-2 text-xs text-muted-foreground">اكتب السعر الذي تريد أن يعرض لكل جلسة جديدة.</p>
          </div>
          <label className="flex items-center gap-2 text-sm text-muted-foreground">
            <input type="checkbox" checked={recurring} onChange={() => setRecurring((value) => !value)} />
            تكرار أسبوعي
          </label>
          <button onClick={addSlot} className="flex items-center justify-center gap-2 rounded-2xl bg-primary px-4 py-3 text-sm font-bold text-primary-foreground w-full">
            <PlusCircle className="size-4" /> حفظ النافذة والسعر
          </button>
        </div>
      </div>

      <div className="space-y-3">
        {slots.map((slot) => (
          <div key={slot.id} className="rounded-3xl border border-border bg-card p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-display font-bold text-sm">{slot.day} • {slot.time}</p>
                <p className="text-xs text-muted-foreground">{slot.recurring ? "تكرار أسبوعي" : "مرة واحدة"}</p>
                {typeof slot.price === "number" && slot.price > 0 && (
                  <p className="mt-1 text-xs font-bold text-primary">{slot.price} ج.م</p>
                )}
              </div>
              <span className={`rounded-full px-3 py-1 text-[10px] font-bold ${typeMeta[slot.type].cls}`}>{typeMeta[slot.type].label}</span>
            </div>
            <div className="mt-3 flex gap-2">
              <button onClick={() => toggleSlot(slot.id)} className="flex items-center gap-1 rounded-full bg-surface px-3 py-2 text-[11px] font-bold">
                <PencilLine className="size-3.5" /> تبديل الحالة
              </button>
              <button onClick={() => removeSlot(slot.id)} className="flex items-center gap-1 rounded-full bg-red-50 px-3 py-2 text-[11px] font-bold text-red-700">
                <Trash2 className="size-3.5" /> حذف
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
