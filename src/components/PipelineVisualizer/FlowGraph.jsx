import { motion } from "framer-motion";
import { useEffect, useMemo, useRef, useState } from "react";

const VIEWBOX = { width: 1000, height: 760 };
const NODE_SIZE = { width: 170, height: 92, radius: 16 };

const NODE_BASE = [
  { id: "input", label: ["INPUT", "PDF"], x: 500, y: 126 },
  { id: "parsing", label: ["PARSE", "REQUEST"], x: 500, y: 236 },
  { id: "llm", label: ["LLM", "ANALYSIS"], x: 500, y: 346 },
  { id: "style", label: ["STYLE", "PROMPT"], x: 350, y: 462 },
  { id: "voice", label: ["VOICE", "SYNTH"], x: 650, y: 462 },
  { id: "image", label: ["IMAGE", "GEN"], x: 350, y: 576 },
  { id: "output", label: ["AGGREGATE", "OUTPUT"], x: 500, y: 642 },
];

const EDGES = [
  { id: "input_parsing", from: "input", to: "parsing", fromAnchor: "bottom", toAnchor: "top" },
  { id: "parsing_llm", from: "parsing", to: "llm", fromAnchor: "bottom", toAnchor: "top" },
  {
    id: "llm_style",
    from: "llm",
    to: "style",
    fromAnchor: "bottom-left",
    toAnchor: "top",
  },
  {
    id: "llm_voice",
    from: "llm",
    to: "voice",
    fromAnchor: "bottom-right",
    toAnchor: "top",
  },
  { id: "style_image", from: "style", to: "image", fromAnchor: "bottom", toAnchor: "top" },
  {
    id: "image_output",
    from: "image",
    to: "output",
    fromAnchor: "bottom-right",
    toAnchor: "top-left",
  },
  {
    id: "voice_output",
    from: "voice",
    to: "output",
    fromAnchor: "bottom-left",
    toAnchor: "top-right",
  },
];

const NODE_COLORS = {
  input: "#64748b",
  parsing: "#3b82f6",
  llm: "#8b5cf6",
  style: "#ec4899",
  image: "#f59e0b",
  voice: "#22c55e",
  output: "#06b6d4",
};

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function hexToRgb(hex) {
  const safeHex = hex.replace("#", "");
  const value = Number.parseInt(safeHex, 16);
  return {
    r: (value >> 16) & 255,
    g: (value >> 8) & 255,
    b: value & 255,
  };
}

