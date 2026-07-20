import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { ArrowRight, Bell, Lock, Globe } from "lucide-react";
import { useState } from "react";

export const Route = createFileRoute("/_authenticated/profile/settings")({
  component: Settings,
});

function Settings() {
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState(true);
  const [emailNotifications, setEmailNotifications] = useState(true);
  const [pushNotifications, setPushNotifications] = useState(false);
  const [language, setLanguage] = useState("ar");

  return (
    <div className="px-5 pt-6 pb-32">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <button onClick={() => navigate({ to: "/profile" })} className="size-10 rounded-full bg-surface flex items-center justify-center">
          <ArrowRight className="size-5" />
        </button>
        <h1 className="font-display font-bold text-2xl">الإعدادات</h1>
      </div>

      {/* Notifications */}
      <div className="mb-6">
        <h2 className="font-display font-bold text-sm mb-3 flex items-center gap-2">
          <Bell className="size-4" /> الإشعارات
        </h2>
        <div className="space-y-3 rounded-2xl border border-border bg-surface p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-bold text-sm">تفعيل الإشعارات</p>
              <p className="text-xs text-muted-foreground">استقبل التنبيهات المهمة</p>
            </div>
            <input
              type="checkbox"
              checked={notifications}
              onChange={(e) => setNotifications(e.target.checked)}
              className="w-5 h-5"
            />
          </div>

          <div className="border-t border-border pt-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-bold text-sm">إشعارات البريد الإلكتروني</p>
                <p className="text-xs text-muted-foreground">عن الحجوزات والعروض</p>
              </div>
              <input
                type="checkbox"
                checked={emailNotifications}
                onChange={(e) => setEmailNotifications(e.target.checked)}
                disabled={!notifications}
                className="w-5 h-5 disabled:opacity-50"
              />
            </div>
          </div>

          <div className="border-t border-border pt-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-bold text-sm">إشعارات الهاتف</p>
                <p className="text-xs text-muted-foreground">تنبيهات فورية</p>
              </div>
              <input
                type="checkbox"
                checked={pushNotifications}
                onChange={(e) => setPushNotifications(e.target.checked)}
                disabled={!notifications}
                className="w-5 h-5 disabled:opacity-50"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Privacy & Security */}
      <div className="mb-6">
        <h2 className="font-display font-bold text-sm mb-3 flex items-center gap-2">
          <Lock className="size-4" /> الخصوصية والأمان
        </h2>
        <div className="space-y-2 rounded-2xl border border-border bg-surface p-4">
          <button className="w-full h-11 rounded-lg border border-border bg-background text-sm font-bold hover:bg-surface transition-all text-right">
            تغيير كلمة المرور
          </button>
          <button className="w-full h-11 rounded-lg border border-border bg-background text-sm font-bold hover:bg-surface transition-all text-right">
            ربط حساب إضافي
          </button>
          <button className="w-full h-11 rounded-lg border border-border bg-background text-sm font-bold hover:bg-surface transition-all text-right">
            تسجيل الخروج من جميع الأجهزة
          </button>
        </div>
      </div>

      {/* Language */}
      <div className="mb-6">
        <h2 className="font-display font-bold text-sm mb-3 flex items-center gap-2">
          <Globe className="size-4" /> اللغة والمنطقة
        </h2>
        <div className="rounded-2xl border border-border bg-surface p-4 space-y-3">
          <div>
            <p className="font-bold text-sm mb-2">اللغة</p>
            <select
              value={language}
              onChange={(e) => setLanguage(e.target.value)}
              className="w-full h-10 rounded-lg border border-border bg-background px-3 font-bold text-sm text-right"
            >
              <option value="ar">العربية</option>
              <option value="en">English</option>
            </select>
          </div>

          <div>
            <p className="font-bold text-sm mb-2">المنطقة الزمنية</p>
            <select className="w-full h-10 rounded-lg border border-border bg-background px-3 font-bold text-sm text-right">
              <option>Cairo (GMT+2)</option>
              <option>Alexandria (GMT+2)</option>
            </select>
          </div>
        </div>
      </div>

      {/* About */}
      <div className="rounded-2xl border border-border bg-surface p-4">
        <p className="font-bold text-sm mb-2">عن التطبيق</p>
        <p className="text-xs text-muted-foreground mb-3">نسخة 1.0.0</p>
        <div className="flex gap-2">
          <button className="flex-1 h-10 rounded-lg border border-border bg-background text-xs font-bold hover:bg-surface transition-all">
            شروط الاستخدام
          </button>
          <button className="flex-1 h-10 rounded-lg border border-border bg-background text-xs font-bold hover:bg-surface transition-all">
            سياسة الخصوصية
          </button>
        </div>
      </div>
    </div>
  );
}
