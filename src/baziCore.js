// src/baziCore.js
import {
    heavenlyStems, earthlyBranches, stemAttributes, earthlyBranchHiddenStems,
    produces, controls
} from './constants.js';
import { findJDForSolarLongitude, getBaziMonthStartJDs, DateToJD } from './astronomyUtils.js';

/**
 * 根据日元属性和目标天干属性，计算目标天干的十神。
 * @param {object} dayMasterAttr - 日元的五行和阴阳属性 { element: "木", yinYang: "阳" }。
 * @param {object} targetStemAttr - 目标天干的五行和阴阳属性。
 * @returns {string} 对应的十神名称。
 */
export function getTenGod(dayMasterAttr, targetStemAttr) {
    if (!dayMasterAttr || !targetStemAttr) return "";

    const myElement = dayMasterAttr.element;
    const myYinYang = dayMasterAttr.yinYang;
    const targetElement = targetStemAttr.element;
    const targetYinYang = targetStemAttr.yinYang;

    // 比劫 (同我)
    if (myElement === targetElement) {
        return myYinYang === targetYinYang ? "比肩" : "劫财";
    }
    // 食伤 (我生)
    if (produces[myElement] === targetElement) {
        return myYinYang === targetYinYang ? "食神" : "伤官";
    }
    // 财星 (我克)
    if (controls[myElement] === targetElement) {
        return myYinYang === targetYinYang ? "偏财" : "正财";
    }
    // 官杀 (克我)
    if (controls[targetElement] === myElement) {
        return myYinYang === targetYinYang ? "偏官(七杀)" : "正官";
    }
    // 印枭 (生我)
    if (produces[targetElement] === myElement) {
        return myYinYang === targetYinYang ? "偏印" : "正印";
    }

    return "未知";
}

/**
 * 根据地支获取其所藏天干。
 * @param {string} earthlyBranch - 地支名称 (e.g., "子")。
 * @returns {Array<string>} 藏干列表。
 */
export function getHiddenStems(earthlyBranch) {
    return earthlyBranchHiddenStems[earthlyBranch] || [];
}

/**
 * 根据公历年份计算其对应的天干地支。
 * 参照 1900 年为庚子年。
 * @param {number} year - 公历年份。
 * @returns {string} 该年份的干支字符串。
 */
export function getGanZhiForYear(year) {
    const startYear = 1900;
    const startStemIndex = 6; // 庚
    const startBranchIndex = 0; // 子

    const yearOffset = year - startYear;

    const stemIndex = (startStemIndex + yearOffset) % 10;
    const branchIndex = (startBranchIndex + yearOffset) % 12;

    return heavenlyStems[stemIndex] + earthlyBranches[branchIndex];
}

/**
 * 根据年干和月地支，计算月干。
 * @param {string} yearStem - 年干 (e.g., "甲", "乙")。
 * @param {string} monthBranch - 月地支 (e.g., "寅", "卯")。
 * @returns {string} 月干。
 */
export function getStemForMonth(yearStem, monthBranch) {
    const yearStemIndex = heavenlyStems.indexOf(yearStem);

    let yinMonthStemIndex; // 寅月的天干索引
    if (yearStemIndex === 0 || yearStemIndex === 5) { // 甲或己
        yinMonthStemIndex = 2; // 丙
    } else if (yearStemIndex === 1 || yearStemIndex === 6) { // 乙或庚
        yinMonthStemIndex = 4; // 戊
    } else if (yearStemIndex === 2 || yearStemIndex === 7) { // 丙或辛
        yinMonthStemIndex = 6; // 庚
    } else if (yearStemIndex === 3 || yearStemIndex === 8) { // 丁或壬
        yinMonthStemIndex = 8; // 壬
    } else { // 戊或癸
        yinMonthStemIndex = 0; // 甲
    }

    const monthBranchActualIndex = earthlyBranches.indexOf(monthBranch);
    const yinBranchActualIndex = earthlyBranches.indexOf("寅");

    const offset = (monthBranchActualIndex - yinBranchActualIndex + 12) % 12;
    const monthStemIndex = (yinMonthStemIndex + offset) % 10;

    return heavenlyStems[monthStemIndex];
}

/**
 * 根据当地时间的小时数（0-23）获取时柱地支。
 * @param {number} localHour - 当地时间的小时数 (0-23)。
 * @returns {string} 对应的时支。
 */
export function getBranchForHour(localHour) {
    if (localHour >= 23 || localHour < 1) return "子"; // 23:00-00:59
    if (localHour >= 1 && localHour < 3) return "丑";
    if (localHour >= 3 && localHour < 5) return "寅";
    if (localHour >= 5 && localHour < 7) return "卯";
    if (localHour >= 7 && localHour < 9) return "辰";
    if (localHour >= 9 && localHour < 11) return "巳";
    if (localHour >= 11 && localHour < 13) return "午";
    if (localHour >= 13 && localHour < 15) return "未";
    if (localHour >= 15 && localHour < 17) return "申";
    if (localHour >= 17 && localHour < 19) return "酉";
    if (localHour >= 19 && localHour < 21) return "戌";
    if (localHour >= 21 && localHour < 23) return "亥";
    return "";
}

/**
 * 根据日干和时支，计算时干。
 * @param {string} dayStem - 日干 (e.g., "甲", "乙")。
 * @param {string} hourBranch - 时地支 (e.g., "子", "丑")。
 * @returns {string} 时干。
 */
