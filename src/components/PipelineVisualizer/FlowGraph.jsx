import { motion } from "framer-motion";
import { useEffect, useMemo, useRef, useState } from "react";

const VIEWBOX = { width: 1000, height: 760 };
const NODE_SIZE = { width: 170, height: 92, radius: 16 };

// "archive" is visually bypassed (in testing / not active in demo)
const BYPASSED_NODES = new Set(["archive"]);

const NODE_BASE = [
  { id: "input", label: ["INPUT", "PDF"], x: 500, y: 92 },
  { id: "parsing", label: ["PARSE", "REQUEST"], x: 500, y: 180 },
  { id: "llm", label: ["LLM", "ANALYSIS"], x: 500, y: 268 },
  { id: "archive", label: ["ARCHIVIO", "VIVO"], x: 500, y: 356 },
  { id: "style", label: ["STYLE", "PROMPT"], x: 248, y: 456 },
  { id: "lora", label: ["LoRA", "SELECT"], x: 500, y: 456 },
  { id: "controlnet", label: ["CONTROL", "NET"], x: 752, y: 456 },
  { id: "image", label: ["IMAGE", "GEN"], x: 248, y: 584 },
  { id: "voice", label: ["VOICE", "SYNTH"], x: 500, y: 584 },
  { id: "video", label: ["VIDEO", "COMPOSE"], x: 752, y: 584 },
  { id: "output", label: ["AGGREGATE", "OUTPUT"], x: 500, y: 688 },
];

const EDGES = [
  { id: "input_parsing", from: "input", to: "parsing", fromAnchor: "bottom", toAnchor: "top" },
  { id: "parsing_llm", from: "parsing", to: "llm", fromAnchor: "bottom", toAnchor: "top" },
  { id: "llm_archive", from: "llm", to: "archive", fromAnchor: "bottom", toAnchor: "top" },
  { id: "archive_style", from: "archive", to: "style", fromAnchor: "bottom-left", toAnchor: "top" },
  { id: "archive_lora", from: "archive", to: "lora", fromAnchor: "bottom", toAnchor: "top" },
  { id: "archive_controlnet", from: "archive", to: "controlnet", fromAnchor: "bottom-right", toAnchor: "top" },
  { id: "style_image", from: "style", to: "image", fromAnchor: "bottom", toAnchor: "top" },
  { id: "lora_voice", from: "lora", to: "voice", fromAnchor: "bottom", toAnchor: "top" },
  { id: "controlnet_video", from: "controlnet", to: "video", fromAnchor: "bottom", toAnchor: "top" },
  { id: "image_output", from: "image", to: "output", fromAnchor: "bottom", toAnchor: "top-left" },
  { id: "voice_output", from: "voice", to: "output", fromAnchor: "bottom", toAnchor: "top" },
  { id: "video_output", from: "video", to: "output", fromAnchor: "bottom", toAnchor: "top-right" },
];

const NODE_COLORS = {
  input: "#64748b",
  parsing: "#3b82f6",
  llm: "#8b5cf6",
  archive: "#14b8a6",
  style: "#ec4899",
  lora: "#f97316",
  controlnet: "#38bdf8",
  image: "#f59e0b",
  voice: "#22c55e",
  video: "#6366f1",
  output: "#06b6d4",
};

