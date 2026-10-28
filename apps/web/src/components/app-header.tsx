import Link from "next/link";
import { uiText } from "../content/ui-text";

const { header } = uiText;
export function AppHeader({ current }: { current: "explorer" | "skills" }) {
  return <header className="app-header">
    <div className="brand"><span className="wordmark">{header.wordmark}</span><span className="brand-description">{header.brandName}</span>
      <button className="demo-tag" type="button" aria-describedby="demo-tooltip">{header.demoTag}</button></div>
    <nav className="site-nav" aria-label={header.navLabel}>
      <Link href="/" aria-current={current === "explorer" ? "page" : undefined}>{header.navExplorer}</Link>
      <Link href="/skills" aria-current={current === "skills" ? "page" : undefined}>{header.navSkills}</Link>
      <button className="mcp-preview" type="button" disabled aria-disabled="true">{header.mcpPreview}</button>
    </nav>
    <div className="demo-tooltip" id="demo-tooltip" role="tooltip">
      <strong>{header.demoTooltipTitle}</strong>
      {header.demoTooltipParagraphs.map(paragraph => <p key={paragraph}>{paragraph}</p>)}
    </div>
  </header>;
}
