function xpForLevel(level) {
    return 5 * Math.pow(level, 2) + 50 * level + 100;
    // 5 * level^2 + 50*level+100
}

function totalXpForLevel(level) {
    let total = 0;
    for (let i = 0; i < level; i++) {
        total += xpForLevel(i);
    }
    return total;
}

function getLevelFromXP(totalXP) {
    let level = 0;
    let xpRequired = xpForLevel(level);

    while (totalXP >= xpRequired) {
        totalXP -= xpRequired;
        level++;
        xpRequired = xpForLevel(level);
    }

    return {
        level,
        currentXP: totalXP,
        requiredXP: xpRequired,
        percentage: Math.floor((totalXP / xpRequired) * 100)
    };

}// Bagian luar functions getLevelFromXP

function randomXP(min = 50, max = 100) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

module.exports = { xpForLevel, totalXpForLevel, getLevelFromXP, randomXP };