const ZOOM_MIN = 0.5;
const ZOOM_MAX = 2.5;
const ZOOM_STEP = 0.15;

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function hexToRgb(hex) {
  const safeHex = hex.replace("#", "");
  const value = Number.parseInt(safeHex, 16);
  return { r: (value >> 16) & 255, g: (value >> 8) & 255, b: value & 255 };
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

function edgeState(fromState, toState, fromBypassed, toBypassed) {
  if (fromBypassed || toBypassed) return "bypassed";
  if (fromState === "error" || toState === "error") return "error";
  if (fromState === "active" || toState === "active") return "active";
  if (fromState === "complete" && toState === "complete") return "complete";
  return "idle";
}

function edgeStyle(state) {
  if (state === "bypassed") {
    return {
      stroke: "rgba(100, 116, 139, 0.22)",
      strokeWidth: 1.6,
      strokeDasharray: "4 6",
      className: "",
    };
  }
  if (state === "active") {
    return { stroke: "#818cf8", strokeWidth: 2.8, strokeDasharray: "8 8", className: "pipeline-edge-flow" };
  }
  if (state === "complete") {
    return { stroke: "rgba(34, 197, 94, 0.76)", strokeWidth: 2.4, strokeDasharray: undefined, className: "" };
  }
  if (state === "error") {
    return { stroke: "rgba(248, 113, 113, 0.82)", strokeWidth: 2.4, strokeDasharray: undefined, className: "" };
  }
  return { stroke: "rgba(148, 163, 184, 0.34)", strokeWidth: 2, strokeDasharray: undefined, className: "" };
}

function nodeVisual(nodeId, state, bypassed) {
  if (bypassed) {
    return {
      fill: "rgba(13, 18, 33, 0.55)",
      stroke: "rgba(64, 74, 101, 0.38)",
      glow: "none",
      iconFill: "rgba(60, 70, 90, 0.12)",
      iconColor: "rgba(100, 116, 139, 0.5)",
      textColor: "rgba(100, 116, 139, 0.55)",
      opacity: 0.6,
    };
  }
  const color = NODE_COLORS[nodeId] || "#6366f1";
  if (state === "error") {
    return {
      fill: "rgba(30, 10, 12, 0.95)", stroke: "rgba(248, 113, 113, 0.8)", glow: "none",
      iconFill: "rgba(248, 113, 113, 0.2)", iconColor: "rgba(252, 165, 165, 1)", textColor: "#fca5a5", opacity: 1,
    };
  }
  if (state === "complete") {
    return {
      fill: rgba(color, 0.24), stroke: rgba(color, 0.92),
      glow: `drop-shadow(0 0 14px ${rgba(color, 0.44)})`,
      iconFill: rgba(color, 0.22), iconColor: "#ffffff", textColor: "#ffffff", opacity: 1,
    };
  }
  if (state === "active") {
    return {
      fill: rgba(color, 0.16), stroke: rgba(color, 0.95),
      glow: `drop-shadow(0 0 16px ${rgba(color, 0.45)})`,
      iconFill: rgba(color, 0.22), iconColor: color, textColor: "#f8fafc", opacity: 1,
    };
  }
  return {
    fill: "rgba(13, 18, 33, 0.9)", stroke: "rgba(64, 74, 101, 0.75)", glow: "none",
    iconFill: "rgba(100, 116, 139, 0.15)", iconColor: "#94a3b8", textColor: "#cbd5e1", opacity: 1,
  };
}

function anchorPoint(node, anchor, halfW, halfH) {
  switch (anchor) {
    case "top": return { x: node.x, y: node.y - halfH };
    case "bottom": return { x: node.x, y: node.y + halfH };
    case "left": return { x: node.x - halfW, y: node.y };
    case "right": return { x: node.x + halfW, y: node.y };
    case "top-left": return { x: node.x - halfW * 0.42, y: node.y - halfH };
    case "top-right": return { x: node.x + halfW * 0.42, y: node.y - halfH };
    case "bottom-left": return { x: node.x - halfW * 0.42, y: node.y + halfH };
    case "bottom-right": return { x: node.x + halfW * 0.42, y: node.y + halfH };
    default: return { x: node.x, y: node.y };
  }
}

function buildEdgePath(fromPoint, toPoint) {
  const dx = toPoint.x - fromPoint.x;
  const dy = toPoint.y - fromPoint.y;
  const absX = Math.abs(dx);
  const absY = Math.abs(dy);
  if (absX < 12) return `M ${fromPoint.x} ${fromPoint.y} L ${toPoint.x} ${toPoint.y}`;
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
    input: "PDF", parsing: "{}", llm: "AI", archive: "AV", style: "S",
    lora: "L", controlnet: "CN", image: "IMG", voice: "VOX", video: "VID", output: "OUT",
  }[id];
  return (
    <text x={x} y={y} textAnchor="middle" dominantBaseline="middle"
      fontSize="10" fontWeight="700" letterSpacing="0.04em" fill={color}>
      {glyph}
    </text>
  );
}

