// src/astronomyUtils.js
import * as astronomia from 'https://cdn.jsdelivr.net/npm/astronomia@4.1.1/+esm';
import { baziMonthDefs } from './constants.js';

/**
 * 辅助函数：计算给定 Julian Day 的太阳黄经（度数）。
 * @param {number} jd - Julian Day。
 * @returns {number} 太阳黄经（0-360 度）。
 */
export function getSolarLongitudeForJD(jd) {
    const T = (jd - 2451545.0) / 36525.0; // 自 J2000.0 以来的儒略世纪数
    let solarLonRad = astronomia.solar.trueLongitude(T).lon; // 结果为弧度
    let solarLonDeg = solarLonRad * 180 / Math.PI; // 转换为度数
    return (solarLonDeg % 360 + 360) % 360; // 归一化到 0-360 度
}

/**
 * 使用二分查找法，精确计算给定年份内太阳黄经达到目标度数时的 Julian Day。
 * @param {number} year - 公历年份。
 * @param {number} targetLonDeg - 目标太阳黄经（0-360 度）。
 * @param {number} roughMonth - 目标节气大致所在的月份（1-12）。
 * @param {number} roughDay - 目标节气大致所在的日期。
 * @returns {number} Julian Day，表示达到目标黄经的精确时刻。
 */
export function findJDForSolarLongitude(year, targetLonDeg, roughMonth, roughDay) {
    let searchStart = new Date(Date.UTC(year, roughMonth - 1, roughDay - 15, 0, 0, 0));
    let searchEnd = new Date(Date.UTC(year, roughMonth - 1, roughDay + 15, 23, 59, 59));

    let lowJD = astronomia.julian.DateToJD(searchStart);
    let highJD = astronomia.julian.DateToJD(searchEnd);

    const toleranceJD = 1 / (24 * 60 * 60); // 1秒的 Julian Day 精度

    let iterationCount = 0;
    const maxIterations = 100;

    while (highJD - lowJD > toleranceJD && iterationCount < maxIterations) {
        let midJD = (lowJD + highJD) / 2;
        let currentLon = getSolarLongitudeForJD(midJD);

        let diff = (currentLon - targetLonDeg + 360) % 360;
        if (diff > 180) diff -= 360; // Now diff is in [-180, 180]

        if (diff < 0) {
             lowJD = midJD;
        } else {
             highJD = midJD;
        }
        iterationCount++;
    }
    return highJD;
}

/**
 * 获取某个八字年（从立春到次年立春前）内所有八字月（节）的起始 Julian Day。
 * 返回的节气是按八字月份的顺序排列的。
 * @param {number} baziYear - 八字年份 (由立春确定的年份)。
 * @returns {Array<{name: string, longitude: number, branch: string, jd: number}>} 包含所有节气信息的数组。
*/
export function getBaziMonthStartJDs(baziYear) {
    const jdsForBaziYearMonths = [];

    // 1. 获取当前八字年的立春 (寅月开始)
    const actualLichunJD_current = findJDForSolarLongitude(baziYear, baziMonthDefs[0].longitude, baziMonthDefs[0].roughMonth, baziMonthDefs[0].roughDay);
    jdsForBaziYearMonths.push({ name: "立春", longitude: baziMonthDefs[0].longitude, branch: baziMonthDefs[0].branch, jd: actualLichunJD_current });

    // 2. 遍历剩余的11个八字月起始节气
    for (let i = 1; i < baziMonthDefs.length; i++) { // 从惊蛰开始
        const term = baziMonthDefs[i];
        let searchGregorianYear = baziYear;
        // 小寒 (丑月) 通常发生在公历的下一年1月份
        if (term.name === "小寒") {
            searchGregorianYear = baziYear + 1;
        }
        let jd = findJDForSolarLongitude(searchGregorianYear, term.longitude, term.roughMonth, term.roughDay);
        jdsForBaziYearMonths.push({ ...term, jd });
    }

    // 3. 添加次年立春的JD，作为最后一个八字月 (丑月) 的结束边界，也用于大运计算
    const actualLichunJD_next = findJDForSolarLongitude(baziYear + 1, baziMonthDefs[0].longitude, baziMonthDefs[0].roughMonth, baziMonthDefs[0].roughDay);
    jdsForBaziYearMonths.push({ name: "次年立春", longitude: baziMonthDefs[0].longitude, branch: baziMonthDefs[0].branch, jd: actualLichunJD_next });

    return jdsForBaziYearMonths;
}

// Re-export astronomia.julian.DateToJD as it's used elsewhere
export const DateToJD = astronomia.julian.DateToJD;
