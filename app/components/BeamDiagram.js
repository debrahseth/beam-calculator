"use client";

import React, { useRef, useState, useEffect } from "react";

export default function BeamDiagram({
  caseType,
  L,
  P,
  w,
  a,
  P2,
  a2,
  udlStart,
  udlEnd,
  triangularLoad,
  units,
  supportLeft,
  supportRight,
  setSupportLeft,
  setSupportRight,
}) {
  const svgWidth = 600;
  const beamLength = 500; // pixel length of beam
  const xStart = 50; // left margin
  const scale = beamLength / (Number(L) || 1); // pixel per unit length

  // Convert positions to SVG coordinates
  const posA = xStart + Number(a) * scale;
  const posA2 = xStart + Number(a2) * scale;
  const udlStartPx = xStart + Number(udlStart) * scale;
  const udlEndPx = xStart + Number(udlEnd) * scale;
  const posS1 = xStart + Number(supportLeft) * scale;
  const posS2 = xStart + Number(supportRight) * scale;

  const svgRef = useRef(null);
  const [dragging, setDragging] = useState(null); // 'left' or 'right'

  useEffect(() => {
    const handlePointerMove = (e) => {
      if (dragging) {
        const rect = svgRef.current.getBoundingClientRect();
        const px = e.clientX - rect.left;
        let newPos = (px - xStart) / scale;
        newPos = Math.max(0, Math.min(newPos, L));
        if (dragging === "left") {
          setSupportLeft(Math.min(newPos, supportRight));
        } else if (dragging === "right") {
          setSupportRight(Math.max(newPos, supportLeft));
        }
      }
    };

    const handlePointerUp = () => {
      setDragging(null);
    };

    if (dragging) {
      document.addEventListener("pointermove", handlePointerMove);
      document.addEventListener("pointerup", handlePointerUp);
    }

    return () => {
      document.removeEventListener("pointermove", handlePointerMove);
      document.removeEventListener("pointerup", handlePointerUp);
    };
  }, [dragging, scale, L, supportRight, supportLeft, xStart]);

  return (
    <div className="flex justify-center items-center py-6">
      <svg
        ref={svgRef}
        width={svgWidth}
        height="200"
        viewBox={`0 0 ${svgWidth} 200`}
        xmlns="http://www.w3.org/2000/svg"
      >
        {/* Beam line */}
        <line
          x1={xStart}
          y1="120"
          x2={xStart + beamLength}
          y2="120"
          stroke="black"
          strokeWidth="4"
        />

        {/* Supports */}
        {caseType.startsWith("simply-supported") && (
          <>
            {/* Left support */}
            <g
              onPointerDown={() => setDragging("left")}
              style={{ cursor: "move" }}
            >
              <polygon
                points={`${posS1},120 ${posS1 - 10},140 ${posS1 + 10},140`}
                fill="gray"
              />
              <circle cx={posS1} cy="145" r="3" fill="black" />
            </g>
            {/* Right support */}
            <g
              onPointerDown={() => setDragging("right")}
              style={{ cursor: "move" }}
            >
              <polygon
                points={`${posS2},120 ${posS2 - 10},140 ${posS2 + 10},140`}
                fill="gray"
              />
              <circle cx={posS2} cy="145" r="3" fill="black" />
            </g>
          </>
        )}

        {caseType.startsWith("cantilever") && (
          <>
            {/* Fixed end */}
            <rect
              x={xStart - 10}
              y="80"
              width="10"
              height="80"
              fill="url(#hatch)"
            />
          </>
        )}

        {/* Loads */}
        {caseType === "simply-supported-point" && Number(P) > 0 && (
          <>
            <line
              x1={posA}
              y1="70"
              x2={posA}
              y2="120"
              stroke="red"
              strokeWidth="2"
              markerEnd="url(#arrow)"
            />
            <text x={posA + 10} y="90" fill="red" fontSize="14">
              P={Number(P).toFixed(1)} {units === "SI" ? "kN" : "kip"}
            </text>
          </>
        )}

        {caseType === "simply-supported-multi-point" && (
          <>
            {Number(P) > 0 && (
              <>
                <line
                  x1={posA}
                  y1="70"
                  x2={posA}
                  y2="120"
                  stroke="red"
                  strokeWidth="2"
                  markerEnd="url(#arrow)"
                />
                <text x={posA + 10} y="90" fill="red" fontSize="14">
                  P1={Number(P).toFixed(1)} {units === "SI" ? "kN" : "kip"}
                </text>
              </>
            )}
            {Number(P2) > 0 && (
              <>
                <line
                  x1={posA2}
                  y1="70"
                  x2={posA2}
                  y2="120"
                  stroke="red"
                  strokeWidth="2"
                  markerEnd="url(#arrow)"
                />
                <text x={posA2 + 10} y="110" fill="red" fontSize="14">
                  P2={Number(P2).toFixed(1)} {units === "SI" ? "kN" : "kip"}
                </text>
              </>
            )}
          </>
        )}

        {caseType === "cantilever-point" && Number(P) > 0 && (
          <>
            <line
              x1={posA}
              y1="70"
              x2={posA}
              y2="120"
              stroke="red"
              strokeWidth="2"
              markerEnd="url(#arrow)"
            />
            <text x={posA - 70} y="90" fill="red" fontSize="14">
              P={Number(P).toFixed(1)} {units === "SI" ? "kN" : "kip"}
            </text>
          </>
        )}

        {(caseType === "simply-supported-udl" ||
          caseType === "cantilever-udl") &&
          Number(w) > 0 && (
            <>
              {/* UDL arrows */}
              {[...Array(10)].map((_, i) => {
                const x = udlStartPx + (i * (udlEndPx - udlStartPx)) / 9;
                if (x >= udlStartPx && x <= udlEndPx) {
                  return (
                    <line
                      key={i}
                      x1={x}
                      y1="70"
                      x2={x}
                      y2="120"
                      stroke="blue"
                      strokeWidth="2"
                      markerEnd="url(#arrow)"
                    />
                  );
                }
                return null;
              })}
              {/* UDL rectangle */}
              <rect
                x={udlStartPx}
                y="70"
                width={udlEndPx - udlStartPx}
                height="10"
                fill="none"
                stroke="blue"
                strokeWidth="1"
              />
              <text
                x={(udlStartPx + udlEndPx) / 2}
                y="60"
                textAnchor="middle"
                fill="blue"
                fontSize="14"
              >
                w={Number(w).toFixed(1)} {units === "SI" ? "kN/m" : "kip/ft"}
              </text>
            </>
          )}

        {caseType === "simply-supported-triangular" &&
          Number(triangularLoad) > 0 && (
            <>
              {/* Triangular load shape */}
              <polygon
                points={`${udlStartPx},120 ${udlStartPx},70 ${udlEndPx},70 ${udlEndPx},120`}
                fill="none"
                stroke="purple"
                strokeWidth="2"
              />
              {/* Arrows for triangular load */}
              {[...Array(10)].map((_, i) => {
                const x = udlStartPx + (i * (udlEndPx - udlStartPx)) / 9;
                const loadHeight =
                  (triangularLoad * (x - udlStartPx)) / (udlEndPx - udlStartPx);
                const arrowLength = (loadHeight / triangularLoad) * 50;
                return (
                  <line
                    key={i}
                    x1={x}
                    y1={120 - arrowLength}
                    x2={x}
                    y2="120"
                    stroke="purple"
                    strokeWidth="2"
                    markerEnd="url(#arrow)"
                  />
                );
              })}
              <text
                x={(udlStartPx + udlEndPx) / 2}
                y="60"
                textAnchor="middle"
                fill="purple"
                fontSize="14"
              >
                w_max={Number(triangularLoad).toFixed(1)}{" "}
                {units === "SI" ? "kN/m" : "kip/ft"}
              </text>
            </>
          )}

        {/* Length label */}
        <text
          x={xStart + beamLength / 2}
          y="150"
          textAnchor="middle"
          fontSize="14"
        >
          L={Number(L).toFixed(1)} {units === "SI" ? "m" : "ft"}
        </text>

        {/* Arrow marker */}
        <defs>
          <marker
            id="arrow"
            markerWidth="10"
            markerHeight="10"
            refX="5"
            refY="5"
            orient="auto"
          >
            <path d="M 0 0 L 10 5 L 0 10 z" fill="currentColor" />
          </marker>
          <pattern
            id="hatch"
            patternUnits="userSpaceOnUse"
            width="4"
            height="4"
          >
            <path
              d="M-1,1 l2,-2 M0,4 l4,-4 M3,5 l2,-2"
              stroke="black"
              strokeWidth="1"
            />
          </pattern>
        </defs>
      </svg>
    </div>
  );
}
