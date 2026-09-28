import Link from "next/link";
import { PageHeader } from "./page-header";

export function RestrictedPage({ title }: { title: string }) {
  return (
    <>
      <PageHeader eyebrow="學生功能" title={title} />
      <section className="dash-panel dash-gate">
        <h2>沒有瀏覽權限</h2>
        <p>這項功能僅限學生使用。訪客可以查詢全校開課資料。</p>
        <Link href="/dashboard/courses" className="dash-more">
          前往課程查詢
        </Link>
      </section>
    </>
  );
}
