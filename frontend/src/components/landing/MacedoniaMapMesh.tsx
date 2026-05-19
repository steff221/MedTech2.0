"use client";

import { motion } from "framer-motion";
import { useMemo } from "react";

interface MapNode {
  id: string | number;
  name?: string;
  /** Geographic lat/lon */
  lat: number;
  lon: number;
  /** Weight — bigger nodes glow more */
  weight?: number;
}

interface MacedoniaMapMeshProps {
  nodes: MapNode[];
  /** Optional viewport size — default fills container */
  width?: number;
  height?: number;
}

// Bounding box of North Macedonia, used to map lat/lon → SVG x/y.
const LAT_MIN = 40.82;
const LAT_MAX = 42.40;
const LON_MIN = 20.42;
const LON_MAX = 23.05;

// Detailed outline of the Republic of North Macedonia — 80 points, traced
// counter-clockwise from the NW corner near Kosovo. Hand-sampled along the
// real political boundary; the Lake Ohrid notch on the west, the Skopje
// finger pushing north into Kosovo, and the gentle Šar Mountains curve all
// read at a glance.
const OUTLINE: Array<[number, number]> = [
  // -- North (Kosovo + Serbia border) -----------------------------------
  [20.55, 42.30], [20.61, 42.25], [20.66, 42.21], [20.72, 42.20],
  [20.78, 42.18], [20.85, 42.16], [20.92, 42.12], [20.99, 42.16],
  [21.04, 42.21], [21.10, 42.25], [21.16, 42.30], [21.22, 42.32],
  [21.30, 42.33], [21.38, 42.34], [21.46, 42.35], [21.55, 42.36],
  [21.63, 42.34], [21.72, 42.34], [21.82, 42.32], [21.91, 42.32],
  [22.00, 42.30], [22.08, 42.30], [22.16, 42.33], [22.24, 42.34],
  [22.32, 42.32], [22.40, 42.32], [22.46, 42.28],
  // -- East (Bulgaria) --------------------------------------------------
  [22.50, 42.18], [22.54, 42.06], [22.60, 41.96], [22.68, 41.88],
  [22.78, 41.82], [22.88, 41.78], [22.96, 41.72], [23.00, 41.62],
  [22.98, 41.52], [23.00, 41.44], [22.96, 41.38], [22.86, 41.34],
  [22.96, 41.30], [22.96, 41.20], [22.94, 41.12],
  // -- South (Greece) ---------------------------------------------------
  [22.88, 41.05], [22.80, 41.00], [22.72, 40.98], [22.64, 41.00],
  [22.55, 41.04], [22.46, 41.06], [22.36, 41.10], [22.28, 41.12],
  [22.20, 41.14], [22.10, 41.16], [22.00, 41.16], [21.90, 41.14],
  [21.80, 41.12], [21.70, 41.06], [21.60, 40.96], [21.50, 40.90],
  [21.40, 40.86], [21.30, 40.86], [21.20, 40.85], [21.10, 40.86],
  [21.00, 40.85], [20.90, 40.88],
  // -- West (Albania — Lake Ohrid notch) --------------------------------
  [20.80, 40.92], [20.72, 41.00], [20.65, 41.05], [20.58, 41.06],
  [20.50, 41.10], [20.48, 41.16], [20.52, 41.24], [20.58, 41.32],
  [20.62, 41.40], [20.58, 41.48], [20.52, 41.56], [20.48, 41.66],
  [20.46, 41.78], [20.46, 41.90], [20.48, 42.00], [20.48, 42.10],
  [20.50, 42.20], [20.53, 42.26],
];

// Ray-casting point-in-polygon. Used to keep the interior mesh nodes
// strictly inside the country's borders.
function pointInPolygon(lon: number, lat: number): boolean {
  let inside = false;
  for (let i = 0, j = OUTLINE.length - 1; i < OUTLINE.length; j = i++) {
    const [xi, yi] = OUTLINE[i];
    const [xj, yj] = OUTLINE[j];
    const intersect =
      yi > lat !== yj > lat &&
      lon < ((xj - xi) * (lat - yi)) / (yj - yi) + xi;
    if (intersect) inside = !inside;
  }
  return inside;
}

// Deterministic pseudo-random jitter so the mesh looks organic but doesn't
// reshuffle on every render. Pure function of (i, j) — no Math.random().
function jitter(i: number, j: number, salt = 1): number {
  const x = Math.sin(i * 12.9898 + j * 78.233 + salt * 37.719) * 43758.5453;
  return x - Math.floor(x); // 0..1
}

