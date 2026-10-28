import { uiText } from "../content/ui-text";

const { header } = uiText;
export function AppHeader() {
  return <header className="app-header">
    <div className="brand"><span className="wordmark">{header.wordmark}</span><span className="brand-description">{header.brandName}</span>
      <button className="demo-tag" type="button" aria-describedby="demo-tooltip">{header.demoTag}</button></div>
    <button className="mcp-preview" type="button" disabled aria-disabled="true">{header.mcpPreview}</button>
    <div className="demo-tooltip" id="demo-tooltip" role="tooltip">
      <strong>{header.demoTooltipTitle}</strong>
      {header.demoTooltipParagraphs.map(paragraph => <p key={paragraph}>{paragraph}</p>)}
    </div>
  </header>;
}
