import { type ReactNode } from "react";

/**
 * Mobile-first phone-shaped container. On mobile the app fills the screen,
 * on desktop it renders as a centered phone frame.
 */
export function PhoneShell({ children, className = "" }: { children: ReactNode; className?: string }) {
  return (
    <div className="min-h-screen bg-neutral-100 flex items-stretch justify-center">
      <div
        className={`w-full max-w-[430px] min-h-screen bg-background relative overflow-x-hidden border-x border-border shadow-xl ${className}`}
      >
        {children}
      </div>
    </div>
  );
}
