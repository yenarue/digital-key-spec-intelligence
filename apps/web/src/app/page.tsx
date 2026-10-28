import { AppHeader } from "../components/app-header";
import { AskPanel } from "../components/ask-panel";
import { AppRelease } from "../components/app-release";
import { SignatureFooter } from "../components/signature-footer";

export default function Home() {
  return <div className="app-shell">
    <a className="skip-link" href="#main">본문으로 건너뛰기</a>
    <AppHeader />
    <main id="main">
      <div className="page-intro"><h1>요구사항을 찾고, 근거를 확인하세요</h1>
        <p>디지털 키 스펙 문서에서 궁금한 규칙과 예외 사항을 질문해 보세요.</p></div>
      <AskPanel />
    </main>
    <AppRelease />
    <SignatureFooter />
  </div>;
}
