import { logout } from "../login/actions";
import { PageHeader } from "./page-header";

/** Shown when the upstream session is gone (school timeout, server restart). */
export function ExpiredPanel({ title }: { title: string }) {
  return (
    <>
      <PageHeader eyebrow="學生功能" title={title} />
      <section className="dash-panel dash-gate">
        <h2>校務系統連線已過期</h2>
        <p>學校的登入階段有時效限制，重新登入即可繼續使用。</p>
        <form action={logout}>
          <button className="enter" type="submit">
            重新登入
          </button>
        </form>
      </section>
    </>
  );
}
