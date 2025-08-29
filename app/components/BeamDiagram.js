"use client";

import React, { useRef, useState, useEffect } from "react";

export default function BeamDiagram({
  caseType,
  L,
  pointLoads,
  udlLoads,
  triangularLoads,
  units,
  supportLeft,
  supportRight,
  setSupportLeft,
  setSupportRight,
  RA,
  RB,
  Mfix,
  loadTypes,
  beamType,
  decimalPlaces,
}) {
  const svgWidth = 1200;
  const beamLength = 800; // pixel length of beam
  const xStart = 180; // left margin
  const scale = beamLength / (Number(L) || 1); // pixel per unit length

  // Convert positions to SVG coordinates
  const pointLoadPositions = pointLoads.map((load) => ({
    magnitude: Number(load.magnitude) || 0,
    position: xStart + (Number(load.position) || 0) * scale,
  }));
  const udlPositions = udlLoads.map((load) => ({
    magnitude: Number(load.magnitude) || 0,
    start: xStart + (Number(load.start) || 0) * scale,
    end: xStart + (Number(load.end) || Number(L)) * scale,
  }));
  const triangularPositions = triangularLoads.map((load) => ({
    magnitude: Number(load.magnitude) || 0,
    start: xStart + (Number(load.start) || 0) * scale,
    end: xStart + (Number(load.end) || Number(L)) * scale,
  }));

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

  const fmt = (val) =>
    typeof val === "number" && !isNaN(val)
      ? val.toFixed(decimalPlaces)
      : "0.00";

  const isSimplySupported =
    caseType.startsWith("simply-supported") ||
    (caseType === "combined" && beamType === "simply-supported");
  const isCantilever =
    caseType.startsWith("cantilever") ||
    (caseType === "combined" && beamType === "cantilever");
  const showPointLoads =
    caseType.includes("point") ||
    (caseType === "combined" && (loadTypes?.point || loadTypes?.multiPoint));
  const showUdl =
    caseType.includes("udl") ||
    (caseType === "combined" && (loadTypes?.udl || loadTypes?.multiUdl));
  const showTriangular =
    caseType === "simply-supported-triangular" ||
    (caseType === "combined" &&
      (loadTypes?.triangular || loadTypes?.multiTriangular));

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
        {isSimplySupported && (
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
              <text
                x={posS1 + 10}
                y="160"
                textAnchor="start"
                fontSize="14"
                fill="green"
              >
                {`RA = ${fmt(RA)} ${units === "SI" ? "kN" : "kip"}`}
              </text>
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
              <text
                x={posS2 - 10}
                y="160"
                textAnchor="end"
                fontSize="14"
                fill="green"
              >
                {`RB = ${fmt(RB)} ${units === "SI" ? "kN" : "kip"}`}
              </text>
            </g>
          </>
        )}

        {isCantilever && (
          <>
            {/* Fixed end */}
            <rect
              x={xStart - 10}
              y="80"
              width="10"
              height="80"
              fill="url(#hatch)"
            />
            {/* Reaction force at fixed end */}
            <text
              x={xStart - 20}
              y="70"
              textAnchor="end"
              fontSize="14"
              fill="green"
            >
              {`RA = ${fmt(RA)} ${units === "SI" ? "kN" : "kip"}`}
            </text>
            {/* Moment at fixed end */}
            <g>
              <defs>
                <marker
                  id="arrowhead"
                  markerWidth="6"
                  markerHeight="6"
                  refX="5"
                  refY="3"
                  orient="auto"
                  fill="blue"
                >
                  <path d="M0,0 L6,3 L0,6 Z" />
                </marker>
              </defs>
              <path
                d={`M ${xStart - 10} 80 A 20 20 0 ${Mfix > 0 ? 0 : 1} 1 ${
                  xStart + 50
                } 100`}
                stroke="blue"
                strokeWidth="2"
                fill="none"
                markerEnd="url(#arrowhead)"
              />
              <text
                x={xStart - 0}
                y="90"
                textAnchor="end"
                fontSize="14"
                fill="blue"
              >
                {`M = ${fmt(Mfix)} ${units === "SI" ? "kN·m" : "kip·ft"}`}
              </text>
            </g>
          </>
        )}

        {/* Point Loads */}
        {showPointLoads &&
          pointLoadPositions.map(
            (load, index) =>
              load.magnitude > 0 && (
                <g key={`point-${index}`}>
                  <line
                    x1={load.position}
                    y1="70"
                    x2={load.position}
                    y2="120"
                    stroke="red"
                    strokeWidth="2"
                    markerEnd="url(#arrow)"
                  />
                  <text
                    x={load.position + (index % 2 === 0 ? 10 : -10)}
                    y={index % 2 === 0 ? 60 : 80}
                    textAnchor={index % 2 === 0 ? "start" : "end"}
                    fill="red"
                    fontSize="14"
                  >
                    {`P${index + 1} = ${load.magnitude.toFixed(
                      decimalPlaces
                    )} ${units === "SI" ? "kN" : "kip"}`}
                  </text>
                </g>
              )
          )}

        {/* UDLs */}
        {showUdl &&
          udlPositions.map(
            (load, index) =>
              load.magnitude > 0 &&
              load.end > load.start && (
                <g key={`udl-${index}`}>
                  {/* UDL arrows */}
                  {[...Array(10)].map((_, i) => {
                    const x = load.start + (i * (load.end - load.start)) / 9;
                    if (x >= load.start && x <= load.end) {
                      return (
                        <line
                          key={`udl-arrow-${index}-${i}`}
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
                    x={load.start}
                    y="70"
                    width={load.end - load.start}
                    height="10"
                    fill="none"
                    stroke="blue"
                    strokeWidth="1"
                  />
                  <text
                    x={(load.start + load.end) / 2}
                    y="60"
                    textAnchor="middle"
                    fill="blue"
                    fontSize="14"
                  >
                    {`w${index + 1} = ${load.magnitude.toFixed(1)} ${
                      units === "SI" ? "kN/m" : "kip/ft"
                    }`}
                  </text>
                </g>
              )
          )}

        {/* Triangular Loads */}
        {showTriangular &&
          triangularPositions.map(
            (load, index) =>
              load.magnitude > 0 &&
              load.end > load.start && (
                <g key={`triangular-${index}`}>
                  {/* Triangular load shape */}
                  <polygon
                    points={`${load.start},120 ${load.start},70 ${load.end},70 ${load.end},120`}
                    fill="none"
                    stroke="purple"
                    strokeWidth="2"
                  />
                  {/* Arrows for triangular load */}
                  {[...Array(10)].map((_, i) => {
                    const x = load.start + (i * (load.end - load.start)) / 9;
                    const loadHeight =
                      (load.magnitude * (x - load.start)) /
                      (load.end - load.start);
                    const arrowLength = (loadHeight / load.magnitude) * 50;
                    return (
                      <line
                        key={`tri-arrow-${index}-${i}`}
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
                    x={(load.start + load.end) / 2}
                    y="60"
                    textAnchor="middle"
                    fill="purple"
                    fontSize="14"
                  >
                    {`w${index + 1}_max = ${load.magnitude.toFixed(1)} ${
                      units === "SI" ? "kN/m" : "kip/ft"
                    }`}
                  </text>
                </g>
              )
          )}

        {/* Length label */}
        <text
          x={xStart + beamLength / 2}
          y="150"
          textAnchor="middle"
          fontSize="14"
        >
          L = {Number(L).toFixed(decimalPlaces)} {units === "SI" ? "m" : "ft"}
        </text>

        {/* Arrow marker and hatch pattern */}
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
