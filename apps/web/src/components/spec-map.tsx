"use client";
import "./spec-overview.css";
import { useState } from "react";
import type { DiffSegment } from "@dksi/spec-core";
import { fill, uiText } from "../content/ui-text";

const text = uiText.overview.map;
export type MapTile = {
  key: string; shortId: string; sectionId: string; heading: string; keywords: string[];
  status: "changed" | "unchanged" | "added" | "removed"; similarity: number | null;
  from: { requirementId: string; text: string } | null; to: { requirementId: string; text: string } | null;
  diff: { from: DiffSegment[]; to: DiffSegment[]; changes: number } | null;
};
const percent = (tile: MapTile) => Math.round((1 - (tile.similarity ?? 1)) * 100);
function statusLabel(tile: MapTile, oldest: string, newest: string) {
  if (tile.status === "changed") return fill(text.statusChanged, { percent: percent(tile) });
  if (tile.status === "added") return fill(text.statusAdded, { version: newest });
  if (tile.status === "removed") return fill(text.statusRemoved, { version: oldest });
  return text.statusUnchanged;
}
function Marked({ parts, tag }: { parts: DiffSegment[]; tag: "del" | "ins" }) {
  return parts.map((part, index) => part.changed ? (tag === "del" ? <del key={index}>{part.text}</del> : <ins key={index}>{part.text}</ins>) : part.text);
}
/** One tile per requirement, shaded by how much its sentence changed between the oldest and newest version. */
export function SpecMap({ tiles, oldest, newest }: { tiles: MapTile[]; oldest: string; newest: string }) {
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState<string | null>(null);
  const needle = query.trim().toLowerCase();
  const matched = (tile: MapTile) => needle !== "" && [tile.heading, tile.shortId, ...tile.keywords].join(" ").toLowerCase().includes(needle);
  const matchCount = tiles.filter(matched).length;
  const current = tiles.find(tile => tile.key === selected) ?? null;
  return <div className="spec-map">
    <div className="map-tools">
      <label htmlFor="map-search">{text.searchLabel}</label>
      <input id="map-search" type="search" value={query} onChange={event => setQuery(event.target.value)} placeholder={text.searchPlaceholder} autoComplete="off" />
      <span className="map-count" role="status">{needle === "" ? "" : matchCount === 0 ? text.noMatch : fill(text.matchCount, { count: matchCount })}</span>
      <ul className="map-legend" aria-hidden="true">
        <li><span className="swatch scale" />{text.scaleLow} → {text.scaleHigh}</li>
        <li><span className="swatch added" />{text.legendAdded}</li>
        <li><span className="swatch removed" />{text.legendRemoved}</li>
        <li><span className="swatch same" />{text.legendSame}</li>
      </ul>
    </div>
    <ul className="map-grid">{tiles.map(tile => {
      const level = tile.status === "changed" ? Math.min(0.1 + (1 - (tile.similarity ?? 1)) * 0.8, 0.6) : 0;
      return <li key={tile.key}><button type="button" className={`map-tile ${tile.status}${needle && (matched(tile) ? " hit" : " dim")}${selected === tile.key ? " selected" : ""}`}
        style={{ "--level": level } as React.CSSProperties} aria-pressed={selected === tile.key}
        aria-label={fill(text.tileAria, { id: tile.shortId, heading: tile.heading, status: statusLabel(tile, oldest, newest) })} onClick={() => setSelected(selected === tile.key ? null : tile.key)}>
        <span className="tile-id">{tile.shortId}{tile.status === "added" && <em>{text.tileAdded}</em>}{tile.status === "removed" && <em>{text.tileRemoved}</em>}</span>
        <span className="tile-heading">{tile.heading}</span>
        <span className="tile-section">§{tile.sectionId}</span></button></li>;
    })}</ul>
    <div className="map-detail" role="region" aria-live="polite" aria-label={current ? `${current.shortId} ${current.heading}` : text.detailEmpty}>
      {!current ? <p className="detail-empty">{text.detailEmpty}</p> : <>
        <h3>{current.shortId} · {current.heading} <span>§{current.sectionId}</span></h3>
        <p className="detail-status">{current.status === "changed" ? fill(text.detailChanged, { percent: percent(current), count: current.diff?.changes ?? 0 })
          : current.status === "added" ? fill(text.detailAdded, { version: newest }) : current.status === "removed" ? fill(text.detailRemoved, { version: oldest }) : text.detailUnchanged}</p>
        <div className={`detail-cols${current.from && current.to && current.status === "changed" ? " two" : ""}`}>
          {current.from && <section><h4>{oldest} <code>{current.from.requirementId}</code></h4>
            <p lang="en">{current.diff ? <Marked parts={current.diff.from} tag="del" /> : current.from.text}</p></section>}
          {current.to && current.status !== "unchanged" && <section><h4>{newest} <code>{current.to.requirementId}</code></h4>
            <p lang="en">{current.diff ? <Marked parts={current.diff.to} tag="ins" /> : current.to.text}</p></section>}
        </div>
        {current.diff && <p className="detail-legend"><del>{fill(text.legendOld, { version: oldest })}</del> <ins>{fill(text.legendNew, { version: newest })}</ins></p>}
      </>}
    </div>
  </div>;
}
