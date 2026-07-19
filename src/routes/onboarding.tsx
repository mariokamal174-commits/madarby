import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { PhoneShell } from "@/components/PhoneShell";
import { ArrowLeft } from "lucide-react";

export const Route = createFileRoute("/onboarding")({
  component: Onboarding,
});

const slides = [
  {
    title: "اعثر على رياضتك",
    body: "استكشف أكثر من ١٢ رياضة — من كرة القدم إلى البادل — واختر ما يناسبك.",
    image: "https://images.unsplash.com/photo-1461896836934-ffe607ba8211?w=800",
  },
  {
    title: "درّب مع الأفضل",
    body: "مدربون معتمدون وأكاديميات موثّقة في مدينتك.",
    image: "https://images.unsplash.com/photo-1518611012118-696072aa579a?w=800",
  },
  {
    title: "احجز فوراً",
    body: "اختر الوقت المناسب، ادفع بأمان، واحصل على رمز QR للدخول.",
    image: "https://images.unsplash.com/photo-1571902943202-507ec2618e8f?w=800",
  },
  {
    title: "كن بطلاً",
    body: "تابع تقدمك، اجمع الإنجازات، وطوّر مهاراتك يوماً بعد يوم.",
    image: "https://images.unsplash.com/photo-1552674605-db6ffd4facb5?w=800",
  },
];

function Onboarding() {
  const [i, setI] = useState(0);
  const navigate = useNavigate();
  const last = i === slides.length - 1;
  const s = slides[i];

  return (
    <PhoneShell>
      <div className="min-h-screen flex flex-col">
        <div className="flex justify-between items-center p-5">
          <Link to="/auth" className="text-muted-foreground text-sm font-bold">
            تخطّي
          </Link>
          <div className="flex gap-1.5">
            {slides.map((_, idx) => (
              <span
                key={idx}
                className={`h-1.5 rounded-full transition-all ${
                  idx === i ? "w-6 bg-primary" : "w-1.5 bg-border"
                }`}
              />
            ))}
          </div>
        </div>

        <div className="flex-1 flex flex-col animate-fade" key={i}>
          <div className="relative flex-1 mx-5 rounded-[32px] overflow-hidden">
            <img src={s.image} alt="" className="absolute inset-0 w-full h-full object-cover" />
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
          </div>
          <div className="px-8 py-8 text-center">
            <h2 className="font-display font-bold text-3xl mb-3 text-balance">{s.title}</h2>
            <p className="text-muted-foreground text-base leading-relaxed max-w-[36ch] mx-auto">{s.body}</p>
          </div>
        </div>

        <div className="p-6">
          {last ? (
            <button
              onClick={() => navigate({ to: "/auth" })}
              className="w-full bg-primary text-primary-foreground h-14 rounded-2xl font-display font-bold text-base shadow-lg shadow-primary/30"
            >
              هيا نبدأ
            </button>
          ) : (
            <button
              onClick={() => setI((v) => Math.min(v + 1, slides.length - 1))}
              className="w-full bg-primary text-primary-foreground h-14 rounded-2xl font-display font-bold text-base flex items-center justify-center gap-2"
            >
              التالي
              <ArrowLeft className="size-5" />
            </button>
          )}
        </div>
      </div>
    </PhoneShell>
  );
}