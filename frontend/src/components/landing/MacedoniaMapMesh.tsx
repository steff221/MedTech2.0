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

// Hand-traced outline of the Republic of North Macedonia.
// 36 points, counter-clockwise from the NW corner near Kosovo. The Ohrid lake
// notch on the western edge and the Skopje finger pushing north into Kosovo
// are the two features that make the silhouette recognisable at a glance.
const OUTLINE: Array<[number, number]> = [
  // North / Kosovo border
  [20.55, 42.32], [20.78, 42.18], [20.92, 42.12], [21.08, 42.22],
  [21.22, 42.32], [21.38, 42.34], [21.55, 42.36], [21.74, 42.34],
  [21.90, 42.32], [22.05, 42.30], [22.22, 42.34], [22.38, 42.32],
  // East / Bulgaria
  [22.50, 42.10], [22.65, 41.92], [22.86, 41.78], [22.98, 41.62],
  [23.00, 41.45], [22.86, 41.32], [22.96, 41.34], [22.94, 41.12],
  // South / Greece
  [22.78, 41.00], [22.55, 41.04], [22.30, 41.12], [22.05, 41.16],
  [21.78, 41.10], [21.55, 40.92], [21.30, 40.86], [21.02, 40.86],
  [20.78, 40.92],
  // West / Albania (Lake Ohrid notch)
  [20.65, 41.05], [20.50, 41.10], [20.55, 41.28], [20.62, 41.42],
  [20.50, 41.58], [20.48, 41.78], [20.48, 42.00], [20.50, 42.20],
];

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

  // Project hospital nodes into SVG space once.
  const hospitalPoints = useMemo(
    () => nodes.map((n) => ({ ...n, x: projectX(n.lon), y: projectY(n.lat) })),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [nodes, width, height],
  );

  // Scaffolding grid points (so the country looks "filled" with mesh nodes).
  const meshPoints = useMemo(() => {
    const points: Array<{ x: number; y: number }> = [];
    for (let i = 1; i < 9; i++) {
      for (let j = 1; j < 7; j++) {
        points.push({
          x: (i / 9) * width,
          y: (j / 7) * height,
        });
      }
    }
    hospitalPoints.forEach((h) => points.push({ x: h.x, y: h.y }));
    return points;
  }, [hospitalPoints, width, height]);

  // Soft scaffolding mesh — every node connects to its 2 nearest neighbours.
  const meshLines = useMemo(() => {
    const lines: Array<{ x1: number; y1: number; x2: number; y2: number; d: number }> = [];
    meshPoints.forEach((p, i) => {
      const ranked = meshPoints
        .map((q, j) => ({ q, j, d: Math.hypot(p.x - q.x, p.y - q.y) }))
        .filter((c) => c.j !== i)
        .sort((a, b) => a.d - b.d)
        .slice(0, 2);
      ranked.forEach((c) => {
        if (c.j > i) {
          lines.push({ x1: p.x, y1: p.y, x2: c.q.x, y2: c.q.y, d: c.d });
        }
      });
    });
    return lines;
  }, [meshPoints]);

  // Hospital ↔ hospital edges (each hospital to its 2 closest hospital peers).
  // Animated "data packet" dots travel along these — the neural-net pulse.
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
          <stop offset="0%" stopColor="#a78bfa" stopOpacity="0.7" />
          <stop offset="100%" stopColor="#06b6d4" stopOpacity="0.7" />
        </linearGradient>
        <filter id="nodeBlur" x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="3" />
        </filter>
        <filter id="packetBlur" x="-100%" y="-100%" width="300%" height="300%">
          <feGaussianBlur stdDeviation="2.5" />
        </filter>
      </defs>

      {/* Faint country fill + outline */}
      <motion.polygon
        points={outline}
        fill="url(#outlineGrad)"
        fillOpacity={0.05}
        stroke="url(#outlineGrad)"
        strokeWidth={1.2}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 1.6, ease: "easeOut" }}
      />

      {/* Background scaffolding mesh — subtle, sets the "network" feel */}
      <g>
        {meshLines.map((l, i) => (
          <motion.line
            key={i}
            x1={l.x1}
            y1={l.y1}
            x2={l.x2}
            y2={l.y2}
            stroke="#00c9b1"
            strokeOpacity={Math.max(0.04, 0.14 - l.d / maxLineD)}
            strokeWidth={0.5}
            initial={{ pathLength: 0, opacity: 0 }}
            animate={{ pathLength: 1, opacity: 1 }}
            transition={{ duration: 1.2, delay: 0.4 + (i % 20) * 0.02 }}
          />
        ))}
      </g>

      {/* Hospital ↔ hospital edges (more prominent than scaffolding) */}
      <g>
        {hospitalEdges.map((e) => (
          <motion.line
            key={`he-${e.key}`}
            x1={e.from.x}
            y1={e.from.y}
            x2={e.to.x}
            y2={e.to.y}
            stroke="#06b6d4"
            strokeOpacity={0.35}
            strokeWidth={0.9}
            initial={{ pathLength: 0 }}
            animate={{ pathLength: 1 }}
            transition={{ duration: 1.4, delay: 1.0, ease: "easeOut" }}
          />
        ))}
      </g>

      {/* Animated data packets — small glowing dots travel between connected
          hospitals, like neurons firing across the network. */}
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

      {/* Scaffolding dots */}
      {meshPoints.slice(0, meshPoints.length - nodes.length).map((p, i) => (
        <circle key={`s-${i}`} cx={p.x} cy={p.y} r={1} fill="#00c9b1" fillOpacity={0.25} />
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
