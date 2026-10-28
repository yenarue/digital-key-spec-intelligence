import webPackage from "../../package.json";

/** Build-time web release identity, separate from fictional document versions. */
export function AppRelease() {
  return <p className="app-release" aria-label="웹앱 버전">Web v{webPackage.version}</p>;
}
