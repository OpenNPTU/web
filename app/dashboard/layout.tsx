import { requireSession } from "@/lib/session";
import { DashNav } from "./nav";

export default async function DashboardLayout({ children }: LayoutProps<"/dashboard">) {
  await requireSession();

  return (
    <div className="dash">
      <DashNav />
      <main className="dash-main">{children}</main>
    </div>
  );
}
