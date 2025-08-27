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

		// 对于目标黄经 315 度 (立春)，我们寻找黄经从小于 315 变为大于等于 315 的点
		// 如果 currentLon 小于 targetLonDeg，说明立春时刻还在 midJD 之后
		// 如果 currentLon 大于等于 targetLonDeg，说明立春时刻在 midJD 或之前
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

// 更加精确的节气判断函数 (保持不变，但在此项目中可能不是核心，因为我们主要看月起始节气)
function getSolarTermByLongitude(lon) {
	lon = (lon % 360 + 360) % 360;

	const terms = [
		{ name: "春分", longitude: 0 }, { name: "清明", longitude: 15 }, { name: "谷雨", longitude: 30 },
		{ name: "立夏", longitude: 45 }, { name: "小满", longitude: 60 }, { name: "芒种", longitude: 75 },
		{ name: "夏至", longitude: 90 }, { name: "小暑", longitude: 105 }, { name: "大暑", longitude: 120 },
		{ name: "立秋", longitude: 135 }, { name: "处暑", longitude: 150 }, { name: "白露", longitude: 165 },
		{ name: "秋分", longitude: 180 }, { name: "寒露", longitude: 195 }, { name: "霜降", longitude: 210 },
		{ name: "立冬", longitude: 225 }, { name: "小雪", longitude: 240 }, { name: "大雪", longitude: 255 },
		{ name: "冬至", longitude: 270 }, { name: "小寒", longitude: 285 }, { name: "大寒", longitude: 300 },
		{ name: "立春", longitude: 315 }, { name: "雨水", longitude: 330 }, { name: "惊蛰", longitude: 345 }
	];

	for (let i = 0; i < terms.length; i++) {
		const currentTerm = terms[i];
		const nextTerm = terms[(i + 1) % terms.length];

		if (currentTerm.longitude <= nextTerm.longitude) {
			if (lon >= currentTerm.longitude && lon < nextTerm.longitude) {
				return currentTerm.name;
			}
		} else {
			if (lon >= currentTerm.longitude || lon < nextTerm.longitude) {
				return currentTerm.name;
			}
		}
	}
	return "未知";
}