export function getStemForHour(dayStem, hourBranch) {
    const dayStemIndex = heavenlyStems.indexOf(dayStem);

    let ziHourStemIndex; // 子时的天干索引
    if (dayStemIndex === 0 || dayStemIndex === 5) { // 甲或己
        ziHourStemIndex = 0; // 甲
    } else if (dayStemIndex === 1 || dayStemIndex === 6) { // 乙或庚
        ziHourStemIndex = 2; // 丙
    } else if (dayStemIndex === 2 || dayStemIndex === 7) { // 丙或辛
        ziHourStemIndex = 4; // 戊
    } else if (dayStemIndex === 3 || dayStemIndex === 8) { // 丁或壬
        ziHourStemIndex = 6; // 庚
    } else { // 戊或癸
        ziHourStemIndex = 8; // 壬
    }

    const hourBranchActualIndex = earthlyBranches.indexOf(hourBranch);
    const ziBranchActualIndex = earthlyBranches.indexOf("子");

    const offset = (hourBranchActualIndex - ziBranchActualIndex + 12) % 12;
    const hourStemIndex = (ziHourStemIndex + offset) % 10;

    return heavenlyStems[hourStemIndex];
}


/**
 * 计算八字四柱。
 * @param {Object} birthDateTimeUTC8 - 出生日期时间 (UTC+8)。
 * @param {Object} location - 城市经纬度信息 { lat, lng }。
 * @returns {Object} 包含年、月、日、时四柱及其相关信息。
 */
export function calculateBaZiPillars(birthDateTimeUTC8, location) {
    const { year, month, day, hour, minute, second } = birthDateTimeUTC8;
    const { lat, lng } = location;

    // 原始输入的UTC+8时间
    const inputUtc8Date = new Date(Date.UTC(year, month - 1, day, hour, minute, second));

    // 转换为 UTC 时间
    const utcDate = new Date(Date.UTC(year, month - 1, day, hour - 8, minute, second));
    const birthJD = DateToJD(utcDate);

    // 根据经度计算时区偏移 (15度经度约等于1小时)
    const timezoneOffsetHours = lng / 15;

    // 将 UTC 时间转换为当地时间 (这里是根据经度粗略计算的“真太阳时”)
    const localDate = new Date(utcDate.getTime() + timezoneOffsetHours * 3600 * 1000);
    const localHourEffective = localDate.getUTCHours();

    // --- 年柱计算逻辑 ---
    // 立春JD的计算需要公历年份
    const lichunJDCurrentGregorianYear = findJDForSolarLongitude(year, 315, 2, 4);
    let baziYearGregorian; // 公历年份对应的八字年
    if (birthJD < lichunJDCurrentGregorianYear) {
        baziYearGregorian = year - 1;
    } else {
        baziYearGregorian = year;
    }
    const yearGanZhi = getGanZhiForYear(baziYearGregorian);

    // --- 月柱计算逻辑 ---
    const baziMonthJDs = getBaziMonthStartJDs(baziYearGregorian);
    let monthBranch = "";
    let monthGan = "";
    let birthMonthTerm = null; // 用于大运计算

    for (let i = 0; i < baziMonthJDs.length - 1; i++) {
        const currentTerm = baziMonthJDs[i];
        const nextTerm = baziMonthJDs[i + 1];

        if (birthJD >= currentTerm.jd && birthJD < nextTerm.jd) {
            monthBranch = currentTerm.branch;
            birthMonthTerm = currentTerm;
            break;
        }
    }

    if (!monthBranch) {
        throw new Error("未能确定出生月份的节气。");
    }
    monthGan = getStemForMonth(yearGanZhi[0], monthBranch);
    const monthGanZhi = monthGan + monthBranch;

    // --- 日柱计算逻辑 ---
    const referenceJD = DateToJD(new Date(Date.UTC(1900, 0, 1, 0, 0, 0))); // 1900年1月1日0点UTC
    const referenceGanZhiIndex = 10; // 1900年1月1日是甲戌日 (甲戌是60干支中的第11个, 索引10)

    let dateForDayPillar = new Date(Date.UTC(
        localDate.getUTCFullYear(),
        localDate.getUTCMonth(),
        localDate.getUTCDate(),
        0, 0, 0
    ));

    // 如果真太阳时在晚上23点以后，日柱按次日计算 (子时换日)
    if (localHourEffective >= 23) {
        dateForDayPillar.setUTCDate(dateForDayPillar.getUTCDate() + 1);
    }

    const effectiveJDForDayPillarCalc = DateToJD(dateForDayPillar);
    const daysDifference = Math.round(effectiveJDForDayPillarCalc - referenceJD);

    const dayGanZhiIndex = (referenceGanZhiIndex + daysDifference) % 60;
    const dayStemIndex = dayGanZhiIndex % 10;
    const dayBranchIndex = dayGanZhiIndex % 12;

    const dayGanZhi = heavenlyStems[dayStemIndex] + earthlyBranches[dayBranchIndex];

    // --- 时柱计算逻辑 ---
    const hourBranch = getBranchForHour(localHourEffective);
    const hourStem = getStemForHour(dayGanZhi[0], hourBranch);
    const hourGanZhi = hourStem + hourBranch;

    // --- 十神和藏干计算所需的基础属性 ---
    const dayMasterStem = dayGanZhi[0];
    const dayMasterAttributes = stemAttributes[dayMasterStem];

    return {
        inputUtc8Date,
        utcDate,
        birthJD,
        timezoneOffsetHours,
        localDate,
        localHourEffective,
        baziYearGregorian, // The Gregorian year used to derive BaZi year
        yearGanZhi,
        monthGanZhi,
        dayGanZhi,
        hourGanZhi,
        dayMasterStem,
        dayMasterAttributes,
        birthMonthTerm, // For Grand Cycle calc
        allBaziMonthJDs: baziMonthJDs, // For Grand Cycle calc
        solarLongitude: null // Will be calculated in main.js or other module if needed for display
    };
}
