export type Role = "user" | "operator" | "admin";

export const ROLE_REDIRECT: Record<Role, string> = {
  user: "/dashboard",
  operator: "/operator",
  admin: "/admin",
};