export function MacedoniaMapMesh({
  nodes,
  width = 800,
  height = 520,
}: MacedoniaMapMeshProps) {
  const projectX = (lon: number) =>
    ((lon - LON_MIN) / (LON_MAX - LON_MIN)) * width;
  const projectY = (lat: number) =>
    ((LAT_MAX - lat) / (LAT_MAX - LAT_MIN)) * height;

  const outline = useMemo(
    () => OUTLINE.map(([lon, lat]) => `${projectX(lon)},${projectY(lat)}`).join(" "),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [width, height],
  );

  // Hospital nodes in SVG space.
  const hospitalPoints = useMemo(
    () => nodes.map((n) => ({ ...n, x: projectX(n.lon), y: projectY(n.lat) })),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [nodes, width, height],
  );

  // Interior mesh nodes — a jittered 16×12 grid filtered through the
  // point-in-polygon test. We end up with ~100 dots that fall strictly
  // inside Macedonia's borders, giving the triangulated network look.
  const meshPoints = useMemo(() => {
    const cols = 16;
    const rows = 12;
    const cellW = (LON_MAX - LON_MIN) / cols;
    const cellH = (LAT_MAX - LAT_MIN) / rows;
    const points: Array<{ x: number; y: number }> = [];
    for (let i = 0; i < cols; i++) {
      for (let j = 0; j < rows; j++) {
        const lon =
          LON_MIN + (i + 0.5) * cellW + (jitter(i, j) - 0.5) * cellW * 0.7;
        const lat =
          LAT_MIN + (j + 0.5) * cellH + (jitter(i, j, 2) - 0.5) * cellH * 0.7;
        if (!pointInPolygon(lon, lat)) continue;
        points.push({ x: projectX(lon), y: projectY(lat) });
      }
    }
    // Add hospital points so they participate in the triangulation too.
    hospitalPoints.forEach((h) => points.push({ x: h.x, y: h.y }));
    return points;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hospitalPoints, width, height]);

  // Triangulated mesh — connect every interior point to its 3 nearest
  // neighbours. Roughly approximates a Delaunay triangulation without the
  // full algorithm; visually indistinguishable at this scale.
  const meshLines = useMemo(() => {
    const lines: Array<{ x1: number; y1: number; x2: number; y2: number; d: number }> = [];
    meshPoints.forEach((p, i) => {
      const ranked = meshPoints
        .map((q, j) => ({ q, j, d: Math.hypot(p.x - q.x, p.y - q.y) }))
        .filter((c) => c.j !== i)
        .sort((a, b) => a.d - b.d)
        .slice(0, 3);
      ranked.forEach((c) => {
        if (c.j > i) {
          lines.push({ x1: p.x, y1: p.y, x2: c.q.x, y2: c.q.y, d: c.d });
        }
      });
    });
    return lines;
  }, [meshPoints]);

  // Hospital ↔ hospital edges — each hospital to its 2 closest peers.
  // Animated "data packet" dots travel along these.
  const hospitalEdges = useMemo(() => {
    const edges: Array<{
      from: { x: number; y: number };
      to: { x: number; y: number };
      key: string;
    }> = [];
    const seen = new Set<string>();
    hospitalPoints.forEach((h) => {
      const peers = hospitalPoints
        .filter((q) => q.id !== h.id)
        .map((q) => ({ q, d: Math.hypot(h.x - q.x, h.y - q.y) }))
        .sort((a, b) => a.d - b.d)
        .slice(0, 2);
      peers.forEach(({ q }) => {
        const a = String(h.id);
        const b = String(q.id);
        const key = a < b ? `${a}-${b}` : `${b}-${a}`;
        if (seen.has(key)) return;
        seen.add(key);
        edges.push({ from: { x: h.x, y: h.y }, to: { x: q.x, y: q.y }, key });
      });
    });
    return edges;
  }, [hospitalPoints]);

  const maxLineD = Math.max(...meshLines.map((l) => l.d), 1);

  return (
    <svg
      viewBox={`0 0 ${width} ${height}`}
      className="h-full w-full"
      preserveAspectRatio="xMidYMid meet"
    >
      <defs>
        <radialGradient id="nodeGlow" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#00d4ff" stopOpacity="1" />
          <stop offset="60%" stopColor="#00c9b1" stopOpacity="0.4" />
          <stop offset="100%" stopColor="#00c9b1" stopOpacity="0" />
        </radialGradient>
        <radialGradient id="packetGlow" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#ffffff" stopOpacity="1" />
          <stop offset="40%" stopColor="#00d4ff" stopOpacity="0.9" />
          <stop offset="100%" stopColor="#00d4ff" stopOpacity="0" />
        </radialGradient>
        <linearGradient id="outlineGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#e2e8f0" stopOpacity="0.95" />
          <stop offset="50%" stopColor="#67e8f9" stopOpacity="0.85" />
          <stop offset="100%" stopColor="#a78bfa" stopOpacity="0.9" />
        </linearGradient>
        <filter id="nodeBlur" x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="3" />
        </filter>
        <filter id="packetBlur" x="-100%" y="-100%" width="300%" height="300%">
          <feGaussianBlur stdDeviation="2.5" />
        </filter>
      </defs>

      {/* Country fill + outline — thicker, brighter than the abstract mesh */}
      <motion.polygon
        points={outline}
        fill="url(#outlineGrad)"
        fillOpacity={0.04}
        stroke="url(#outlineGrad)"
        strokeWidth={1.6}
        strokeLinejoin="round"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 1.6, ease: "easeOut" }}
      />

      {/* Triangulated interior mesh */}
      <g>
        {meshLines.map((l, i) => (
          <motion.line
            key={i}
            x1={l.x1}
            y1={l.y1}
            x2={l.x2}
            y2={l.y2}
            stroke="#00c9b1"
            strokeOpacity={Math.max(0.06, 0.22 - l.d / maxLineD)}
            strokeWidth={0.6}
            initial={{ pathLength: 0, opacity: 0 }}
            animate={{ pathLength: 1, opacity: 1 }}
            transition={{ duration: 1.2, delay: 0.4 + (i % 30) * 0.015 }}
          />
        ))}
      </g>

      {/* Hospital ↔ hospital edges (drawn on top of the mesh) */}
      <g>
        {hospitalEdges.map((e) => (
          <motion.line
            key={`he-${e.key}`}
            x1={e.from.x}
            y1={e.from.y}
            x2={e.to.x}
            y2={e.to.y}
            stroke="#06b6d4"
            strokeOpacity={0.45}
            strokeWidth={1.0}
            initial={{ pathLength: 0 }}
            animate={{ pathLength: 1 }}
            transition={{ duration: 1.4, delay: 1.0, ease: "easeOut" }}
          />
        ))}
      </g>

      {/* Animated data packets — neurons firing across the hospital network */}
      <g>
        {hospitalEdges.map((e, i) => (
          <motion.circle
            key={`pkt-${e.key}`}
            r={2.8}
            fill="url(#packetGlow)"
            filter="url(#packetBlur)"
            initial={{ cx: e.from.x, cy: e.from.y, opacity: 0 }}
            animate={{
              cx: [e.from.x, e.to.x],
              cy: [e.from.y, e.to.y],
              opacity: [0, 1, 1, 0],
            }}
            transition={{
              duration: 2.8,
              delay: 1.6 + (i % 5) * 0.55,
              repeat: Infinity,
              repeatDelay: 0.8,
              ease: "easeInOut",
              times: [0, 0.15, 0.85, 1],
            }}
          />
        ))}
      </g>

      {/* Interior mesh dots */}
      {meshPoints.slice(0, meshPoints.length - nodes.length).map((p, i) => (
        <circle key={`s-${i}`} cx={p.x} cy={p.y} r={1.2} fill="#22d3ee" fillOpacity={0.5} />
      ))}

      {/* Hospital nodes — glowing, pulsing */}
      {hospitalPoints.map((n, i) => {
        const r = 4 + (n.weight ?? 1) * 2;
        return (
          <g key={n.id}>
            <motion.circle
              cx={n.x}
              cy={n.y}
              r={r * 4}
              fill="url(#nodeGlow)"
              filter="url(#nodeBlur)"
              initial={{ opacity: 0 }}
              animate={{ opacity: [0.3, 0.7, 0.3] }}
              transition={{
                opacity: { duration: 2.5, repeat: Infinity, delay: i * 0.15 },
              }}
            />
            <motion.circle
              cx={n.x}
              cy={n.y}
              r={r}
              fill="#00d4ff"
              stroke="#ffffff"
              strokeWidth={0.5}
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.5, delay: 1.2 + i * 0.08 }}
              style={{ transformOrigin: `${n.x}px ${n.y}px`, transformBox: "fill-box" }}
            />
            {n.name && (
              <text
                x={n.x + r + 6}
                y={n.y + 3}
                fill="#cbd5e1"
                fontSize={9}
                fontWeight={500}
                opacity={0.7}
              >
                {n.name}
              </text>
            )}
          </g>
        );
      })}
    </svg>
  );
}
