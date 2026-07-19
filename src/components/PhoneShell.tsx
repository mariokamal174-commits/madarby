import { type ReactNode } from "react";

/**
 * Mobile-first phone-shaped container. On mobile the app fills the screen,
 * on desktop it renders as a centered phone frame.
 */
export function PhoneShell({ children, className = "" }: { children: ReactNode; className?: string }) {
  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,_rgba(30,136,229,0.12),_transparent_35%),linear-gradient(180deg,_#f7f9ff_0%,_#f5f8fc_100%)] flex items-stretch justify-center px-0 py-0">
      <div
        className={`w-full max-w-[430px] min-h-screen bg-background/85 backdrop-blur-xl relative overflow-x-hidden border-x border-border/80 shadow-[0_30px_70px_rgba(15,23,42,0.12)] ${className}`}
      >
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_left,_rgba(30,136,229,0.08),_transparent_38%)]" />
        {children}
      </div>
    </div>
  );
}