document.getElementById('combinedQueryForm').addEventListener('submit', function(event) {
	event.preventDefault();

	// 清空之前的搜索结果和错误信息
	document.getElementById('result').style.display = 'none';
	document.getElementById('errorMessage').style.display = 'none';
	document.getElementById('errorMessage').textContent = '';
	document.getElementById('yearPillarDisplay').textContent = ''; // 清空年柱显示
    document.getElementById('monthPillarDisplay').textContent = ''; // 清空月柱显示

	// 获取 UTC 日期/时间输入
	const year = parseInt(document.getElementById('year').value);
	const month = parseInt(document.getElementById('month').value);
	const day = parseInt(document.getElementById('day').value);
	const hour = parseInt(document.getElementById('hour').value);
	const minute = parseInt(document.getElementById('minute').value);
	const second = parseInt(document.getElementById('second').value);

	const cityInput = document.getElementById('cityInput').value.trim().toLowerCase();

	if (!cityInput) {
		document.getElementById('errorMessage').textContent = '请输入城市名称。';
		document.getElementById('errorMessage').style.display = 'block';
		return;
	}

	// 组合成一个 Date 对象（UTC时间）
	// 注意：Date对象的月份是从0开始的，所以需要 month - 1
	const utcDate = new Date(Date.UTC(year, month - 1, day, hour, minute, second));
    const birthJD = astronomia.julian.DateToJD(utcDate); // 出生时间的 Julian Day

	// 搜索城市数据
	const foundCities = cities.filter(city =>
		city.name.toLowerCase().includes(cityInput)
	);

	if (foundCities.length === 0) {
		document.getElementById('errorMessage').textContent = `未找到城市 "${cityInput}" 的结果。`;
		document.getElementById('errorMessage').style.display = 'block';
		return;
	}

	const selectedCity = foundCities[0]; // 为简化示例，只取第一个匹配的城市

	// 显式将经纬度字符串转换为浮点数
	const cityLat = parseFloat(selectedCity.lat);
	const cityLng = parseFloat(selectedCity.lng);

	// 根据经度计算时区偏移 (15度经度约等于1小时)
	const timezoneOffsetHours = cityLng / 15;
	
	// 将 UTC 时间转换为当地时间 (这里是根据经度粗略计算的“当地时间”，未考虑夏令时等复杂因素)
	const localDate = new Date(utcDate.getTime() + timezoneOffsetHours * 3600 * 1000);

	// 使用 astronomia 库计算太阳黄经
	const T = (birthJD - 2451545.0) / 36525.0;
	let solarLongitude = astronomia.solar.trueLongitude(T).lon * 180 / Math.PI;
	solarLongitude = (solarLongitude % 360 + 360) % 360;

	// 判断当前节气 (此处的节气是指24节气之一，不是八字月份的起始节气)
	const currentSolarTerm = getSolarTermByLongitude(solarLongitude);

	// --- 年柱计算逻辑 ---
	// 查找当年立春的 Julian Day (立春黄经为 315 度)
	let lichunJDCurrentGregorianYear = findJDForSolarLongitude(year, 315, 2, 4); 

	let baziYear;
	// 比较出生时间 (UTC) 与立春时间 (UTC)
	if (birthJD < lichunJDCurrentGregorianYear) {
		// 如果出生时间在当年立春之前，则年柱为前一年的干支
		baziYear = year - 1;
	} else {
		// 如果出生时间在当年立春或之后，则年柱为当年的干支
		baziYear = year;
	}

	// 计算年柱干支
	const yearGanZhi = getGanZhiForYear(baziYear);
	// --- 年柱计算逻辑结束 ---

    // --- 月柱计算逻辑 ---
    const baziMonthJDs = getBaziMonthStartJDs(baziYear); // 获取八字年内的所有月起始节气JDs

    let monthBranch = "";
    let monthGan = "";

    // 遍历节气JDs，找到出生时间所属的八字月份
    // baziMonthJDs 包含13个元素：从当前八字年立春到次年立春
    for (let i = 0; i < baziMonthJDs.length - 1; i++) {
        const currentTerm = baziMonthJDs[i];
        const nextTerm = baziMonthJDs[i + 1]; // 下一个节气是当前月的结束边界

        if (birthJD >= currentTerm.jd && birthJD < nextTerm.jd) {
            monthBranch = currentTerm.branch;
            break;
        }
    }

    if (monthBranch) {
        // 修正：从 yearGanZhi 中提取年干（第一个字符）传递给 getStemForMonth
        monthGan = getStemForMonth(yearGanZhi[0], monthBranch); 
    }

    const monthGanZhi = monthGan + monthBranch;
    // --- 月柱计算逻辑结束 ---


	// 显示结果
	document.getElementById('inputTimeUTC').textContent = utcDate.toISOString().replace('T', ' ').slice(0, 19) + ' UTC';
	document.getElementById('cityNameDisplay').textContent = selectedCity.name;
	document.getElementById('countryCodeDisplay').textContent = selectedCity.country;
	document.getElementById('latitudeDisplay').textContent = cityLat.toFixed(4);
	document.getElementById('longitudeDisplay').textContent = cityLng.toFixed(4);
	document.getElementById('timezoneOffsetDisplay').textContent = timezoneOffsetHours.toFixed(4);
	document.getElementById('localTimeDisplay').textContent = localDate.toLocaleString('zh-CN', {
		year: 'numeric',
		month: '2-digit',
		day: '2-digit',
		hour: '2-digit',
		minute: '2-digit',
		second: '2-digit',
		hour12: false
	});
	document.getElementById('solarLongitude').textContent = solarLongitude.toFixed(4);
	document.getElementById('solarTerm').textContent = currentSolarTerm;
	document.getElementById('yearPillarDisplay').textContent = yearGanZhi; // 显示年柱
    document.getElementById('monthPillarDisplay').textContent = monthGanZhi; // 显示月柱
	
	document.getElementById('result').style.display = 'block';
});