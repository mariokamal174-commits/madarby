# نظام الحجوزات والملفات الشخصية

## نظرة عامة

تم بناء نظام شامل لحجز الجلسات التدريبية مع دعم ثنائي الاتجاه:
- **المدربون**: استقبال الطلبات وإدارة الجلسات والأرباح
- **المتدربون**: البحث عن مدربين وحجز جلسات وتتبع تقدمهم

## العناصر الرئيسية

### نموذج البيانات (Supabase)

#### جدول `bookings`
```sql
- id: UUID (PK)
- player_id: UUID (FK → auth.users)
- coach_id: UUID (FK → auth.users)
- sport_id: UUID (FK → sports)
- start_time: TIMESTAMPTZ
- end_time: TIMESTAMPTZ
- price: NUMERIC(10,2)
- status: ENUM (pending, confirmed, completed, cancelled)
- notes: TEXT
- created_at: TIMESTAMPTZ
```

**الحالات (Status Flow):**
```
pending (المتدرب يطلب) 
  ↓ (المدرب يقبل)
confirmed (جلسة مؤكدة)
  ↓ (المدرب ينهي)
completed (مكتملة + مدفوعة)

OR

pending → cancelled (المدرب يرفض أو يلغي)
confirmed → cancelled (إلغاء من أي طرف)
```

#### جدول `player_preferences`
```sql
- player_id: UUID (PK, FK → auth.users)
- level: TEXT (بداية/متوسط/متقدم/احترافي)
- favorite_sports: TEXT[]
- fitness_goals: TEXT
- followed_coaches: UUID[]
- followed_academies: UUID[]
- created_at: TIMESTAMPTZ
- updated_at: TIMESTAMPTZ
```

#### سياسات الوصول (RLS)

**Bookings:**
- `SELECT`: اللاعب أو المدرب المعني فقط
- `INSERT`: اللاعب ينشئ حجز بـ player_id=auth.uid()
- `UPDATE`: طرفا الحجز فقط (تأكيد/إلغاء)

**Player Preferences:**
- `SELECT`: المالك فقط
- `INSERT/UPDATE`: المالك فقط

---

## تدفقات المستخدم

### 🎮 تدفق المتدرب الجديد

1. **التسجيل** (`/auth`)
   - اختيار دور "متدرب" (لاعب)
   - ملء: الاسم، البريد، الهاتف، المدينة

2. **الاستكمال** (`/onboarding-complete`)
   - فحص الدور من profiles.primary_role
   - التوجيه إلى `/player-onboarding`

3. **الإعداد الأولي** (`/player-onboarding`)
   - **الخطوة 1**: اختيار العمر (5-100) ومستوى المهارة
   - **الخطوة 2**: اختيار الرياضات المفضلة (متعدد)
   - **الخطوة 3**: إدخال أهداف التدريب (اختياري)
   - **الإجراء**: تحديث profiles + upsert player_preferences

4. **الصفحة الرئيسية** (`/home` - دور player)
   - **بطاقات الإحصائيات**: جلسات قادمة، مكتملة، رياضات متتبعة
   - **معلومات المستخدم**: مستوى، أهداف، جلسات قادمة
   - **كارت الحجز**: رابط سريع للحجز الجديد

---

### 📅 تدفق الحجز (Booking Flow)

#### المسار: `/booking-flow` (3 خطوات)

**الخطوة 1: اختيار المدرب**
- تصفية حسب الرياضة (8 خيارات)
- عرض قائمة المدربين المتاحين مع:
  - الاسم والتخصص
  - التقييم والمدينة
  - السعر لكل جلسة
- اختيار مدرب واحد

**الخطوة 2: اختيار الوقت**
- ملخص المدرب المختار
- إدخال التاريخ والوقت
- ملاحظات اختيارية (200 حرف أقصى)
- التحقق من: التاريخ والوقت مطلوبة

**الخطوة 3: التأكيد**
- عرض ملخص الحجز كامل
- عرض الشروط والأحكام
- زر "تأكيد الحجز"
- **الإجراء عند التأكيد**:
  - إدراج صف في جدول bookings
  - status='pending'
  - إشعار النجاح + إعادة توجيه إلى `/bookings`

---

### 📋 عرض الحجوزات

#### المسار: `/_authenticated/bookings`

**الإحصائيات** (3 بطاقات علوية):
- الجلسات القادمة (status=confirmed، start_time > now)
- الجلسات المكتملة
- الجلسات الملغاة

**الأقسام**:

1. **الجلسات القادمة** (status=confirmed & start_time > now)
   - بطاقة لكل جلسة مع:
     - اسم المدرب والتخصص والرياضة
     - التاريخ والوقت والسعر
   - أزرار: **إلغاء** (نقل إلى cancelled)، **تفاصيل**

2. **جلسات مكتملة** (status=completed)
   - عرض مختصر: المدرب + التاريخ + ✓
   - آخر 3 فقط

3. **جلسات ملغاة** (status=cancelled)
   - عرض مختصر: المدرب + التاريخ + ✕
   - آخر 3 فقط

---

