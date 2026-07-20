import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useQuery, useMutation } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { ArrowRight } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/profile/edit")({
  component: ProfileEdit,
});

function ProfileEdit() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [city, setCity] = useState("");
  const [bio, setBio] = useState("");

  const profileQ = useQuery({
    queryKey: ["profile", user?.id],
    queryFn: async () => {
      if (!user?.id) return null;
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .single();
      if (error) throw error;
      return data;
    },
    enabled: !!user?.id,
  });

  const updateMutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase
        .from("profiles")
        .update({ full_name: name, phone, city })
        .eq("id", user?.id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("تم حفظ التغييرات");
      navigate({ to: "/profile" });
    },
    onError: () => {
      toast.error("فشل حفظ التغييرات");
    },
  });

  if (profileQ.isLoading) return <div className="p-8 text-center">جارٍ التحميل...</div>;

  const p = profileQ.data;

  return (
    <div className="px-5 pt-6 pb-32">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <button onClick={() => navigate({ to: "/profile" })} className="size-10 rounded-full bg-surface flex items-center justify-center">
          <ArrowRight className="size-5" />
        </button>
        <h1 className="font-display font-bold text-2xl">البيانات الشخصية</h1>
      </div>

      {/* Form */}
      <div className="space-y-4 mb-6">
        <div>
          <label className="text-xs font-bold text-muted-foreground block mb-2">الاسم الكامل</label>
          <input
            type="text"
            value={name || p?.full_name}
            onChange={(e) => setName(e.target.value)}
            placeholder="أدخل اسمك الكامل"
            className="w-full h-12 rounded-2xl border border-border bg-surface px-4 text-right font-bold"
          />
        </div>

        <div>
          <label className="text-xs font-bold text-muted-foreground block mb-2">رقم الهاتف</label>
          <input
            type="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="01000000000"
            className="w-full h-12 rounded-2xl border border-border bg-surface px-4 text-right font-bold"
          />
        </div>

        <div>
          <label className="text-xs font-bold text-muted-foreground block mb-2">المدينة</label>
          <input
            type="text"
            value={city}
            onChange={(e) => setCity(e.target.value)}
            placeholder="المدينة"
            className="w-full h-12 rounded-2xl border border-border bg-surface px-4 text-right font-bold"
          />
        </div>

        <div>
          <label className="text-xs font-bold text-muted-foreground block mb-2">النبذة</label>
          <textarea
            value={bio}
            onChange={(e) => setBio(e.target.value)}
            placeholder="اكتب نبذة عن نفسك"
            rows={4}
            className="w-full rounded-2xl border border-border bg-surface px-4 py-3 text-right font-bold text-sm"
          />
        </div>
      </div>

      {/* Save Button */}
      <button
        onClick={() => updateMutation.mutate()}
        disabled={updateMutation.isPending}
        className="w-full h-12 rounded-2xl bg-primary text-primary-foreground font-bold disabled:opacity-60"
      >
        {updateMutation.isPending ? "جارٍ الحفظ..." : "حفظ التغييرات"}
      </button>
    </div>
  );
}
