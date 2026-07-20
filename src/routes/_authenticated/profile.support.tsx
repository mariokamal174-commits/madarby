import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { ArrowRight, HelpCircle, MessageSquare, Phone, Mail, Plus, ChevronDown } from "lucide-react";
import { useState } from "react";

export const Route = createFileRoute("/_authenticated/profile/support")({
  component: Support,
});

function Support() {
  const navigate = useNavigate();
  const [expandedFaq, setExpandedFaq] = useState<number | null>(null);

  const faqs = [
    {
      id: 1,
      question: "كيف أحجز جلسة تدريبية؟",
      answer: "انتقل إلى الصفحة الرئيسية واختر مدرباً، ثم اتبع خطوات الحجز السهلة.",
    },
    {
      id: 2,
      question: "كيف ألغي الحجز؟",
      answer: "في صفحة الحجوزات، اضغط على إلغاء بجانب الحجز المطلوب قبل موعد الجلسة بـ 24 ساعة.",
    },
    {
      id: 3,
      question: "ما طرق الدفع المتاحة؟",
      answer: "نقبل الفيزا، ماستر كارد، Apple Pay، والمحفظة الرقمية.",
    },
    {
      id: 4,
      question: "كيف أضيف رقم بطاقة جديد؟",
      answer: "اذهب إلى الملف الشخصي > وسائل الدفع > أضف بطاقة جديدة",
    },
    {
      id: 5,
      question: "هل يمكنني استرجاع أموالي؟",
      answer: "نعم، يمكنك الحصول على استرجاع كامل إذا ألغيت الحجز قبل 24 ساعة من الموعد.",
    },
  ];

  return (
    <div className="px-5 pt-6 pb-32">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <button onClick={() => navigate({ to: "/profile" })} className="size-10 rounded-full bg-surface flex items-center justify-center">
          <ArrowRight className="size-5" />
        </button>
        <h1 className="font-display font-bold text-2xl">الدعم الفني</h1>
      </div>

      {/* Contact Methods */}
      <div className="mb-6">
        <h2 className="font-display font-bold text-sm mb-3 flex items-center gap-2">
          <MessageSquare className="size-4" /> تواصل معنا
        </h2>
        <div className="space-y-3">
          <button className="w-full rounded-2xl border border-border bg-surface p-4 flex items-center justify-between hover:bg-background transition-all">
            <div className="flex items-center gap-3">
              <div className="size-10 rounded-lg bg-blue-500/10 flex items-center justify-center">
                <MessageSquare className="size-5 text-blue-600" />
              </div>
              <div className="text-right">
                <p className="font-bold text-sm">الدردشة المباشرة</p>
                <p className="text-xs text-muted-foreground">تحدث معنا الآن</p>
              </div>
            </div>
            <ArrowRight className="size-4 text-muted-foreground" />
          </button>

          <button className="w-full rounded-2xl border border-border bg-surface p-4 flex items-center justify-between hover:bg-background transition-all">
            <div className="flex items-center gap-3">
              <div className="size-10 rounded-lg bg-green-500/10 flex items-center justify-center">
                <Phone className="size-5 text-green-600" />
              </div>
              <div className="text-right">
                <p className="font-bold text-sm">استدعاء الدعم</p>
                <p className="text-xs text-muted-foreground">16000 (٢٤/٧)</p>
              </div>
            </div>
            <ArrowRight className="size-4 text-muted-foreground" />
          </button>

          <button className="w-full rounded-2xl border border-border bg-surface p-4 flex items-center justify-between hover:bg-background transition-all">
            <div className="flex items-center gap-3">
              <div className="size-10 rounded-lg bg-orange-500/10 flex items-center justify-center">
                <Mail className="size-5 text-orange-600" />
              </div>
              <div className="text-right">
                <p className="font-bold text-sm">البريد الإلكتروني</p>
                <p className="text-xs text-muted-foreground">support@athlete.app</p>
              </div>
            </div>
            <ArrowRight className="size-4 text-muted-foreground" />
          </button>
        </div>
      </div>

      {/* FAQs */}
      <div>
        <h2 className="font-display font-bold text-sm mb-3 flex items-center gap-2">
          <HelpCircle className="size-4" /> الأسئلة الشائعة
        </h2>
        <div className="space-y-2 rounded-2xl border border-border bg-surface overflow-hidden">
          {faqs.map((faq) => (
            <div key={faq.id} className="border-b border-border last:border-b-0">
              <button
                onClick={() => setExpandedFaq(expandedFaq === faq.id ? null : faq.id)}
                className="w-full p-4 flex items-center justify-between hover:bg-background/50 transition-all text-right"
              >
                <div className="flex items-center gap-2">
                  <ChevronDown
                    className={`size-4 text-muted-foreground transition-transform ${
                      expandedFaq === faq.id ? "rotate-180" : ""
                    }`}
                  />
                </div>
                <p className="flex-1 font-bold text-sm">{faq.question}</p>
              </button>

              {expandedFaq === faq.id && (
                <div className="px-4 pb-4 text-xs text-muted-foreground bg-background/30">
                  {faq.answer}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Report Issue Button */}
      <button className="w-full mt-6 h-12 rounded-2xl border border-border bg-surface font-bold flex items-center justify-center gap-2 hover:bg-background transition-all">
        <Plus className="size-4" />
        إبلاغ عن مشكلة
      </button>
    </div>
  );
}
