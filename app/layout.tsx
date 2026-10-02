import type { Metadata } from "next";
import { Noto_Sans_TC, Poiret_One } from "next/font/google";
import Script from "next/script";
import { getSession, isStudent } from "@/lib/session";
import { SiteNav } from "./site-nav";
import "./globals.css";

const sans = Noto_Sans_TC({
  weight: ["400", "500"],
  subsets: ["latin"],
  display: "swap",
  variable: "--font-noto",
});

const logo = Poiret_One({
  weight: "400",
  subsets: ["latin"],
  display: "swap",
  variable: "--font-poiret",
});

const themeBoot = `try{var t=localStorage.getItem("theme");if(t!=="light"&&t!=="dark"){t=matchMedia("(prefers-color-scheme: dark)").matches?"dark":"light"}document.documentElement.dataset.theme=t}catch(e){}`;

export const metadata: Metadata = {
  title: {
    default: "OpenNPTU",
    template: "%s · OpenNPTU",
  },
  description: "OpenNPTU",
};

export default async function RootLayout({ children }: LayoutProps<"/">) {
  const session = await getSession();

  return (
    <html
      lang="zh-Hant"
      className={`${sans.variable} ${logo.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <body className="min-h-full">
        <Script id="theme-boot" strategy="beforeInteractive">
          {themeBoot}
        </Script>
        <SiteNav
          user={
            session && isStudent(session)
              ? { name: session.name, studentId: session.studentId }
              : null
          }
        />
        {children}
      </body>
    </html>
  );
}
