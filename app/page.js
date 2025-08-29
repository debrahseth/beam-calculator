"use client";

import React, { useMemo, useState } from "react";
import { Line } from "react-chartjs-2";
import "katex/dist/katex.min.css";
import { BlockMath, InlineMath } from "react-katex";
import BeamDiagram from "./components/BeamDiagram";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
} from "chart.js";

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);

export default function Home() {
  // inputs
  const [L, setL] = useState(6); // m or ft
  const [P, setP] = useState(12); // kN or kip
  const [w, setW] = useState(5); // kN/m or kip/ft
  const [caseType, setCaseType] = useState("simply-supported-point");
  const [a, setA] = useState(3); // position of point load (m or ft)
  const [P2, setP2] = useState(0); // second point load (kN or kip)
  const [a2, setA2] = useState(0); // position of second point load
  const [udlStart, setUdlStart] = useState(0); // UDL start position
  const [udlEnd, setUdlEnd] = useState(0); // UDL end position
  const [triangularLoad, setTriangularLoad] = useState(0); // peak triangular load (kN/m or kip/ft)
  const [units, setUnitsState] = useState("SI"); // SI or Imperial

  const POINTS = 200; // resolution for plots

  const handleUnitChange = (newUnits) => {
    if (newUnits === units) return;

    const isToImperial = units === "SI" && newUnits === "Imperial";
    const isToSI = units === "Imperial" && newUnits === "SI";
    if (!isToImperial && !isToSI) return;

    const factorLength = isToImperial ? 3.28084 : 1 / 3.28084;
    const factorForce = isToImperial ? 0.224809 : 1 / 0.224809;
    const factorDistLoad = isToImperial ? 0.068522 : 1 / 0.068522;

    setL((prev) => Number((prev * factorLength).toFixed(3)));
    setA((prev) => Number((prev * factorLength).toFixed(3)));
    setA2((prev) => Number((prev * factorLength).toFixed(3)));
    setUdlStart((prev) => Number((prev * factorLength).toFixed(3)));
    setUdlEnd((prev) => Number((prev * factorLength).toFixed(3)));
    setP((prev) => Number((prev * factorForce).toFixed(3)));
    setP2((prev) => Number((prev * factorForce).toFixed(3)));
    setW((prev) => Number((prev * factorDistLoad).toFixed(3)));
    setTriangularLoad((prev) => Number((prev * factorDistLoad).toFixed(3)));

    setUnitsState(newUnits);
  };

  const results = useMemo(() => {
    const len = Number(L) || 0;
    const pointLoad = Number(P) || 0;
    const pointLoad2 = Number(P2) || 0;
    const udl = Number(w) || 0;
    const triLoad = Number(triangularLoad) || 0;
    const posA = Number(a) || 0;
    const posA2 = Number(a2) || 0;
    const udlS = Number(udlStart) || 0;
    const udlE = Number(udlEnd) || len;

    // arrays for plotting
    const xs = [];
    const labels = [];
    const shear = [];
    const moment = [];

    for (let i = 0; i <= POINTS; i++) {
      const x = (len * i) / POINTS;
      xs.push(x);
      labels.push(x.toFixed(2));
      let V = 0;
      let M = 0;

      switch (caseType) {
        case "simply-supported-point": {
          // point load at arbitrary position a
          const RA = (pointLoad * (len - posA)) / len;
          const RB = (pointLoad * posA) / len;
          if (x < posA) {
            V = RA;
            M = RA * x;
          } else {
            V = RA - pointLoad;
            M = RB * (len - x);
          }
          break;
        }

        case "simply-supported-multi-point": {
          // multiple point loads at a and a2
          const RA =
            (pointLoad * (len - posA) + pointLoad2 * (len - posA2)) / len;
          const RB = pointLoad + pointLoad2 - RA;
          V = RA;
          M = RA * x;
          if (x > posA) V -= pointLoad;
          if (x > posA2) V -= pointLoad2;
          if (x > posA) M = RA * x - pointLoad * (x - posA);
          if (x > posA2)
            M = RA * x - pointLoad * (x - posA) - pointLoad2 * (x - posA2);
          break;
        }

        case "cantilever-point": {
          V = -pointLoad;
          M = -pointLoad * (len - x);
          break;
        }

        case "simply-supported-udl": {
          const loadLength = udlE - udlS;
          const totalLoad = udl * loadLength;
          const RA = (totalLoad * (len - (udlS + loadLength / 2))) / len;
          const RB = totalLoad - RA;
          const loaded = Math.max(0, Math.min(x - udlS, loadLength));
          V = RA - udl * loaded;
          M =
            RA * x -
            (udl * loaded * loaded) / 2 -
            udl * loaded * (udlS - (udlS + loaded / 2));
          break;
        }

        case "cantilever-udl": {
          const loadLength = udlE - udlS;
          const loadedFromFree = Math.max(
            0,
            Math.min(len - x - udlS, loadLength)
          );
          V = -udl * loadedFromFree;
          M = -(udl * loadedFromFree * loadedFromFree) / 2;
          break;
        }

        case "simply-supported-triangular": {
          const loadLength = udlE - udlS;
          const totalLoad = (triLoad * loadLength) / 2;
          const centroidFromStart = loadLength / 3;
          const RA = (totalLoad * (len - (udlS + centroidFromStart))) / len;
          const RB = totalLoad - RA;
          const loaded = Math.max(0, Math.min(x - udlS, loadLength));
          const wAtEndOfLoaded = triLoad * (loaded / loadLength);
          V = RA - (wAtEndOfLoaded * loaded) / 2;
          M = RA * x - (wAtEndOfLoaded * loaded * loaded) / 3;
          break;
        }

        default:
          break;
      }

      shear.push(Number(V.toFixed(6)));
      moment.push(Number(M.toFixed(6)));
    }

    // Reactions and analytic max values
    let reactionText = "";
    let steps = [];
    let maxShear = 0;
    let maxMoment = 0;
    let equations = { shear: "", moment: "" };

    switch (caseType) {
      case "simply-supported-point": {
        const RA = (pointLoad * (len - posA)) / len;
        const RB = (pointLoad * posA) / len;
        reactionText = `Reactions: RA = ${RA.toFixed(3)} kN, RB = ${RB.toFixed(
          3
        )} kN`;
        steps.push(`Total load = P = ${pointLoad} kN`);
        steps.push(
          `RA = P·(L-a)/L = ${pointLoad}·(${len}-${posA})/${len} = ${RA.toFixed(
            3
          )} kN`
        );
        steps.push(
          `RB = P·a/L = ${pointLoad}·${posA}/${len} = ${RB.toFixed(3)} kN`
        );
        steps.push(`Shear: V(x) = RA for x < a; V(x) = RA - P for x ≥ a`);
        steps.push(`Moment: M(x) = RA·x for x ≤ a; M(x) = RB·(L-x) for x ≥ a`);
        maxShear = Math.max(Math.abs(RA), Math.abs(RA - pointLoad));
        maxMoment = Math.abs(RA * posA);
        equations.shear = `V(x) = \\begin{cases} ${RA.toFixed(
          3
        )} & x < ${posA} \\\\ ${(RA - pointLoad).toFixed(
          3
        )} & x \\geq ${posA} \\end{cases}`;
        equations.moment = `M(x) = \\begin{cases} ${RA.toFixed(
          3
        )} \\cdot x & x \\leq ${posA} \\\\ ${RB.toFixed(
          3
        )} \\cdot (L - x) & x \\geq ${posA} \\end{cases}`;
        break;
      }

      case "simply-supported-multi-point": {
        const RA =
          (pointLoad * (len - posA) + pointLoad2 * (len - posA2)) / len;
        const RB = pointLoad + pointLoad2 - RA;
        reactionText = `Reactions: RA = ${RA.toFixed(3)} kN, RB = ${RB.toFixed(
          3
        )} kN`;
        const ans = pointLoad + pointLoad2;
        steps.push(`Total load = P1 + P2 = ${ans} kN`);
        steps.push(`RA = (P1·(L-a1) + P2·(L-a2))/L = ${RA.toFixed(3)} kN`);
        steps.push(`RB = P1 + P2 - RA = ${RB.toFixed(3)} kN`);
        steps.push(
          `Shear: V(x) = RA for x < min(a1,a2); then subtract loads as passed`
        );
        steps.push(`Moment: M(x) = RA·x - sum of P_i·(x - a_i) for a_i < x`);
        maxShear = Math.max(
          Math.abs(RA),
          Math.abs(RA - pointLoad),
          Math.abs(RA - pointLoad - pointLoad2)
        );
        maxMoment = Math.max(...moment.map(Math.abs));
        equations.shear = `V(x) = RA - \\sum P_i \\ for\\ x > a_i`;
        equations.moment = `M(x) = RA \\cdot x - \\sum P_i \\cdot (x - a_i)\\ for\\ x > a_i`;
        break;
      }

      case "cantilever-point": {
        const reaction = pointLoad;
        const Mfix = -pointLoad * len;
        reactionText = `At fixed support: vertical = ${reaction.toFixed(
          3
        )} kN, moment = ${Mfix.toFixed(3)} kN·m`;
        steps.push(`Point load P = ${pointLoad} kN at free end`);
        steps.push(`Vertical reaction = P = ${pointLoad.toFixed(3)} kN`);
        steps.push(`Fixed-end moment = -P·L = ${Mfix.toFixed(3)} kN·m`);
        steps.push(`Shear: V(x) = -P = ${-pointLoad.toFixed(3)} kN`);
        steps.push(`Moment: M(x) = -P·(L-x)`);
        maxShear = Math.abs(pointLoad);
        maxMoment = Math.abs(pointLoad * len);
        equations.shear = `V(x) = ${-pointLoad.toFixed(3)}`;
        equations.moment = `M(x) = -${pointLoad.toFixed(3)} \\cdot (L - x)`;
        break;
      }

      case "simply-supported-udl": {
        const loadLength = udlE - udlS;
        const totalLoad = udl * loadLength;
        const centroid = udlS + loadLength / 2;
        const RA = (totalLoad * (len - centroid)) / len;
        const RB = totalLoad - RA;
        reactionText = `Reactions: RA = ${RA.toFixed(3)} kN, RB = ${RB.toFixed(
          3
        )} kN`;
        steps.push(
          `Total load = w·(b-a) = ${udl}·${loadLength} = ${totalLoad.toFixed(
            3
          )} kN`
        );
        steps.push(`Centroid at ${centroid.toFixed(3)} from left`);
        steps.push(`RA = W·(L - centroid)/L = ${RA.toFixed(3)} kN`);
        steps.push(`RB = W - RA = ${RB.toFixed(3)} kN`);
        steps.push(`Shear: V(x) = RA - w·(max(0, min(x-a, b-a)))`);
        steps.push(
          `Moment: M(x) = RA·x - w·(max(0, d)·d/2) where d = min(x-a, b-a)`
        );
        maxShear = Math.max(...shear.map(Math.abs));
        maxMoment = Math.max(...moment.map(Math.abs));
        equations.shear = `V(x) = ${RA.toFixed(3)} - ${udl.toFixed(
          3
        )} \\cdot \\max(0, \\min(x-${udlS}, ${loadLength}))`;
        equations.moment = `M(x) = ${RA.toFixed(
          3
        )} \\cdot x - \\frac{${udl.toFixed(
          3
        )} \\cdot [\\max(0, \\min(x-${udlS}, ${loadLength}))]^2}{2}`;
        break;
      }

      case "cantilever-udl": {
        const loadLength = udlE - udlS;
        const totalLoad = udl * loadLength;
        const distanceToCentroid = len - (udlS + loadLength / 2);
        const Mfix = -totalLoad * distanceToCentroid;
        reactionText = `At fixed support: vertical = ${totalLoad.toFixed(
          3
        )} kN (upward), moment = ${Mfix.toFixed(3)} kN·m`;
        steps.push(`Total load = w·(b-a) = ${totalLoad.toFixed(3)} kN`);
        steps.push(`Shear V(x) = -w·max(0, min(L-x - a, b-a))`);
        steps.push(
          `Moment M(x) = -w·[max(0, d)^2 / 2] where d = min(L-x - a, b-a)`
        );
        maxShear = Math.abs(totalLoad);
        maxMoment = Math.abs(Mfix);
        equations.shear = `V(x) = -${udl.toFixed(
          3
        )} \\cdot \\max(0, \\min(L - x - ${udlS}, ${loadLength}))`;
        equations.moment = `M(x) = - \\frac{${udl.toFixed(
          3
        )} \\cdot [\\max(0, \\min(L - x - ${udlS}, ${loadLength}))]^2}{2}`;
        break;
      }

      case "simply-supported-triangular": {
        const loadLength = udlE - udlS;
        const totalLoad = (triLoad * loadLength) / 2;
        const centroidFromStart = loadLength / 3;
        const centroid = udlS + centroidFromStart;
        const RA = (totalLoad * (len - centroid)) / len;
        const RB = totalLoad - RA;
        reactionText = `Reactions: RA = ${RA.toFixed(3)} kN, RB = ${RB.toFixed(
          3
        )} kN`;
        steps.push(`Total load = (w·(b-a))/2 = ${totalLoad.toFixed(3)} kN`);
        steps.push(
          `Centroid at a + (b-a)/3 = ${centroid.toFixed(3)} from left`
        );
        steps.push(`RA = W·(L - centroid)/L = ${RA.toFixed(3)} kN`);
        steps.push(`RB = W - RA = ${RB.toFixed(3)} kN`);
        steps.push(
          `Shear V(x) = RA - (w_at_d · d)/2 where d = max(0, min(x-a, b-a)), w_at_d = w·(d/(b-a))`
        );
        steps.push(`Moment M(x) = RA·x - (w_at_d · d^2)/3`);
        maxShear = Math.max(...shear.map(Math.abs));
        maxMoment = Math.max(...moment.map(Math.abs));
        equations.shear = `V(x) = ${RA.toFixed(3)} - \\frac{${triLoad.toFixed(
          3
        )} \\cdot d /(b-a) \\cdot d}{2},\\ d = \\max(0, \\min(x-${udlS}, ${loadLength}))`;
        equations.moment = `M(x) = ${RA.toFixed(
          3
        )} \\cdot x - \\frac{${triLoad.toFixed(
          3
        )} \\cdot d /(b-a) \\cdot d^2}{3}`;
        break;
      }

      default:
        break;
    }

    return {
      xs,
      labels,
      shear,
      moment,
      reactionText,
      steps,
      maxShear,
      maxMoment,
      len,
      pointLoad,
      pointLoad2,
      udl,
      triLoad,
      posA,
      posA2,
      udlS,
      udlE,
      equations,
    };
  }, [L, P, P2, w, triangularLoad, caseType, a, a2, udlStart, udlEnd, units]);

  // Chart data & options
  const shearData = {
    labels: results.labels,
    datasets: [
      {
        label: `Shear V(x) (${units === "SI" ? "kN" : "kip"})`,
        data: results.shear,
        fill: false,
        borderColor: "rgb(34, 197, 94)",
        tension: 0.1,
        pointRadius: 0,
        borderWidth: 2,
      },
    ],
  };

  const momentData = {
    labels: results.labels,
    datasets: [
      {
        label: `Moment M(x) (${units === "SI" ? "kN·m" : "kip·ft"})`,
        data: results.moment,
        fill: false,
        borderColor: "rgb(59, 130, 246)",
        tension: 0.1,
        pointRadius: 0,
        borderWidth: 2,
      },
    ],
  };

  const commonOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: true },
      title: { display: false },
      tooltip: {
        callbacks: {
          label: (ctx) => `${ctx.dataset.label}: ${ctx.parsed.y} `,
        },
      },
    },
    scales: {
      x: {
        display: true,
        title: { display: true, text: `x (${units === "SI" ? "m" : "ft"})` },
      },
      y: { display: true, title: { display: true, text: "" } },
    },
  };

  const display = (v) => (Number.isFinite(v) ? v.toFixed(3) : "—");

  const showPointLoad = caseType.includes("point");
  const showMultiPoint = caseType === "simply-supported-multi-point";
  const showUdl = caseType.includes("udl");
  const showTriangular = caseType === "simply-supported-triangular";
  const showPositionA =
    caseType === "simply-supported-point" ||
    caseType === "simply-supported-multi-point";
  const showUdlPositions = showUdl || showTriangular;

  return (
    <main className="min-h-screen bg-gradient-to-br from-gray-100 to-gray-200 p-6 flex justify-center">
      <div className="w-full max-w-6xl bg-white rounded-2xl shadow-xl p-8 space-y-8">
        {/* Header */}
        <header className="border-b pb-4 mb-4">
          <h1 className="text-3xl font-bold text-gray-800">
            🏗️ Beam Calculator
          </h1>
          <p className="text-gray-500">
            Compute reactions, shear force & bending moment diagrams with
            step-by-step derivations.
          </p>
        </header>

        {/* Controls */}
        <section className="grid md:grid-cols-4 gap-6">
          <label className="flex flex-col text-sm font-medium text-gray-700">
            Beam length L ({units === "SI" ? "m" : "ft"})
            <input
              type="number"
              step="0.01"
              min="0"
              value={L}
              onChange={(e) => setL(e.target.value)}
              className="mt-2 border rounded-lg px-3 py-2 shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </label>

          {showPointLoad && (
            <label className="flex flex-col text-sm font-medium text-gray-700">
              Point load P ({units === "SI" ? "kN" : "kip"})
              <input
                type="number"
                step="0.01"
                min="0"
                value={P}
                onChange={(e) => setP(e.target.value)}
                className="mt-2 border rounded-lg px-3 py-2 shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </label>
          )}

          {showPositionA && (
            <label className="flex flex-col text-sm font-medium text-gray-700">
              Point load position a ({units === "SI" ? "m" : "ft"})
              <input
                type="number"
                step="0.01"
                min="0"
                max={L}
                value={a}
                onChange={(e) => setA(e.target.value)}
                className="mt-2 border rounded-lg px-3 py-2 shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </label>
          )}

          {showMultiPoint && (
            <label className="flex flex-col text-sm font-medium text-gray-700">
              Second point load P2 ({units === "SI" ? "kN" : "kip"})
              <input
                type="number"
                step="0.01"
                min="0"
                value={P2}
                onChange={(e) => setP2(e.target.value)}
                className="mt-2 border rounded-lg px-3 py-2 shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </label>
          )}

          {showMultiPoint && (
            <label className="flex flex-col text-sm font-medium text-gray-700">
              Second point load position a2 ({units === "SI" ? "m" : "ft"})
              <input
                type="number"
                step="0.01"
                min="0"
                max={L}
                value={a2}
                onChange={(e) => setA2(e.target.value)}
                className="mt-2 border rounded-lg px-3 py-2 shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </label>
          )}

          {showUdl && (
            <label className="flex flex-col text-sm font-medium text-gray-700">
              UDL w ({units === "SI" ? "kN/m" : "kip/ft"})
              <input
                type="number"
                step="0.01"
                min="0"
                value={w}
                onChange={(e) => setW(e.target.value)}
                className="mt-2 border rounded-lg px-3 py-2 shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </label>
          )}

          {showUdlPositions && (
            <label className="flex flex-col text-sm font-medium text-gray-700">
              UDL start ({units === "SI" ? "m" : "ft"})
              <input
                type="number"
                step="0.01"
                min="0"
                max={L}
                value={udlStart}
                onChange={(e) => setUdlStart(e.target.value)}
                className="mt-2 border rounded-lg px-3 py-2 shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </label>
          )}

          {showUdlPositions && (
            <label className="flex flex-col text-sm font-medium text-gray-700">
              UDL end ({units === "SI" ? "m" : "ft"})
              <input
                type="number"
                step="0.01"
                min={udlStart}
                max={L}
                value={udlEnd}
                onChange={(e) => setUdlEnd(e.target.value)}
                className="mt-2 border rounded-lg px-3 py-2 shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </label>
          )}

          {showTriangular && (
            <label className="flex flex-col text-sm font-medium text-gray-700">
              Triangular load peak ({units === "SI" ? "kN/m" : "kip/ft"})
              <input
                type="number"
                step="0.01"
                min="0"
                value={triangularLoad}
                onChange={(e) => setTriangularLoad(e.target.value)}
                className="mt-2 border rounded-lg px-3 py-2 shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </label>
          )}

          <label className="flex flex-col text-sm font-medium text-gray-700">
            Units
            <select
              value={units}
              onChange={(e) => handleUnitChange(e.target.value)}
              className="mt-2 border rounded-lg px-3 py-2 shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="SI">SI (kN, m)</option>
              <option value="Imperial">Imperial (kip, ft)</option>
            </select>
          </label>

          <label className="flex flex-col text-sm font-medium text-gray-700">
            Load case
            <select
              value={caseType}
              onChange={(e) => setCaseType(e.target.value)}
              className="mt-2 border rounded-lg px-3 py-2 shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="simply-supported-point">
                Simply supported — point load
              </option>
              <option value="simply-supported-multi-point">
                Simply supported — multiple points
              </option>
              <option value="cantilever-point">
                Cantilever — point (free end)
              </option>
              <option value="simply-supported-udl">
                Simply supported — partial UDL
              </option>
              <option value="cantilever-udl">Cantilever — partial UDL</option>
              <option value="simply-supported-triangular">
                Simply supported — triangular
              </option>
            </select>
          </label>
        </section>

        {/* Results summary */}
        <section className="grid md:grid-cols-3 gap-6">
          <div className="p-6 bg-green-50 border border-green-200 rounded-xl shadow-sm">
            <div className="text-sm text-green-700">Max |Shear|</div>
            <div className="text-2xl font-bold text-green-800 mt-1">
              {display(results.maxShear)} {units === "SI" ? "kN" : "kip"}
            </div>
          </div>
          <div className="p-6 bg-blue-50 border border-blue-200 rounded-xl shadow-sm">
            <div className="text-sm text-blue-700">Max |Moment|</div>
            <div className="text-2xl font-bold text-blue-800 mt-1">
              {display(results.maxMoment)} {units === "SI" ? "kN·m" : "kip·ft"}
            </div>
          </div>
          <div className="p-6 bg-yellow-50 border border-yellow-200 rounded-xl shadow-sm">
            <div className="text-sm text-yellow-700">
              Support reactions / fixed end
            </div>
            <div className="text-sm mt-2 whitespace-pre-line text-yellow-900">
              {results.reactionText}
            </div>
          </div>
        </section>

        {/* Step-by-step & Equations & Notes */}
        <section className="grid md:grid-cols-2 gap-6">
          {/* Step-by-step equations */}
          <div className="p-6 bg-gray-50 border rounded-xl shadow-inner">
            <h3 className="font-semibold mb-3 text-gray-800">
              Step-by-step Solution
            </h3>
            <div className="max-h-60 overflow-y-auto pr-2 space-y-4">
              {results.steps.map((s, i) => (
                <details key={i} className="border-b pb-2">
                  <summary className="cursor-pointer text-sm font-medium text-gray-700">
                    Step {i + 1}
                  </summary>
                  <div className="mt-2 text-sm text-gray-700">
                    <BlockMath>{s}</BlockMath>
                  </div>
                </details>
              ))}
            </div>
            <h3 className="font-semibold mt-4 mb-3 text-gray-800">Equations</h3>
            <div className="text-sm text-gray-700">
              <BlockMath>{results.equations.shear}</BlockMath>
              <BlockMath>{results.equations.moment}</BlockMath>
            </div>
          </div>

          {/* Notes */}
          <div className="p-6 bg-white border rounded-xl shadow-inner">
            <h3 className="font-semibold mb-3 text-gray-800">Notes & Units</h3>
            <p className="text-sm text-gray-600 leading-relaxed">
              Units: <strong>L</strong> in{" "}
              {units === "SI" ? "meters (m)" : "feet (ft)"}, <strong>P</strong>{" "}
              in {units === "SI" ? "kilonewtons (kN)" : "kip"},
              <strong>w</strong> in {units === "SI" ? "kN/m" : "kip/ft"}.
              <br />
              Results: shear in {units === "SI" ? "kN" : "kip"}, moment in{" "}
              {units === "SI" ? "kN·m" : "kip·ft"}.
              <br />
              Triangular loads peak at the specified value, linearly varying
              from zero.
            </p>
          </div>
        </section>

        {/* Charts */}
        <section>
          <h3 className="font-semibold text-gray-800 mb-2">Beam Setup</h3>
          <BeamDiagram
            caseType={caseType}
            L={L}
            P={P}
            w={w}
            a={a}
            P2={P2}
            a2={a2}
            udlStart={udlStart}
            udlEnd={udlEnd}
            triangularLoad={triangularLoad}
            units={units}
          />
        </section>
        <section className="grid lg:grid-cols-2 gap-6">
          <div className="bg-white border rounded-xl p-6 shadow-sm">
            <h4 className="font-medium mb-3 text-gray-800">
              Shear Force Diagram-SFD (V(x))
            </h4>
            <div style={{ height: 320 }}>
              <Line data={shearData} options={commonOptions} />
            </div>
          </div>
          <div className="bg-white border rounded-xl p-6 shadow-sm">
            <h4 className="font-medium mb-3 text-gray-800">
              Bending Moment Diagram-BMD (M(x))
            </h4>
            <div style={{ height: 320 }}>
              <Line data={momentData} options={commonOptions} />
            </div>
          </div>
        </section>

        {/* Footer */}
        <footer className="text-xs text-gray-500 border-t pt-4">
          Tip: try L=6 {units === "SI" ? "m" : "ft"}, P=12{" "}
          {units === "SI" ? "kN" : "kip"}, w=5{" "}
          {units === "SI" ? "kN/m" : "kip/ft"}. Built with Next.js + Tailwind +
          Chart.js 🎉
        </footer>
      </div>
    </main>
  );
}
