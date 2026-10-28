import { AppHeader } from "../components/app-header";
import { AskPanel } from "../components/ask-panel";
import { AppRelease } from "../components/app-release";
import { SignatureFooter } from "../components/signature-footer";
import { uiText } from "../content/ui-text";

const { intro } = uiText;
export default function Home() {
  return <div className="app-shell">
    <a className="skip-link" href="#main">{intro.skipLink}</a>
    <AppHeader />
    <main id="main">
      <div className="page-intro"><h1>{intro.heading}</h1>
        <p>{intro.subheading}</p></div>
      <details className="about">
        <summary>{intro.aboutSummary}</summary>
        <ul>
          {intro.aboutItems.map(item => <li key={item}>{item}</li>)}
        </ul>
      </details>
      <AskPanel />
    </main>
    <AppRelease />
    <SignatureFooter />
  </div>;
}
