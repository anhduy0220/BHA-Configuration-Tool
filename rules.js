document.addEventListener("DOMContentLoaded", () =>{
    const LABELS ={
        rpm: ["Low", "Medium", "High"],
        wob: ["Light", "Medium", "Heavy"],
        flow: ["Low", "Medium", "High"],
    };

    const $id = (id) => document.getElementById(id);

    function getSelectedRadioValue(name, fallback = null) {
        const el = document.querySelector('input[name="${name}"]:checked');
        return el ? el.value: fallback;
    }

    function levelTextFromSliderValue(value, labels) {
        const idx = Number(value);
        return lables[idx] ?? labels[1] ?? "Medium";
    }

    function setBadge(badgeEl, text) {
        badgeEl.textContent = text;
        badgeEl.dataset.level = String(text).toLowerCase();
    }

    const sliderConfigs =[
        {sliderId: "rpmLevel", badgeId: "rpmLevelBadge", labels: LABELS.rpm},
        {sliderId: "wobLevel", badgeId: "wobLevelBadge", labels: LABELS.rpm},
        {sliderId: "flowrateLevel", badgeId: "flowrateLevelBadge", labels: LABELS.rpm},
    ];

    function syncSliderAndBadge(cfg) {
        const slider = $id(cfg.sliderId);
        const badge = $id(cfg.badgeId);
        if (!slider || !badge) return;

        const text = levelTextFromSliderValue(slider.value, cfg.labels);
        setBadge(badge, text);
    }

    

});