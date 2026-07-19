import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useState } from "react";
import { PhoneShell } from "@/components/PhoneShell";
import { CoachCard, type CoachCardData } from "@/components/CoachCard";
import { toast } from "sonner";
import { ArrowRight, Calendar, Filter, MapPin } from "lucide-react";

export const Route = createFileRoute("/booking-flow")({
  component: BookingFlow,
});

function BookingFlow() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [selectedSport, setSelectedSport] = useState<string | null>(null);
  const [selectedCoachId, setSelectedCoachId] = useState<string | null>(null);
  const [sessionDate, setSessionDate] = useState("");
  const [sessionTime, setSessionTime] = useState("");
  const [notes, setNotes] = useState("");
  const [step, setStep] = useState<"select-coach" | "select-time" | "confirm">("select-coach");

  const sportsQ = useQuery({
    queryKey: ["sports"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("sports")
        .select("id, name_ar, emoji")
        .order("name_ar");
      if (error) throw error;
      return data || [];
    },
  });

  const coachesQ = useQuery({
    queryKey: ["coaches_for_booking", selectedSport],
    queryFn: async () => {
      let q = supabase
        .from("coaches")
        .select("id, full_name, title_ar, avatar_url, rating, price_per_session, city, verified");
      
      if (selectedSport) {
        q = q.contains("specialties", [selectedSport]);
      }
      
      const { data, error } = await q.order("rating", { ascending: false });
      if (error) throw error;
      return (data || []) as CoachCardData[];
    },
    enabled: !!selectedSport,
  });

  const selectedCoach = coachesQ.data?.find((c: any) => c.id === selectedCoachId);

  const createBookingMutation = useMutation({
    mutationFn: async () => {
      if (!user?.id || !selectedCoachId || !sessionDate || !sessionTime) {
        throw new Error("Missing required fields");
      }

      const startTime = new Date(`${sessionDate}T${sessionTime}`);
      const endTime = new Date(startTime.getTime() + 60 * 60 * 1000); // 1 hour session

      const { data, error } = await supabase.from("bookings").insert({
        player_id: user.id,
        coach_id: selectedCoachId,
        sport_id: selectedSport,
        start_time: startTime.toISOString(),
        end_time: endTime.toISOString(),
        price: selectedCoach?.price_per_session || 0,
        notes,
        status: "pending",
      });

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      toast.success("تم حجز الجلسة بنجاح! 🎉");
      queryClient.invalidateQueries({ queryKey: ["player_bookings"] });
      setTimeout(() => navigate({ to: "/bookings" }), 1000);
    },
    onError: (error) => {
      toast.error("حدث خطأ في الحجز. حاول مجدداً");
      console.error(error);
    },
  });

  return (
    <PhoneShell>
      <div className="px-5 pt-6 pb-8">
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <h1 className="font-display font-bold text-2xl">احجز جلسة</h1>
          {step !== "select-coach" && (
            <button
              onClick={() => {
                if (step === "select-time") {
                  setStep("select-coach");
                } else {
                  setStep("select-time");
                }
              }}
              className="flex items-center gap-1 text-xs text-primary font-bold"
            >
              <ArrowRight className="size-4" />
              رجوع
            </button>
          )}
        </div>

        {/* Progress bar */}
        <div className="flex gap-1 mb-6">
          <div
            className={`flex-1 h-1 rounded-full transition-colors ${
              step === "select-coach" ? "bg-primary" : "bg-border"
            }`}
          />
          <div
            className={`flex-1 h-1 rounded-full transition-colors ${
              step !== "select-coach" ? "bg-primary" : "bg-border"
            }`}
          />
        </div>

        {/* Step 1: Select Coach */}
        {step === "select-coach" && (
          <div>
            {/* Sport Filter */}
            <div className="mb-4">
              <h2 className="font-display font-bold text-sm mb-3">اختر الرياضة</h2>
              <div className="grid grid-cols-4 gap-2">
                {sportsQ.data?.map((sport: any) => (
                  <button
                    key={sport.id}
                    onClick={() => {
                      setSelectedSport(sport.id);
                      setSelectedCoachId(null);
                    }}
                    className={`h-16 rounded-2xl flex flex-col items-center justify-center text-xs font-bold transition-all ${
                      selectedSport === sport.id
                        ? "bg-primary text-primary-foreground shadow-lg shadow-primary/30"
                        : "bg-surface border border-border"
                    }`}
                  >
                    <span className="text-xl">{sport.emoji}</span>
                    <span className="text-[10px] mt-1 line-clamp-1">{sport.name_ar}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Coaches List */}
            {selectedSport && (
              <div>
                <h2 className="font-display font-bold text-sm mb-3">المدربون المتاحون</h2>
                <div className="space-y-3">
                  {coachesQ.isLoading && (
                    <div className="text-center py-6 text-muted-foreground text-sm">
                      جاري البحث عن المدربين...
                    </div>
                  )}
                  {coachesQ.data?.map((coach: any) => (
                    <button
                      key={coach.id}
                      onClick={() => {
                        setSelectedCoachId(coach.id);
                        setStep("select-time");
                      }}
                      className={`w-full text-right rounded-2xl p-4 transition-all ${
                        selectedCoachId === coach.id
                          ? "bg-primary text-primary-foreground shadow-lg shadow-primary/30"
                          : "bg-surface border border-border hover:border-primary"
                      }`}
                    >
                      <div className="flex justify-between items-start">
                        <div className="flex-1 min-w-0">
                          <h3 className="font-display font-bold">{coach.full_name}</h3>
                          <p className="text-xs opacity-80 mb-2">{coach.title_ar}</p>
                          <div className="flex gap-2">
                            <span className="text-xs opacity-75 flex items-center gap-1">
                              ⭐ {coach.rating || 4.8}
                            </span>
                            <span className="text-xs opacity-75 flex items-center gap-1">
                              <MapPin className="size-3" />
                              {coach.city}
                            </span>
                          </div>
                        </div>
                        <div className="text-right shrink-0 ml-4">
                          <p className="font-display font-bold text-lg">{coach.price_per_session}</p>
                          <p className="text-xs opacity-75">ر.س</p>
                        </div>
                      </div>
                    </button>
                  ))}
                  {coachesQ.data?.length === 0 && (
                    <div className="text-center py-6 text-muted-foreground text-sm">
                      لا يوجد مدربون في هذه الرياضة حالياً
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Step 2: Select Time */}
        {step === "select-time" && selectedCoach && (
          <div>
            {/* Coach Summary */}
            <div className="bg-surface rounded-2xl p-4 mb-6">
              <div className="flex gap-3">
                <div className="size-12 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-display font-bold shrink-0">
                  {selectedCoach.full_name.charAt(0)}
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-display font-bold">{selectedCoach.full_name}</h3>
                  <p className="text-xs text-muted-foreground">{selectedCoach.title_ar}</p>
                  <p className="text-sm font-bold mt-1">
                    {selectedCoach.price_per_session} ر.س
                  </p>
                </div>
              </div>
            </div>

            {/* Date & Time Selection */}
            <div className="mb-4">
              <h2 className="font-display font-bold text-sm mb-3">اختر التاريخ</h2>
              <input
                type="date"
                value={sessionDate}
                onChange={(e) => setSessionDate(e.target.value)}
                className="w-full h-12 rounded-2xl bg-surface border border-border px-4 font-bold text-sm text-right"
              />
            </div>

            <div className="mb-6">
              <h2 className="font-display font-bold text-sm mb-3">اختر الوقت</h2>
              <input
                type="time"
                value={sessionTime}
                onChange={(e) => setSessionTime(e.target.value)}
                className="w-full h-12 rounded-2xl bg-surface border border-border px-4 font-bold text-sm text-right"
              />
            </div>

            {/* Notes */}
            <div className="mb-6">
              <h2 className="font-display font-bold text-sm mb-3">ملاحظات (اختياري)</h2>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="أي ملاحظات للمدرب؟"
                maxLength={200}
                className="w-full h-20 rounded-2xl bg-surface border border-border px-4 py-3 font-bold text-sm text-right resize-none"
              />
              <p className="text-xs text-muted-foreground mt-1 text-left">
                {notes.length}/200
              </p>
            </div>

            <button
              onClick={() => setStep("confirm")}
              className="w-full h-12 rounded-2xl bg-primary text-primary-foreground font-display font-bold shadow-lg shadow-primary/30 hover:shadow-lg transition-all disabled:opacity-60"
              disabled={!sessionDate || !sessionTime}
            >
              التالي
            </button>
          </div>
        )}

        {/* Step 3: Confirm */}
        {step === "confirm" && selectedCoach && (
          <div>
            {/* Booking Summary */}
            <div className="bg-gradient-to-br from-primary/10 to-cyan-500/10 rounded-3xl p-6 mb-6 text-right">
              <h2 className="font-display font-bold text-lg mb-4">تأكيد الحجز</h2>
              <div className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">المدرب:</span>
                  <span className="font-bold">{selectedCoach.full_name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">التخصص:</span>
                  <span className="font-bold">{selectedCoach.title_ar}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">التاريخ:</span>
                  <span className="font-bold">
                    {new Date(`${sessionDate}T${sessionTime}`).toLocaleDateString("ar-SA")}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">الوقت:</span>
                  <span className="font-bold">{sessionTime}</span>
                </div>
                <div className="border-t border-border pt-3 mt-3 flex justify-between">
                  <span className="text-muted-foreground font-bold">السعر:</span>
                  <span className="font-display font-bold text-lg text-primary">
                    {selectedCoach.price_per_session} ر.س
                  </span>
                </div>
              </div>
            </div>

            {/* Terms */}
            <div className="bg-surface rounded-2xl p-4 mb-6 text-xs leading-relaxed text-muted-foreground text-right">
              <p className="font-bold mb-2">الشروط:</p>
              <ul className="list-disc list-inside space-y-1">
                <li>الحجز محدد بمدة ساعة واحدة</li>
                <li>يمكنك إلغاء الحجز قبل 24 ساعة</li>
                <li>سيتم إرسال رابط الاتصال قبل موعد الجلسة</li>
              </ul>
            </div>

            {/* Action Buttons */}
            <div className="space-y-2">
              <button
                onClick={() => createBookingMutation.mutate()}
                disabled={createBookingMutation.isPending}
                className="w-full h-12 rounded-2xl bg-primary text-primary-foreground font-display font-bold shadow-lg shadow-primary/30 hover:shadow-lg transition-all disabled:opacity-60"
              >
                {createBookingMutation.isPending ? "جاري الحجز..." : "تأكيد الحجز 🎉"}
              </button>
              <button
                onClick={() => setStep("select-time")}
                className="w-full h-12 rounded-2xl bg-background border border-border font-display font-bold hover:bg-surface transition-all"
              >
                رجوع
              </button>
            </div>
          </div>
        )}
      </div>
    </PhoneShell>
  );
}
