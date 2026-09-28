import type { Metadata } from "next";
import { isStudent, requireSession } from "@/lib/session";
import { RestrictedPage } from "../restricted";
import { ScheduleView } from "./schedule-view";

export const metadata: Metadata = {
  title: "課表查詢",
};

export default async function SchedulePage() {
  const session = await requireSession();
  if (!isStudent(session)) {
    return <RestrictedPage title="課表查詢" />;
  }

  return <ScheduleView courses={[]} />;
}
