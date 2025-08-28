// 导入 astronomia 和 cities.json 数据
import * as astronomia from 'https://cdn.jsdelivr.net/npm/astronomia@4.1.1/+esm';
import cities from 'https://cdn.jsdelivr.net/npm/cities.json@1.1.50/+esm';

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

// --- 新增：天干五行和阴阳属性映射 ---
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

// --- 新增：地支藏干映射表 ---
// 每个地支对应一个藏干天干数组
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

// --- 新增：五行相生相克规则 ---
// key 生 value
const produces = {
    "木": "火",
    "火": "土",
    "土": "金",
    "金": "水",
    "水": "木",
};

// key 克 value
const controls = {
    "木": "土",
    "火": "金",
    "土": "水",
    "金": "木",
    "水": "火",
};

/**
 * 根据日元属性和目标天干属性，计算目标天干的十神。
 * @param {object} dayMasterAttr - 日元的五行和阴阳属性 { element: "木", yinYang: "阳" }。
 * @param {object} targetStemAttr - 目标天干的五行和阴阳属性。
 * @returns {string} 对应的十神名称。
 */
function getTenGod(dayMasterAttr, targetStemAttr) {
    if (!dayMasterAttr || !targetStemAttr) return ""; // 防御性编程

    const myElement = dayMasterAttr.element;
    const myYinYang = dayMasterAttr.yinYang;
    const targetElement = targetStemAttr.element;
    const targetYinYang = targetStemAttr.yinYang;

    // 与我同类 (比肩/劫财)
    if (myElement === targetElement) {
        return myYinYang === targetYinYang ? "比肩" : "劫财";
    }

    // 我生出 (食神/伤官)
    if (produces[myElement] === targetElement) {
        return myYinYang === targetYinYang ? "食神" : "伤官";
    }

    // 我克制 (正财/偏财)
    if (controls[myElement] === targetElement) {
        return myYinYang === targetYinYang ? "偏财" : "正财"; // 我克者为财，同性偏财，异性正财
    }

    // 克制我 (正官/偏官)
    // 关键修改在这里：将“偏官”显示为“偏官 (七杀)”
    if (controls[targetElement] === myElement) {
        return myYinYang === targetYinYang ? "偏官 (七杀)" : "正官"; // 克我者为官杀，同性偏官(七杀)，异性正官
    }

    // 生扶我 (正印/偏印)
    if (produces[targetElement] === myElement) {
        return myYinYang === targetYinYang ? "偏印" : "正印"; // 生我者为印枭，同性偏印，异性正印
    }

    return "未知"; // 理论上不会发生，除非数据有误
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
    // 1900 年是庚子年
    // 庚 (Geng) 是天干的第 7 位 (索引 6)
    // 子 (Zi) 是地支的第 1 位 (索引 0)
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
 * 用于查找节气交接时间，例如立春（黄经 315 度）。
 * @param {number} year - 公历年份。
 * @param {number} targetLonDeg - 目标太阳黄经（0-360 度）。
 * @param {number} roughMonth - 目标节气大致所在的月份（1-12）。
 * @param {number} roughDay - 目标节气大致所在的日期。
 * @returns {number} Julian Day，表示达到目标黄经的精确时刻。
 */
function findJDForSolarLongitude(year, targetLonDeg, roughMonth, roughDay) {
    // 定义一个围绕粗略日期的搜索窗口，例如立春通常在2月3-5日，我们设定1月20日到2月20日。
    // 使用 UTC 时间，因为 astronomia 库的计算基于此
    let searchStart = new Date(Date.UTC(year, roughMonth - 1, roughDay - 15, 0, 0, 0));
    let searchEnd = new Date(Date.UTC(year, roughMonth - 1, roughDay + 15, 23, 59, 59));

    let lowJD = astronomia.julian.DateToJD(searchStart);
    let highJD = astronomia.julian.DateToJD(searchEnd);

    // 设置一个足够小的容忍度，例如 1/86400 Julian Day (1秒)
    const toleranceJD = 1 / (24 * 60 * 60);

    let iterationCount = 0;
    const maxIterations = 100; // 防止无限循环

    while (highJD - lowJD > toleranceJD && iterationCount < maxIterations) {
        let midJD = (lowJD + highJD) / 2;
        let currentLon = getSolarLongitudeForJD(midJD);

        // 如果 solarLon 随时间单调递增，且我们寻找首次达到或超过 targetLonDeg 的点
        if (currentLon < targetLonDeg) {
             lowJD = midJD;
        } else {
             highJD = midJD;
        }

        iterationCount++;
    }
    return highJD; // 返回高边界，它更接近实际时刻（或者说，是黄经首次达到或超过目标值的点）
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

    // 3. 添加次年立春的JD，作为最后一个八字月 (丑月) 的结束边界
    const actualLichunJD_next = findJDForSolarLongitude(baziYear + 1, baziMonthDefs[0].longitude, baziMonthDefs[0].roughMonth, baziMonthDefs[0].roughDay);
    jdsForBaziYearMonths.push({ name: "次年立春", longitude: baziMonthDefs[0].longitude, branch: baziMonthDefs[0].branch, jd: actualLichunJD_next });

    return jdsForBaziYearMonths;
}

/**
 * 根据年干和月地支，计算月干。
 * 使用五虎遁月歌诀。
 * @param {string} yearStem - 年干 (e.g., "甲", "乙")。
 * @param {string} monthBranch - 月地支 (e.g., "寅", "卯")。
 * @returns {string} 月干。
 */
function getStemForMonth(yearStem, monthBranch) {
    const yearStemIndex = heavenlyStems.indexOf(yearStem);

    // 根据年干确定寅月的天干 (五虎遁月歌诀)
    let yinMonthStemIndex;
    if (yearStemIndex === heavenlyStems.indexOf("甲") || yearStemIndex === heavenlyStems.indexOf("己")) {
        yinMonthStemIndex = heavenlyStems.indexOf("丙"); // 甲己之年丙作首
    } else if (yearStemIndex === heavenlyStems.indexOf("乙") || yearStemIndex === heavenlyStems.indexOf("庚")) {
        yinMonthStemIndex = heavenlyStems.indexOf("戊"); // 乙庚之岁戊为头
    } else if (yearStemIndex === heavenlyStems.indexOf("丙") || yearStemIndex === heavenlyStems.indexOf("辛")) {
        yinMonthStemIndex = heavenlyStems.indexOf("庚"); // 丙辛之岁寻庚上
    } else if (yearStemIndex === heavenlyStems.indexOf("丁") || yearStemIndex === heavenlyStems.indexOf("壬")) {
        yinMonthStemIndex = heavenlyStems.indexOf("壬"); // 丁壬壬位顺水流
    } else { // 戊 or 癸
        yinMonthStemIndex = heavenlyStems.indexOf("甲"); // 戊癸之年甲寅居
    }

    // 获取月地支和寅地支在 earthlyBranches 数组中的实际索引
    const monthBranchActualIndex = earthlyBranches.indexOf(monthBranch);
    const yinBranchActualIndex = earthlyBranches.indexOf("寅");

    // 计算月地支相对于寅月地支的偏移量 (0-11)
    const offset = (monthBranchActualIndex - yinBranchActualIndex + 12) % 12;

    // 计算最终的月干索引
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
    return ""; // Should not happen with valid hour input
}

/**
 * 根据日干和时支，计算时干。
 * 使用五鼠遁时歌诀。
 * @param {string} dayStem - 日干 (e.g., "甲", "乙")。
 * @param {string} hourBranch - 时地支 (e.g., "子", "丑")。
 * @returns {string} 时干。
 */
function getStemForHour(dayStem, hourBranch) {
    const dayStemIndex = heavenlyStems.indexOf(dayStem);

    // 根据日干确定子时 (Zi hour) 的天干 (五鼠遁时歌诀)
    let ziHourStemIndex;
    if (dayStemIndex === heavenlyStems.indexOf("甲") || dayStemIndex === heavenlyStems.indexOf("己")) {
        ziHourStemIndex = heavenlyStems.indexOf("甲"); // 甲己还加甲
    } else if (dayStemIndex === heavenlyStems.indexOf("乙") || dayStemIndex === heavenlyStems.indexOf("庚")) {
        ziHourStemIndex = heavenlyStems.indexOf("丙"); // 乙庚丙作初
    } else if (dayStemIndex === heavenlyStems.indexOf("丙") || dayStemIndex === heavenlyStems.indexOf("辛")) {
        ziHourStemIndex = heavenlyStems.indexOf("戊"); // 丙辛从戊起
    } else if (dayStemIndex === heavenlyStems.indexOf("丁") || dayStemIndex === heavenlyStems.indexOf("壬")) {
        ziHourStemIndex = heavenlyStems.indexOf("庚"); // 丁壬庚子居
    } else { // 戊 or 癸
        ziHourStemIndex = heavenlyStems.indexOf("壬"); // 戊癸何方发 (壬子居)
    }

    // 获取时地支和子地支在 earthlyBranches 数组中的实际索引
    const hourBranchActualIndex = earthlyBranches.indexOf(hourBranch);
    const ziBranchActualIndex = earthlyBranches.indexOf("子");

    // 计算时地支相对于子时地支的偏移量 (0-11)
    const offset = (hourBranchActualIndex - ziBranchActualIndex + 12) % 12;

    // 计算最终的时干索引
    const hourStemIndex = (ziHourStemIndex + offset) % 10;

    return heavenlyStems[hourStemIndex];
}


document.getElementById('combinedQueryForm').addEventListener('submit', function(event) {
    event.preventDefault();

    // 清空之前的搜索结果和错误信息
    document.getElementById('result').style.display = 'none';
    document.getElementById('errorMessage').style.display = 'none';
    document.getElementById('errorMessage').textContent = '';
    // 清空四柱显示
    document.getElementById('yearPillarDisplay').textContent = '';
    document.getElementById('monthPillarDisplay').textContent = '';
    document.getElementById('dayPillarDisplay').textContent = '';
    document.getElementById('hourPillarDisplay').textContent = '';
    // 清空藏干显示
    document.getElementById('yearBranchHiddenStems').innerHTML = '';
    document.getElementById('monthBranchHiddenStems').innerHTML = '';
    document.getElementById('dayBranchHiddenStems').innerHTML = '';
    document.getElementById('hourBranchHiddenStems').innerHTML = '';


    // 获取 UTC+8 日期/时间输入
    const year = parseInt(document.getElementById('year').value);
    const month = parseInt(document.getElementById('month').value);
    const day = parseInt(document.getElementById('day').value);
    const hour = parseInt(document.getElementById('hour').value);
    const minute = parseInt(document.getElementById('minute').value);
    const second = parseInt(document.getElementById('second').value);

    const cityInput = document.getElementById('cityInput').value.trim().toLowerCase();
    const gender = document.getElementById('gender').value; // <-- 新增：获取性别输入

    if (!cityInput) {
        document.getElementById('errorMessage').textContent = '请输入城市名称。';
        document.getElementById('errorMessage').style.display = 'block';
        return;
    }

    // 原始输入的UTC+8时间
    const inputUtc8Date = new Date(Date.UTC(year, month - 1, day, hour, minute, second)); 

    // 组合成一个 Date 对象（UTC时间）
    const utcDate = new Date(Date.UTC(year, month - 1, day, hour - 8, minute, second)); 
    const birthJD = astronomia.julian.DateToJD(utcDate); 

    // 搜索城市数据
    const foundCities = cities.filter(city =>
        city.name.toLowerCase().includes(cityInput)
    );

    if (foundCities.length === 0) {
        document.getElementById('errorMessage').textContent = `未找到城市 "${cityInput}" 的结果。`;
        document.getElementById('errorMessage').style.display = 'block';
        return;
    }

    const selectedCity = foundCities[0]; 

    // 显式将经纬度字符串转换为浮点数
    const cityLat = parseFloat(selectedCity.lat);
    const cityLng = parseFloat(selectedCity.lng);

    // 根据经度计算时区偏移 (15度经度约等于1小时)
    const timezoneOffsetHours = cityLng / 15;
    
    // 将 UTC 时间转换为当地时间 (这里是根据经度粗略计算的“真太阳时”)
    const localDate = new Date(utcDate.getTime() + timezoneOffsetHours * 3600 * 1000);

    // 使用 astronomia 库计算太阳黄经
    const T = (birthJD - 2451545.0) / 36525.0;
    let solarLongitude = astronomia.solar.trueLongitude(T).lon * 180 / Math.PI;
    solarLongitude = (solarLongitude % 360 + 360) % 360;

    // --- 年柱计算逻辑 ---
    let lichunJDCurrentGregorianYear = findJDForSolarLongitude(year, 315, 2, 4); 

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

    for (let i = 0; i < baziMonthJDs.length - 1; i++) {
        const currentTerm = baziMonthJDs[i];
        const nextTerm = baziMonthJDs[i + 1]; 

        if (birthJD >= currentTerm.jd && birthJD < nextTerm.jd) {
            monthBranch = currentTerm.branch;
            break;
        }
    }

    if (monthBranch) {
        monthGan = getStemForMonth(yearGanZhi[0], monthBranch); 
    }
    const monthGanZhi = monthGan + monthBranch;
    // --- 月柱计算逻辑结束 ---

    // --- 日柱计算逻辑 ---
    const referenceJD = astronomia.julian.DateToJD(new Date(Date.UTC(1900, 0, 1, 0, 0, 0)));
    const referenceGanZhiIndex = 10; // 甲戌

    const localHourEffective = localDate.getUTCHours(); 
    
    let dateForDayPillar = new Date(Date.UTC(
        localDate.getUTCFullYear(),
        localDate.getUTCMonth(),
        localDate.getUTCDate(),
        0, 0, 0 
    ));

    if (localHourEffective >= 23) {
        dateForDayPillar.setUTCDate(dateForDayPillar.getUTCDate() + 1); 
    }

    const effectiveJDForDayPillarCalc = astronomia.julian.DateToJD(dateForDayPillar);
    const daysDifference = Math.round(effectiveJDForDayPillarCalc - referenceJD);
    
    let dayGanZhiIndex = (referenceGanZhiIndex + daysDifference) % 60;
    if (dayGanZhiIndex < 0) {
        dayGanZhiIndex += 60; 
    }

    const dayStemIndex = dayGanZhiIndex % 10;
    const dayBranchIndex = dayGanZhiIndex % 12;
    const dayGanZhi = heavenlyStems[dayStemIndex] + earthlyBranches[dayBranchIndex];
    // --- 日柱计算逻辑结束 ---

    // --- 时柱计算逻辑 ---
    const hourBranch = getBranchForHour(localHourEffective);
    const hourStem = getStemForHour(dayGanZhi[0], hourBranch); 
    const hourGanZhi = hourStem + hourBranch;
    // --- 时柱计算逻辑结束 ---

    // --- 十神和藏干计算逻辑 ---

    // 1. 获取日元（日柱天干）的属性
    const dayMasterStem = dayGanZhi[0]; 
    const dayMasterAttributes = stemAttributes[dayMasterStem];

    // 2. 计算天干的十神并更新显示
    document.getElementById('yearPillarDisplay').textContent = `${yearGanZhi} (${getTenGod(dayMasterAttributes, stemAttributes[yearGanZhi[0]])})`;
    document.getElementById('monthPillarDisplay').textContent = `${monthGanZhi} (${getTenGod(dayMasterAttributes, stemAttributes[monthGanZhi[0]])})`;
    
    // 日柱显示增加性别标识
    let dayPillarGenderText = gender === 'male' ? '(日元 - 元男)' : '(日元 - 元女)';
    document.getElementById('dayPillarDisplay').textContent = `${dayGanZhi} ${dayPillarGenderText}`; 

    document.getElementById('hourPillarDisplay').textContent = `${hourGanZhi} (${getTenGod(dayMasterAttributes, stemAttributes[hourGanZhi[0]])})`;

    // 3. 计算地支藏干及其十神
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
            const element = stemAttributesForHidden.element; // 获取五行属性，例如 "木"
            const tenGod = getTenGod(dayMasterAttributes, stemAttributesForHidden);
            const p = document.createElement('p');
            
            // 修改这里：给 <rt> 标签添加一个基于五行的类名，例如 "element-木"
            p.innerHTML = `<ruby>${stem}<rp>(</rp><rt class="element-${element}">${element}</rt><rp>)</rp></ruby> (${tenGod})`;
            container.appendChild(p);
        });
    });

    // --- 十神和藏干计算逻辑结束 ---


    // 显示结果
    document.getElementById('inputTimeUTC8').textContent = inputUtc8Date.toISOString().replace('Z', ' ').replace('T', ' ').slice(0, 19) + ' UTC+8'; 
    document.getElementById('inputTimeUTC').textContent = utcDate.toISOString().replace('T', ' ').slice(0, 19) + ' UTC'; 
    document.getElementById('cityNameDisplay').textContent = selectedCity.name;
    document.getElementById('countryCodeDisplay').textContent = selectedCity.country;
    document.getElementById('latitudeDisplay').textContent = cityLat.toFixed(4);
    document.getElementById('longitudeDisplay').textContent = cityLng.toFixed(4);
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