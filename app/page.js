"use client";

import React, { useMemo, useState, useEffect } from "react";
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
  const [L, setL] = useState(0); // m or ft
  const [P, setP] = useState(0); // kN or kip
  const [w, setW] = useState(0); // kN/m or kip/ft
  const [caseType, setCaseType] = useState("simply-supported-point");
  const [a, setA] = useState(0); // position of point load (m or ft)
  const [P2, setP2] = useState(0); // second point load (kN or kip)
  const [a2, setA2] = useState(0); // position of second point load
  const [udlStart, setUdlStart] = useState(0); // UDL start position
  const [udlEnd, setUdlEnd] = useState(0); // UDL end position
  const [triangularLoad, setTriangularLoad] = useState(0); // peak triangular load (kN/m or kip/ft)
  const [units, setUnitsState] = useState("SI"); // SI or Imperial
  const [supportLeft, setSupportLeft] = useState(0);
  const [supportRight, setSupportRight] = useState(0);

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
    setSupportLeft((prev) => Number((prev * factorLength).toFixed(3)));
    setSupportRight((prev) => Number((prev * factorLength).toFixed(3)));
    setP((prev) => Number((prev * factorForce).toFixed(3)));
    setP2((prev) => Number((prev * factorForce).toFixed(3)));
    setW((prev) => Number((prev * factorDistLoad).toFixed(3)));
    setTriangularLoad((prev) => Number((prev * factorDistLoad).toFixed(3)));

    setUnitsState(newUnits);
  };

  useEffect(() => {
    if (supportLeft > L) setSupportLeft(L);
    if (supportRight > L) setSupportRight(L);
  }, [L]);

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
    let posS1 = Number(supportLeft) || 0;
    let posS2 = Number(supportRight) || len;
    if (posS1 > posS2) [posS1, posS2] = [posS2, posS1];

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

      const isSimplySupported = caseType.startsWith("simply-supported");

      let RA = 0;
      let RB = 0;
      let Mfix = 0;

      if (isSimplySupported) {
        let total_load = 0;
        let moment_about_S1 = 0;
        let load_len = udlE - udlS;

        switch (caseType) {
          case "simply-supported-point":
            total_load = pointLoad;
            moment_about_S1 = pointLoad * (posA - posS1);
            break;
          case "simply-supported-multi-point":
            total_load = pointLoad + pointLoad2;
            moment_about_S1 =
              pointLoad * (posA - posS1) + pointLoad2 * (posA2 - posS1);
            break;
          case "simply-supported-udl":
            total_load = udl * load_len;
            let cent_udl = udlS + load_len / 2;
            moment_about_S1 = total_load * (cent_udl - posS1);
            break;
          case "simply-supported-triangular":
            total_load = (triLoad * load_len) / 2;
            let cent_tri = udlS + load_len / 3;
            moment_about_S1 = total_load * (cent_tri - posS1);
            break;
        }

        let span = posS2 - posS1;
        RB = span > 0 ? moment_about_S1 / span : 0;
        RA = total_load - RB;

        if (posS1 < x) {
          V += RA;
          M += RA * (x - posS1);
        }
        if (posS2 < x) {
          V += RB;
          M += RB * (x - posS2);
        }

        let length_left = 0;
        let total_left = 0;
        let dist_cent = 0;
        let k = 0;

        switch (caseType) {
          case "simply-supported-point":
            if (posA < x) {
              V -= pointLoad;
              M -= pointLoad * (x - posA);
            }
            break;
          case "simply-supported-multi-point":
            if (posA < x) {
              V -= pointLoad;
              M -= pointLoad * (x - posA);
            }
            if (posA2 < x) {
              V -= pointLoad2;
              M -= pointLoad2 * (x - posA2);
            }
            break;
          case "simply-supported-udl":
            length_left = Math.max(0, Math.min(x - udlS, load_len));
            total_left = udl * length_left;
            dist_cent = length_left / 2;
            V -= total_left;
            M -= total_left * dist_cent;
            break;
          case "simply-supported-triangular":
            length_left = Math.max(0, Math.min(x - udlS, load_len));
            k = triLoad / load_len;
            total_left = (k * length_left * length_left) / 2;
            dist_cent = length_left / 3;
            V -= total_left;
            M -= total_left * dist_cent;
            break;
        }
      } else {
        // cantilever cases
        posS1 = 0;
        switch (caseType) {
          case "cantilever-point":
            RA = pointLoad;
            Mfix = -pointLoad * (posA - posS1);
            if (posS1 < x) {
              V += RA;
              M += RA * (x - posS1) + Mfix;
            }
            if (posA < x) {
              V -= pointLoad;
              M -= pointLoad * (x - posA);
            }
            break;
          case "cantilever-udl":
            let length_right = Math.max(0, udlE - Math.max(udlS, x));
            let total_right = udl * length_right;
            RA = total_right;
            let load_len_c = udlE - udlS;
            let cent_right = len - (udlS + load_len_c / 2);
            Mfix = -(udl * load_len_c) * cent_right;
            if (posS1 < x) {
              V += RA;
              M += RA * (x - posS1) + Mfix;
            }
            let length_left_c = Math.max(0, Math.min(x - udlS, load_len_c));
            const total_left = udl * length_left_c;
            const dist_cent = length_left_c / 2;
            V -= total_left;
            M -= total_left * dist_cent;
            break;
        }
        V = -V;
      }

      shear.push(Number(V.toFixed(6)));
      moment.push(Number(M.toFixed(6)));
    }

    // Reactions and analytic max values
    let reactionText = "";
    let steps = [];
    let equations = { shear: "", moment: "" };

    const isSimplySupported = caseType.startsWith("simply-supported");

    let RA = 0;
    let RB = 0;
    let Mfix = 0;
    let total_load = 0;
    let moment_about_S1 = 0;
    let load_len = udlE - udlS;

    if (isSimplySupported) {
      switch (caseType) {
        case "simply-supported-point":
          total_load = pointLoad;
          moment_about_S1 = pointLoad * (posA - posS1);
          break;
        case "simply-supported-multi-point":
          total_load = pointLoad + pointLoad2;
          moment_about_S1 =
            pointLoad * (posA - posS1) + pointLoad2 * (posA2 - posS1);
          break;
        case "simply-supported-udl":
          total_load = udl * load_len;
          let cent_udl = udlS + load_len / 2;
          moment_about_S1 = total_load * (cent_udl - posS1);
          break;
        case "simply-supported-triangular":
          total_load = (triLoad * load_len) / 2;
          let cent_tri = udlS + load_len / 3;
          moment_about_S1 = total_load * (cent_tri - posS1);
          break;
      }

      let span = posS2 - posS1;
      RB = span > 0 ? moment_about_S1 / span : 0;
      RA = total_load - RB;

      reactionText = `Reactions: RA at ${posS1.toFixed(2)} = ${RA.toFixed(
        3
      )} kN, RB at ${posS2.toFixed(3)} = ${RB.toFixed(3)} kN`;

      steps.push(`Supports at x=${posS1.toFixed(2)}, x=${posS2.toFixed(2)}`);
      steps.push(`Total load = ${total_load.toFixed(3)} kN`);
      steps.push(`Moment about RA: ${moment_about_S1.toFixed(3)} kN·m`);
      steps.push(
        `RB = moment / span = ${moment_about_S1.toFixed(3)} / ${span.toFixed(
          2
        )} = ${RB.toFixed(3)} kN`
      );
      steps.push(`RA = total - RB = ${RA.toFixed(3)} kN`);
      steps.push(`Shear and moment calculated by section method.`);
    } else {
      // cantilever
      switch (caseType) {
        case "cantilever-point":
          RA = pointLoad;
          Mfix = -pointLoad * (posA - posS1);
          reactionText = `At fixed support: vertical = ${RA.toFixed(
            3
          )} kN, moment = ${Mfix.toFixed(3)} kN·m`;
          steps.push(`Point load at x=${posA.toFixed(2)}`);
          steps.push(`RA = ${RA.toFixed(3)} kN`);
          steps.push(`Mfix = ${Mfix.toFixed(3)} kN·m`);
          break;
        case "cantilever-udl":
          load_len = udlE - udlS;
          total_load = udl * load_len;
          let cent = udlS + load_len / 2;
          Mfix = -total_load * (cent - posS1);
          RA = total_load;
          reactionText = `At fixed support: vertical = ${RA.toFixed(
            3
          )} kN, moment = ${Mfix.toFixed(3)} kN·m`;
          steps.push(`UDL from ${udlS.toFixed(2)} to ${udlE.toFixed(2)}`);
          steps.push(`Total load = ${total_load.toFixed(3)} kN`);
          steps.push(`RA = ${RA.toFixed(3)} kN`);
          steps.push(`Mfix = ${Mfix.toFixed(3)} kN·m`);
          break;
      }
    }

    const maxShear = shear.reduce((max, v) => Math.max(max, Math.abs(v)), 0);
    const maxMoment = moment.reduce((max, v) => Math.max(max, Math.abs(v)), 0);

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
  }, [
    L,
    P,
    P2,
    w,
    triangularLoad,
    caseType,
    a,
    a2,
    udlStart,
    udlEnd,
    units,
    supportLeft,
    supportRight,
  ]);

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
    caseType === "simply-supported-multi-point" ||
    caseType === "cantilever-point";
  const showUdlPositions = showUdl || showTriangular;
  const showSupports = caseType.startsWith("simply-supported");

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

          {showSupports && (
            <label className="flex flex-col text-sm font-medium text-gray-700">
              Left support position ({units === "SI" ? "m" : "ft"})
              <input
                type="number"
                step="0.01"
                min="0"
                max={L}
                value={supportLeft}
                onChange={(e) => setSupportLeft(e.target.value)}
                className="mt-2 border rounded-lg px-3 py-2 shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </label>
          )}

          {showSupports && (
            <label className="flex flex-col text-sm font-medium text-gray-700">
              Right support position ({units === "SI" ? "m" : "ft"})
              <input
                type="number"
                step="0.01"
                min={supportLeft}
                max={L}
                value={supportRight}
                onChange={(e) => setSupportRight(e.target.value)}
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
              <option value="cantilever-point">Cantilever — point load</option>
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
              <br />
              Supports can be moved using inputs or by dragging in the diagram.
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
            supportLeft={supportLeft}
            supportRight={supportRight}
            setSupportLeft={setSupportLeft}
            setSupportRight={setSupportRight}
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
