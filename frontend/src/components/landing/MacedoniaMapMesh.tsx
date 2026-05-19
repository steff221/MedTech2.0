"use client";

import { motion } from "framer-motion";
import { useMemo } from "react";
import {
  MK_GEO,
  MK_MUNICIPALITIES,
  MK_SVG_HEIGHT,
  MK_SVG_WIDTH,
} from "./macedoniaPaths";

interface MapNode {
  id: string | number;
  name?: string;
  lat: number;
  lon: number;
  weight?: number;
}

interface MacedoniaMapMeshProps {
  nodes: MapNode[];
}

// Project lat/lon into the SVG's native coordinate system (defined by the
// source map's geoViewBox), so hospital pins land on the right municipalities.
function projectX(lon: number): number {
  return ((lon - MK_GEO.lonMin) / (MK_GEO.lonMax - MK_GEO.lonMin)) * MK_SVG_WIDTH;
}

function projectY(lat: number): number {
  return ((MK_GEO.latMax - lat) / (MK_GEO.latMax - MK_GEO.latMin)) * MK_SVG_HEIGHT;
}

export function MacedoniaMapMesh({ nodes }: MacedoniaMapMeshProps) {
  const hospitalPoints = useMemo(
    () => nodes.map((n) => ({ ...n, x: projectX(n.lon), y: projectY(n.lat) })),
    [nodes],
  );

  // Hospital ↔ hospital edges — each hospital to its 2 closest peers.
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

  return (
    <svg
      viewBox={`0 0 ${MK_SVG_WIDTH} ${MK_SVG_HEIGHT}`}
      className="h-full w-full"
      preserveAspectRatio="xMidYMid meet"
    >
      <defs>
        <linearGradient id="mkFill" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#10b981" stopOpacity="0.18" />
          <stop offset="100%" stopColor="#059669" stopOpacity="0.10" />
        </linearGradient>
        <radialGradient id="nodeGlow" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#34d399" stopOpacity="1" />
          <stop offset="60%" stopColor="#10b981" stopOpacity="0.4" />
          <stop offset="100%" stopColor="#10b981" stopOpacity="0" />
        </radialGradient>
        <radialGradient id="packetGlow" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#ffffff" stopOpacity="1" />
          <stop offset="40%" stopColor="#34d399" stopOpacity="0.9" />
          <stop offset="100%" stopColor="#10b981" stopOpacity="0" />
        </radialGradient>
        <filter id="nodeBlur" x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="3" />
        </filter>
        <filter id="packetBlur" x="-100%" y="-100%" width="300%" height="300%">
          <feGaussianBlur stdDeviation="2.5" />
        </filter>
      </defs>

      {/* Municipal boundaries — emerald fill + stroke */}
      <g>
        {MK_MUNICIPALITIES.map((m, i) => (
          <motion.path
            key={m.id}
            d={m.d}
            fill="url(#mkFill)"
            stroke="#10b981"
            strokeWidth={0.7}
            strokeOpacity={0.55}
            strokeLinejoin="round"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.9, delay: (i % 20) * 0.025, ease: "easeOut" }}
          >
            <title>{m.title}</title>
          </motion.path>
        ))}
      </g>

      {/* Hospital ↔ hospital edges */}
      <g>
        {hospitalEdges.map((e) => (
          <motion.line
            key={`he-${e.key}`}
            x1={e.from.x}
            y1={e.from.y}
            x2={e.to.x}
            y2={e.to.y}
            stroke="#059669"
            strokeOpacity={0.55}
            strokeWidth={1.1}
            initial={{ pathLength: 0 }}
            animate={{ pathLength: 1 }}
            transition={{ duration: 1.4, delay: 0.9, ease: "easeOut" }}
          />
        ))}
      </g>

      {/* Animated data packets */}
      <g>
        {hospitalEdges.map((e, i) => (
          <motion.circle
            key={`pkt-${e.key}`}
            r={3}
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
              delay: 1.4 + (i % 5) * 0.55,
              repeat: Infinity,
              repeatDelay: 0.8,
              ease: "easeInOut",
              times: [0, 0.15, 0.85, 1],
            }}
          />
        ))}
      </g>

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
              fill="#10b981"
              stroke="#ffffff"
              strokeWidth={0.6}
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.5, delay: 1.1 + i * 0.08 }}
              style={{ transformOrigin: `${n.x}px ${n.y}px`, transformBox: "fill-box" }}
            />
            {n.name && (
              <text
                x={n.x + r + 6}
                y={n.y + 3}
                fill="#cbd5e1"
                fontSize={9}
                fontWeight={500}
                opacity={0.75}
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
