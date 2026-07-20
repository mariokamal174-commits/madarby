export type BookingStatus = "pending" | "accepted" | "rejected" | "cancelled" | "completed";
export type ReviewStatus = "pending" | "approved" | "rejected" | "hidden";
export type TransactionStatus = "pending" | "processing" | "completed";

export interface CoachBooking {
  id: string;
  student: string;
  sport: string;
  date: string;
  time: string;
  status: BookingStatus;
  amount: number;
  commission: number;
  net: number;
  notes?: string;
  history: Array<{
    status: BookingStatus;
    label: string;
    timestamp: string;
  }>;
}

export interface CoachAvailabilitySlot {
  id: string;
  day: string;
  time: string;
  recurring: boolean;
  available: boolean;
  type: "available" | "blocked" | "vacation";
}

export interface EarningsTransaction {
  id: string;
  booking: string;
  student: string;
  amount: number;
  commission: number;
  net: number;
  date: string;
  status: TransactionStatus;
}

export interface ReviewRecord {
  id: string;
  bookingId: string;
  student: string;
  overall: number;
  coach: number;
  quality: number;
  communication: number;
  punctuality: number;
  comment: string;
  photos: string[];
  anonymous: boolean;
  status: ReviewStatus;
  createdAt: string;
}

export interface NotificationItem {
  id: string;
  title: string;
  body: string;
  time: string;
  unread: boolean;
  type: string;
}

export interface AnalyticsPoint {
  name: string;
  revenue: number;
  bookings: number;
  users: number;
  rating: number;
}

export interface AdminSummary {
  title: string;
  value: string;
  trend: string;
}

export interface AcademyDashboardSummary {
  title: string;
  value: string;
  hint: string;
}

export interface BookingHistoryItem {
  id: string;
  coach: string;
  sport: string;
  date: string;
  time: string;
  amount: number;
  status: BookingStatus;
}

export const coachBookingsSeed: CoachBooking[] = [
  {
    id: "bk-1001",
    student: "سارة أحمد",
    sport: "كرة قدم",
    date: "2026-07-25",
    time: "18:30",
    status: "pending",
    amount: 300,
    commission: 45,
    net: 255,
    notes: "تفضل جلسة فردية في المركز",
    history: [
      { status: "pending", label: "تم استلام الطلب", timestamp: "قبل 2 ساعة" },
      { status: "accepted", label: "تم قبول الحجز", timestamp: "قبل 1 ساعة" },
    ],
  },
  {
    id: "bk-1002",
    student: "نادر المطيري",
    sport: "تنس",
    date: "2026-07-27",
    time: "20:00",
    status: "accepted",
    amount: 400,
    commission: 60,
    net: 340,
    notes: "مطلوب تدريب على الإرسال",
    history: [
      { status: "accepted", label: "تم تأكيد الحجز", timestamp: "قبل يوم" },
    ],
  },
  {
    id: "bk-1003",
    student: "ريم السالم",
    sport: "السباحة",
    date: "2026-07-29",
    time: "07:00",
    status: "completed",
    amount: 250,
    commission: 38,
    net: 212,
    history: [
      { status: "completed", label: "تمت الجلسة بنجاح", timestamp: "قبل 3 أيام" },
    ],
  },
  {
    id: "bk-1004",
    student: "فهد العتيبي",
    sport: "يوجا",
    date: "2026-07-20",
    time: "16:00",
    status: "cancelled",
    amount: 180,
    commission: 27,
    net: 153,
    history: [
      { status: "cancelled", label: "تم إلغاء الحجز", timestamp: "قبل 6 ساعات" },
    ],
  },
];

export const availabilitySeed: CoachAvailabilitySlot[] = [
  { id: "slot-1", day: "الاثنين", time: "18:00", recurring: true, available: true, type: "available" },
  { id: "slot-2", day: "الأربعاء", time: "20:00", recurring: true, available: true, type: "available" },
  { id: "slot-3", day: "الجمعة", time: "09:00", recurring: false, available: false, type: "blocked" },
  { id: "slot-4", day: "السبت", time: "16:00", recurring: true, available: true, type: "available" },
  { id: "slot-5", day: "الأحد", time: "14:00", recurring: false, available: false, type: "vacation" },
];

export const earningsSeed: EarningsTransaction[] = [
  { id: "txn-1", booking: "bk-1003", student: "ريم السالم", amount: 250, commission: 38, net: 212, date: "2026-07-10", status: "completed" },
  { id: "txn-2", booking: "bk-1002", student: "نادر المطيري", amount: 400, commission: 60, net: 340, date: "2026-07-08", status: "processing" },
  { id: "txn-3", booking: "bk-1001", student: "سارة أحمد", amount: 300, commission: 45, net: 255, date: "2026-07-05", status: "pending" },
];

