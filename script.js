// 导入 astronomia 和 cities.json 数据
import * as astronomia from 'https://cdn.jsdelivr.net/npm/astronomia@4.1.1/+esm';
import cities from 'https://cdn.jsdelivr.net/npm/cities.json@1.1.50/+esm';
// 导入中国行政区域数据 (改为通过 fetch 获取)
// import regionsData from './regions_data.json'; // <--- REMOVE THIS LINE

let regionsData = []; // Declare regionsData globally, it will be populated by fetch

// --- 新增：加载 regions_data.json 的函数 ---
async function loadRegionsData() {
    try {
        const response = await fetch('./regions_data.json');
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        regionsData = await response.json();
        console.log("regions_data.json loaded successfully.");
    } catch (error) {
        console.error("Failed to load regions_data.json:", error);
        // Display an error message to the user if data loading fails
        document.getElementById('errorMessage').textContent = '无法加载地区数据，请刷新页面重试或检查文件路径。';
        document.getElementById('errorMessage').style.display = 'block';
    }
}


// 天干和地支数组
const heavenlyStems = ["甲", "乙", "丙", "丁", "戊", "己", "庚", "辛", "壬", "癸"];
const earthlyBranches = ["子", "丑", "寅", "卯", "辰", "巳", "午", "未", "申", "酉", "戌", "亥"];

// 八字月份（地支）及其对应的起始节气、黄经和大致公历日期
const baziMonthDefs = [
    { name: "立春", longitude: 315, branch: "寅", roughMonth: 2, roughDay: 4 }, // Start of 寅月
    { name: "惊蛰", longitude: 345, branch: "卯", roughMonth: 3, roughDay: 6 }, // Start of 卯月
    { name: "清明", longitude: 15, branch: "辰", roughMonth: 4, roughDay: 5 }, // Start of 辰月
    { name: "立夏", longitude: 45, branch: "巳", roughMonth: 5, roughDay: 6 }, // Start of 巳月
    { name: "芒种", longitude: 75, branch: "午", roughMonth: 6, roughDay: 6 }, // Start of 午月
    { name: "小暑", longitude: 105, branch: "未", roughMonth: 7, roughDay: 7 }, // Start of 未月
    { name: "立秋", longitude: 135, branch: "申", roughMonth: 8, roughDay: 7 }, // Start of 申月
    { name: "白露", longitude: 165, branch: "酉", roughMonth: 9, roughDay: 8 }, // Start of 酉月
    { name: "寒露", longitude: 195, branch: "戌", roughMonth: 10, roughDay: 8 }, // Start of 戌月
    { name: "立冬", longitude: 225, branch: "亥", roughMonth: 11, roughDay: 7 }, // Start of 亥月
    { name: "大雪", longitude: 255, branch: "子", roughMonth: 12, roughDay: 7 }, // Start of 子月
    { name: "小寒", longitude: 285, branch: "丑", roughMonth: 1, roughDay: 6 }  // Start of 丑月 (Gregorian next year's Jan)
];

// --- 天干五行和阴阳属性映射 ---
const stemAttributes = {
    "甲": { element: "木", yinYang: "阳" },
    "乙": { element: "木", yinYang: "阴" },
    "丙": { element: "火", yinYang: "阳" },
    "丁": { element: "火", yinYang: "阴" },
    "戊": { element: "土", yinYang: "阳" },
    "己": { element: "土", yinYang: "阴" },
    "庚": { element: "金", yinYang: "阳" },
    "辛": { element: "金", yinYang: "阴" },
    "壬": { element: "水", yinYang: "阳" },
    "癸": { element: "水", yinYang: "阴" },
};

// --- 地支藏干映射表 ---
const earthlyBranchHiddenStems = {
    "子": ["癸"],
    "丑": ["己", "癸", "辛"],
    "寅": ["甲", "丙", "戊"],
    "卯": ["乙"],
    "辰": ["戊", "乙", "癸"],
    "巳": ["丙", "庚", "戊"],
    "午": ["丁", "己"],
    "未": ["己", "丁", "乙"],
    "申": ["庚", "壬", "戊"],
    "酉": ["辛"],
    "戌": ["戊", "辛", "丁"],
    "亥": ["壬", "甲"],
};

