import { createFileRoute, Link } from "@tanstack/react-router";
import { PhoneShell } from "@/components/PhoneShell";
import { ArrowLeft, Trophy } from "lucide-react";

export const Route = createFileRoute("/")({
  component: Landing,
});

function Landing() {
  return (
    <PhoneShell>
      <div className="relative min-h-screen flex flex-col">
        <div className="relative h-[62vh]">
          <img
            src="https://images.unsplash.com/photo-1517649763962-0c623066013b?w=1200"
            alt="رياضة"
            className="absolute inset-0 w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-background via-background/60 to-transparent" />
          <div className="absolute top-6 right-6 bg-primary text-primary-foreground size-12 rounded-2xl flex items-center justify-center">
            <Trophy className="size-6" />
          </div>
        </div>

        <div className="flex-1 -mt-16 px-6 pb-8 flex flex-col justify-end relative z-10">
          <span className="bg-primary text-primary-foreground w-fit px-3 py-1 rounded-lg text-[10px] font-bold mb-3 uppercase tracking-wider">
            جديد
          </span>
          <h1 className="text-5xl font-display font-bold leading-tight mb-4 text-balance">
            دربّ، احجز،
            <br />
            <span className="text-primary">وكن الأفضل.</span>
          </h1>
          <p className="text-muted-foreground text-base leading-relaxed mb-8 max-w-[36ch]">
            سوق شامل لجميع الرياضات — اختر مدربك، حدد وقتك، وابدأ رحلتك نحو التميّز.
          </p>

          <div className="flex flex-col gap-3">
            <Link
              to="/onboarding"
              className="w-full bg-primary text-primary-foreground h-14 rounded-2xl font-display font-bold text-base flex items-center justify-center gap-2 shadow-lg shadow-primary/30"
            >
              ابدأ الآن
              <ArrowLeft className="size-5" />
            </Link>
            <Link
              to="/auth"
              className="w-full h-14 rounded-2xl font-display font-bold text-sm flex items-center justify-center text-muted-foreground"
            >
              لديّ حساب — تسجيل الدخول
            </Link>
          </div>
        </div>
      </div>
    </PhoneShell>
  );
}
