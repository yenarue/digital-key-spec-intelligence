export function AppHeader() {
  return <header className="app-header">
    <div className="brand"><span className="wordmark">DKSI</span><span className="brand-description">Digital Key Spec Intelligence</span>
      <button className="demo-tag" type="button" aria-describedby="demo-tooltip">DEMO</button></div>
    <button className="mcp-preview" type="button" disabled aria-disabled="true">Local MCP · Coming soon</button>
    <div className="demo-tooltip" id="demo-tooltip" role="tooltip">
      <strong>Synthetic demo — not an official specification</strong>
      <p>이 화면의 요구사항은 데모를 위해 새로 지어낸 가상 내용이에요. 실제 CCC 디지털 키 규격과는 관계가 없어요.</p>
      <p>실제 규격 문서는 사용 권한을 확인하지 못한 상태에서 공개 데모에 올릴 수 없어서, 검색·버전 비교·원문 근거 표시가 어떻게 동작하는지만 보여주는 연습용 문서를 직접 만들었어요.</p>
      <p>답변을 실제 규격 해석이나 업무 판단에 사용하지 마세요.</p>
    </div>
  </header>;
}
