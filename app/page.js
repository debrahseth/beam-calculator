"use client";

import React, { useMemo, useState, useEffect } from "react";
import { Line } from "react-chartjs-2";
import "katex/dist/katex.min.css";
import { BlockMath } from "react-katex";
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
  const [L, setL] = useState(0); // m or ft
  const [pointLoads, setPointLoads] = useState([{ magnitude: 0, position: 0 }]); // kN or kip
  const [udlLoads, setUdlLoads] = useState([
    { magnitude: 0, start: 0, end: 0 },
  ]);
  const [triangularLoads, setTriangularLoads] = useState([
    { magnitude: 0, start: 0, end: 0 },
  ]);
  const [caseType, setCaseType] = useState("combined");
  const [beamType, setBeamType] = useState("simply-supported");
  const [loadTypes, setLoadTypes] = useState({
    point: false,
    multiPoint: false,
    udl: false,
    multiUdl: false,
    triangular: false,
    multiTriangular: false,
  });
  const [units, setUnitsState] = useState("SI"); // SI or Imperial
  const [supportLeft, setSupportLeft] = useState(0);
  const [supportRight, setSupportRight] = useState(0);
  const [isManualOpen, setIsManualOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [decimalPlaces, setDecimalPlaces] = useState(2); // default 2 decimals
  const resetAll = () => {
    setL(0);
    setPointLoads([{ magnitude: 0, position: 0 }]);
    setUdlLoads([{ magnitude: 0, start: 0, end: 0 }]);
    setTriangularLoads([{ magnitude: 0, start: 0, end: 0 }]);
    setCaseType("combined");
    setBeamType("simply-supported");
    setLoadTypes({
      point: false,
      multiPoint: false,
      udl: false,
      multiUdl: false,
      triangular: false,
      multiTriangular: false,
    });
    setUnitsState("SI");
    setSupportLeft(0);
    setSupportRight(L);
    setIsManualOpen(false);
  };

  const POINTS = 10000;

  const handleUnitChange = (newUnits) => {
    if (newUnits === units) return;

    const isToImperial = units === "SI" && newUnits === "Imperial";
    const isToSI = units === "Imperial" && newUnits === "SI";
    if (!isToImperial && !isToSI) return;

    const factorLength = isToImperial ? 3.28084 : 1 / 3.28084;
    const factorForce = isToImperial ? 0.224809 : 1 / 0.224809;
    const factorDistLoad = isToImperial ? 0.068522 : 1 / 0.068522;

    setL((prev) => Number((prev * factorLength).toFixed(decimalPlaces)));
    setPointLoads((prev) =>
      prev.map((load) => ({
        magnitude: Number(
          (load.magnitude * factorForce).toFixed(decimalPlaces)
        ),
        position: Number((load.position * factorLength).toFixed(decimalPlaces)),
      }))
    );
    setUdlLoads((prev) =>
      prev.map((load) => ({
        magnitude: Number(
          (load.magnitude * factorDistLoad).toFixed(decimalPlaces)
        ),
        start: Number((load.start * factorLength).toFixed(decimalPlaces)),
        end: Number((load.end * factorLength).toFixed(decimalPlaces)),
      }))
    );
    setTriangularLoads((prev) =>
      prev.map((load) => ({
        magnitude: Number(
          (load.magnitude * factorDistLoad).toFixed(decimalPlaces)
        ),
        start: Number((load.start * factorLength).toFixed(decimalPlaces)),
        end: Number((load.end * factorLength).toFixed(decimalPlaces)),
      }))
    );
    setSupportLeft((prev) =>
      Number((prev * factorLength).toFixed(decimalPlaces))
    );
    setSupportRight((prev) =>
      Number((prev * factorLength).toFixed(decimalPlaces))
    );

    setUnitsState(newUnits);
  };

  const addPointLoad = () => {
    setPointLoads([...pointLoads, { magnitude: 0, position: 0 }]);
  };

  const removePointLoad = (index) => {
    if (pointLoads.length > 1) {
      setPointLoads(pointLoads.filter((_, i) => i !== index));
    }
  };

  const updatePointLoad = (index, field, value) => {
    setPointLoads((prev) =>
      prev.map((load, i) =>
        i === index ? { ...load, [field]: Number(value) } : load
      )
    );
  };

  const addUdlLoad = () => {
    setUdlLoads([...udlLoads, { magnitude: 0, start: 0, end: 0 }]);
  };

  const removeUdlLoad = (index) => {
    if (udlLoads.length > 1) {
      setUdlLoads(udlLoads.filter((_, i) => i !== index));
    }
  };

  const updateUdlLoad = (index, field, value) => {
    setUdlLoads((prev) =>
      prev.map((load, i) =>
        i === index ? { ...load, [field]: Number(value) } : load
      )
    );
  };

  const addTriangularLoad = () => {
    setTriangularLoads([
      ...triangularLoads,
      { magnitude: 0, start: 0, end: 0 },
    ]);
  };

  const removeTriangularLoad = (index) => {
    if (triangularLoads.length > 1) {
      setTriangularLoads(triangularLoads.filter((_, i) => i !== index));
    }
  };

  const updateTriangularLoad = (index, field, value) => {
    setTriangularLoads((prev) =>
      prev.map((load, i) =>
        i === index ? { ...load, [field]: Number(value) } : load
      )
    );
  };

  useEffect(() => {
    if (supportLeft > L) setSupportLeft(L);
    if (supportRight > L) setSupportRight(L);
    if (caseType !== "combined") {
      setLoadTypes({
        point: caseType.includes("point") && !caseType.includes("multi-point"),
        multiPoint: caseType.includes("multi-point"),
        udl: caseType.includes("udl"),
        multiUdl: false,
        triangular: caseType.includes("triangular"),
        multiTriangular: false,
      });
      if (caseType === "cantilever-point") {
        setPointLoads([{ magnitude: 0, position: 0 }]);
      }
      if (
        caseType === "simply-supported-udl" ||
        caseType === "cantilever-udl"
      ) {
        setUdlLoads([{ magnitude: 0, start: 0, end: 0 }]);
      }
      if (caseType === "simply-supported-triangular") {
        setTriangularLoads([{ magnitude: 0, start: 0, end: 0 }]);
      }
    }
  }, [L, caseType]);

  const results = useMemo(() => {
    const len = Number(L) || 0;
    let posS1 = Number(supportLeft) || 0;
    let posS2 = Number(supportRight) || len;
    if (posS1 > posS2) [posS1, posS2] = [posS2, posS1];

    const xs = [];
    const labels = [];
    const shear = [];
    const moment = [];

    for (let i = 0; i <= POINTS; i++) {
      const x = (len * i) / POINTS;
      xs.push(x);
      labels.push(x.toFixed(decimalPlaces));
      let V = 0;
      let M = 0;

      const isSimplySupported =
        caseType.startsWith("simply-supported") ||
        (caseType === "combined" && beamType === "simply-supported");

      let RA = 0;
      let RB = 0;
      let Mfix = 0;

      if (isSimplySupported) {
        let total_load = 0;
        let moment_about_S1 = 0;

        if (caseType === "combined") {
          if (loadTypes.point || loadTypes.multiPoint) {
            total_load += pointLoads.reduce(
              (sum, load) => sum + (Number(load.magnitude) || 0),
              0
            );
            moment_about_S1 += pointLoads.reduce(
              (sum, load) =>
                sum +
                (Number(load.magnitude) || 0) *
                  ((Number(load.position) || 0) - posS1),
              0
            );
          }
          if (loadTypes.udl || loadTypes.multiUdl) {
            udlLoads.forEach((load) => {
              const mag = Number(load.magnitude) || 0;
              const start = Number(load.start) || 0;
              const end = Number(load.end) || len;
              const load_len = end - start;
              if (load_len > 0) {
                total_load += mag * load_len;
                const cent_udl = start + load_len / 2;
                moment_about_S1 += mag * load_len * (cent_udl - posS1);
              }
            });
          }
          if (loadTypes.triangular || loadTypes.multiTriangular) {
            triangularLoads.forEach((load) => {
              const mag = Number(load.magnitude) || 0;
              const start = Number(load.start) || 0;
              const end = Number(load.end) || len;
              const load_len = end - start;
              if (load_len > 0) {
                total_load += (mag * load_len) / 2;
                const cent_tri = start + (2 * load_len) / 3; // Centroid at 2/3 from start
                moment_about_S1 += ((mag * load_len) / 2) * (cent_tri - posS1);
              }
            });
          }
        } else {
          switch (caseType) {
            case "simply-supported-point":
            case "simply-supported-multi-point":
              total_load = pointLoads.reduce(
                (sum, load) => sum + (Number(load.magnitude) || 0),
                0
              );
              moment_about_S1 = pointLoads.reduce(
                (sum, load) =>
                  sum +
                  (Number(load.magnitude) || 0) *
                    ((Number(load.position) || 0) - posS1),
                0
              );
              break;
            case "simply-supported-udl":
              const udl = Number(udlLoads[0]?.magnitude) || 0;
              const udlS = Number(udlLoads[0]?.start) || 0;
              const udlE = Number(udlLoads[0]?.end) || len;
              const load_len = udlE - udlS;
              total_load = udl * load_len;
              const cent_udl = udlS + load_len / 2;
              moment_about_S1 = total_load * (cent_udl - posS1);
              break;
            case "simply-supported-triangular":
              const triLoad = Number(triangularLoads[0]?.magnitude) || 0;
              const triStart = Number(triangularLoads[0]?.start) || 0;
              const triEnd = Number(triangularLoads[0]?.end) || len;
              const load_len_1 = triEnd - triStart;
              total_load = (triLoad * load_len_1) / 2;
              const cent_tri = triStart + (2 * load_len_1) / 3;
              moment_about_S1 = total_load * (cent_tri - posS1);
              break;
          }
        }

        const span = posS2 - posS1;
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

        if (caseType === "combined") {
          if (loadTypes.point || loadTypes.multiPoint) {
            pointLoads.forEach((load) => {
              const pos = Number(load.position) || 0;
              const mag = Number(load.magnitude) || 0;
              if (pos < x) {
                V -= mag;
                M -= mag * (x - pos);
              }
            });
          }
          if (loadTypes.udl || loadTypes.multiUdl) {
            udlLoads.forEach((load) => {
              const mag = Number(load.magnitude) || 0;
              const start = Number(load.start) || 0;
              const end = Number(load.end) || len;
              const length_left = Math.max(0, Math.min(x - start, end - start));
              const total_left = mag * length_left;
              const dist_cent = length_left / 2;
              V -= total_left;
              M -= total_left * dist_cent;
            });
          }
          if (loadTypes.triangular || loadTypes.multiTriangular) {
            triangularLoads.forEach((load) => {
              const mag = Number(load.magnitude) || 0;
              const start = Number(load.start) || 0;
              const end = Number(load.end) || len;
              const load_len = end - start;
              const length_left = Math.max(0, Math.min(x - start, load_len));
              const k = load_len > 0 ? mag / load_len : 0;
              const total_left = (k * length_left * length_left) / 2;
              const dist_cent = length_left / 3;
              V -= total_left;
              M -= total_left * dist_cent;
            });
          }
        } else {
          switch (caseType) {
            case "simply-supported-point":
            case "simply-supported-multi-point":
              pointLoads.forEach((load) => {
                const pos = Number(load.position) || 0;
                const mag = Number(load.magnitude) || 0;
                if (pos < x) {
                  V -= mag;
                  M -= mag * (x - pos);
                }
              });
              break;
            case "simply-supported-udl":
              const udl = Number(udlLoads[0]?.magnitude) || 0;
              const udlS = Number(udlLoads[0]?.start) || 0;
              const udlE = Number(udlLoads[0]?.end) || len;
              const length_left = Math.max(0, Math.min(x - udlS, udlE - udlS));
              const total_left = udl * length_left;
              const dist_cent = length_left / 2;
              V -= total_left;
              M -= total_left * dist_cent;
              break;
            case "simply-supported-triangular":
              const triLoad = Number(triangularLoads[0]?.magnitude) || 0;
              const triStart = Number(triangularLoads[0]?.start) || 0;
              const triEnd = Number(triangularLoads[0]?.end) || len;
              const load_len = triEnd - triStart;
              const length_left_1 = Math.max(
                0,
                Math.min(x - triStart, load_len)
              );
              const k = load_len > 0 ? triLoad / load_len : 0;
              const total_left_1 = (k * length_left_1 * length_left_1) / 2;
              const dist_cent_1 = length_left_1 / 3;
              V -= total_left_1;
              M -= total_left_1 * dist_cent_1;
              break;
          }
        }
      } else {
        posS1 = 0;
        let total_load = 0;
        let moment_at_fixed = 0;

        if (caseType === "combined") {
          if (loadTypes.point || loadTypes.multiPoint) {
            pointLoads.forEach((load) => {
              const pointLoad = Number(load.magnitude) || 0;
              const posA = Number(load.position) || 0;
              total_load += pointLoad;
              moment_at_fixed += -pointLoad * (posA - posS1);
              if (posS1 < x) {
                V += pointLoad;
                M += pointLoad * (x - posS1) + moment_at_fixed;
              }
              if (posA < x) {
                V -= pointLoad;
                M -= pointLoad * (x - posA);
              }
            });
          }
          if (loadTypes.udl || loadTypes.multiUdl) {
            udlLoads.forEach((load) => {
              const mag = Number(load.magnitude) || 0;
              const start = Number(load.start) || 0;
              const end = Number(load.end) || len;
              const load_len = end - start;
              if (load_len > 0) {
                const total_right = mag * Math.max(0, end - Math.max(start, x));
                total_load += mag * load_len;
                const cent = start + load_len / 2;
                moment_at_fixed += -(mag * load_len) * (cent - posS1);
                if (posS1 < x) {
                  V += total_right;
                  M += total_right * (x - posS1) + moment_at_fixed;
                }
                const length_left = Math.max(0, Math.min(x - start, load_len));
                const total_left = mag * length_left;
                const dist_cent = length_left / 2;
                V -= total_left;
                M -= total_left * dist_cent;
              }
            });
          }
          if (loadTypes.triangular || loadTypes.multiTriangular) {
            triangularLoads.forEach((load) => {
              const mag = Number(load.magnitude) || 0;
              const start = Number(load.start) || 0;
              const end = Number(load.end) || len;
              const load_len = end - start;
              if (load_len > 0) {
                const k = mag / load_len;
                const total_right =
                  (k * Math.max(0, end - Math.max(start, x)) ** 2) / 2;
                total_load += (mag * load_len) / 2;
                const cent_tri = start + (2 * load_len) / 3;
                moment_at_fixed += -((mag * load_len) / 2) * (cent_tri - posS1);
                if (posS1 < x) {
                  V += total_right;
                  M += total_right * (x - posS1) + moment_at_fixed;
                }
                const length_left = Math.max(0, Math.min(x - start, load_len));
                const total_left = (k * length_left * length_left) / 2;
                const dist_cent = length_left / 3;
                V -= total_left;
                M -= total_left * dist_cent;
              }
            });
          }

          RA = total_load;
          Mfix = moment_at_fixed;
          V = -V;
        } else {
          switch (caseType) {
            case "cantilever-point":
              const pointLoad = Number(pointLoads[0]?.magnitude) || 0;
              const posA = Number(pointLoads[0]?.position) || 0;
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
              const udl = Number(udlLoads[0]?.magnitude) || 0;
              const udlS = Number(udlLoads[0]?.start) || 0;
              const udlE = Number(udlLoads[0]?.end) || len;
              const load_len = udlE - udlS;
              const total_right = udl * Math.max(0, udlE - Math.max(udlS, x));
              RA = udl * load_len;
              const cent = udlS + load_len / 2;
              Mfix = -(udl * load_len) * (cent - posS1);
              if (posS1 < x) {
                V += total_right;
                M += total_right * (x - posS1) + Mfix;
              }
              const length_left = Math.max(0, Math.min(x - udlS, load_len));
              const total_left = udl * length_left;
              const dist_cent = length_left / 2;
              V -= total_left;
              M -= total_left * dist_cent;
              break;
          }
          V = -V;
        }
      }

      shear.push(Number(V.toFixed(6)));
      moment.push(Number(M.toFixed(6)));
    }

    let reactionText = "";
    let steps = [];
    let equations = { shear: "", moment: "" };

    const isSimplySupported =
      caseType.startsWith("simply-supported") ||
      (caseType === "combined" && beamType === "simply-supported");

    let RA = 0;
    let RB = 0;
    let Mfix = 0;
    let total_load = 0;
    let moment_about_S1 = 0;

    if (isSimplySupported) {
      if (caseType === "combined") {
        if (loadTypes.point || loadTypes.multiPoint) {
          total_load += pointLoads.reduce(
            (sum, load) => sum + (Number(load.magnitude) || 0),
            0
          );
          moment_about_S1 += pointLoads.reduce(
            (sum, load) =>
              sum +
              (Number(load.magnitude) || 0) *
                ((Number(load.position) || 0) - posS1),
            0
          );
        }
        if (loadTypes.udl || loadTypes.multiUdl) {
          udlLoads.forEach((load) => {
            const mag = Number(load.magnitude) || 0;
            const start = Number(load.start) || 0;
            const end = Number(load.end) || len;
            const load_len = end - start;
            if (load_len > 0) {
              total_load += mag * load_len;
              const cent_udl = start + load_len / 2;
              moment_about_S1 += mag * load_len * (cent_udl - posS1);
            }
          });
        }
        if (loadTypes.triangular || loadTypes.multiTriangular) {
          triangularLoads.forEach((load) => {
            const mag = Number(load.magnitude) || 0;
            const start = Number(load.start) || 0;
            const end = Number(load.end) || len;
            const load_len = end - start;
            if (load_len > 0) {
              total_load += (mag * load_len) / 2;
              const cent_tri = start + (2 * load_len) / 3;
              moment_about_S1 += ((mag * load_len) / 2) * (cent_tri - posS1);
            }
          });
        }
      } else {
        switch (caseType) {
          case "simply-supported-point":
          case "simply-supported-multi-point":
            total_load = pointLoads.reduce(
              (sum, load) => sum + (Number(load.magnitude) || 0),
              0
            );
            moment_about_S1 = pointLoads.reduce(
              (sum, load) =>
                sum +
                (Number(load.magnitude) || 0) *
                  ((Number(load.position) || 0) - posS1),
              0
            );
            break;
          case "simply-supported-udl":
            const udl = Number(udlLoads[0]?.magnitude) || 0;
            const udlS = Number(udlLoads[0]?.start) || 0;
            const udlE = Number(udlLoads[0]?.end) || len;
            const load_len = udlE - udlS;
            total_load = udl * load_len;
            const cent_udl = udlS + load_len / 2;
            moment_about_S1 = total_load * (cent_udl - posS1);
            break;
          case "simply-supported-triangular":
            const triLoad = Number(triangularLoads[0]?.magnitude) || 0;
            const triStart = Number(triangularLoads[0]?.start) || 0;
            const triEnd = Number(triangularLoads[0]?.end) || len;
            const load_len_1 = triEnd - triStart;
            total_load = (triLoad * load_len_1) / 2;
            const cent_tri = triStart + (2 * load_len_1) / 3;
            moment_about_S1 = total_load * (cent_tri - posS1);
            break;
        }
      }

      const span = posS2 - posS1;
      RB = span > 0 ? moment_about_S1 / span : 0;
      RA = total_load - RB;

      reactionText = `Reactions: 
      RA at ${posS1.toFixed(decimalPlaces)} = ${RA.toFixed(decimalPlaces)} kN
      RB at ${posS2.toFixed(decimalPlaces)} = ${RB.toFixed(decimalPlaces)} kN`;

      steps.push(
        `Supports at x=${posS1.toFixed(decimalPlaces)}, x=${posS2.toFixed(
          decimalPlaces
        )}`
      );
      steps.push(`Total load = ${total_load.toFixed(decimalPlaces)} kN`);
      steps.push(
        `Moment about RA: ${moment_about_S1.toFixed(decimalPlaces)} kN·m`
      );
      steps.push(
        `RB = moment / span = ${moment_about_S1.toFixed(
          decimalPlaces
        )} / ${span.toFixed(decimalPlaces)} = ${RB.toFixed(decimalPlaces)} kN`
      );
      steps.push(`RA = total - RB = ${RA.toFixed(decimalPlaces)} kN`);
      steps.push(`Shear and moment calculated by section method.`);
    } else {
      if (caseType === "combined") {
        let total_load = 0;
        let moment_at_fixed = 0;

        if (loadTypes.point || loadTypes.multiPoint) {
          pointLoads.forEach((load) => {
            const pointLoad = Number(load.magnitude) || 0;
            const posA = Number(load.position) || 0;
            total_load += pointLoad;
            moment_at_fixed += -pointLoad * (posA - posS1);
          });
        }
        if (loadTypes.udl || loadTypes.multiUdl) {
          udlLoads.forEach((load) => {
            const mag = Number(load.magnitude) || 0;
            const start = Number(load.start) || 0;
            const end = Number(load.end) || len;
            const load_len = end - start;
            if (load_len > 0) {
              total_load += mag * load_len;
              const cent = start + load_len / 2;
              moment_at_fixed += -(mag * load_len) * (cent - posS1);
            }
          });
        }
        if (loadTypes.triangular || loadTypes.multiTriangular) {
          triangularLoads.forEach((load) => {
            const mag = Number(load.magnitude) || 0;
            const start = Number(load.start) || 0;
            const end = Number(load.end) || len;
            const load_len = end - start;
            if (load_len > 0) {
              total_load += (mag * load_len) / 2;
              const cent_tri = start + (2 * load_len) / 3;
              moment_at_fixed += -((mag * load_len) / 2) * (cent_tri - posS1);
            }
          });
        }

        RA = total_load;
        Mfix = moment_at_fixed;

        reactionText = `At fixed support: vertical = ${RA.toFixed(
          3
        )} kN, moment = ${Mfix.toFixed(decimalPlaces)} kN·m`;
        steps.push(`Cantilever with combined loads`);
        steps.push(`Total load = ${total_load.toFixed(decimalPlaces)} kN`);
        steps.push(`RA = ${RA.toFixed(decimalPlaces)} kN`);
        steps.push(`Mfix = ${Mfix.toFixed(decimalPlaces)} kN·m`);
      } else {
        switch (caseType) {
          case "cantilever-point":
            const pointLoad = Number(pointLoads[0]?.magnitude) || 0;
            const posA = Number(pointLoads[0]?.position) || 0;
            RA = pointLoad;
            Mfix = -pointLoad * (posA - posS1);
            reactionText = `At fixed support: vertical = ${RA.toFixed(
              3
            )} kN, moment = ${Mfix.toFixed(decimalPlaces)} kN·m`;
            steps.push(`Point load at x=${posA.toFixed(decimalPlaces)}`);
            steps.push(`RA = ${RA.toFixed(decimalPlaces)} kN`);
            steps.push(`Mfix = ${Mfix.toFixed(decimalPlaces)} kN·m`);
            break;
          case "cantilever-udl":
            const udl = Number(udlLoads[0]?.magnitude) || 0;
            const udlS = Number(udlLoads[0]?.start) || 0;
            const udlE = Number(udlLoads[0]?.end) || len;
            const load_len = udlE - udlS;
            total_load = udl * load_len;
            const cent = udlS + load_len / 2;
            Mfix = -total_load * (cent - posS1);
            RA = total_load;
            reactionText = `At fixed support: 
            Vertical = ${RA.toFixed(decimalPlaces)} kN
            Moment = ${Mfix.toFixed(decimalPlaces)} kN·m`;
            steps.push(
              `UDL from ${udlS.toFixed(decimalPlaces)} to ${udlE.toFixed(
                decimalPlaces
              )}`
            );
            steps.push(`Total load = ${total_load.toFixed(decimalPlaces)} kN`);
            steps.push(`RA = ${RA.toFixed(decimalPlaces)} kN`);
            steps.push(`Mfix = ${Mfix.toFixed(decimalPlaces)} kN·m`);
            break;
        }
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
      pointLoads,
      udlLoads,
      triangularLoads,
      equations,
      RA,
      RB,
      Mfix,
    };
  }, [
    L,
    pointLoads,
    udlLoads,
    triangularLoads,
    caseType,
    beamType,
    loadTypes,
    units,
    supportLeft,
    supportRight,
  ]);

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

  const display = (v) => (Number.isFinite(v) ? v.toFixed(decimalPlaces) : "—");

  const showPointLoad =
    caseType.includes("point") ||
    (caseType === "combined" && (loadTypes.point || loadTypes.multiPoint));
  const showMultiPoint =
    caseType === "simply-supported-multi-point" ||
    (caseType === "combined" && loadTypes.multiPoint);
  const showUdl =
    caseType.includes("udl") ||
    (caseType === "combined" && (loadTypes.udl || loadTypes.multiUdl));
  const showMultiUdl = caseType === "combined" && loadTypes.multiUdl;
  const showTriangular =
    caseType === "simply-supported-triangular" ||
    (caseType === "combined" &&
      (loadTypes.triangular || loadTypes.multiTriangular));
  const showMultiTriangular =
    caseType === "combined" && loadTypes.multiTriangular;
  const showSupports =
    caseType.startsWith("simply-supported") ||
    (caseType === "combined" && beamType === "simply-supported");

  return (
    <main className="min-h-screen bg-gradient-to-br from-gray-100 to-gray-200 p-6 flex justify-center">
      <div className="w-full max-w-8xl bg-white rounded-2xl shadow-xl p-8 space-y-8">
        {/* Header */}
        <header className="border-b pb-4 mb-4">
          <h1 className="text-3xl font-bold text-gray-800">
            🏗️ Beam Calculator
          </h1>
          <p className="text-gray-500">
            Compute reactions, shear force & bending moment diagrams with
            step-by-step derivations.
          </p>
          <div className="flex flex-col sm:flex-row justify-between gap-4 mt-4 w-full max-w-6xl mx-auto">
            {/* How to use button */}
            <button
              onClick={() => setIsManualOpen(true)}
              className="flex-1 px-6 py-3 flex items-center justify-center gap-2 bg-gradient-to-r from-blue-500 to-blue-600 text-white font-semibold rounded-lg shadow-md hover:from-blue-600 hover:to-blue-700 hover:shadow-lg transition duration-300 transform hover:-translate-y-1 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-offset-2"
            >
              HOW TO USE THIS TOOL ℹ️
            </button>

            {/* Reset button */}
            <button
              onClick={() => {
                if (
                  window.confirm("Are you sure you want to reset everything?")
                ) {
                  resetAll();
                }
              }}
              className="flex-1 px-6 py-3 flex items-center justify-center gap-2 bg-gradient-to-r from-red-500 to-red-600 text-white font-semibold rounded-lg shadow-md hover:from-red-600 hover:to-red-700 hover:shadow-lg transition duration-300 transform hover:-translate-y-1 focus:outline-none focus:ring-2 focus:ring-red-400 focus:ring-offset-2"
            >
              RESET 🔄
            </button>

            {/* Settings button */}
            <button
              onClick={() => setIsSettingsOpen(true)}
              className="flex-1 px-6 py-3 flex items-center justify-center bg-gradient-to-r from-gray-500 to-gray-600 text-white font-semibold rounded-lg shadow-md hover:from-gray-600 hover:to-gray-700 hover:shadow-lg transition duration-300 transform hover:-translate-y-1 focus:outline-none focus:ring-2 focus:ring-gray-400 focus:ring-offset-2"
            >
              SETTINGS ⚙️
            </button>
          </div>
        </header>
        {/* Controls */}
        <section className="grid md:grid-cols-3 gap-6">
          <label className="flex flex-col text-sm font-medium text-gray-700">
            Load case
            <select
              value={caseType}
              onChange={(e) => {
                setCaseType(e.target.value);
                if (e.target.value === "cantilever-point") {
                  setPointLoads([{ magnitude: 0, position: 0 }]);
                }
                if (e.target.value !== "combined") {
                  setBeamType(
                    e.target.value.startsWith("cantilever")
                      ? "cantilever"
                      : "simply-supported"
                  );
                }
              }}
              className="mt-2 border rounded-lg px-3 py-2 shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="combined">Combined Load Case</option>
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
                Simply supported — triangular (Linearly Varying Load)
              </option>
            </select>
          </label>

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
        </section>

        {caseType === "combined" && (
          <section className="grid md:grid-cols-3 gap-6">
            <label className="flex flex-col text-sm font-medium text-gray-700">
              Beam Type
              <select
                value={beamType}
                onChange={(e) => setBeamType(e.target.value)}
                className="mt-2 border rounded-lg px-3 py-2 shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="simply-supported">Simply Supported</option>
                <option value="cantilever">Cantilever</option>
              </select>
            </label>

            <div className="flex flex-col text-sm font-medium text-gray-700">
              Load Types
              <div className="mt-2 grid grid-cols-2 gap-2">
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={loadTypes.point}
                    onChange={(e) =>
                      setLoadTypes({
                        ...loadTypes,
                        point: e.target.checked,
                        multiPoint: loadTypes.multiPoint && !e.target.checked,
                      })
                    }
                    disabled={loadTypes.multiPoint}
                    className="mr-2"
                  />
                  Single Point Load
                </label>
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={loadTypes.multiPoint}
                    onChange={(e) =>
                      setLoadTypes({
                        ...loadTypes,
                        multiPoint: e.target.checked,
                        point: loadTypes.point && !e.target.checked,
                      })
                    }
                    disabled={loadTypes.point}
                    className="mr-2"
                  />
                  Multiple Point Loads
                </label>
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={loadTypes.udl}
                    onChange={(e) =>
                      setLoadTypes({
                        ...loadTypes,
                        udl: e.target.checked,
                        multiUdl: loadTypes.multiUdl && !e.target.checked,
                      })
                    }
                    disabled={loadTypes.multiUdl}
                    className="mr-2"
                  />
                  Single UDL
                </label>
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={loadTypes.multiUdl}
                    onChange={(e) =>
                      setLoadTypes({
                        ...loadTypes,
                        multiUdl: e.target.checked,
                        udl: loadTypes.udl && !e.target.checked,
                      })
                    }
                    disabled={loadTypes.udl}
                    className="mr-2"
                  />
                  Multiple UDLs
                </label>
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={loadTypes.triangular}
                    onChange={(e) =>
                      setLoadTypes({
                        ...loadTypes,
                        triangular: e.target.checked,
                        multiTriangular:
                          loadTypes.multiTriangular && !e.target.checked,
                      })
                    }
                    disabled={loadTypes.multiTriangular}
                    className="mr-2"
                  />
                  Single Triangular Load
                </label>
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={loadTypes.multiTriangular}
                    onChange={(e) =>
                      setLoadTypes({
                        ...loadTypes,
                        multiTriangular: e.target.checked,
                        triangular: loadTypes.triangular && !e.target.checked,
                      })
                    }
                    disabled={loadTypes.triangular}
                    className="mr-2"
                  />
                  Multiple Triangular Loads
                </label>
              </div>
            </div>
          </section>
        )}

        <section className="grid md:grid-cols-3 gap-6">
          {showPointLoad && (
            <>
              {pointLoads.map((load, index) => (
                <div key={index} className="flex flex-col gap-4">
                  <label className="flex flex-col text-sm font-medium text-gray-700">
                    Point load P{index + 1} ({units === "SI" ? "kN" : "kip"})
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      value={load.magnitude}
                      onChange={(e) =>
                        updatePointLoad(index, "magnitude", e.target.value)
                      }
                      className="mt-2 border rounded-lg px-3 py-2 shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </label>
                  <label className="flex flex-col text-sm font-medium text-gray-700">
                    Position a{index + 1} ({units === "SI" ? "m" : "ft"})
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      max={L}
                      value={load.position}
                      onChange={(e) =>
                        updatePointLoad(index, "position", e.target.value)
                      }
                      className="mt-2 border rounded-lg px-3 py-2 shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </label>
                  {showMultiPoint && (
                    <button
                      onClick={() => removePointLoad(index)}
                      className="mt-2 px-4 py-2 bg-red-500 text-white rounded-lg disabled:opacity-50"
                      disabled={pointLoads.length === 1}
                    >
                      Remove Point Load
                    </button>
                  )}
                </div>
              ))}
            </>
          )}
        </section>
        {showMultiPoint && (
          <div className="flex justify-center">
            <button
              onClick={addPointLoad}
              className="w-4/5 mt-2 px-4 py-2 bg-green-500 text-white rounded-lg text-center"
            >
              Add Point Load
            </button>
          </div>
        )}

        <section className="grid md:grid-cols-3 gap-6">
          {showUdl && (
            <>
              {udlLoads.map((load, index) => (
                <div key={index} className="flex flex-col gap-4">
                  <label className="flex flex-col text-sm font-medium text-gray-700">
                    UDL w{index + 1} ({units === "SI" ? "kN/m" : "kip/ft"})
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      value={load.magnitude}
                      onChange={(e) =>
                        updateUdlLoad(index, "magnitude", e.target.value)
                      }
                      className="mt-2 border rounded-lg px-3 py-2 shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </label>
                  <label className="flex flex-col text-sm font-medium text-gray-700">
                    UDL {index + 1} start ({units === "SI" ? "m" : "ft"})
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      max={L}
                      value={load.start}
                      onChange={(e) =>
                        updateUdlLoad(index, "start", e.target.value)
                      }
                      className="mt-2 border rounded-lg px-3 py-2 shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </label>
                  <label className="flex flex-col text-sm font-medium text-gray-700">
                    UDL {index + 1} end ({units === "SI" ? "m" : "ft"})
                    <input
                      type="number"
                      step="0.01"
                      min={load.start}
                      max={L}
                      value={load.end}
                      onChange={(e) =>
                        updateUdlLoad(index, "end", e.target.value)
                      }
                      className="mt-2 border rounded-lg px-3 py-2 shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </label>
                  {showMultiUdl && (
                    <button
                      onClick={() => removeUdlLoad(index)}
                      className="mt-2 px-4 py-2 bg-red-500 text-white rounded-lg disabled:opacity-50"
                      disabled={udlLoads.length === 1}
                    >
                      Remove UDL
                    </button>
                  )}
                </div>
              ))}
            </>
          )}
        </section>
        {showMultiUdl && (
          <div className="flex justify-center">
            <button
              onClick={addUdlLoad}
              className="w-4/5 mt-2 px-4 py-2 bg-green-500 text-white rounded-lg text-center"
            >
              Add UDL
            </button>
          </div>
        )}

        <section className="grid md:grid-cols-3 gap-6">
          {showTriangular && (
            <>
              {triangularLoads.map((load, index) => (
                <div key={index} className="flex flex-col gap-4">
                  <label className="flex flex-col text-sm font-medium text-gray-700">
                    Triangular load w{index + 1} peak (
                    {units === "SI" ? "kN/m" : "kip/ft"})
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      value={load.magnitude}
                      onChange={(e) =>
                        updateTriangularLoad(index, "magnitude", e.target.value)
                      }
                      className="mt-2 border rounded-lg px-3 py-2 shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </label>
                  <label className="flex flex-col text-sm font-medium text-gray-700">
                    Triangular {index + 1} start ({units === "SI" ? "m" : "ft"})
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      max={L}
                      value={load.start}
                      onChange={(e) =>
                        updateTriangularLoad(index, "start", e.target.value)
                      }
                      className="mt-2 border rounded-lg px-3 py-2 shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </label>
                  <label className="flex flex-col text-sm font-medium text-gray-700">
                    Triangular {index + 1} end ({units === "SI" ? "m" : "ft"})
                    <input
                      type="number"
                      step="0.01"
                      min={load.start}
                      max={L}
                      value={load.end}
                      onChange={(e) =>
                        updateTriangularLoad(index, "end", e.target.value)
                      }
                      className="mt-2 border rounded-lg px-3 py-2 shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </label>
                  {showMultiTriangular && (
                    <button
                      onClick={() => removeTriangularLoad(index)}
                      className="mt-2 px-4 py-2 bg-red-500 text-white rounded-lg disabled:opacity-50"
                      disabled={triangularLoads.length === 1}
                    >
                      Remove Triangular Load
                    </button>
                  )}
                </div>
              ))}
            </>
          )}
        </section>
        {showMultiTriangular && (
          <div className="flex justify-center">
            <button
              onClick={addTriangularLoad}
              className="w-4/5 mt-2 px-4 py-2 bg-green-500 text-white rounded-lg text-center"
            >
              Add Triangular Load
            </button>
          </div>
        )}

        {showSupports && (
          <section className="grid md:grid-cols-3 gap-6">
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
            <label className="flex flex-col text-sm font-medium text-gray-700">
              Right support position ({units === "SI" ? "m" : "ft"})
              <input
                type="number"
                step="0.01"
                min={supportLeft}
                max={L}
                value={supportRight}
                onChange={(e) => {
                  let value = parseFloat(e.target.value);
                  if (isNaN(value)) value = supportLeft;
                  if (value > L) value = L;
                  if (value < supportLeft) value = supportLeft;
                  setSupportRight(value);
                }}
                className="mt-2 border rounded-lg px-3 py-2 shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </label>
          </section>
        )}

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
              from zero at start.
              <br />
              Supports can be moved using inputs or by dragging in the diagram.
              <br />
              Combined load case allows multiple point, UDL, and triangular
              loads with individual start and end positions.
            </p>
          </div>
        </section>

        {/* Beam Diagram */}
        <section>
          <h3 className="font-semibold text-gray-800 mb-2">Beam Setup</h3>
          <BeamDiagram
            caseType={caseType}
            L={L}
            pointLoads={pointLoads}
            udlLoads={udlLoads}
            triangularLoads={triangularLoads}
            units={units}
            supportLeft={supportLeft}
            supportRight={supportRight}
            setSupportLeft={setSupportLeft}
            setSupportRight={setSupportRight}
            RA={results.RA}
            RB={results.RB}
            Mfix={results.Mfix}
            loadTypes={loadTypes}
            beamType={beamType}
            decimalPlaces={decimalPlaces}
          />
        </section>

        {/* Charts */}
        <section className="grid lg:grid-cols-1 gap-6">
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
          Built with Next.js + Tailwind + Chart.js 🎉. Built by DEBRAH SETH
          ASEDA JR
        </footer>
      </div>

      {/* Manual Modal */}
      {isManualOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-900 p-8 rounded-2xl shadow-2xl max-w-6xl w-full max-h-[90vh] overflow-y-auto animate-fadeIn">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-3xl font-extrabold text-gray-800 dark:text-white">
                📘 Beam Calculator Manual
              </h2>
              <button
                onClick={() => setIsManualOpen(false)}
                className="text-gray-500 hover:text-red-500 transition"
              >
                ✖
              </button>
            </div>

            <p className="text-gray-700 dark:text-gray-300 leading-relaxed mb-6">
              This app is a simple <strong>beam calculator</strong> for
              structural engineering calculations. It computes support
              reactions, shear force diagrams (SFD), and bending moment diagrams
              (BMD) for various load cases on simply supported or cantilever
              beams.
            </p>

            <div className="space-y-8">
              <section>
                <h3 className="text-xl font-semibold text-indigo-600 mb-3">
                  🔣 Abbreviations Used and What They Mean
                </h3>
                <ul className="list-disc pl-6 space-y-2 text-gray-700 dark:text-gray-300">
                  <li>UDL - Uniformly Distributed Load</li>
                  <li>SFD - Shear Force Diagram</li>
                  <li>BMD - Bending Moment Diagram</li>
                </ul>
              </section>
              <section>
                <h3 className="text-xl font-semibold text-indigo-600 mb-3">
                  🔧 How to Use It
                </h3>
                <ul className="list-disc pl-6 space-y-2 text-gray-700 dark:text-gray-300">
                  <li>
                    Select a load case from the dropdown (e.g., Combined Load
                    Case).
                  </li>
                  <li>
                    For Combined Load Case, choose beam type (Simply Supported
                    or Cantilever) and select load types (Point, Multi-Point,
                    UDL, Multi-UDL, Triangular, Multi-Triangular).
                  </li>
                  <li>
                    Input the beam length <code>L</code> in meters (m) or feet
                    (ft).
                  </li>
                  <li>
                    Choose units (SI or Imperial)—the app converts values if
                    switched.
                  </li>
                  <li>
                    Enter load parameters:
                    <ul className="list-disc pl-6 mt-1 space-y-1">
                      <li>
                        <strong>Point load:</strong> Magnitude P (kN/kip),
                        position a (m/ft).
                      </li>
                      <li>
                        <strong>UDL:</strong> Magnitude w (kN/m or kip/ft),
                        start and end positions.
                      </li>
                      <li>
                        <strong>Triangular:</strong> Peak magnitude (kN/m or
                        kip/ft), start and end positions.
                      </li>
                      <li>
                        In Combined mode, add multiple loads of each type with
                        individual start and end positions for UDL and
                        triangular loads.
                      </li>
                    </ul>
                  </li>
                  <li>Adjust support positions for simply supported beams.</li>
                  <li>
                    The app automatically shows reactions, max shear/moment,
                    SFD, and BMD.
                  </li>
                </ul>
              </section>

              <section>
                <h3 className="text-xl font-semibold text-indigo-600 mb-3">
                  📊 What Everything Means
                </h3>
                <ul className="list-disc pl-6 space-y-2 text-gray-700 dark:text-gray-300">
                  <li>
                    <strong>Load Case:</strong> The type of beam and loading.
                  </li>
                  <li>
                    <strong>Beam Length L:</strong> Total span of the beam.
                  </li>
                  <li>
                    <strong>Units:</strong> SI (metric) or Imperial.
                  </li>
                  <li>
                    <strong>Support Positions:</strong> Locations of supports.
                  </li>
                  <li>
                    <strong>Reactions:</strong> Forces/moments at supports.
                  </li>
                  <li>
                    <strong>Max |Shear|:</strong> Maximum shear force (V).
                  </li>
                  <li>
                    <strong>Max |Moment|:</strong> Maximum bending moment (M).
                  </li>
                  <li>
                    <strong>SFD:</strong> Shear Force Diagram.
                  </li>
                  <li>
                    <strong>BMD:</strong> Bending Moment Diagram.
                  </li>
                  <li>
                    <strong>Step-by-step Solution:</strong> Shows detailed
                    calculations.
                  </li>
                </ul>
              </section>

              <section>
                <h3 className="text-xl font-semibold text-indigo-600 mb-3">
                  📝 Expected Inputs
                </h3>
                <ul className="list-disc pl-6 space-y-2 text-gray-700 dark:text-gray-300">
                  <li>L: Positive number (greater than 0).</li>
                  <li>Loads (P, w, triangular): Non-negative numbers.</li>
                  <li>
                    Positions: Between 0 and L, with start ≤ end for UDL and
                    triangular loads.
                  </li>
                  <li>Supports: Left ≤ Right, within 0 to L.</li>
                  <li>
                    Invalid inputs may give incorrect results—ensure values make
                    sense.
                  </li>
                </ul>
              </section>
            </div>

            <div className="flex justify-end mt-8">
              <button
                onClick={() => setIsManualOpen(false)}
                className="px-6 py-2 bg-gradient-to-r from-red-500 to-pink-500 text-white font-semibold rounded-lg shadow-md hover:opacity-90 transition"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {isSettingsOpen && (
        <div className="fixed inset-0 flex items-center justify-center bg-transparent bg-opacity-50 backdrop-blur-sm z-50 transition-opacity duration-300">
          <div className="bg-white rounded-2xl shadow-2xl p-10 w-200 transform transition-all duration-300 scale-100 animate-fadeIn">
            <h2 className="text-3xl font-bold mb-6 text-gray-800 flex items-center gap-2">
              ⚙️ Settings
            </h2>

            {/* Units selection */}
            <label className="block mb-5">
              <span className="text-gray-700 font-medium">Units</span>
              <select
                value={units}
                onChange={(e) => setUnitsState(e.target.value)}
                className="text-black mt-2 block w-full border border-gray-300 rounded-lg px-3 py-2 bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
              >
                <option value="SI">🌍 SI (m, kN)</option>
                <option value="Imperial">🇺🇸 Imperial (ft, kip)</option>
              </select>
            </label>

            {/* Decimal places selection */}
            <label className="block mb-5">
              <span className="text-gray-700 font-medium">Decimal Places</span>
              <select
                value={decimalPlaces}
                onChange={(e) => setDecimalPlaces(Number(e.target.value))}
                className="text-black mt-2 block w-full border border-gray-300 rounded-lg px-3 py-2 bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
              >
                <option value={0}>0 (no decimals)</option>
                <option value={1}>1 decimal (0.0)</option>
                <option value={2}>2 decimals (0.00)</option>
                <option value={3}>3 decimals (0.000)</option>
                <option value={4}>4 decimals (0.0000)</option>
              </select>
            </label>

            {/* Buttons */}
            <div className="flex justify-end gap-3 mt-6">
              <button
                onClick={() => setIsSettingsOpen(false)}
                className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition font-medium"
              >
                Cancel
              </button>
              <button
                onClick={() => setIsSettingsOpen(false)}
                className="px-5 py-2 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-lg shadow-md hover:from-blue-600 hover:to-blue-700 hover:shadow-lg transition font-semibold"
              >
                Save
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
