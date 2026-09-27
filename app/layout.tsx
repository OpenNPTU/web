import type { Metadata } from "next";
import { Noto_Sans_TC, Poiret_One } from "next/font/google";
import Script from "next/script";
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

export default function RootLayout({ children }: LayoutProps<"/">) {
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
        {children}
      </body>
    </html>
  );
}
