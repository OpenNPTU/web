import { isStudent, requireSession } from "@/lib/session";
import { DashNav } from "./nav";

export default async function DashboardLayout({ children }: LayoutProps<"/dashboard">) {
  const session = await requireSession();

  return (
    <div className="dash">
      <DashNav student={isStudent(session)} />
      <main className="dash-main">{children}</main>
    </div>
  );
}
