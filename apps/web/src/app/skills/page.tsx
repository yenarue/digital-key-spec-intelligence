import type { Metadata } from "next";
import Link from "next/link";
import { AppHeader } from "../../components/app-header";
import { AppRelease } from "../../components/app-release";
import { SignatureFooter } from "../../components/signature-footer";
import { uiText } from "../../content/ui-text";
import content from "../../content/agent-skills.json";

const REPO = "https://github.com/yenarue/digital-key-spec-intelligence";
const skillFile = (id: string, file: string) => `${REPO}/blob/main/.agents/skills/${id}/${file}`;

export const metadata: Metadata = { title: content.meta.title, description: content.meta.description };

const { hero, problem, interfaces, skills, skillPlan, roadmap } = content;
export default function SkillsPage() {
  return <div className="app-shell">
    <a className="skip-link" href="#main">{uiText.intro.skipLink}</a>
    <AppHeader current="skills" />
    <main id="main" className="landing">
      <section className="landing-hero" aria-labelledby="hero-title">
        <p className="eyebrow">{hero.eyebrow}</p>
        <h1 id="hero-title">{hero.title}</h1>
        <p className="hero-lead">{hero.lead}</p>
        <div className="hero-actions">
          <Link className="primary-button" href="/">{hero.primaryCta}</Link>
          <a className="secondary-button" href={REPO} target="_blank" rel="noopener noreferrer">{hero.secondaryCta}</a>
        </div>
      </section>

      <section className="landing-section" aria-labelledby="problem-title">
        <h2 id="problem-title">{problem.heading}</h2>
        <ol className="flow-steps">
          {problem.items.map(item => <li key={item.label}>
            <span className="flow-label">{item.label}</span>
            <h3>{item.title}</h3>
            <p>{item.body}</p>
          </li>)}
        </ol>
      </section>

      <section className="landing-section" aria-labelledby="interfaces-title">
        <h2 id="interfaces-title">{interfaces.heading}</h2>
        <div className="landing-grid">
          {interfaces.items.map(item => <article className="landing-card" key={item.name}>
            <div className="card-head"><h3>{item.name}</h3><span className="status-label">{item.status}</span></div>
            <p className="card-kind">{item.kind}</p>
            <p>{item.body}</p>
            <ul>{item.points.map(point => <li key={point}>{point}</li>)}</ul>
          </article>)}
        </div>
        <div className="landing-notice" role="note">
          <strong lang="en">{interfaces.noticeTitle}</strong>
          <p>{interfaces.noticeBody}</p>
        </div>
      </section>

      <section className="landing-section" aria-labelledby="skill-plan-title">
        <h2 id="skill-plan-title">{skillPlan.heading}</h2>
        <dl className="skill-rationale">
          <div><dt>{skillPlan.goalLabel}</dt><dd>{skillPlan.goal}</dd></div>
          <div><dt>{skillPlan.whyLabel}</dt><dd>{skillPlan.why}</dd></div>
        </dl>
        <ol className="skill-plan">
          {skillPlan.items.map(item => <li key={item.id} className={item.done ? "is-done" : undefined}>
            <div className="card-head"><h3>{item.name}</h3><span className="status-label">{item.status}</span></div>
            <code>{item.id}</code>
            <p>{item.body}</p>
          </li>)}
        </ol>
        <p className="skill-plan-link"><a href={`${REPO}/blob/main/docs/skills-plan.md`} target="_blank" rel="noopener noreferrer">{skillPlan.linkLabel}</a></p>
      </section>

      <section className="landing-section" aria-labelledby="skills-title">
        <h2 id="skills-title">{skills.heading}</h2>
        <p className="section-lead">{skills.subheading}</p>
        <div className="landing-grid">
          {skills.items.map(skill => <article className="landing-card skill-card" key={skill.id}>
            <div className="card-head"><h3>{skill.name}</h3><span className="status-label">{skill.role}</span></div>
            <p>{skill.summary}</p>
            <h4>{skill.stepsLabel}</h4>
            <ol className="skill-steps">{skill.steps.map(step => <li key={step}>{step}</li>)}</ol>
            <h4>{skills.invokeLabel}</h4>
            <pre className="skill-prompt"><code>{skill.prompt}</code></pre>
            <dl className="skill-meta">
              <div><dt>{skills.statusLabel}</dt><dd>{skill.status}</dd></div>
              <div><dt>{skills.linksLabel}</dt><dd className="skill-links">
                <a href={skillFile(skill.id, "README.md")} target="_blank" rel="noopener noreferrer">{skills.links.readme}</a>
                <a href={skillFile(skill.id, "SKILL.md")} target="_blank" rel="noopener noreferrer">{skills.links.skill}</a>
                <a href={skillFile(skill.id, "example.md")} target="_blank" rel="noopener noreferrer">{skills.links.example}</a>
              </dd></div>
            </dl>
          </article>)}
        </div>
      </section>

      <section className="landing-section" aria-labelledby="roadmap-title">
        <h2 id="roadmap-title">{roadmap.heading}</h2>
        <p className="section-lead">{roadmap.lead}</p>
        <ol className="roadmap">
          {roadmap.items.map(item => <li key={item.step}>
            <span className="roadmap-step" aria-hidden="true">{item.step}</span>
            <div><div className="card-head"><h3>{item.name}</h3><span className="status-label">{item.status}</span></div>
              <p>{item.body}</p>
              <dl className="roadmap-pain">
                <div><dt>{roadmap.painLabel}</dt><dd>{item.pain}</dd></div>
                <div><dt>{roadmap.solvedLabel}</dt><dd>{item.solved}</dd></div>
              </dl></div>
          </li>)}
        </ol>
        <figure className="arch" aria-labelledby="arch-caption">
          <div className="arch-flow">
            {roadmap.arch.columns.map((column, index) => <div className="arch-step" key={column.title}>
              {index > 0 && <span className="arch-arrow" aria-hidden="true">→</span>}
              <div className="arch-col">
                <p className="arch-col-title">{column.title}</p>
                {column.boxes.map(box => <div className={box.planned ? "arch-box is-planned" : "arch-box"} key={box.name}>
                  <strong>{box.name}</strong>
                  <span>{box.detail}</span>
                  <span className="arch-state">{box.planned ? roadmap.arch.planned : roadmap.arch.now}</span>
                </div>)}
              </div>
            </div>)}
          </div>
          <figcaption id="arch-caption"><strong>{roadmap.arch.label}</strong> · {roadmap.arch.caption}</figcaption>
        </figure>
      </section>
    </main>
    <AppRelease />
    <SignatureFooter />
  </div>;
}
