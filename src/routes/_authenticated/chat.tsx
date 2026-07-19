import { createFileRoute } from "@tanstack/react-router";
import { MessageCircle } from "lucide-react";

export const Route = createFileRoute("/_authenticated/chat")({
  component: Chat,
});

function Chat() {
  return (
    <div className="px-5 pt-6">
      <h1 className="font-display font-bold text-2xl mb-6">محادثات</h1>
      <div className="text-center py-20">
        <div className="size-20 mx-auto mb-4 rounded-full bg-surface flex items-center justify-center">
          <MessageCircle className="size-8 text-muted-foreground" />
        </div>
        <p className="font-display font-bold mb-2">لا توجد محادثات بعد</p>
        <p className="text-muted-foreground text-sm max-w-[28ch] mx-auto">
          ابدأ محادثة مع مدربك بعد الحجز الأول.
        </p>
      </div>
    </div>
  );
}