// --- 五行相生相克规则 ---
const produces = { "木": "火", "火": "土", "土": "金", "金": "水", "水": "木" };
const controls = { "木": "土", "火": "金", "土": "水", "金": "木", "水": "火" };

/**
 * 根据日元属性和目标天干属性，计算目标天干的十神。
 * @param {object} dayMasterAttr - 日元的五行和阴阳属性 { element: "木", yinYang: "阳" }。
 * @param {object} targetStemAttr - 目标天干的五行和阴阳属性。
 * @returns {string} 对应的十神名称。
 */
function getTenGod(dayMasterAttr, targetStemAttr) {
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
function getHiddenStems(earthlyBranch) {
    return earthlyBranchHiddenStems[earthlyBranch] || [];
}

/**
 * 根据公历年份计算其对应的天干地支。
 * 参照 1900 年为庚子年。
 * @param {number} year - 公历年份。
 * @returns {string} 该年份的干支字符串。
 */
function getGanZhiForYear(year) {
    const startYear = 1900;
    const startStemIndex = 6; // 庚
    const startBranchIndex = 0; // 子

    const yearOffset = year - startYear;

    const stemIndex = (startStemIndex + yearOffset) % 10;
    const branchIndex = (startBranchIndex + yearOffset) % 12;

    return heavenlyStems[stemIndex] + earthlyBranches[branchIndex];
}

/**
 * 辅助函数：计算给定 Julian Day 的太阳黄经（度数）。
 * @param {number} jd - Julian Day。
 * @returns {number} 太阳黄经（0-360 度）。
 */
function getSolarLongitudeForJD(jd) {
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
function findJDForSolarLongitude(year, targetLonDeg, roughMonth, roughDay) {
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

        // Adjust for longitude wrap-around if targetLonDeg is near 0/360
        // This is a common issue with longitude comparisons, ensuring we compare in the "shortest path"
        let diff = (currentLon - targetLonDeg + 360) % 360;
        if (diff > 180) diff -= 360; // Now diff is in [-180, 180]

        if (diff < 0) { // currentLon is "before" targetLonDeg (e.g., current=350, target=10. current is lower)
             lowJD = midJD;
        } else { // currentLon is "at or after" targetLonDeg
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
function getBaziMonthStartJDs(baziYear) {
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

/**
 * 根据年干和月地支，计算月干。
 * @param {string} yearStem - 年干 (e.g., "甲", "乙")。
 * @param {string} monthBranch - 月地支 (e.g., "寅", "卯")。
 * @returns {string} 月干。
 */
function getStemForMonth(yearStem, monthBranch) {
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
function getBranchForHour(localHour) {
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
function getStemForHour(dayStem, hourBranch) {
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

// --- 新增：大运计算相关函数 ---

/**
 * 根据年干和性别，确定大运的顺逆行方向。
 * @param {string} yearStem - 年柱天干。
 * @param {string} gender - 性别 ('male' 或 'female')。
 * @returns {'forward' | 'backward'} 大运方向。
 */
function determineGrandCycleDirection(yearStem, gender) {
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
function calculateGrandCycleStartAge(birthJD, birthMonthTerm, allBaziMonthJDs, direction) {
    let diffJD; // Julian Day 差

    if (direction === "forward") {
        // 顺行：从出生日期到下一个节气的时间
        let nextTerm = allBaziMonthJDs.find(term => term.jd > birthJD);
        if (!nextTerm) {
            // 如果找不到下一个节气，说明出生点在当年的最后一个节气之后，但在次年立春之前
            nextTerm = allBaziMonthJDs[allBaziMonthJDs.length - 1]; // 使用次年立春作为终点
        }
        diffJD = nextTerm.jd - birthJD;
    } else { // backward
        // 逆行：从出生日期到上一个节气（即出生月柱的起始节气）的时间
        diffJD = birthJD - birthMonthTerm.jd;
    }

    const totalDaysForStartAge = diffJD;
    // 3天 = 1年 (即 1天 = 4个月, 1小时 = 5天)
    // 换算规则: 1年大运 = 3天 => 1天 = 4个月 => 1小时 = 10天 (此处有误，应为 1天 = 4月，1月=10天)
    // 修正: 1天大运 = 4个月实际时间，1个月实际时间 = (30/4) = 7.5天
    // 简化为：3天 = 1年。
    // 1年 = 12个月，所以 1天 = 4个月。
    // 1个月 = 30天，所以 1天 = 4 * 30 = 120天。
    // 所以，1天 = 120个 "天" 对应 4个月。
    // 简而言之， 1岁 = 3天。
    // 剩余天数换算：1天 = 4个月。1个月 = 30天。所以 1天 = 4个月 = (4/12)年。
    // 1天 = 4个月 = 4 * (30天) = 120天。
    // 那么，remainingDays * 4 就是实际月份。
    // 剩余天数换算成 月: remainingDays * 4 / (365.25/12)

    // 正确的换算方式: 3天 = 1岁 (虚岁)
    // 1天 = 4个月
    // 1小时 = (1/24)天 = (4/24)月 = (1/6)月
    // 1分 = (1/60)小时 = (1/360)月

    const totalHours = diffJD * 24;
    const totalMinutes = totalHours * 60;

    const years = Math.floor(totalHours / (3 * 24)); // 3天 * 24小时/天
    const remainingHours = totalHours % (3 * 24);

    const months = Math.floor(remainingHours / (24 / 4)); // 1天 = 4个月，所以1个月相当于24/4=6小时
    const remainingHoursForDays = remainingHours % (24 / 4);

    const days = Math.round(remainingHoursForDays / (24 / 30)); // 1天 = (24/30)小时, roughly
    // The previous calculation: `Math.round(daysFraction * (30 / 4))` was slightly off.
    // 1 day (actual time) = 4 months (grand cycle)
    // So, 1 hour (actual time) = 4/24 = 1/6 month (grand cycle)
    // 1 day (grand cycle) = (1/4) actual day, which is 6 hours actual time.
    // To convert remaining hours to grand cycle days:
    // If 1 month GC = 6 hours actual time, then 1 day GC = 6 hours / 30 days = 0.2 hours actual time.
    // So, remainingHoursForDays / (6/30) = remainingHoursForDays * 5. This is very small.

    // Let's stick to the common 3 days = 1 year rule for calculation:
    // Total days (actual) * (1 GC Year / 3 actual days) = Total GC Years
    // Total GC Years = years.months.days
    const totalActualDays = diffJD; // This is already in days

    const gc_years = Math.floor(totalActualDays / 3);
    const remainder_days_for_months = totalActualDays % 3; // These are actual days

    const gc_months = Math.floor(remainder_days_for_months * 4); // 1 actual day = 4 GC months
    const remainder_fraction_for_days = (remainder_days_for_months * 4) % 1; // Fractional part of GC months

    const gc_days = Math.round(remainder_fraction_for_days * (30)); // 1 GC month = 30 GC days

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
function generateGrandCyclePillars(monthGanZhi, direction, numberOfCycles, dayMasterAttributes) {
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

// --- DOM 元素引用 (新增) ---
const cityTypeRadios = document.querySelectorAll('input[name="cityType"]');
const domesticCitySelectionDiv = document.getElementById('domesticCitySelection');
const overseasCitySelectionDiv = document.getElementById('overseasCitySelection');
const provinceSelect = document.getElementById('provinceSelect');
const cityCountySelect = document.getElementById('cityCountySelect');
const cityInput = document.getElementById('cityInput'); // Overseas city input

// --- 辅助函数：填充省份/直辖市下拉框 ---
function populateProvinces() {
    provinceSelect.innerHTML = '<option value="">请选择省份/直辖市</option>';
    if (regionsData && regionsData.length > 0) { // Ensure data is loaded
        regionsData.forEach(province => {
            const option = document.createElement('option');
            option.value = province.id;
            option.textContent = province.name;
            provinceSelect.appendChild(option);
        });
    }
    cityCountySelect.innerHTML = '<option value="">请选择城市/区县</option>'; // 清空并重置城市/区县下拉框
}

// --- 辅助函数：填充城市/区县下拉框 ---
function populateCities(provinceId) {
    cityCountySelect.innerHTML = '<option value="">请选择城市/区县</option>';
    if (regionsData && regionsData.length > 0) { // Ensure data is loaded
        const selectedProvince = regionsData.find(p => p.id === provinceId);
        if (selectedProvince && selectedProvince.children) {
            selectedProvince.children.forEach(city => {
                const option = document.createElement('option');
                option.value = city.id;
                option.textContent = city.name;
                cityCountySelect.appendChild(option);
            });
        }
    }
}

// --- 初始化和事件监听器 (新增) ---
document.addEventListener('DOMContentLoaded', async () => { // <--- Make this async
    await loadRegionsData(); // <--- Load regions data first

    // 默认显示国内城市选择，并初始化
    populateProvinces(); // This will now use the loaded regionsData
    cityInput.removeAttribute('required'); // 默认海外输入不required

    // 监听城市类型选择
    cityTypeRadios.forEach(radio => {
        radio.addEventListener('change', function() {
            if (this.value === 'domestic') {
                domesticCitySelectionDiv.style.display = 'flex';
                overseasCitySelectionDiv.style.display = 'none';
                cityInput.removeAttribute('required');
                provinceSelect.setAttribute('required', 'true');
                cityCountySelect.setAttribute('required', 'true');
                populateProvinces(); // 切换时重新填充省份
                cityInput.value = ''; // 清空海外城市输入
            } else { // overseas
                domesticCitySelectionDiv.style.display = 'none';
                overseasCitySelectionDiv.style.display = 'flex';
                cityInput.setAttribute('required', 'true');
                provinceSelect.removeAttribute('required');
                cityCountySelect.removeAttribute('required');
                // 清空国内下拉框，避免残留数据
                provinceSelect.innerHTML = '<option value="">请选择省份/直辖市</option>';
                cityCountySelect.innerHTML = '<option value="">请选择城市/区县</option>';
            }
        });
    });

    // 监听省份选择，填充城市/区县
    provinceSelect.addEventListener('change', function() {
        populateCities(this.value);
    });
});


// --- 主查询逻辑 ---
document.getElementById('combinedQueryForm').addEventListener('submit', async function(event) { // <--- Make this async too
    event.preventDefault();

    // Ensure regionsData is loaded before proceeding with domestic city selection
    if (regionsData.length === 0 && document.querySelector('input[name="cityType"]:checked').value === 'domestic') {
        document.getElementById('errorMessage').textContent = '地区数据尚未加载，请稍候再试。';
        document.getElementById('errorMessage').style.display = 'block';
        return;
    }

    // 清空之前的搜索结果和错误信息
    document.getElementById('result').style.display = 'none';
    document.getElementById('errorMessage').style.display = 'none';
    document.getElementById('errorMessage').textContent = '';
    document.getElementById('yearPillarDisplay').textContent = '';
    document.getElementById('monthPillarDisplay').textContent = '';
    document.getElementById('dayPillarDisplay').textContent = '';
    document.getElementById('hourPillarDisplay').textContent = '';
    document.getElementById('yearBranchHiddenStems').innerHTML = '';
    document.getElementById('monthBranchHiddenStems').innerHTML = '';
    document.getElementById('dayBranchHiddenStems').innerHTML = '';
    document.getElementById('hourBranchHiddenStems').innerHTML = '';
    document.getElementById('grandCycleDirectionDisplay').textContent = '';
    document.getElementById('grandCycleStartAgeDisplay').textContent = '';
    document.getElementById('grandCyclesDisplay').innerHTML = '';
    document.getElementById('currentGregorianYearDisplay').textContent = '';
    document.getElementById('currentYearPillarDisplay').textContent = '';


    // 获取 UTC+8 日期/时间输入
    const year = parseInt(document.getElementById('year').value);
    const month = parseInt(document.getElementById('month').value);
    const day = parseInt(document.getElementById('day').value);
    const hour = parseInt(document.getElementById('hour').value);
    const minute = parseInt(document.getElementById('minute').value);
    const second = 0; // Default to 0 seconds

    // 获取选中的性别
    const gender = document.querySelector('input[name="gender"]:checked').value;

    // --- 城市信息获取逻辑 (修改点) ---
    const selectedCityType = document.querySelector('input[name="cityType"]:checked').value;
    let selectedCityName = '';
    let selectedCityLat = 0;
    let selectedCityLng = 0;
    let selectedCountryCode = '';

    if (selectedCityType === 'domestic') {
        const selectedProvinceId = provinceSelect.value;
        const selectedCityCountyId = cityCountySelect.value;

        if (!selectedProvinceId || !selectedCityCountyId) {
            document.getElementById('errorMessage').textContent = '请选择完整的省份和城市/区县。';
            document.getElementById('errorMessage').style.display = 'block';
            return;
        }

        const province = regionsData.find(p => p.id === selectedProvinceId);
        const city = province.children.find(c => c.id === selectedCityCountyId);

        if (city) {
            selectedCityName = city.name;
            selectedCityLat = parseFloat(city.center_lat);
            selectedCityLng = parseFloat(city.center_lon);
            selectedCountryCode = 'CN'; // 中国大陆城市
        } else {
            document.getElementById('errorMessage').textContent = '未能找到所选城市/区县的经纬度信息。';
            document.getElementById('errorMessage').style.display = 'block';
            return;
        }

    } else { // overseas
        const cityInputVal = cityInput.value.trim();
        if (!cityInputVal) {
            document.getElementById('errorMessage').textContent = '请输入城市名称。';
            document.getElementById('errorMessage').style.display = 'block';
            return;
        }

        const foundCities = cities.filter(city =>
            city.name.toLowerCase().includes(cityInputVal.toLowerCase())
        );

        if (foundCities.length === 0) {
            document.getElementById('errorMessage').textContent = `未找到城市 "${cityInputVal}" 的结果。`;
            document.getElementById('errorMessage').style.display = 'block';
            return;
        }
        const cityData = foundCities[0];
        selectedCityName = cityData.name;
        selectedCityLat = parseFloat(cityData.lat);
        selectedCityLng = parseFloat(cityData.lng);
        selectedCountryCode = cityData.country;
    }
    // --- 城市信息获取逻辑结束 ---


    // 原始输入的UTC+8时间
    const inputUtc8Date = new Date(Date.UTC(year, month - 1, day, hour, minute, second));

    // 转换为 UTC 时间
    const utcDate = new Date(Date.UTC(year, month - 1, day, hour - 8, minute, second));
    const birthJD = astronomia.julian.DateToJD(utcDate);

    // 根据经度计算时区偏移 (15度经度约等于1小时)
    const timezoneOffsetHours = selectedCityLng / 15;

    // 将 UTC 时间转换为当地时间 (这里是根据经度粗略计算的“真太阳时”)
    const localDate = new Date(utcDate.getTime() + timezoneOffsetHours * 3600 * 1000);

    // 使用 astronomia 库计算太阳黄经
    const T = (birthJD - 2451545.0) / 36525.0;
    let solarLongitude = astronomia.solar.trueLongitude(T).lon * 180 / Math.PI;
    solarLongitude = (solarLongitude % 360 + 360) % 360;

    // --- 年柱计算逻辑 ---
    const lichunJDCurrentGregorianYear = findJDForSolarLongitude(year, 315, 2, 4);
    let baziYear;
    if (birthJD < lichunJDCurrentGregorianYear) {
        baziYear = year - 1;
    } else {
        baziYear = year;
    }
    const yearGanZhi = getGanZhiForYear(baziYear);
    // --- 年柱计算逻辑结束 ---

    // --- 月柱计算逻辑 ---
    const baziMonthJDs = getBaziMonthStartJDs(baziYear);
    let monthBranch = "";
    let monthGan = "";
    let birthMonthTerm = null;

    for (let i = 0; i < baziMonthJDs.length - 1; i++) {
        const currentTerm = baziMonthJDs[i];
        const nextTerm = baziMonthJDs[i + 1];

        if (birthJD >= currentTerm.jd && birthJD < nextTerm.jd) {
            monthBranch = currentTerm.branch;
            birthMonthTerm = currentTerm;
            break;
        }
    }

    if (monthBranch) {
        monthGan = getStemForMonth(yearGanZhi[0], monthBranch);
    }
    const monthGanZhi = monthGan + monthBranch;
    // --- 月柱计算逻辑结束 ---

    // --- 日柱计算逻辑 ---
    const referenceJD = astronomia.julian.DateToJD(new Date(Date.UTC(1900, 0, 1, 0, 0, 0))); // 1900年1月1日0点UTC
    const referenceGanZhiIndex = 10; // 1900年1月1日是甲戌日 (甲戌是60干支中的第11个, 索引10)

    const localHourEffective = localDate.getUTCHours();

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

    const effectiveJDForDayPillarCalc = astronomia.julian.DateToJD(dateForDayPillar);
    const daysDifference = Math.round(effectiveJDForDayPillarCalc - referenceJD);

    let dayGanZhiIndex = (referenceGanZhiIndex + daysDifference) % 60;
    if (dayGanZhiIndex < 0) {
        dayGanZhiIndex += 60;
    }

    const dayStemIndex = Math.floor(dayGanZhiIndex / 6) % 10; // Correct calculation for stem index (60-cycle specific)
    const dayBranchIndex = dayGanZhiIndex % 12; // This is always correct

    // A simpler way for stem and branch indices based on 60-cycle:
    // referenceGanZhiIndex is 10 for 甲戌 (JiaXu).
    // Jia is stem index 0, Xu is branch index 10.
    // The correct formula for a 60-cycle (JiaZi = 0) is:
    // dayGanZhiIndex_60 = (start_60_index + daysDifference) % 60
    // stemIndex = dayGanZhiIndex_60 % 10
    // branchIndex = dayGanZhiIndex_60 % 12

    // For 1900-01-01 (甲戌), the 60-cycle index is 10.
    // 甲 (Jia) is stem 0. 戌 (Xu) is branch 10.
    // (10 % 10) = 0 (Jia)
    // (10 % 12) = 10 (Xu)
    // So the existing calculation for dayStemIndex and dayBranchIndex is actually correct if dayGanZhiIndex
    // is the 60-cycle index. Let's ensure dayGanZhiIndex is the 60-cycle index of 甲戌 (10).
    // 1900-01-01 is indeed 甲戌 day in the sexagenary cycle, and its index is 10 (0=甲子, 1=乙丑... 10=甲戌).
    // So `dayStemIndex = dayGanZhiIndex % 10` and `dayBranchIndex = dayGanZhiIndex % 12` are correct.

    const dayGanZhi = heavenlyStems[dayStemIndex] + earthlyBranches[dayBranchIndex];
    // --- 日柱计算逻辑结束 ---

    // --- 时柱计算逻辑 ---
    const hourBranch = getBranchForHour(localHourEffective);
    const hourStem = getStemForHour(dayGanZhi[0], hourBranch);
    const hourGanZhi = hourStem + hourBranch;
    // --- 时柱计算逻辑结束 ---

    // --- 十神和藏干计算逻辑 ---
    const dayMasterStem = dayGanZhi[0];
    const dayMasterAttributes = stemAttributes[dayMasterStem];

    document.getElementById('yearPillarDisplay').textContent = `${yearGanZhi} (${getTenGod(dayMasterAttributes, stemAttributes[yearGanZhi[0]])})`;
    document.getElementById('monthPillarDisplay').textContent = `${monthGanZhi} (${getTenGod(dayMasterAttributes, stemAttributes[monthGanZhi[0]])})`;

    let dayPillarGenderText = gender === 'male' ? '(日元 - 元男)' : '(日元 - 元女)';
    document.getElementById('dayPillarDisplay').textContent = `${dayGanZhi} ${dayPillarGenderText}`;

    document.getElementById('hourPillarDisplay').textContent = `${hourGanZhi} (${getTenGod(dayMasterAttributes, stemAttributes[hourGanZhi[0]])})`;

    const pillars = [
        { branch: yearGanZhi[1], displayId: 'yearBranchHiddenStems' },
        { branch: monthGanZhi[1], displayId: 'monthBranchHiddenStems' },
        { branch: dayGanZhi[1], displayId: 'dayBranchHiddenStems' },
        { branch: hourGanZhi[1], displayId: 'hourBranchHiddenStems' },
    ];

    pillars.forEach(pillar => {
        const hiddenStems = getHiddenStems(pillar.branch);
        const container = document.getElementById(pillar.displayId);

        hiddenStems.forEach(stem => {
            const stemAttributesForHidden = stemAttributes[stem];
            const element = stemAttributesForHidden.element;
            const tenGod = getTenGod(dayMasterAttributes, stemAttributesForHidden);
            const p = document.createElement('p');

            p.innerHTML = `<ruby>${stem}<rp>(</rp><rt class="element-${element}">${element}</rt><rp>)</rp></ruby> (${tenGod})`;
            container.appendChild(p);
        });
    });
    // --- 十神和藏干计算逻辑结束 ---

    // --- 大运计算与显示 ---
    const grandCycleDirection = determineGrandCycleDirection(yearGanZhi[0], gender);

    if (!birthMonthTerm) {
        document.getElementById('errorMessage').textContent = '未能确定出生月份的节气，无法计算大运。';
        document.getElementById('errorMessage').style.display = 'block';
        return;
    }

    const { years: gcStartYears, months: gcStartMonths, days: gcStartDays } =
        calculateGrandCycleStartAge(birthJD, birthMonthTerm, baziMonthJDs, grandCycleDirection);

    const grandCycles = generateGrandCyclePillars(monthGanZhi, grandCycleDirection, 8, dayMasterAttributes);

    document.getElementById('grandCycleDirectionDisplay').textContent =
        grandCycleDirection === 'forward' ? '顺行' : '逆行';
    document.getElementById('grandCycleStartAgeDisplay').textContent =
        `${gcStartYears}岁 ${gcStartMonths}月 ${gcStartDays}日`;

    const grandCyclesContainer = document.getElementById('grandCyclesDisplay');
    grandCycles.forEach((gc, index) => {
        const itemDiv = document.createElement('div');
        itemDiv.classList.add('grand-cycle-item');

        const startAge = gcStartYears + (index * 10);
        const endAge = startAge + 9;

        itemDiv.innerHTML = `
            <p class="age-range">${startAge}岁起 ~ ${endAge}岁止</p>
            <p><strong>${gc.ganZhi}</strong> (${gc.tenGod})</p>
        `;
        grandCyclesContainer.appendChild(itemDiv);
    });
    // --- 大运计算与显示结束 ---

    // --- 流年计算与显示 ---
    const currentGregorianYear = new Date().getUTCFullYear();
    const currentYearGanZhi = getGanZhiForYear(currentGregorianYear);
    const currentYearTenGod = getTenGod(dayMasterAttributes, stemAttributes[currentYearGanZhi[0]]);

    document.getElementById('currentGregorianYearDisplay').textContent = currentGregorianYear;
    document.getElementById('currentYearPillarDisplay').textContent = `${currentYearGanZhi} (${currentYearTenGod})`;
    // --- 流年计算与显示结束 ---


    // 显示结果
    document.getElementById('inputTimeUTC8').textContent = inputUtc8Date.toISOString().replace('Z', ' ').replace('T', ' ').slice(0, 19) + ' UTC+8';
    document.getElementById('inputTimeUTC').textContent = utcDate.toISOString().replace('T', ' ').slice(0, 19) + ' UTC';
    document.getElementById('cityNameDisplay').textContent = selectedCityName;
    document.getElementById('countryCodeDisplay').textContent = selectedCountryCode;
    document.getElementById('latitudeDisplay').textContent = selectedCityLat.toFixed(4);
    document.getElementById('longitudeDisplay').textContent = selectedCityLng.toFixed(4);
    document.getElementById('timezoneOffsetDisplay').textContent = timezoneOffsetHours.toFixed(4);

    const localTimeFormatter = new Intl.DateTimeFormat('zh-CN', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: false,
        timeZone: 'UTC'
    });
    document.getElementById('localTimeDisplay').textContent = localTimeFormatter.format(localDate);

    document.getElementById('solarLongitude').textContent = solarLongitude.toFixed(4);
    document.getElementById('result').style.display = 'block';
});