// Admin emails that can access both coach and student views
const ADMIN_EMAILS = ['wenjyu@gmail.com'];

export function isAdmin(email: string | undefined | null): boolean {
  if (!email) return false;
  return ADMIN_EMAILS.includes(email.toLowerCase());
}
