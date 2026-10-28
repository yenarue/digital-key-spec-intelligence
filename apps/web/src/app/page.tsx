import { AppHeader } from "../components/app-header";
import { AskPanel } from "../components/ask-panel";
import { SignatureFooter } from "../components/signature-footer";

export default function Home() {
  return <div className="app-shell">
    <a className="skip-link" href="#main">본문으로 건너뛰기</a>
    <AppHeader />
    <div className="synthetic-notice" role="note">
      <strong>Synthetic demo — not an official specification</strong>
      <p>독립 창작한 가상 요구사항입니다. 실제 CCC 규격과 대응하지 않습니다.</p>
    </div>
    <main id="main">
      <div className="page-intro"><h1>요구사항을 찾고, 근거를 확인하세요</h1>
        <p>가상 V1·V2 문서에서 조건과 예외를 찾아보세요.</p></div>
      <AskPanel />
    </main>
    <SignatureFooter />
  </div>;
}