### 👤 ملف المتدرب الشخصي

#### المسار: `/_authenticated/player-profile`

**الإحصائيات** (شبكة 3 أعمدة):
- جلسات قادمة
- جلسات مكتملة
- رياضات متتبعة

**المعلومات الأساسية**:
- المدينة
- رقم الهاتف

**معلومات التدريب**:
- مستوى المهارة (من player_preferences.level)
- الرياضات المفضلة (شارات)
- أهداف التدريب

**أزرار**:
- عرض الجلسات
- حجز جلسة جديدة

---

### 👨‍🏫 تدفق المدرب

#### لوحة تحكم المدرب: `/_authenticated/coach-dashboard`

**الإحصائيات** (شبكة):
- إجمالي الحجوزات
- الجلسات القادمة
- الأرباح الشهرية
- التقييم
- طلبات قيد الانتظار

**الرسم البياني**: 
- إحصائيات الحجوزات أسبوعية (7 أيام)

**قسم الطلبات**:

1. **قيد الانتظار** (status=pending)
   - بطاقات برتقالية/كهرمانية
   - معلومات المتدرب: اسم، رياضة، تاريخ/وقت
   - أزرار: **قبول** (→ confirmed)، **رفض** (→ cancelled)

2. **الجلسات القادمة** (status=confirmed & start_time > now)
   - بطاقات زرقاء
   - معلومات كاملة: اسم، رقم، تاريخ، وقت
   - أزرار: **إكمال الجلسة** (→ completed)، **إلغاء** (→ cancelled)

3. **جلسات مكتملة**
   - عرض الإجمالي والأرباح

---

## مكونات مساعدة

### `PlayerBottomNav` 
شريط تنقل سفلي للمتدربين:
- الرئيسية (`/home`)
- البحث (`/search`)
- حجوزاتي (`/bookings`)
- ملفي (`/player-profile`)

**الاستخدام**:
```tsx
import { PlayerBottomNav } from "@/components/PlayerBottomNav";

export function PlayerLayout() {
  return (
    <>
      <div className="pb-20">
        {/* محتوى الصفحة */}
      </div>
      <PlayerBottomNav />
    </>
  );
}
```

### صفحة البحث المحسّنة
**المسار**: `/_authenticated/search`

- تبويبات: المدربون | الأكاديميات
- فلاتر:
  - البحث بالاسم/التخصص
  - المدينة
  - الرياضة (للمدربين فقط)
  - التقييم الأدنى (للمدربين فقط)
- النتائج بطاقات حقيقية

---

## أنماط الأكواد (Code Patterns)

### استدعاء API مع React Query

```tsx
const bookingsQ = useQuery({
  queryKey: ["player_bookings_detail", user?.id],
  queryFn: async () => {
    const { data, error } = await supabase
      .from("bookings")
      .select("*, coaches(full_name, title_ar), sports(name_ar)")
      .eq("player_id", user.id)
      .order("start_time", { ascending: false });
    if (error) throw error;
    return data || [];
  },
  enabled: !!user?.id,
});
```

### عمليات التحديث (Mutations)

```tsx
const confirmBookingMutation = useMutation({
  mutationFn: async (bookingId: string) => {
    const { error } = await supabase
      .from("bookings")
      .update({ status: "confirmed" })
      .eq("id", bookingId);
    if (error) throw error;
  },
  onSuccess: () => {
    toast.success("تم تأكيد الحجز ✓");
    queryClient.invalidateQueries({ queryKey: ["coach_bookings_dashboard"] });
  },
  onError: () => {
    toast.error("فشل تأكيد الحجز");
  },
});
```

### الفلترة والتصنيف

```tsx
const upcomingBookings = bookingsQ.data?.filter(
  (b: any) => b.status === "confirmed" && new Date(b.start_time) > new Date()
) || [];
```

---

## الميزات المستقبلية (النسخة التالية)

- ⭐ نظام التقييمات والتعليقات
- 💬 نظام المراسلة المباشرة
- 📧 الإشعارات عبر البريد الإلكتروني
- 🎁 نظام الخصومات والقسائم
- 📊 تقارير الأداء للمدربين
- 🔄 إعادة جدولة الجلسات
- 🏆 شهادات الإنجاز

---

## الملاحظات المهمة

### الأمان (Security)
- ✅ سياسات RLS محكمة لـ bookings و player_preferences
- ✅ المتدربون لا يمكنهم رؤية حجوزات الآخرين
- ✅ المدربون لا يمكنهم قبول حجوزات ليست لهم
- ⚠️ يجب إضافة تحقق من البريد الإلكتروني قبل السماح بالحجز

### الأداء
- ✅ استخدام queryKey المناسبة لـ caching
- ✅ pagination للقوائم الطويلة (future)
- ✅ lazy loading للصور

### التجربة (UX)
- ✅ تحققات شاملة من النماذج
- ✅ رسائل خطأ واضحة
- ✅ تحميل بحالات فارغة مناسبة
- ✅ تكامل إشعارات (toast) في كل العمليات

---

آخر تحديث: 19 يوليو 2025
