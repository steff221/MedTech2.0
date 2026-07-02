// React компонента: 3D/интерактивна мапа на Македонија.
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
  dark?: boolean;
}

function projectX(lon: number): number {
  return ((lon - MK_GEO.lonMin) / (MK_GEO.lonMax - MK_GEO.lonMin)) * MK_SVG_WIDTH;
}

function projectY(lat: number): number {
  return ((MK_GEO.latMax - lat) / (MK_GEO.latMax - MK_GEO.latMin)) * MK_SVG_HEIGHT;
}

export function MacedoniaMapMesh({ nodes, dark = false }: MacedoniaMapMeshProps) {
  const hospitalPoints = useMemo(
    () => nodes.map((n) => ({ ...n, x: projectX(n.lon), y: projectY(n.lat) })),
    [nodes],
  );

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
        {/* Map fill */}
        <linearGradient id="mkFill" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#10b981" stopOpacity="0.18" />
          <stop offset="100%" stopColor="#059669" stopOpacity="0.10" />
        </linearGradient>

        {/* Node outer ambient glow — large, soft */}
        <radialGradient id="glowOuter" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#34d399" stopOpacity="0.55" />
          <stop offset="45%" stopColor="#10b981" stopOpacity="0.2" />
          <stop offset="100%" stopColor="#10b981" stopOpacity="0" />
        </radialGradient>

        {/* Node inner glow — tighter, brighter */}
        <radialGradient id="glowInner" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#6ee7b7" stopOpacity="0.9" />
          <stop offset="60%" stopColor="#34d399" stopOpacity="0.35" />
          <stop offset="100%" stopColor="#10b981" stopOpacity="0" />
        </radialGradient>

        {/* Packet comet glow */}
        <radialGradient id="packetGlow" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#ffffff" stopOpacity="1" />
          <stop offset="35%" stopColor="#6ee7b7" stopOpacity="0.85" />
          <stop offset="100%" stopColor="#10b981" stopOpacity="0" />
        </radialGradient>

        {/* Packet comet tail — larger, dimmer */}
        <radialGradient id="packetTail" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#34d399" stopOpacity="0.5" />
          <stop offset="100%" stopColor="#10b981" stopOpacity="0" />
        </radialGradient>

        {/* One-time scan sweep gradient */}
        <linearGradient id="scanSweep" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#10b981" stopOpacity="0" />
          <stop offset="40%" stopColor="#34d399" stopOpacity="0.08" />
          <stop offset="50%" stopColor="#6ee7b7" stopOpacity="0.18" />
          <stop offset="60%" stopColor="#34d399" stopOpacity="0.08" />
          <stop offset="100%" stopColor="#10b981" stopOpacity="0" />
        </linearGradient>

        {/* Filters */}
        <filter id="blurOuter" x="-70%" y="-70%" width="240%" height="240%">
          <feGaussianBlur stdDeviation="5" />
        </filter>
        <filter id="blurInner" x="-40%" y="-40%" width="180%" height="180%">
          <feGaussianBlur stdDeviation="2.5" />
        </filter>
        <filter id="packetBlur" x="-120%" y="-120%" width="340%" height="340%">
          <feGaussianBlur stdDeviation="2.2" />
        </filter>
        <filter id="tailBlur" x="-120%" y="-120%" width="340%" height="340%">
          <feGaussianBlur stdDeviation="3.5" />
        </filter>
        <filter id="crisp" x="-20%" y="-20%" width="140%" height="140%">
          <feGaussianBlur stdDeviation="0.8" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>

        {/* Clip to map bounds */}
        <clipPath id="mapClip">
          <rect x="0" y="0" width={MK_SVG_WIDTH} height={MK_SVG_HEIGHT} />
        </clipPath>
      </defs>

      {/* Municipal boundaries */}
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
            transition={{ duration: 1.0, delay: (i % 20) * 0.022, ease: "easeOut" }}
          >
            <title>{m.title}</title>
          </motion.path>
        ))}
      </g>

      {/* One-time scan sweep — map "comes online" */}
      <motion.rect
        clipPath="url(#mapClip)"
        x={-MK_SVG_WIDTH}
        y={0}
        width={MK_SVG_WIDTH}
        height={MK_SVG_HEIGHT}
        fill="url(#scanSweep)"
        initial={{ x: -MK_SVG_WIDTH }}
        animate={{ x: MK_SVG_WIDTH * 1.6 }}
        transition={{ duration: 1.8, delay: 0.4, ease: [0.25, 0.46, 0.45, 0.94] }}
      />

      {/* Edges — fade + draw in as a wave */}
      <g>
        {hospitalEdges.map((e, i) => (
          <motion.line
            key={`he-${e.key}`}
            x1={e.from.x}
            y1={e.from.y}
            x2={e.to.x}
            y2={e.to.y}
            stroke="#34d399"
            strokeWidth={0.9}
            initial={{ pathLength: 0, strokeOpacity: 0 }}
            animate={{ pathLength: 1, strokeOpacity: 0.28 }}
            transition={{
              pathLength: { duration: 1.0, delay: 1.1 + i * 0.035, ease: "easeOut" },
              strokeOpacity: { duration: 0.5, delay: 1.1 + i * 0.035 },
            }}
          />
        ))}
      </g>

      {/* Data packet comet tails — behind the main dot */}
      <g>
        {hospitalEdges.map((e, i) => {
          const dur = 2.6 + (i % 3) * 0.4;
          const startDelay = 2.0 + (i % 7) * 0.38;
          const gap = 2.4 + (i % 4) * 0.5;
          return (
            <motion.circle
              key={`tail-${e.key}`}
              r={6}
              fill="url(#packetTail)"
              filter="url(#tailBlur)"
              initial={{ cx: e.from.x, cy: e.from.y, opacity: 0 }}
              animate={{
                cx: [e.from.x, e.to.x, e.from.x],
                cy: [e.from.y, e.to.y, e.from.y],
                opacity: [0, 0.55, 0.55, 0],
              }}
              transition={{
                duration: dur,
                delay: startDelay + 0.1,
                repeat: Infinity,
                repeatDelay: gap,
                ease: "easeInOut",
                times: [0, 0.45, 0.9, 1],
              }}
            />
          );
        })}
      </g>

      {/* Data packet heads — bright comet tip */}
      <g>
        {hospitalEdges.map((e, i) => {
          const dur = 2.6 + (i % 3) * 0.4;
          const startDelay = 2.0 + (i % 7) * 0.38;
          const gap = 2.4 + (i % 4) * 0.5;
          return (
            <motion.circle
              key={`pkt-${e.key}`}
              r={2.2}
              fill="url(#packetGlow)"
              filter="url(#packetBlur)"
              initial={{ cx: e.from.x, cy: e.from.y, opacity: 0 }}
              animate={{
                cx: [e.from.x, e.to.x, e.from.x],
                cy: [e.from.y, e.to.y, e.from.y],
                opacity: [0, 1, 1, 0],
              }}
              transition={{
                duration: dur,
                delay: startDelay,
                repeat: Infinity,
                repeatDelay: gap,
                ease: "easeInOut",
                times: [0, 0.45, 0.9, 1],
              }}
            />
          );
        })}
      </g>

      {/* Hospital nodes — layered glow, no rings */}
      {hospitalPoints.map((n, i) => {
        const r = 4 + (n.weight ?? 1) * 1.8;
        const delay = 1.3 + i * 0.08;
        // Offset each node's breathing phase so they don't all pulse together
        const breathOffset = (i * 0.37) % 3.5;

        return (
          <g key={n.id}>
            {/* Layer 1: outer ambient halo — large, faint, very slow breathe */}
            <motion.circle
              cx={n.x}
              cy={n.y}
              r={r * 7}
              fill="url(#glowOuter)"
              filter="url(#blurOuter)"
              initial={{ opacity: 0 }}
              animate={{ opacity: [0, 0.9, 0.45, 0.75, 0.45] }}
              transition={{
                opacity: {
                  duration: 4.5,
                  delay: delay,
                  repeat: Infinity,
                  ease: "easeInOut",
                  times: [0, 0.08, 0.5, 0.75, 1],
                  repeatDelay: breathOffset * 0.1,
                },
              }}
            />

            {/* Layer 2: inner glow — tighter, slightly brighter, offset breathe */}
            <motion.circle
              cx={n.x}
              cy={n.y}
              r={r * 3}
              fill="url(#glowInner)"
              filter="url(#blurInner)"
              initial={{ opacity: 0 }}
              animate={{ opacity: [0, 0.8, 0.4, 0.65, 0.4] }}
              transition={{
                opacity: {
                  duration: 3.2,
                  delay: delay + 0.15,
                  repeat: Infinity,
                  ease: "easeInOut",
                  times: [0, 0.1, 0.5, 0.75, 1],
                  repeatDelay: breathOffset * 0.15,
                },
              }}
            />

            {/* Core dot — clean spring-in */}
            <motion.circle
              cx={n.x}
              cy={n.y}
              r={r}
              fill="#10b981"
              stroke="#d1fae5"
              strokeWidth={0.7}
              filter="url(#crisp)"
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{
                scale: { type: "spring", stiffness: 320, damping: 20, delay },
                opacity: { duration: 0.2, delay },
              }}
              style={{ transformOrigin: `${n.x}px ${n.y}px`, transformBox: "fill-box" }}
            />

            {/* Inner specular highlight */}
            <motion.circle
              cx={n.x - r * 0.28}
              cy={n.y - r * 0.28}
              r={r * 0.35}
              fill="#ecfdf5"
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.65 }}
              transition={{ duration: 0.35, delay: delay + 0.18 }}
            />

            {/* Label */}
            {n.name && (
              <motion.text
                x={n.x + r + 6}
                y={n.y + 3.5}
                fill={dark ? "#6ee7b7" : "#065f46"}
                fontSize={9}
                fontWeight={500}
                letterSpacing={0.3}
                initial={{ opacity: 0 }}
                animate={{ opacity: dark ? 0.8 : 0.9 }}
                transition={{ duration: 0.6, delay: delay + 0.35, ease: "easeOut" }}
              >
                {n.name}
              </motion.text>
            )}
          </g>
        );
      })}
    </svg>
  );
}