export default function FlowGraph({ steps }) {
  const stepState = normalizeState(steps);
  const halfW = NODE_SIZE.width / 2;
  const halfH = NODE_SIZE.height / 2;

  const basePositions = useMemo(
    () => NODE_BASE.reduce((acc, node) => { acc[node.id] = { x: node.x, y: node.y }; return acc; }, {}),
    [],
  );

  const [positions, setPositions] = useState(basePositions);
  const [dragNodeId, setDragNodeId] = useState(null);
  const [zoom, setZoom] = useState(1);

  const svgRef = useRef(null);
  const containerRef = useRef(null);
  const dragOffsetRef = useRef({ x: 0, y: 0 });

  const minX = 30 + halfW;
  const maxX = VIEWBOX.width - 30 - halfW;
  const minY = 24 + halfH;
  const maxY = VIEWBOX.height + 120;

  // Zoom via mouse wheel / trackpad
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const onWheel = (e) => {
      e.preventDefault();
      const delta = e.deltaY < 0 ? ZOOM_STEP : -ZOOM_STEP;
      setZoom((prev) => clamp(prev + delta, ZOOM_MIN, ZOOM_MAX));
    };
    el.addEventListener("wheel", onWheel, { passive: false });
    return () => el.removeEventListener("wheel", onWheel);
  }, []);

  const handleNodePointerDown = (event, nodeId) => {
    const svgElement = svgRef.current;
    if (!svgElement) return;
    const cursor = toSvgPoint(event, svgElement);
    const nodePos = positions[nodeId];
    dragOffsetRef.current = { x: cursor.x - nodePos.x, y: cursor.y - nodePos.y };
    setDragNodeId(nodeId);
  };

  const handlePointerMove = (event) => {
    if (!dragNodeId) return;
    const svgElement = svgRef.current;
    if (!svgElement) return;
    const cursor = toSvgPoint(event, svgElement);
    const nextX = clamp(cursor.x - dragOffsetRef.current.x, minX, maxX);
    const nextY = clamp(cursor.y - dragOffsetRef.current.y, minY, maxY);
    setPositions((prev) => ({ ...prev, [dragNodeId]: { x: nextX, y: nextY } }));
  };

  const handlePointerUp = () => setDragNodeId(null);

  useEffect(() => {
    if (!dragNodeId) return undefined;
    const onMove = (e) => handlePointerMove(e);
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

  const resetLayout = () => { setPositions(basePositions); setDragNodeId(null); setZoom(1); };

  return (
    <div ref={containerRef} className="faint-grid panel relative h-full overflow-hidden">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_42%,rgba(99,102,241,0.16),transparent_55%)]" />

      <svg
        ref={svgRef}
        className="absolute inset-0 h-full w-full"
        viewBox={`${VIEWBOX.width / 2 - (VIEWBOX.width / 2) / zoom} ${VIEWBOX.height / 2 - (VIEWBOX.height / 2) / zoom} ${VIEWBOX.width / zoom} ${VIEWBOX.height / zoom}`}
        preserveAspectRatio="xMidYMid meet"
        style={{ touchAction: "none", userSelect: "none" }}
      >
        {EDGES.map((edge) => {
          const fromNode = positions[edge.from];
          const toNode = positions[edge.to];
          const fromPoint = anchorPoint(fromNode, edge.fromAnchor, halfW, halfH);
          const toPoint = anchorPoint(toNode, edge.toAnchor, halfW, halfH);
          const state = edgeState(
            stepState[edge.from],
            stepState[edge.to],
            BYPASSED_NODES.has(edge.from),
            BYPASSED_NODES.has(edge.to),
          );
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
          const bypassed = BYPASSED_NODES.has(node.id);
          const visual = nodeVisual(node.id, state, bypassed);
          const isDragging = dragNodeId === node.id;

          return (
            <motion.g
              key={node.id}
              animate={state === "active" && !isDragging && !bypassed ? { scale: [1, 1.03, 1] } : { scale: 1 }}
              transition={
                state === "active" && !isDragging && !bypassed
                  ? { duration: 1.4, repeat: Infinity, ease: "easeInOut" }
                  : { duration: 0.18 }
              }
              style={{
                transformOrigin: `${position.x}px ${position.y}px`,
                filter: visual.glow,
                cursor: isDragging ? "grabbing" : "grab",
                opacity: visual.opacity,
              }}
              onPointerDown={(event) => handleNodePointerDown(event, node.id)}
            >
              {/* Node body */}
              <rect
                x={position.x - halfW} y={position.y - halfH}
                width={NODE_SIZE.width} height={NODE_SIZE.height}
                rx={NODE_SIZE.radius}
                fill={visual.fill} stroke={visual.stroke} strokeWidth="1.6"
              />

              {/* Icon badge */}
              <rect x={position.x - 16} y={position.y - 31} width="32" height="22" rx="6" fill={visual.iconFill} />
              <NodeGlyph id={node.id} x={position.x} y={position.y - 20} color={visual.iconColor} />

              {/* Label */}
              <text x={position.x} y={position.y + 8} textAnchor="middle" fontSize="11"
                fill={visual.textColor}
                fontFamily="Inter, -apple-system, BlinkMacSystemFont, sans-serif" fontWeight="600">
                {node.label.map((line, index) => (
                  <tspan key={`${node.id}_${line}`} x={position.x} dy={index === 0 ? 0 : 14}>{line}</tspan>
                ))}
              </text>

              {/* Bypassed overlay: diagonal strikethrough + BYPASS badge */}
              {bypassed && (
                <>
                  <line
                    x1={position.x - halfW + 10} y1={position.y - halfH + 10}
                    x2={position.x + halfW - 10} y2={position.y + halfH - 10}
                    stroke="rgba(100, 116, 139, 0.45)" strokeWidth="1.8" strokeLinecap="round"
                  />
                  {/* BYPASS badge top-right */}
                  <rect
                    x={position.x + halfW - 52} y={position.y - halfH - 10}
                    width="46" height="14" rx="4"
                    fill="rgba(30, 35, 50, 0.9)" stroke="rgba(100, 116, 139, 0.5)" strokeWidth="0.8"
                  />
                  <text
                    x={position.x + halfW - 29} y={position.y - halfH - 4}
                    textAnchor="middle" dominantBaseline="middle"
                    fontSize="7.5" fontWeight="700" letterSpacing="0.08em"
                    fill="rgba(148, 163, 184, 0.75)"
                  >
                    BYPASS
                  </text>
                </>
              )}

              {/* Complete checkmark */}
              {state === "complete" && !bypassed ? (
                <>
                  <circle cx={position.x + halfW - 8} cy={position.y - halfH + 8} r="12" fill="#22c55e" />
                  <text x={position.x + halfW - 8} y={position.y - halfH + 12}
                    textAnchor="middle" fontSize="12" fontWeight="700" fill="#04130a">✓</text>
                </>
              ) : null}
            </motion.g>
          );
        })}
      </svg>

      {/* Info label */}
      <div className="absolute left-7 top-7 rounded-md border border-borderPrimary bg-bgPrimary/70 px-3 py-2 text-[11px] text-textSecondary">
        <p className="mb-1 font-semibold tracking-[0.06em]">PIPELINE GRAPH</p>
        <p>Drag nodes · Scroll to zoom · Edges auto-route.</p>
      </div>

      {/* Zoom controls */}
      <div className="absolute bottom-10 right-10 z-20 flex flex-col gap-1">
        <button
          type="button"
          className="grid h-7 w-7 place-items-center rounded border border-borderAccent/80 bg-bgPrimary/80 text-base font-bold text-textSecondary hover:bg-bgHover hover:text-textPrimary"
          onClick={() => setZoom((z) => clamp(z + ZOOM_STEP, ZOOM_MIN, ZOOM_MAX))}
          title="Zoom in"
        >+</button>
        <button
          type="button"
          className="grid h-7 w-7 place-items-center rounded border border-borderAccent/80 bg-bgPrimary/80 text-base font-bold text-textSecondary hover:bg-bgHover hover:text-textPrimary"
          onClick={() => setZoom((z) => clamp(z - ZOOM_STEP, ZOOM_MIN, ZOOM_MAX))}
          title="Zoom out"
        >−</button>
        <div className="mt-0.5 text-center text-[9px] font-semibold tracking-widest text-textMuted">
          {Math.round(zoom * 100)}%
        </div>
      </div>

      {/* Reset button */}
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
