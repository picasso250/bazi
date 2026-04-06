// src/grandCycleUtils.js
import { heavenlyStems, earthlyBranches, stemAttributes } from './constants.js';
import { getTenGod } from './baziCore.js'; // Use getTenGod from baziCore

/**
 * 根据年干和性别，确定大运的顺逆行方向。
 * @param {string} yearStem - 年柱天干。
 * @param {string} gender - 性别 ('male' 或 'female')。
 * @returns {'forward' | 'backward'} 大运方向。
 */
export function determineGrandCycleDirection(yearStem, gender) {
    const yearStemAttr = stemAttributes[yearStem];
    const isYearStemYang = yearStemAttr.yinYang === "阳";

    if (gender === "male") {
        return isYearStemYang ? "forward" : "backward";
    } else { // female
        return isYearStemYang ? "backward" : "forward";
    }
}

/**
 * 计算大运起运岁数。
 * @param {number} birthJD - 出生时刻的 Julian Day。
 * @param {object} birthMonthTerm - 出生月柱起始节气的对象 (包含 jd)。
 * @param {Array<object>} allBaziMonthJDs - 包含出生八字年所有节气（以及次年立春）的数组。
 * @param {'forward' | 'backward'} direction - 大运方向。
 * @returns {{ years: number, months: number, days: number }} 起运岁数。
 */
export function calculateGrandCycleStartAge(birthJD, birthMonthTerm, allBaziMonthJDs, direction) {
    let diffJD; // Julian Day 差

    if (direction === "forward") {
        // 顺行：从出生日期到下一个节气的时间
        let nextTerm = allBaziMonthJDs.find(term => term.jd > birthJD);
        if (!nextTerm) {
            // This case should ideally not happen if allBaziMonthJDs includes the next year's Lichun
            // As a safeguard, use the very last term (next year's Lichun)
            nextTerm = allBaziMonthJDs[allBaziMonthJDs.length - 1];
        }
        diffJD = nextTerm.jd - birthJD;
    } else { // backward
        // 逆行：从出生日期到上一个节气（即出生月柱的起始节气）的时间
        diffJD = birthJD - birthMonthTerm.jd;
    }

    const totalActualDays = diffJD; // This is already in days

    const gc_years = Math.floor(totalActualDays / 3);
    const remainder_days_for_months = totalActualDays % 3; // These are actual days

    const gc_months = Math.floor(remainder_days_for_months * 4); // 1 actual day = 4 GC months
    const remainder_fraction_for_days = (remainder_days_for_months * 4) % 1; // Fractional part of GC months

    const gc_days = Math.round(remainder_fraction_for_days * 30); // 1 GC month = 30 GC days

    return { years: gc_years, months: gc_months, days: gc_days };
}


/**
 * 生成一系列大运干支。
 * @param {string} monthGanZhi - 月柱的干支。
 * @param {'forward' | 'backward'} direction - 大运方向。
 * @param {number} numberOfCycles - 要生成的周期数量（通常是8-10个）。
 * @param {object} dayMasterAttributes - 日元的五行和阴阳属性，用于计算十神。
 * @returns {Array<{ ganZhi: string, tenGod: string }>} 大运列表。
 */
export function generateGrandCyclePillars(monthGanZhi, direction, numberOfCycles, dayMasterAttributes) {
    const grandCycles = [];
    let currentStemIndex = heavenlyStems.indexOf(monthGanZhi[0]);
    let currentBranchIndex = earthlyBranches.indexOf(monthGanZhi[1]);

    // 跳过月柱本身，从月柱的下一个干支开始计算大运
    if (direction === "forward") {
        currentStemIndex = (currentStemIndex + 1) % 10;
        currentBranchIndex = (currentBranchIndex + 1) % 12;
    } else { // backward
        currentStemIndex = (currentStemIndex - 1 + 10) % 10;
        currentBranchIndex = (currentBranchIndex - 1 + 12) % 12;
    }

    for (let i = 0; i < numberOfCycles; i++) {
        const ganZhi = heavenlyStems[currentStemIndex] + earthlyBranches[currentBranchIndex];
        const tenGod = getTenGod(dayMasterAttributes, stemAttributes[heavenlyStems[currentStemIndex]]);
        grandCycles.push({ ganZhi, tenGod });

        if (direction === "forward") {
            currentStemIndex = (currentStemIndex + 1) % 10;
            currentBranchIndex = (currentBranchIndex + 1) % 12;
        } else { // backward
            currentStemIndex = (currentStemIndex - 1 + 10) % 10;
            currentBranchIndex = (currentBranchIndex - 1 + 12) % 12;
        }
    }
    return grandCycles;
}
