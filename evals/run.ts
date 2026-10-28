import v1 from "../data/demo/spec-v1.json";
import v2 from "../data/demo/spec-v2.json";
import benchmark from "./questions.json";
import additional from "./additional-cases.json";
import { SyntheticCorpusProvider } from "../packages/spec-core/src/corpus";
import { MiniSearchRetriever } from "../packages/spec-core/src/retriever";
import { VERSIONS, type Version } from "../packages/spec-core/src/types";

const retriever = new MiniSearchRetriever(new SyntheticCorpusProvider([v1, v2]));
const cases = [...benchmark.cases, ...additional.cases];
let failures = 0;
let expectedTotal = 0;
let recoveredTotal = 0;
for (const item of cases) {
  if (item.versions.some((version) => !VERSIONS.includes(version as Version))) {
    throw new Error(`Invalid evaluation version: ${item.id}`);
  }
  const hits = retriever.searchRequirements(item.question, { versions: item.versions as Version[], topK: 5 });
  const actual = hits.map((hit) => hit.requirementId);
  const recovered = item.expectedRequirementIds.filter((id) => actual.includes(id));
  expectedTotal += item.expectedRequirementIds.length;
  recoveredTotal += recovered.length;
  const wrongVersion = hits.some((hit) => !item.versions.includes(hit.version));
  const passes = !wrongVersion && (item.expectedRequirementIds.length === 0
    ? actual.length === 0
    : recovered.length === item.expectedRequirementIds.length);
  if (!passes) failures += 1;
  console.log(`${passes ? "PASS" : "FAIL"} ${item.id} expected=${JSON.stringify(item.expectedRequirementIds)} actualTop5=${JSON.stringify(actual)} versionLeak=${wrongVersion}`);
}
console.log(`Cases passed: ${cases.length - failures}/${cases.length}; expected IDs recovered@5: ${recoveredTotal}/${expectedTotal}. Small synthetic fixture evaluation only; not a general accuracy estimate.`);
if (failures > 0) process.exitCode = 1;
