document.addEventListener("DOMContentLoaded", () => {
    // 1) Slider labels
    const LABELS = {
      rpm: ["Low", "Medium", "High"],
      wob: ["Low", "Medium", "Heavy"],
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
  
    function setBadge(badgeEl, text) {
      badgeEl.textContent = text;

      badgeEl.dataset.level = String(text).toLowerCase();
    }
  
    // 2) Bind RPM/WOB/Flow to badges 
    const sliderConfigs = [
      { sliderId: "rpmLevel", badgeId: "rpmLevelBadge", labels: LABELS.rpm },
      { sliderId: "wobLevel", badgeId: "wobLevelBadge", labels: LABELS.wob },
      { sliderId: "flowrateLevel", badgeId: "flowrateLevelBadge", labels: LABELS.flow },
    ];
  
    function syncSliderAndBadge(cfg) {
      const slider = $id(cfg.sliderId);
      const badge = $id(cfg.badgeId);
      if (!slider || !badge) return;
  
      const text = levelTextFromSliderValue(slider.value, cfg.labels);
      setBadge(badge, text);
    }
  
    function bindSliders(onAnyChange) {
      sliderConfigs.forEach((cfg) => {
        const slider = $id(cfg.sliderId);
        const badge = $id(cfg.badgeId);
        if (!slider || !badge) return;
  
        const update = () => {
          syncSliderAndBadge(cfg);
          onAnyChange();
        };
  
        slider.addEventListener("input", update);
        update();
      });
    }
  
    // 3) Build a normalized state object
    function buildState() {
      const rpmSlider = $id("rpmLevel");
      const wobSlider = $id("wobLevel");
      const flowSlider = $id("flowrateLevel");
  
      const formation = getSelectedRadioValue("formationType", "soft");
      const trajectory = getSelectedRadioValue("trajectoryRequirement", "straight");
  
      const rpm = rpmSlider ? levelTextFromSliderValue(rpmSlider.value, LABELS.rpm).toLowerCase() : "medium";
      const wob = wobSlider ? levelTextFromSliderValue(wobSlider.value, LABELS.wob).toLowerCase() : "medium";
      const flow = flowSlider ? levelTextFromSliderValue(flowSlider.value, LABELS.flow).toLowerCase() : "medium";

      const vibrationRisk = (rpm === "high" && wob === "heavy") ? "high" : "low";
  
      return { formation, trajectory, rpm, wob, flow, vibrationRisk };
    }
  
    // 4) Rule Engine
    function evaluateRules(state) {
      const output = {
        // Group A
        mwd: false,
        nearBitStabilizer: false,
        shockVibrationTool: false,
  
        // Group B
        motor: {
          type: null,
          torque: null,
          evenWallThickness: false,
        },
  
        // Group C
        bit: {
          aggressiveness: null,
          cutterDensity: null,
        },
  
        // Debug/trace
        firedRules: [],
        notes: [],
      };
  
      // ----- Group A -----
      // IF Formation = Soft OR Trajectory ≠ Straight THEN Recommend MWD = Yes
      if (state.formation === "soft" || state.trajectory !== "straight") {
        output.mwd = true;
        output.firedRules.push("A1");
        output.notes.push("MWD recommended: soft formation or non-straight trajectory.");
      }
  
      // IF Formation = Soft AND RPM = High THEN Recommend Near-bit Stabilizer = Yes
      if (state.formation === "soft" && state.rpm === "high") {
        output.nearBitStabilizer = true;
        output.firedRules.push("A2");
        output.notes.push("Near-bit stabilizer recommended: soft formation + high RPM.");
      }
  
      // IF Formation = Hard AND Vibration Risk = High THEN Recommend Shock / Vibration Tool = Yes
      if (state.formation === "hard" && state.vibrationRisk === "high") {
        output.shockVibrationTool = true;
        output.firedRules.push("A3");
        output.notes.push("Shock/vibration tool recommended: hard formation + high vibration risk.");
      }
  
      // ----- Group B -----
      // IF Formation = Soft THEN Motor Type = High RPM / Standard Torque
      if (state.formation === "soft") {
        output.motor.type = "High RPM";
        output.motor.torque = "Standard Torque";
        output.firedRules.push("B1");
      }
  
      // IF Formation = Medium THEN Motor Type = Balanced RPM / Medium Torque
      if (state.formation === "medium") {
        output.motor.type = "Balanced RPM";
        output.motor.torque = "Medium Torque";
        output.firedRules.push("B2");
      }
  
      // IF Formation = Hard OR Abrasive THEN Motor Type = Low RPM / High Torque
      if (state.formation === "hard" || state.formation === "abrasive") {
        output.motor.type = "Low RPM";
        output.motor.torque = "High Torque";
        output.firedRules.push("B3");
      }
  
      // IF WOB = Heavy AND RPM = Low THEN Suggest Even Wall Thickness Motor
      if (state.wob === "heavy" && state.rpm === "low") {
        output.motor.evenWallThickness = true;
        output.firedRules.push("B4");
        output.notes.push("Even wall thickness motor suggested: heavy WOB + low RPM.");
      }
  
      // ----- Group C -----
      // IF Formation = Soft THEN Bit Aggressiveness = High
      if (state.formation === "soft") {
        output.bit.aggressiveness = "High";
        output.firedRules.push("C1");
      }
  
      // IF Formation = Medium THEN Bit Aggressiveness = Medium
      if (state.formation === "medium") {
        output.bit.aggressiveness = "Medium";
        output.firedRules.push("C2");
      }
  
      // IF Formation = Hard / Abrasive THEN Bit Aggressiveness = Low AND Cutter Density = High
      if (state.formation === "hard" || state.formation === "abrasive") {
        output.bit.aggressiveness = "Low";
        output.bit.cutterDensity = "High";
        output.firedRules.push("C3");
      }
  
      return output;
    }
  
    // 5) Console verification
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
  
      console.group("BHA Config — Recommendations");
      console.table({
        "MWD": output.mwd ? "Yes" : "No",
        "Near-bit Stabilizer": output.nearBitStabilizer ? "Yes" : "No",
        "Shock/Vibration Tool": output.shockVibrationTool ? "Yes" : "No",
        "Motor Type": output.motor.type ?? "-",
        "Motor Torque": output.motor.torque ?? "-",
        "Even Wall Thickness": output.motor.evenWallThickness ? "Yes" : "No",
        "Bit Aggressiveness": output.bit.aggressiveness ?? "-",
        "Cutter Density": output.bit.cutterDensity ?? "-",
      });
      console.groupEnd();
  
      console.log("Fired rules:", output.firedRules.join(", ") || "(none)");
      if (output.notes.length) {
        console.log("Notes:");
        output.notes.forEach((n) => console.log("•", n));
      }
    }
  
    // 6) One update function for everything
    function updateAll() {
      sliderConfigs.forEach(syncSliderAndBadge);
  
      const state = buildState();
      const output = evaluateRules(state);
      logSummary(state, output);
    }
  
    // 7) Bind UI events
    bindSliders(updateAll);
    document.querySelectorAll('input[name="formationType"], input[name="trajectoryRequirement"]')
      .forEach((el) => el.addEventListener("change", updateAll));
  
    updateAll();
  });