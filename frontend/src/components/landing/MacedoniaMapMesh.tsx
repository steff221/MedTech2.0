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

// Rough bounding box of North Macedonia, used to map lat/lon → SVG x/y.
const LAT_MIN = 40.85;
const LAT_MAX = 42.37;
const LON_MIN = 20.45;
const LON_MAX = 23.05;

// Stylized outline of North Macedonia (low-poly hand-traced — not geographically
// accurate, just shaped enough to read as the country at a glance).
const OUTLINE: Array<[number, number]> = [
  [20.55, 42.30], [20.95, 42.34], [21.55, 42.32], [22.10, 42.30],
  [22.65, 42.10], [23.00, 41.85], [23.00, 41.55], [22.75, 41.30],
  [22.55, 41.10], [22.20, 40.90], [21.70, 40.85], [21.20, 40.90],
  [20.80, 40.95], [20.50, 41.10], [20.45, 41.40], [20.55, 41.75],
  [20.50, 42.05], [20.55, 42.30],
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
    [width, height],
  );

  // Mesh: filler points + the real nodes — Delaunay-style triangulation would
  // be ideal, but a deterministic grid + nearest-neighbour lines is plenty.
  const meshPoints = useMemo(() => {
    const points: Array<{ x: number; y: number }> = [];
    // 8x6 grid of scaffolding points (kept inside the bounding box).
    for (let i = 1; i < 8; i++) {
      for (let j = 1; j < 6; j++) {
        points.push({
          x: (i / 8) * width,
          y: (j / 6) * height,
        });
      }
    }
    nodes.forEach((n) =>
      points.push({ x: projectX(n.lon), y: projectY(n.lat) }),
    );
    return points;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [nodes, width, height]);

  // For each point, connect to its 2 nearest neighbours → soft web.
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
        <linearGradient id="outlineGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#a78bfa" stopOpacity="0.5" />
          <stop offset="100%" stopColor="#06b6d4" stopOpacity="0.5" />
        </linearGradient>
        <filter id="nodeBlur" x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="3" />
        </filter>
      </defs>

      {/* Faint country outline */}
      <motion.polygon
        points={outline}
        fill="url(#outlineGrad)"
        fillOpacity={0.04}
        stroke="url(#outlineGrad)"
        strokeWidth={1}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 1.6, ease: "easeOut" }}
      />

      {/* Mesh */}
      <g>
        {meshLines.map((l, i) => (
          <motion.line
            key={i}
            x1={l.x1}
            y1={l.y1}
            x2={l.x2}
            y2={l.y2}
            stroke="#00c9b1"
            strokeOpacity={Math.max(0.05, 0.18 - l.d / maxLineD)}
            strokeWidth={0.6}
            initial={{ pathLength: 0, opacity: 0 }}
            animate={{ pathLength: 1, opacity: 1 }}
            transition={{ duration: 1.2, delay: 0.4 + (i % 20) * 0.02 }}
          />
        ))}
      </g>

      {/* Scaffolding dots */}
      {meshPoints.slice(0, meshPoints.length - nodes.length).map((p, i) => (
        <circle key={`s-${i}`} cx={p.x} cy={p.y} r={1} fill="#00c9b1" fillOpacity={0.25} />
      ))}

      {/* Hospital nodes — glowing, pulsing */}
      {nodes.map((n, i) => {
        const x = projectX(n.lon);
        const y = projectY(n.lat);
        const r = 4 + (n.weight ?? 1) * 2;
        return (
          <g key={n.id}>
            <motion.circle
              cx={x}
              cy={y}
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
              cx={x}
              cy={y}
              r={r}
              fill="#00d4ff"
              stroke="#ffffff"
              strokeWidth={0.5}
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.5, delay: 1.2 + i * 0.08 }}
              style={{ transformOrigin: `${x}px ${y}px`, transformBox: "fill-box" }}
            />
            {n.name && (
              <text
                x={x + r + 6}
                y={y + 3}
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
