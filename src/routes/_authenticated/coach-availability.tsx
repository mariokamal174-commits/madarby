import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { CalendarClock, PlusCircle, Trash2, PencilLine } from "lucide-react";
import { availabilitySeed, type CoachAvailabilitySlot } from "@/lib/mock-platform";

export const Route = createFileRoute("/_authenticated/coach-availability")({
  component: CoachAvailability,
});

const typeMeta: Record<CoachAvailabilitySlot["type"], { label: string; cls: string }> = {
  available: { label: "متاح", cls: "bg-emerald-100 text-emerald-800" },
  blocked: { label: "محجوب", cls: "bg-amber-100 text-amber-800" },
  vacation: { label: "إجازة", cls: "bg-violet-100 text-violet-800" },
};

function CoachAvailability() {
  const [slots, setSlots] = useState<CoachAvailabilitySlot[]>(() => availabilitySeed);
  const [day, setDay] = useState("الاثنين");
  const [time, setTime] = useState("19:00");
  const [type, setType] = useState<CoachAvailabilitySlot["type"]>("available");
  const [recurring, setRecurring] = useState(true);

  const summary = useMemo(() => {
    const available = slots.filter((slot) => slot.type === "available").length;
    const blocked = slots.filter((slot) => slot.type === "blocked").length;
    const vacations = slots.filter((slot) => slot.type === "vacation").length;
    return { available, blocked, vacations };
  }, [slots]);

  function addSlot() {
    if (!day || !time) return;
    setSlots((current) => [{ id: crypto.randomUUID(), day, time, recurring, available: type === "available", type }, ...current]);
  }

  function removeSlot(id: string) {
    setSlots((current) => current.filter((slot) => slot.id !== id));
  }

  function toggleSlot(id: string) {
    setSlots((current) => current.map((slot) => (slot.id === id ? { ...slot, available: !slot.available, type: slot.available ? "blocked" : "available" } : slot)));
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
          <input value={day} onChange={(e) => setDay(e.target.value)} className="w-full rounded-2xl border border-border bg-background px-3 py-3 text-sm" placeholder="اليوم" />
          <input value={time} onChange={(e) => setTime(e.target.value)} className="w-full rounded-2xl border border-border bg-background px-3 py-3 text-sm" placeholder="الوقت" />
          <select value={type} onChange={(e) => setType(e.target.value as CoachAvailabilitySlot["type"])} className="w-full rounded-2xl border border-border bg-background px-3 py-3 text-sm">
            <option value="available">متاح</option>
            <option value="blocked">محجوب</option>
            <option value="vacation">إجازة</option>
          </select>
          <label className="flex items-center gap-2 text-sm text-muted-foreground">
            <input type="checkbox" checked={recurring} onChange={() => setRecurring((value) => !value)} />
            تكرار أسبوعي
          </label>
          <button onClick={addSlot} className="flex items-center justify-center gap-2 rounded-2xl bg-primary px-4 py-3 text-sm font-bold text-primary-foreground w-full">
            <PlusCircle className="size-4" /> إضافة نافذة
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
