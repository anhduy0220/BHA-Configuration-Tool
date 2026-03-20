/* rules.js
   Phase 1: Rule Engine Implementation
   - This script implements the core logic of the BHA configuration tool.
   - It defines the input parameters, the rules that govern the recommendations, and the output structure.
   Phase 3: Rule output Keys
   - 
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

      const trajectory =
        getSelectedRadioValue("trajectory", null) ??
        getSelectedRadioValue("trajectoryRequirement", "straight") ??
        "straight";
  
      const rpm = rpmSlider ? levelTextFromSliderValue(rpmSlider.value, LABELS.rpm).toLowerCase() : "medium";
      const wob = wobSlider ? levelTextFromSliderValue(wobSlider.value, LABELS.wob).toLowerCase() : "medium";
      const flow = flowSlider ? levelTextFromSliderValue(flowSlider.value, LABELS.flow).toLowerCase() : "medium";

      const vibrationRisk = (rpm === "high" && wob === "heavy") ? "high" : "low";
  
      return { formation, trajectory, rpm, wob, flow, vibrationRisk };
    }

    function replaceKey (groupArr, removeKey, addKey) {
      const idx = groupArr.indexOf(removeKey);
      if (idx !== -1) groupArr.splice(idx, 1);
      if (!groupArr.includes(addKey)) groupArr.push(addKey);
    }

    // 3) Rule Engine
    function evaluateRules(state) {
      const output = {
        keys: { Tools: [], Motors: [], Bit: [] },
        firedRules: [],
      };
  
      // Defaults: "NOT" outcomes selected
      output.keys.Tools.push(
        "MWD_NOT_RECOMMENDED",
        "NEAR_BIT_STABILIZER_NOT_RECOMMENDED",
        "SHOCK_VIBRATION_TOOL_NOT_RECOMMENDED"
      );
  
      // Motor Type will always be selected below (no default here)
      output.keys.Motors.push("MOTOR_EVEN_WALL_THICKNESS_NOT_SUGGESTED");
  
      // Bit: select defaults
      output.keys.Bit.push("BIT_CUTTER_DENSITY_STANDARD");
  
      // Tools parameter outcomes
      // MWD: Soft OR Trajectory != Straight => Recommended
      if (state.formation === "soft" || state.trajectory !== "straight") {
        replaceKey(output.keys.Tools, "MWD_NOT_RECOMMENDED", "MWD_RECOMMENDED");
        output.firedRules.push("A1");
      }
  
      // Near-bit Stabilizer: Soft + RPM High => Recommended
      if (state.formation === "soft" && state.rpm === "high") {
        replaceKey(
          output.keys.Tools,
          "NEAR_BIT_STABILIZER_NOT_RECOMMENDED",
          "NEAR_BIT_STABILIZER_RECOMMENDED"
        );
        output.firedRules.push("A2");
      }
  
      // Shock/Vibration tool: Hard + vibration risk high => Recommended
      if (state.formation === "hard" && state.vibrationRisk === "high") {
        replaceKey(
          output.keys.Tools,
          "SHOCK_VIBRATION_TOOL_NOT_RECOMMENDED",
          "SHOCK_VIBRATION_TOOL_RECOMMENDED"
        );
        output.firedRules.push("A3");
      }
  
      // Motor Type parameter outcomes (one-of)
      if (state.formation === "soft") {
        output.keys.Motors.push("MOTOR_HIGH_RPM_STANDARD_TORQUE");
        output.firedRules.push("B1");
      } else if (state.formation === "medium") {
        output.keys.Motors.push("MOTOR_BALANCED_RPM_MEDIUM_TORQUE");
        output.firedRules.push("B2");
      } else {
        // hard or abrasive
        output.keys.Motors.push("MOTOR_LOW_RPM_HIGH_TORQUE");
        output.firedRules.push("B3");
      }
  
      // Even Wall Thickness: Heavy WOB + Low RPM => Suggested
      if (state.wob === "heavy" && state.rpm === "low") {
        replaceKey(
          output.keys.Motors,
          "MOTOR_EVEN_WALL_THICKNESS_NOT_SUGGESTED",
          "MOTOR_EVEN_WALL_THICKNESS_SUGGESTED"
        );
        output.firedRules.push("B4");
      }
  
      // Bit outcomes
      // Aggressiveness
      if (state.formation === "soft") {
        output.keys.Bit.push("BIT_AGG_HIGH");
        output.firedRules.push("C1");
      } else if (state.formation === "medium") {
        output.keys.Bit.push("BIT_AGG_MEDIUM");
        output.firedRules.push("C2");
      } else {
        // hard or abrasive
        output.keys.Bit.push("BIT_AGG_LOW");
        output.firedRules.push("C3");
      }
  
      // Cutter density: hard/abrasive => High, otherwise Standard
      if (state.formation === "hard" || state.formation === "abrasive") {
        replaceKey(output.keys.Bit, "BIT_CUTTER_DENSITY_STANDARD", "BIT_CUTTER_DENSITY_HIGH");
      }
  
      return output;
    }
  
    // 4) Console verification
    function logSummary(state, output) {
      console.clear();
  
      console.group("BHA Config — Inputs");
      console.table({
        "Formation": state.formation,
        "Trajectory": state.trajectory,
        "RPM": state.rpm,
        "WOB": state.wob,
        "Flow Rate": state.flow,
        "Vibration Risk (derived)": state.vibrationRisk,
      });
      console.groupEnd();
  
      console.group("BHA Config — Selected Outcome Keys");
      console.table({
        Tools: output.keys.Tools.join(", "),
        Motors: output.keys.Motors.join(", "),
        Bit: output.keys.Bit.join(", "),
      });
      console.groupEnd();
  
      console.log("Fired rules:", output.firedRules.join(", ") || "(none)");
    }
  
    // 5) One update function for everything
    function updateAll() {
      const state = buildState();
      const output = evaluateRules(state);

      if (window.renderOutputs) {
        window.renderOutputs(output);
      } else {
        console.warn("[rules.js] renderOutputs not found. Ensure render.js is loaded before rules.js");
      }

      logSummary(state, output);
    }

    console.log("BHA_DICTIONARY exists?", !!window.BHA_DICTIONARY);
    console.log("renderOutputs exists?", typeof window.renderOutputs);

    window.renderOutputs({ keys: { Tools: ["MWD_RECOMMENDED"], Motors: [], Bit: [] } });
  
    // 6) Bind UI events
    ["rpmLevel", "wobLevel", "flowrateLevel"].forEach((id) => {
      const el = $id(id);
      if (el) el.addEventListener("input", updateAll);
    });

    document
      .querySelectorAll('input[name="formationType"], input[name="trajectory"], input[name="trajectoryRequirement"]')
      .forEach((el) => el.addEventListener("change", updateAll));
  
    updateAll();
  });