/* rules.js
   Phase 1: Rule Engine Implementation
   This script implements the core logic of the BHA configuration tool.
   It defines the input parameters, the rules that govern the recommendations, and the output structure.
*/

document.addEventListener("DOMContentLoaded", () => {
    // 1) Slider labels
    const LABELS = {
      rpm: ["Low", "Medium", "High"],
      wob: ["Light", "Medium", "Heavy"],
      flow: ["Low", "Medium", "High"],
    };
  
    const $id = (id) => document.getElementById(id);
  
    function getSelectedRadioValue(name, fallback = null) {
      const el = document.querySelector(`input[name="${name}"]:checked`);
      return el ? el.value : fallback;
    }
  
    function levelTextFromSliderValue(value, labels) {
      const idx = Number(value);
      return labels[idx] ?? labels[1] ?? "Medium";
    }
  
    // 2) Build a normalized state object
    function buildState() {
      const rpmSlider = $id("rpmLevel");
      const wobSlider = $id("wobLevel");
      const flowSlider = $id("flowrateLevel");
  
      const formation = getSelectedRadioValue("formationType", "soft");
      const trajectory = getSelectedRadioValue("trajectory", "straight");
  
      const rpm = rpmSlider ? levelTextFromSliderValue(rpmSlider.value, LABELS.rpm).toLowerCase() : "medium";
      const wob = wobSlider ? levelTextFromSliderValue(wobSlider.value, LABELS.wob).toLowerCase() : "medium";
      const flow = flowSlider ? levelTextFromSliderValue(flowSlider.value, LABELS.flow).toLowerCase() : "medium";

      const vibrationRisk = (rpm === "high" && wob === "heavy") ? "high" : "low";
  
      return { formation, trajectory, rpm, wob, flow, vibrationRisk };
    }
  
    // 3) Rule Engine
    function evaluateRules(state) {
      const output = {
        keys: { tools: [], motor: {}, bit: {} },
        firedRules: [],
        notes: [],
      };

      const addKey = (group, key) => {
        if (!output.keys[group].includes(key)) output.keys[group].push(key);
      };
  
      // ----- Group A -----
      // IF Formation = Soft OR Trajectory ≠ Straight THEN Recommend MWD = Yes
      if (state.formation === "soft" || state.trajectory !== "straight") {
        addKey("Tools", "MWD_RECOMMENDED");
        output.firedRules.push("A1");
      }
  
      // IF Formation = Soft AND RPM = High THEN Recommend Near-bit Stabilizer = Yes
      if (state.formation === "soft" && state.rpm === "high") {
        addKey("Tools", "NEAR_BIT_STABILIZER_RECOMMENDED");
        output.firedRules.push("A2");        
      }
  
      // IF Formation = Hard AND Vibration Risk = High THEN Recommend Shock / Vibration Tool = Yes
      if (state.formation === "hard" && state.vibrationRisk === "high") {
        addKey("Tools", "SHOCK_VIBRATION_TOOL_RECOMMENDED");
        output.firedRules.push("A3");
      }
  
      // ----- Group B -----
      // IF Formation = Soft THEN Motor Type = High RPM / Standard Torque
      if (state.formation === "soft") {
        addKey("Motors", "MOTOR_HIGH_RPM_STANDARD_TORQUE");
        output.firedRules.push("B1");
      }
  
      // IF Formation = Medium THEN Motor Type = Balanced RPM / Medium Torque
      if (state.formation === "medium") {
        addKey("Motors", "MOTOR_BALANCED_RPM_MEDIUM_TORQUE");
        output.firedRules.push("B2");
      }
  
      // IF Formation = Hard OR Abrasive THEN Motor Type = Low RPM / High Torque
      if (state.formation === "hard" || state.formation === "abrasive") {
        addKey("Motors", "MOTOR_LOW_RPM_HIGH_TORQUE");
        output.firedRules.push("B3");
      }
  
      // IF WOB = Heavy AND RPM = Low THEN Suggest Even Wall Thickness Motor
      if (state.wob === "heavy" && state.rpm === "low") {
        addKey("Motors", "MOTOR_EVEN_WALL_THICKNESS_SUGGESTED");
        output.firedRules.push("B4");
        output.notes.push("Even Wall Thickness Suggested due to heavy WOB and low RPM.");
      }
  
      // ----- Group C -----
      // IF Formation = Soft THEN Bit Aggressiveness = High
      if (state.formation === "soft") {
        addKey("Bit", "BIT_AGG_HIGH");
        output.firedRules.push("C1");
      }
  
      // IF Formation = Medium THEN Bit Aggressiveness = Medium
      if (state.formation === "medium") {
        addKey("Bit", "BIT_AGG_MEDIUM");
        output.firedRules.push("C2");
      }
  
      // IF Formation = Hard / Abrasive THEN Bit Aggressiveness = Low AND Cutter Density = High
      if (state.formation === "hard" || state.formation === "abrasive") {
        addKey("Bit", "BIT_AGG_LOW");
        addKey("Bit", "BIT_CUTTER_DENSITY_HIGH");
        output.firedRules.push("C3");
      }
  
      return output;
    }
  
    // 4) Console verification
    function logSummary(state, output) {
      console.clear();
  
      console.group("BHA Config — Inputs");
      console.table({
        Formation: state.formation,
        Trajectory: state.trajectory,
        RPM: state.rpm,
        WOB: state.wob,
        "Flow Rate": state.flow,
        "Vibration Risk (derived)": state.vibrationRisk,
      });
      console.groupEnd();
  
      console.group("BHA Config — Output Keys");
      console.table({
        Tools: output.keys.Tools.join(", ") || "-",
        Motors: output.keys.Motors.join(", ") || "-",
        Bit: output.keys.Bit.join(", ") || "-",
      });
      console.groupEnd();

      const dict = window.BHA_DICTIONARY || {};
      
      const toDisplayRows = (keys, category) => 
        keys.map((key) => ({
          category, key,
          title: dict[key]?.title ?? "(not mapped yet)",
        }));

      const allRows = [
        ...toDisplayRows(output.keys.Tools, "Tools"),
        ...toDisplayRows(output.keys.Motors, "Motors"),
        ...toDisplayRows(output.keys.Bit, "Bit"),
      ];
      
      console.group("BHA Config - Detailed Suggestions");
      console.table(allRows);
      console.groupEnd();
  
      console.log("Fired rules:", output.firedRules.join(", ") || "(none)");
      if (output.notes.length) {
        console.log("Notes:");
        output.notes.forEach((n) => console.log("•", n));
      }
    }
  
    // 5) One update function for everything
    function updateAll() {
      const state = buildState();
      const output = evaluateRules(state);
      logSummary(state, output);
    }
  
    // 6) Bind UI events
    ["rpmLevel", "wobLevel", "flowrateLevel"].forEach((id) => {
      const el = $id(id);
      if (el) el.addEventListener("input", updateAll);
    });

    document.querySelectorAll('input[name="formationType"], input[name="trajectoryRequirement"]')
      .forEach((el) => el.addEventListener("change", updateAll));
  
    updateAll();
  });