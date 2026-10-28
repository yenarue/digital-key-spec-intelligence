import type { Metadata } from "next";
import type { ReactNode } from "react";
import localFont from "next/font/local";
import "./globals.css";
import { uiText } from "../content/ui-text";

const pretendard = localFont({
  src: "../assets/fonts/PretendardVariable.woff2",
  variable: "--font-pretendard",
  weight: "45 920",
  display: "swap",
});
export const metadata: Metadata = {
  title: uiText.meta.title,
  description: uiText.meta.description,
};
export default function Layout({ children }: { children: ReactNode }) {
  return <html lang="ko" className={pretendard.variable}><body>{children}</body></html>;
}
