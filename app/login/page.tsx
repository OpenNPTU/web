import type { Metadata } from "next";
import { LoginPanel } from "../login-panel";

export const metadata: Metadata = {
  title: "登入",
};

export default function LoginPage() {
  return (
    <main className="landing">
      <div className="landing-center">
        <h1>
          <span className="wordmark">OpenNPTU</span>
        </h1>
        <LoginPanel />
      </div>
    </main>
  );
}
