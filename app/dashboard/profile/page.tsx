import type { Metadata } from "next";
import { UpstreamSessionExpired, withStudentData } from "@/lib/nptu/data";
import { parseProfile } from "@/lib/nptu/profile";
import { isStudent, requireSession } from "@/lib/session";
import { ExpiredPanel } from "../expired";
import { PageHeader } from "../page-header";
import { RestrictedPage } from "../restricted";

export const metadata: Metadata = {
  title: "個人資料",
};

export default async function ProfilePage() {
  const session = await requireSession();
  if (!isStudent(session)) {
    return <RestrictedPage title="個人資料" />;
  }

  let profile;
  try {
    profile = await withStudentData(async (upstream) => {
      const url = await upstream.menuUrl("A0207S");
      const page = await upstream.get(url, "https://webap2.nptu.edu.tw/Web1/Message/Main.aspx");
      return parseProfile(page.html);
    });
  } catch (error) {
    if (error instanceof UpstreamSessionExpired) return <ExpiredPanel title="個人資料" />;
    throw error;
  }

  return (
    <>
      <PageHeader eyebrow="學籍資料" title="個人資料">
        <p className="dash-meta">{profile.name}</p>
      </PageHeader>

      <div className="dash-stack">
        {profile.groups.map((group) => (
          <section className="dash-panel" key={group.title}>
            <div className="dash-panel-head">
              <h2>{group.title}</h2>
            </div>
            <dl className="dash-stats dash-stats-wide">
              {group.fields.map((field) => (
                <div key={field.label}>
                  <dt>{field.label}</dt>
                  <dd>{field.value}</dd>
                </div>
              ))}
            </dl>
          </section>
        ))}
        <p className="dash-note">
          資料以校務系統為準，如需修改請至原系統的個人資料頁面。
        </p>
      </div>
    </>
  );
}
