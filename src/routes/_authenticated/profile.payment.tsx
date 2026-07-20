import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { ArrowRight, Plus, CreditCard, Wallet, Trash2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/profile/payment")({
  component: PaymentMethods,
});

function PaymentMethods() {
  const navigate = useNavigate();
  const [showForm, setShowForm] = useState(false);
  const [cards, setCards] = useState([
    { id: 1, name: "فيزا", number: "****4242", type: "visa" },
    { id: 2, name: "ماستر كارد", number: "****8888", type: "mastercard" },
  ]);

  return (
    <div className="px-5 pt-6 pb-32">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <button onClick={() => navigate({ to: "/profile" })} className="size-10 rounded-full bg-surface flex items-center justify-center">
          <ArrowRight className="size-5" />
        </button>
        <h1 className="font-display font-bold text-2xl">وسائل الدفع</h1>
      </div>

      {/* Saved Cards */}
      <div className="mb-6">
        <h2 className="font-display font-bold text-sm mb-3">💳 البطاقات المحفوظة</h2>
        <div className="space-y-3">
          {cards.map((card) => (
            <div key={card.id} className="rounded-2xl border border-border bg-surface p-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="size-10 rounded-lg bg-primary/10 flex items-center justify-center">
                  <CreditCard className="size-5 text-primary" />
                </div>
                <div>
                  <p className="font-bold text-sm">{card.name}</p>
                  <p className="text-xs text-muted-foreground">{card.number}</p>
                </div>
              </div>
              <button
                onClick={() => {
                  setCards(cards.filter((c) => c.id !== card.id));
                  toast.success("تم حذف البطاقة");
                }}
                className="size-10 rounded-lg text-red-600 hover:bg-red-50 transition-all"
              >
                <Trash2 className="size-5" />
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Wallet */}
      <div className="mb-6">
        <h2 className="font-display font-bold text-sm mb-3">💰 المحفظة الرقمية</h2>
        <div className="rounded-2xl border border-border bg-surface p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-bold text-sm">رصيدي</p>
              <p className="text-xs text-muted-foreground">استخدم الرصيد في الحجوزات</p>
            </div>
            <p className="font-display font-bold text-2xl text-primary">250 ج.م</p>
          </div>
          <button className="w-full mt-3 h-10 rounded-lg bg-primary/10 text-primary font-bold text-xs">
            شحن المحفظة
          </button>
        </div>
      </div>

      {/* Add New Card */}
      {!showForm ? (
        <button
          onClick={() => setShowForm(true)}
          className="w-full h-12 rounded-2xl border border-border bg-surface font-bold flex items-center justify-center gap-2 hover:bg-background transition-all"
        >
          <Plus className="size-4" />
          إضافة بطاقة جديدة
        </button>
      ) : (
        <div className="rounded-2xl border border-border bg-surface p-4 space-y-3">
          <input type="text" placeholder="رقم البطاقة" className="w-full h-10 rounded-lg border border-border bg-background px-3 text-right" />
          <div className="grid grid-cols-2 gap-2">
            <input type="text" placeholder="الشهر/السنة" className="h-10 rounded-lg border border-border bg-background px-3 text-right" />
            <input type="text" placeholder="CVV" className="h-10 rounded-lg border border-border bg-background px-3 text-right" />
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setShowForm(false)}
              className="flex-1 h-10 rounded-lg border border-border font-bold text-xs"
            >
              إلغاء
            </button>
            <button
              onClick={() => {
                setShowForm(false);
                toast.success("تمت إضافة البطاقة");
              }}
              className="flex-1 h-10 rounded-lg bg-primary text-primary-foreground font-bold text-xs"
            >
              إضافة
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
