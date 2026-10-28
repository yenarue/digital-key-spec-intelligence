import type { Metadata } from "next";
import type { ReactNode } from "react";
import localFont from "next/font/local";
import "./globals.css";

const pretendard = localFont({
  src: "../assets/fonts/PretendardVariable.woff2",
  variable: "--font-pretendard",
  weight: "45 920",
  display: "swap",
});
export const metadata: Metadata = {
  title: "DKSI · Spec Intelligence",
  description: "독립 창작한 가상 요구사항에서 버전과 정확한 원문 근거를 확인하는 학술 데모",
};
export default function Layout({ children }: { children: ReactNode }) {
  return <html lang="ko" className={pretendard.variable}><body>{children}</body></html>;
}
