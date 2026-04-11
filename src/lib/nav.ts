/**
 * Active nav state for sidebar / mobile nav.
 * Disbursement flows share one highlight (new + detail).
 */
export function isNavActive(pathname: string, href: string): boolean {
  if (href === "/disbursements/new") {
    return pathname.startsWith("/disbursements");
  }
  if (href === "/dashboard") {
    return pathname === "/dashboard" || pathname === "/";
  }
  return pathname === href || pathname.startsWith(`${href}/`);
}
