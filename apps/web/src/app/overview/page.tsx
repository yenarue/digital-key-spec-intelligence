import type { Metadata } from "next";
import { buildOverview, diffWords, precomputeScenarios, validateScenarioDefinition, type ScenarioDefinition, type SpecDocument } from "@dksi/spec-core";
import v1 from "../../../../../data/demo/spec-v1.json";
import v2 from "../../../../../data/demo/spec-v2.json";
import scenarios from "../../../../../data/demo/scenarios.json";
import { AppHeader } from "../../components/app-header";
import { AppRelease } from "../../components/app-release";
import { ScenarioSimulator } from "../../components/scenario-simulator";
import { SignatureFooter } from "../../components/signature-footer";
import { SpecMap, type MapTile } from "../../components/spec-map";
import { uiText } from "../../content/ui-text";

const text = uiText.overview;
export const metadata: Metadata = { title: text.metaTitle, description: text.metaDescription };

// Everything below runs at build time. Swapping in another spec (same JSON shape) and its reviewed rules changes the page without touching the components;
// a rule that points at a requirement the new spec no longer has fails the build instead of showing a wrong result.
const overview = buildOverview([v1, v2] as SpecDocument[]);
const definition = scenarios as ScenarioDefinition;
const problems = validateScenarioDefinition(definition, overview.pairs);
if (problems.length > 0) throw new Error(`Invalid scenario definition:\n${problems.join("\n")}`);
const table = precomputeScenarios(definition, overview.pairs);
const sources = Object.fromEntries(overview.pairs.flatMap(pair => Object.values(pair.entries).map(entry =>
  [entry.citationId, { requirementId: entry.requirementId, version: entry.version, sectionId: pair.sectionId, heading: pair.heading, text: entry.text }])));
const [oldest, newest] = [overview.versions[0], overview.versions[overview.versions.length - 1]];
const tiles: MapTile[] = overview.pairs.map(pair => {
  const from = pair.entries[oldest], to = pair.entries[newest];
  const diff = pair.status === "changed" && from && to ? diffWords(from.text, to.text) : null;
  return {
    key: pair.key, shortId: pair.key.split("-").slice(-2).join("-"), sectionId: pair.sectionId, heading: pair.heading, keywords: pair.keywords,
    status: pair.status, similarity: pair.similarity, from: from ? { requirementId: from.requirementId, text: from.text } : null,
    to: to ? { requirementId: to.requirementId, text: to.text } : null, diff,
  };
});

export default function OverviewPage() {
  return <div className="app-shell">
    <a className="skip-link" href="#main">{uiText.intro.skipLink}</a>
    <AppHeader current="overview" />
    <main id="main" className="overview">
      <section className="overview-hero" aria-labelledby="overview-title">
        <p className="eyebrow">{text.eyebrow}</p>
        <h1 id="overview-title">{text.title}</h1>
        <p className="overview-lead">{text.lead}</p>
      </section>
      <section className="overview-section" aria-labelledby="map-title">
        <h2 id="map-title">{text.map.heading}</h2>
        <p className="overview-lead">{text.map.lead}</p>
        <SpecMap tiles={tiles} oldest={oldest} newest={newest} />
      </section>
      <section className="overview-section" aria-labelledby="scenario-title">
        <h2 id="scenario-title">{text.scenario.heading}</h2>
        <p className="overview-lead">{text.scenario.lead}</p>
        <ScenarioSimulator factors={definition.factors} review={definition.review} table={table} sources={sources} />
      </section>
    </main>
    <AppRelease />
    <SignatureFooter />
  </div>;
}
