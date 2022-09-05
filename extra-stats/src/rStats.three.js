export function updatedThreeStats(renderer) {
    const rawThreeStats = window.threeStats(renderer);

    // Sane limits for mobile (Quest 2, Pico Neo 3 Link, etc..) HMDs
    rawThreeStats.values['renderer.info.render.calls'].over = 150;
    rawThreeStats.values['renderer.info.render.triangles'].over = 1_200_000;

    return rawThreeStats;
}