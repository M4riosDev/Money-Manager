import { ReactNode } from "react";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import Link from "next/link";

function NavIcon({ path }: { path: string }) {
  const icons: Record<string, string> = {
    expenses: "M3 6h12M3 10h12M3 14h8",
    analytics: "M2 12l3-4 3 3 4-5 3 3",
    charts: "M2 14V8l4-4 4 4 4-6v12H2z",
  };
  const d = icons[path] || "M3 6h12M3 10h12M3 14h12";
  return (
    <svg width="15" height="15" viewBox="0 0 16 16" fill="none">
      <path d={d} stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  );
}

const navItems = [
  { href: "/dashboard/expenses", label: "Expenses", icon: "expenses" },
  { href: "/dashboard/analytics", label: "Analytics", icon: "analytics" },
];

export default async function DashboardLayout({ children }: { children: ReactNode }) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  return (
    <div className="shell">
      <aside className="sidebar">
        <div className="sidebar-logo">
          <div aria-label="Money Manager logo" role="img" className="sidebar-logo-icon" />
          Money Manager
        </div>

        <nav className="sidebar-nav">
          <div className="sidebar-section-label">Menu</div>
          {navItems.map(item => (
            <Link key={item.href} href={item.href} className="sidebar-link">
              <NavIcon path={item.icon} />
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="sidebar-bottom">
          <form action="/auth/signout" method="post">
            <Link href="/login" className="sidebar-link" style={{ fontSize: 13 }}>
              <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
                <path d="M6 14H3a1 1 0 01-1-1V3a1 1 0 011-1h3M10 11l4-4-4-4M14 8H6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              Sign out
            </Link>
          </form>
        </div>
      </aside>
      <div className="main">{children}</div>
    </div>
  );
}
