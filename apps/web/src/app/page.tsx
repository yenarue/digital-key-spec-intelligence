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
      <details className="about">
        <summary>이 서비스는 무엇인가요?</summary>
        <ul>
          <li>디지털 키 스펙은 버전마다 조건과 예외가 조금씩 달라서, 사람이 직접 비교하기 번거로워요.</li>
          <li>질문하면 선택한 버전의 요구사항을 검색하고, 원문 근거를 함께 보여줘요.</li>
          <li>AI 답변은 검색된 근거 안에서만 만들고, 인용은 원문과 대조해 확인해요.</li>
        </ul>
      </details>
      <AskPanel />
    </main>
    <AppRelease />
    <SignatureFooter />
  </div>;
}
