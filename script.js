// 导入 astronomia 和 cities.json 数据
import * as astronomia from 'https://cdn.jsdelivr.net/npm/astronomia@4.1.1/+esm';
import cities from 'https://cdn.jsdelivr.net/npm/cities.json@1.1.50/+esm';

// 天干和地支数组
const heavenlyStems = ["甲", "乙", "丙", "丁", "戊", "己", "庚", "辛", "壬", "癸"];
const earthlyBranches = ["子", "丑", "寅", "卯", "辰", "巳", "午", "未", "申", "酉", "戌", "亥"];

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

// 更加精确的节气判断函数 (保持不变)
function getSolarTermByLongitude(lon) {
	// 确保黄经在 0-360 范围内
	lon = (lon % 360 + 360) % 360;

	// 二十四节气，按黄经升序排列，春分0度（或360度）
	const terms = [
		{ name: "春分", longitude: 0 },
		{ name: "清明", longitude: 15 },
		{ name: "谷雨", longitude: 30 },
		{ name: "立夏", longitude: 45 },
		{ name: "小满", longitude: 60 },
		{ name: "芒种", longitude: 75 },
		{ name: "夏至", longitude: 90 },
		{ name: "小暑", longitude: 105 },
		{ name: "大暑", longitude: 120 },
		{ name: "立秋", longitude: 135 },
		{ name: "处暑", longitude: 150 },
		{ name: "白露", longitude: 165 },
		{ name: "秋分", longitude: 180 },
		{ name: "寒露", longitude: 195 },
		{ name: "霜降", longitude: 210 },
		{ name: "立冬", longitude: 225 },
		{ name: "小雪", longitude: 240 },
		{ name: "大雪", longitude: 255 },
		{ name: "冬至", longitude: 270 },
		{ name: "小寒", longitude: 285 },
		{ name: "大寒", longitude: 300 },
		{ name: "立春", longitude: 315 },
		{ name: "雨水", longitude: 330 },
		{ name: "惊蛰", longitude: 345 }
	];

	// 查找当前黄经所属的节气区间
	for (let i = 0; i < terms.length; i++) {
		const currentTerm = terms[i];
		const nextTerm = terms[(i + 1) % terms.length]; // 循环到下一个节气

		if (currentTerm.longitude <= nextTerm.longitude) {
			// 普通情况，如 清明(15) -> 谷雨(30)
			if (lon >= currentTerm.longitude && lon < nextTerm.longitude) {
				return currentTerm.name;
			}
		} else {
			// 跨越 360/0 度的情况，例如 惊蛰(345) -> 春分(0)
			if (lon >= currentTerm.longitude || lon < nextTerm.longitude) {
				return currentTerm.name;
			}
		}
	}
	
	return "未知"; // Fallback，理论上不应到达
}

document.getElementById('combinedQueryForm').addEventListener('submit', function(event) {
	event.preventDefault();

	// 清空之前的搜索结果和错误信息
	document.getElementById('result').style.display = 'none';
	document.getElementById('errorMessage').style.display = 'none';
	document.getElementById('errorMessage').textContent = '';
	document.getElementById('yearPillarDisplay').textContent = ''; // 清空年柱显示

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
	const jd = astronomia.julian.DateToJD(utcDate);
	const T = (jd - 2451545.0) / 36525.0;
	let solarLongitude = astronomia.solar.trueLongitude(T).lon * 180 / Math.PI;
	solarLongitude = (solarLongitude % 360 + 360) % 360;

	// 判断当前节气
	const currentSolarTerm = getSolarTermByLongitude(solarLongitude);

	// --- 年柱计算逻辑 ---
	// 1. 查找当年立春的 Julian Day (立春黄经为 315 度)
	// 考虑到立春可能在2月3日或4日，先用当前输入年份查找。
	let lichunJDCurrentYear = findJDForSolarLongitude(year, 315, 2, 4); 
	let lichunDateCurrentYear = astronomia.julian.JDToDate(lichunJDCurrentYear);

	let baziYear;
	// 2. 比较出生时间 (UTC) 与立春时间 (UTC)
	if (utcDate.getTime() < lichunDateCurrentYear.getTime()) {
		// 如果出生时间在当年立春之前，则年柱为前一年的干支
		baziYear = year - 1;
		// 为了准确，还需要再次计算前一年的立春，以防跨年计算错误 (虽然 findJDForSolarLongitude 已经考虑了搜索窗口)
		// 简单起见，我们假设 roughMonth 和 roughDay 足够覆盖。
	} else {
		// 如果出生时间在当年立春或之后，则年柱为当年的干支
		baziYear = year;
	}

	// 3. 计算年柱干支
	const yearGanZhi = getGanZhiForYear(baziYear);
	// --- 年柱计算逻辑结束 ---


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
	
	document.getElementById('result').style.display = 'block';
});