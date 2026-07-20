import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
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
  const [editingSlot, setEditingSlot] = useState<CoachAvailabilitySlot | null>(null);
  const [editPrice, setEditPrice] = useState("");

  const coachProfileQ = useQuery({
    queryKey: ["coach-profile", user?.id],
    queryFn: async () => {
      if (!user?.id) return null;
      const { data, error } = await supabase.from("coaches").select("id").eq("user_id", user.id).single();
      if (error) throw error;
      return data;
    },
    enabled: !!user?.id,
  });

  const coachId = coachProfileQ.data?.id;

  const availabilityQ = useQuery({
    queryKey: ["coach_availability", coachId],
    queryFn: async () => {
      if (!coachId) return [] as CoachAvailabilitySlot[];
      const { data, error } = await supabase
        .from("coach_availability")
        .select("id, day_of_week, start_time, end_time, price")
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
        price: Number(row.price ?? 0),
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
        price: normalized,
      });
      if (error) throw error;

      toast.success("تم حفظ النافذة بالسعر الخاص بها");
      queryClient.invalidateQueries({ queryKey: ["coach_availability", coachId] });
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
      if (editingSlot?.id === id) {
        setEditingSlot(null);
        setEditPrice("");
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "فشل حذف النافذة");
    }
  }

  function startEditSlot(slot: CoachAvailabilitySlot) {
    setEditingSlot(slot);
    setEditPrice(String(slot.price ?? 0));
  }

  async function updateSlotPrice() {
    if (!coachId || !editingSlot) return;
    const parsedPrice = Number(editPrice);
    const normalized = Number.isFinite(parsedPrice) ? parsedPrice : 0;

    try {
      const { error } = await supabase
        .from("coach_availability")
        .update({ price: normalized })
        .eq("id", editingSlot.id)
        .eq("coach_id", coachId);
      if (error) throw error;
      toast.success("تم تحديث سعر النافذة");
      setEditingSlot(null);
      setEditPrice("");
      queryClient.invalidateQueries({ queryKey: ["coach_availability", coachId] });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "فشل تحديث السعر");
    }
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
            <p className="text-sm font-semibold text-foreground">سعر هذه النافذة</p>
            <p className="mt-2 text-sm text-muted-foreground">كل نافذة تتسع لسعر خاص بها، ولا تعتمد على سعر المدرب العام.</p>
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

      {editingSlot && (
        <div className="rounded-3xl border border-border bg-surface p-4 mb-6">
          <div className="flex items-center justify-between mb-3">
            <div>
              <p className="text-xs text-muted-foreground">تعديل سعر النافذة</p>
              <p className="font-bold">{editingSlot.day} • {editingSlot.time}</p>
            </div>
            <button onClick={() => setEditingSlot(null)} className="text-xs text-muted-foreground hover:text-foreground">إلغاء</button>
          </div>
          <div className="grid gap-3">
            <div>
              <label className="text-xs font-bold text-muted-foreground block mb-2">السعر الجديد</label>
              <input
                type="number"
                min="0"
                step="50"
                value={editPrice}
                onChange={(e) => setEditPrice(e.target.value)}
                className="w-full rounded-2xl border border-border bg-background px-3 py-3 text-sm"
              />
            </div>
            <button onClick={updateSlotPrice} className="w-full rounded-2xl bg-emerald-600 px-4 py-3 text-sm font-bold text-white">
              حفظ التعديل
            </button>
          </div>
        </div>
      )}

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
                <button onClick={() => startEditSlot(slot)} className="flex items-center gap-1 rounded-full bg-surface px-3 py-2 text-[11px] font-bold">
                <PencilLine className="size-3.5" /> تعديل السعر
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
