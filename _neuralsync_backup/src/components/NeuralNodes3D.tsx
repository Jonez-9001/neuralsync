import { useEffect, useRef, useState } from 'react';

interface NodeData {
  id: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  pulsePhase: number;
}

interface NeuralNodesProps {
  nodeCount?: number;
  color?: string;
  connectionDistance?: number;
  className?: string;
}

export default function NeuralNodes3D({
  nodeCount = 35,
  color = '#00f3ff',
  connectionDistance = 160,
  className = ''
}: NeuralNodesProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const svgRef = useRef<SVGSVGElement>(null);
  const nodesRef = useRef<NodeData[]>([]);
  const animFrameRef = useRef<number>(0);
  const [dims, setDims] = useState({ w: 800, h: 600 });
  const [, setTick] = useState(0);

  // Track container dimensions
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const measure = () => {
      setDims({ w: el.clientWidth, h: el.clientHeight });
    };

    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  // Initialize + animate nodes
  useEffect(() => {
    const nodes: NodeData[] = [];
    for (let i = 0; i < nodeCount; i++) {
      nodes.push({
        id: i,
        x: Math.random() * dims.w,
        y: Math.random() * dims.h,
        vx: (Math.random() - 0.5) * 0.4,
        vy: (Math.random() - 0.5) * 0.4,
        radius: 1.5 + Math.random() * 2,
        pulsePhase: Math.random() * Math.PI * 2,
      });
    }
    nodesRef.current = nodes;

    let lastTime = 0;
    const step = (time: number) => {
      if (time - lastTime < 33) {
        // Cap at ~30fps for perf (this is a background decoration)
        animFrameRef.current = requestAnimationFrame(step);
        return;
      }
      lastTime = time;

      const cn = nodesRef.current;
      for (const n of cn) {
        n.x += n.vx;
        n.y += n.vy;
        if (n.x < 0 || n.x > dims.w) n.vx *= -1;
        if (n.y < 0 || n.y > dims.h) n.vy *= -1;
        n.x = Math.max(0, Math.min(dims.w, n.x));
        n.y = Math.max(0, Math.min(dims.h, n.y));
      }
      setTick(t => t + 1);
      animFrameRef.current = requestAnimationFrame(step);
    };

    animFrameRef.current = requestAnimationFrame(step);
    return () => cancelAnimationFrame(animFrameRef.current);
  }, [nodeCount, dims.w, dims.h]);

  // Build connection data
  const nodes = nodesRef.current;
  const lines: { x1: number; y1: number; x2: number; y2: number; o: number }[] = [];
  for (let i = 0; i < nodes.length; i++) {
    for (let j = i + 1; j < nodes.length; j++) {
      const dx = nodes[i].x - nodes[j].x;
      const dy = nodes[i].y - nodes[j].y;
      const d = Math.sqrt(dx * dx + dy * dy);
      if (d < connectionDistance) {
        lines.push({
          x1: nodes[i].x, y1: nodes[i].y,
          x2: nodes[j].x, y2: nodes[j].y,
          o: (1 - d / connectionDistance) * 0.18,
        });
      }
    }
  }

  return (
    <div ref={containerRef} className={`absolute inset-0 overflow-hidden pointer-events-none ${className}`}>
      <svg
        ref={svgRef}
        width={dims.w}
        height={dims.h}
        className="absolute inset-0"
        aria-hidden="true"
      >
        {/* Connections */}
        {lines.map((l, i) => (
          <line
            key={i}
            x1={l.x1} y1={l.y1} x2={l.x2} y2={l.y2}
            stroke={color}
            strokeWidth={0.6}
            opacity={l.o}
          />
        ))}
        {/* Nodes */}
        {nodes.map((n) => (
          <g key={n.id}>
            <circle cx={n.x} cy={n.y} r={n.radius * 3} fill={color} opacity={0.025}>
              <animate attributeName="opacity" values="0.02;0.05;0.02" dur={`${2.5 + n.pulsePhase}s`} repeatCount="indefinite" />
            </circle>
            <circle cx={n.x} cy={n.y} r={n.radius} fill={color} opacity={0.5}>
              <animate attributeName="opacity" values="0.35;0.7;0.35" dur={`${2.5 + n.pulsePhase}s`} repeatCount="indefinite" />
            </circle>
          </g>
        ))}
      </svg>
    </div>
  );
}
