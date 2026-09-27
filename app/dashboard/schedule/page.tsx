import type { Metadata } from "next";
import { ScheduleView } from "./schedule-view";

export const metadata: Metadata = {
  title: "課表查詢",
};

export default function SchedulePage() {
  return <ScheduleView />;
}
