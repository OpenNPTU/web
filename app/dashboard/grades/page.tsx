import type { Metadata } from "next";
import { isStudent, requireSession } from "@/lib/session";
import { PageHeader } from "../page-header";
import { RestrictedPage } from "../restricted";

export const metadata: Metadata = {
  title: "成績查詢",
};

export default async function GradesPage() {
  const session = await requireSession();
  if (!isStudent(session)) {
    return <RestrictedPage title="成績查詢" />;
  }

  return (
    <>
      <PageHeader eyebrow="歷年成績" title="成績查詢" />
      <section className="dash-panel">
        <p className="dash-empty">目前沒有成績資料。</p>
      </section>
    </>
  );
}