function rgba(hex, alpha) {
  const { r, g, b } = hexToRgb(hex);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

function normalizeState(steps) {
  return steps.reduce((acc, step) => {
    acc[step.id] = step.state;
    return acc;
  }, {});
}

function edgeState(fromState, toState) {
  if (fromState === "error" || toState === "error") return "error";
  if (fromState === "active" || toState === "active") return "active";
  if (fromState === "complete" && toState === "complete") return "complete";
  return "idle";
}

function edgeStyle(state) {
  if (state === "active") {
    return {
      stroke: "#818cf8",
      strokeWidth: 2.8,
      strokeDasharray: "8 8",
      className: "pipeline-edge-flow",
    };
  }
  if (state === "complete") {
    return {
      stroke: "rgba(34, 197, 94, 0.76)",
      strokeWidth: 2.4,
      strokeDasharray: undefined,
      className: "",
    };
  }
  if (state === "error") {
    return {
      stroke: "rgba(248, 113, 113, 0.82)",
      strokeWidth: 2.4,
      strokeDasharray: undefined,
      className: "",
    };
  }
  return {
    stroke: "rgba(148, 163, 184, 0.34)",
    strokeWidth: 2,
    strokeDasharray: undefined,
    className: "",
  };
}

function nodeVisual(nodeId, state) {
  const color = NODE_COLORS[nodeId] || "#6366f1";
  if (state === "error") {
    return {
      fill: "rgba(30, 10, 12, 0.95)",
      stroke: "rgba(248, 113, 113, 0.8)",
      glow: "none",
      iconFill: "rgba(248, 113, 113, 0.2)",
      iconColor: "rgba(252, 165, 165, 1)",
      textColor: "#fca5a5",
    };
  }
  if (state === "complete") {
    return {
      fill: rgba(color, 0.24),
      stroke: rgba(color, 0.92),
      glow: `drop-shadow(0 0 14px ${rgba(color, 0.44)})`,
      iconFill: rgba(color, 0.22),
      iconColor: "#ffffff",
      textColor: "#ffffff",
    };
  }
  if (state === "active") {
    return {
      fill: rgba(color, 0.16),
      stroke: rgba(color, 0.95),
      glow: `drop-shadow(0 0 16px ${rgba(color, 0.45)})`,
      iconFill: rgba(color, 0.22),
      iconColor: color,
      textColor: "#f8fafc",
    };
  }
  return {
    fill: "rgba(13, 18, 33, 0.9)",
    stroke: "rgba(64, 74, 101, 0.75)",
    glow: "none",
    iconFill: "rgba(100, 116, 139, 0.15)",
    iconColor: "#94a3b8",
    textColor: "#cbd5e1",
  };
}

function anchorPoint(node, anchor, halfW, halfH) {
  switch (anchor) {
    case "top":
      return { x: node.x, y: node.y - halfH };
    case "bottom":
      return { x: node.x, y: node.y + halfH };
    case "left":
      return { x: node.x - halfW, y: node.y };
    case "right":
      return { x: node.x + halfW, y: node.y };
    case "top-left":
      return { x: node.x - halfW * 0.42, y: node.y - halfH };
    case "top-right":
      return { x: node.x + halfW * 0.42, y: node.y - halfH };
    case "bottom-left":
      return { x: node.x - halfW * 0.42, y: node.y + halfH };
    case "bottom-right":
      return { x: node.x + halfW * 0.42, y: node.y + halfH };
    default:
      return { x: node.x, y: node.y };
  }
}

function buildEdgePath(fromPoint, toPoint) {
  const dx = toPoint.x - fromPoint.x;
  const dy = toPoint.y - fromPoint.y;
  const absX = Math.abs(dx);
  const absY = Math.abs(dy);

  if (absX < 12) {
    return `M ${fromPoint.x} ${fromPoint.y} L ${toPoint.x} ${toPoint.y}`;
  }

  const verticalPull = clamp(absY * 0.42, 34, 130);
  const directionY = dy >= 0 ? 1 : -1;
  const curveBias = clamp(absX * 0.15, 14, 44);

  const c1x = fromPoint.x + Math.sign(dx) * curveBias;
  const c1y = fromPoint.y + verticalPull * directionY;
  const c2x = toPoint.x - Math.sign(dx) * curveBias;
  const c2y = toPoint.y - verticalPull * directionY;

  return `M ${fromPoint.x} ${fromPoint.y} C ${c1x} ${c1y}, ${c2x} ${c2y}, ${toPoint.x} ${toPoint.y}`;
}

function toSvgPoint(event, svgElement) {
  const point = svgElement.createSVGPoint();
  point.x = event.clientX;
  point.y = event.clientY;
  const transform = svgElement.getScreenCTM();
  if (!transform) return { x: 0, y: 0 };
  const result = point.matrixTransform(transform.inverse());
  return { x: result.x, y: result.y };
}

function NodeGlyph({ id, x, y, color }) {
  const glyph = {
    input: "PDF",
    parsing: "{}",
    llm: "AI",
    style: "S",
    image: "IMG",
    voice: "VOX",
    output: "OUT",
  }[id];
  return (
    <text
      x={x}
      y={y}
      textAnchor="middle"
      dominantBaseline="middle"
      fontSize="10"
      fontWeight="700"
      letterSpacing="0.04em"
      fill={color}
    >
      {glyph}
    </text>
  );
}

export default function FlowGraph({ steps }) {
  const stepState = normalizeState(steps);
  const halfW = NODE_SIZE.width / 2;
  const halfH = NODE_SIZE.height / 2;

  const basePositions = useMemo(
    () =>
      NODE_BASE.reduce((acc, node) => {
        acc[node.id] = { x: node.x, y: node.y };
        return acc;
      }, {}),
    [],
  );

  const [positions, setPositions] = useState(basePositions);
  const [dragNodeId, setDragNodeId] = useState(null);

  const svgRef = useRef(null);
  const dragOffsetRef = useRef({ x: 0, y: 0 });

  const minX = 30 + halfW;
  const maxX = VIEWBOX.width - 30 - halfW;
  const minY = 24 + halfH;
  const maxY = VIEWBOX.height + 120;

  const handleNodePointerDown = (event, nodeId) => {
    const svgElement = svgRef.current;
    if (!svgElement) return;
    const cursor = toSvgPoint(event, svgElement);
    const nodePos = positions[nodeId];
    dragOffsetRef.current = {
      x: cursor.x - nodePos.x,
      y: cursor.y - nodePos.y,
    };
    setDragNodeId(nodeId);
  };

  const handlePointerMove = (event) => {
    if (!dragNodeId) return;
    const svgElement = svgRef.current;
    if (!svgElement) return;
    const cursor = toSvgPoint(event, svgElement);
    const nextX = clamp(cursor.x - dragOffsetRef.current.x, minX, maxX);
    const nextY = clamp(cursor.y - dragOffsetRef.current.y, minY, maxY);
    setPositions((prev) => ({
      ...prev,
      [dragNodeId]: { x: nextX, y: nextY },
    }));
  };

  const handlePointerUp = () => {
    setDragNodeId(null);
  };

  useEffect(() => {
    if (!dragNodeId) return undefined;
    const onMove = (event) => handlePointerMove(event);
    const onUp = () => handlePointerUp();
    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onUp);
    window.addEventListener("pointercancel", onUp);
    return () => {
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
      window.removeEventListener("pointercancel", onUp);
    };
  }, [dragNodeId]);

  const resetLayout = () => {
    setPositions(basePositions);
    setDragNodeId(null);
  };

  return (
    <div className="faint-grid panel relative h-full overflow-hidden">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_42%,rgba(99,102,241,0.16),transparent_55%)]" />

      <svg
        ref={svgRef}
        className="absolute inset-0 h-full w-full"
        viewBox={`0 0 ${VIEWBOX.width} ${VIEWBOX.height}`}
        preserveAspectRatio="xMidYMid meet"
        style={{ touchAction: "none", userSelect: "none" }}
      >
        {EDGES.map((edge) => {
          const fromNode = positions[edge.from];
          const toNode = positions[edge.to];
          const fromPoint = anchorPoint(fromNode, edge.fromAnchor, halfW, halfH);
          const toPoint = anchorPoint(toNode, edge.toAnchor, halfW, halfH);
          const state = edgeState(stepState[edge.from], stepState[edge.to]);
          const style = edgeStyle(state);
          return (
            <path
              key={edge.id}
              d={buildEdgePath(fromPoint, toPoint)}
              className={`pipeline-edge ${style.className}`}
              fill="none"
              stroke={style.stroke}
              strokeWidth={style.strokeWidth}
              strokeDasharray={style.strokeDasharray}
            />
          );
        })}

        {NODE_BASE.map((node) => {
          const position = positions[node.id];
          const state = stepState[node.id] || "idle";
          const visual = nodeVisual(node.id, state);
          const isDragging = dragNodeId === node.id;
          return (
            <motion.g
              key={node.id}
              animate={state === "active" && !isDragging ? { scale: [1, 1.03, 1] } : { scale: 1 }}
              transition={
                state === "active" && !isDragging
                  ? { duration: 1.4, repeat: Infinity, ease: "easeInOut" }
                  : { duration: 0.18 }
              }
              style={{
                transformOrigin: `${position.x}px ${position.y}px`,
                filter: visual.glow,
                cursor: isDragging ? "grabbing" : "grab",
              }}
              onPointerDown={(event) => handleNodePointerDown(event, node.id)}
            >
              <rect
                x={position.x - halfW}
                y={position.y - halfH}
                width={NODE_SIZE.width}
                height={NODE_SIZE.height}
                rx={NODE_SIZE.radius}
                fill={visual.fill}
                stroke={visual.stroke}
                strokeWidth="1.6"
              />

              <rect
                x={position.x - 16}
                y={position.y - 31}
                width="32"
                height="22"
                rx="6"
                fill={visual.iconFill}
              />
              <NodeGlyph id={node.id} x={position.x} y={position.y - 20} color={visual.iconColor} />

              <text
                x={position.x}
                y={position.y + 8}
                textAnchor="middle"
                fontSize="11"
                fill={visual.textColor}
                fontFamily="Inter, -apple-system, BlinkMacSystemFont, sans-serif"
                fontWeight="600"
              >
                {node.label.map((line, index) => (
                  <tspan key={`${node.id}_${line}`} x={position.x} dy={index === 0 ? 0 : 14}>
                    {line}
                  </tspan>
                ))}
              </text>

              {state === "complete" ? (
                <>
                  <circle
                    cx={position.x + halfW - 8}
                    cy={position.y - halfH + 8}
                    r="12"
                    fill="#22c55e"
                  />
                  <text
                    x={position.x + halfW - 8}
                    y={position.y - halfH + 12}
                    textAnchor="middle"
                    fontSize="12"
                    fontWeight="700"
                    fill="#04130a"
                  >
                    ✓
                  </text>
                </>
              ) : null}
            </motion.g>
          );
        })}
      </svg>

      <div className="absolute left-7 top-7 rounded-md border border-borderPrimary bg-bgPrimary/70 px-3 py-2 text-[11px] text-textSecondary">
        <div>
          <p className="mb-1 font-semibold tracking-[0.06em]">PIPELINE GRAPH</p>
          <p>Drag nodes to refine layout. Edges auto-route.</p>
        </div>
      </div>

      <button
        type="button"
        className="absolute z-20 rounded-md border border-borderAccent/80 bg-bgPrimary/70 px-2 py-1 text-[10px] font-semibold tracking-[0.05em] text-textSecondary hover:border-borderAccent hover:bg-bgHover hover:text-textPrimary"
        style={{ top: 10, right: 10 }}
        onClick={resetLayout}
      >
        RESET
      </button>
    </div>
  );
}
