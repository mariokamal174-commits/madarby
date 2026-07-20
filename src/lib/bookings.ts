export function getBookingDateTime(booking: { booking_date?: string | null; start_time?: string | null }) {
  if (!booking?.start_time) return null;

  const raw = String(booking.start_time).trim();
  if (!raw) return null;

  const directDate = new Date(raw);
  if (!Number.isNaN(directDate.getTime())) {
    return directDate;
  }

  if (booking.booking_date) {
    const timeMatch = raw.match(/^(\d{1,2}):(\d{2})$/);
    if (timeMatch) {
      const hours = Number(timeMatch[1]);
      const minutes = Number(timeMatch[2]);
      const fallback = new Date(`${booking.booking_date}T${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}:00`);
      if (!Number.isNaN(fallback.getTime())) return fallback;
    }

    const fallback = new Date(`${booking.booking_date}T00:00:00`);
    if (!Number.isNaN(fallback.getTime())) return fallback;
  }

  return null;
}

export function getBookingDisplayDate(booking: { booking_date?: string | null; start_time?: string | null }) {
  const date = getBookingDateTime(booking);
  if (!date) return "";
  return date.toLocaleDateString("ar-SA", {
    weekday: "long",
    month: "long",
    day: "numeric",
  });
}

export function getBookingDisplayTime(booking: { booking_date?: string | null; start_time?: string | null }) {
  const date = getBookingDateTime(booking);
  if (!date) return "";
  return date.toLocaleTimeString("ar-SA", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function getBookingTimeCode(booking: { booking_date?: string | null; start_time?: string | null }) {
  const date = getBookingDateTime(booking);
  if (!date) return "";
  return `${String(date.getHours()).padStart(2, "0")}:${String(date.getMinutes()).padStart(2, "0")}`;
}

export function isBookingUpcoming(booking: { status?: string | null; booking_date?: string | null; start_time?: string | null }) {
  const date = getBookingDateTime(booking);
  if (!date) {
    return booking?.status === "pending" || booking?.status === "confirmed";
  }

  if (booking?.status === "completed" || booking?.status === "cancelled") {
    return false;
  }

  return date > new Date();
}
