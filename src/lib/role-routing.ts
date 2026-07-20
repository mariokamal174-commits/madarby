export type AppRole = "player" | "coach" | "academy" | "admin";

export function getDefaultRouteForRole(role?: string | null) {
  return role === "admin" ? "/admin-dashboard" : "/home";
}
