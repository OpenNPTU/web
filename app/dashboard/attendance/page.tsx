import type { Metadata } from "next";
import { isStudent, requireSession } from "@/lib/session";
import { PageHeader } from "../page-header";
import { RestrictedPage } from "../restricted";

export const metadata: Metadata = {
  title: "出缺勤",
};

export default async function AttendancePage() {
  const session = await requireSession();
  if (!isStudent(session)) {
    return <RestrictedPage title="出缺勤" />;
  }

  return (
    <>
      <PageHeader eyebrow="出缺勤紀錄" title="出缺勤" />
      <section className="dash-panel">
        <p className="dash-empty">目前沒有出缺勤資料。</p>
      </section>
    </>
  );
}
