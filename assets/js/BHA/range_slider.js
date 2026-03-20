document.addEventListener("DOMContentLoaded", () => {
    const configs = [
        {sliderID: "rpmLevel", badgeID: "rpmLevelBadge", labels: ["Low", "Medium", "High"]},
        {sliderID: "wobLevel", badgeID: "wobLevelBadge", labels: ["Light", "Medium", "Heavy"]},
        {sliderID: "flowrateLevel", badgeID: "flowrateLevelBadge", labels: ["Low", "Medium", "High"]},
    ];

    function bindSliderToBadge({ sliderID, badgeID, labels}) {
        const slider = document.getElementById(sliderID);
        const badge = document.getElementById(badgeID);

        if (!slider || !badge) return;

        const update = () => {
            const idx = Number(slider.value);
            const text = labels[idx] ?? labels[1] ?? "Medium";
            badge.textContent = text;
            badge.dataset.level = text.toLowerCase();
        };

        slider.addEventListener("input", update);
        update();
    }

    configs.forEach(bindSliderToBadge)
});