export const reviewSeed: ReviewRecord[] = [
  {
    id: "rev-1",
    bookingId: "bk-1003",
    student: "ريم السالم",
    overall: 5,
    coach: 5,
    quality: 5,
    communication: 4,
    punctuality: 5,
    comment: "جلسة ممتازة ومريحة، أوصي بها بشدة.",
    photos: ["https://images.unsplash.com/photo-1518611012118-696072aa579a?w=400"],
    anonymous: false,
    status: "pending",
    createdAt: "2026-07-10",
  },
  {
    id: "rev-2",
    bookingId: "bk-1005",
    student: "أحمد الفهد",
    overall: 4,
    coach: 4,
    quality: 4,
    communication: 4,
    punctuality: 5,
    comment: "المدرب محترف للغاية ولكن الوقت كان قصيرًا.",
    photos: [],
    anonymous: true,
    status: "approved",
    createdAt: "2026-07-04",
  },
];

export const notificationsSeed: NotificationItem[] = [
  { id: "n-1", title: "تم استلام حجز جديد", body: "طلب جلسة فردية من سارة أحمد", time: "قبل 5 دقائق", unread: true, type: "booking" },
  { id: "n-2", title: "تذكير قبل 24 ساعة", body: "جلسة مع نادر المطيري تبدأ غدًا", time: "قبل 20 دقيقة", unread: true, type: "reminder" },
  { id: "n-3", title: "تم الدفع", body: "تم استلام 255 جنيهًا مصريًا لحجز bk-1003", time: "قبل ساعة", unread: false, type: "payment" },
];

export const analyticsSeed: AnalyticsPoint[] = [
  { name: "يناير", revenue: 1800, bookings: 14, users: 21, rating: 4.7 },
  { name: "فبراير", revenue: 2200, bookings: 18, users: 24, rating: 4.8 },
  { name: "مارس", revenue: 2600, bookings: 22, users: 28, rating: 4.9 },
  { name: "أبريل", revenue: 3100, bookings: 26, users: 33, rating: 4.8 },
  { name: "مايو", revenue: 3500, bookings: 30, users: 36, rating: 5.0 },
  { name: "يونيو", revenue: 4100, bookings: 34, users: 41, rating: 4.9 },
];

export const adminSeed: AdminSummary[] = [
  { title: "المستخدمون", value: "1,284", trend: "+12%" },
  { title: "المدربون", value: "87", trend: "+8%" },
  { title: "الحجوزات", value: "532", trend: "+19%" },
  { title: "المدفوعات", value: "SAR 38K", trend: "+16%" },
];

export const academySeed: AcademyDashboardSummary[] = [
  { title: "الرياضات", value: "8", hint: "تشمل كرة قدم وتنس والسباحة" },
  { title: "الملاعب", value: "12", hint: "6 داخلية و6 خارجية" },
  { title: "المدربون", value: "19", hint: "3 مدربون جدد هذا الشهر" },
  { title: "الإيرادات", value: "SAR 24K", hint: "متوقعة هذا الأسبوع" },
];

export const bookingHistorySeed: BookingHistoryItem[] = [
  { id: "hist-1", coach: "سالم الزهراني", sport: "كرة قدم", date: "2026-07-22", time: "19:00", amount: 300, status: "upcoming" as BookingStatus },
  { id: "hist-2", coach: "نورة الشهري", sport: "يوجا", date: "2026-07-10", time: "08:30", amount: 220, status: "completed" as BookingStatus },
  { id: "hist-3", coach: "فهد العتيبي", sport: "تنس", date: "2026-06-28", time: "17:00", amount: 180, status: "cancelled" as BookingStatus },
];

export function getCoachDashboardStats() {
  return {
    totalBookings: 124,
    upcomingSessions: 14,
    monthlyEarnings: 18200,
    ratingAverage: 4.8,
    totalStudents: 86,
  };
}

export function getBookingFlowOptions() {
  return [
    { id: "individual", label: "فردي" },
    { id: "group", label: "جماعي" },
    { id: "subscription", label: "اشتراك شهري" },
    { id: "package", label: "باقة 12 جلسة" },
    { id: "home", label: "تدريب منزلي" },
    { id: "online", label: "تدريب عن بعد" },
  ];
}

export function getSearchFilterOptions() {
  return {
    sports: ["كرة قدم", "تنس", "يوجا", "سباحة", "ألعاب القوى"],
    cities: ["الرياض", "جدة", "الدمام", "مكة", "المدينة"],
    prices: ["أقل من 200", "200 - 400", "400+"],
  };
}

export function shouldFilterReview(comment: string) {
  const profanityList = ["قذر", "مقرف", "سيء", "غبي"];
  return profanityList.some((term) => comment.includes(term));
}
