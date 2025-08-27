// 在文件的最顶部导入 astronomia，使用命名空间导入
import * as astronomia from 'https://cdn.jsdelivr.net/npm/astronomia@4.1.1/+esm';

// 更加精确的节气判断函数
function getSolarTermByLongitude(lon) {
    // 确保黄经在 0-360 范围内
    lon = (lon % 360 + 360) % 360;

    // 二十四节气，按黄经升序排列，春分0度（或360度）
    // 为了方便逻辑判断，我们把立春放在列表最后，并处理360度的情况
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

document.getElementById('solarTermsForm').addEventListener('submit', function(event) {
    event.preventDefault();

    const year = parseInt(document.getElementById('year').value);
    const month = parseInt(document.getElementById('month').value);
    const day = parseInt(document.getElementById('day').value);
    const hour = parseInt(document.getElementById('hour').value);
    const minute = parseInt(document.getElementById('minute').value);
    const second = parseInt(document.getElementById('second').value);

    // 组合成一个Date对象（UTC时间）
    // 注意：Date对象的月份是从0开始的，所以需要 month - 1
    const utcDate = new Date(Date.UTC(year, month - 1, day, hour, minute, second));

    // 使用 astronomia 库进行计算
    // 1. 将Date对象转换为儒略日 (Julian Day)
    const jd = astronomia.julian.DateToJD(utcDate);

    // 2. 将儒略日转换为自 J2000 以来的儒略世纪数 (T)
    // J2000.0 儒略日是 2451545.0
    // 一个儒略世纪是 36525 天
    const T = (jd - 2451545.0) / 36525.0;

    // 3. 计算太阳的黄经
    // astronomia.solar.trueLongitude(T) 返回一个包含 'lon' (弧度) 的对象
    const solarPosition = astronomia.solar.trueLongitude(T);
    
    // 将弧度转换为度数
    let solarLongitude = solarPosition.lon * 180 / Math.PI;

    // 确保黄经度数调整到 0-360 度范围
    solarLongitude = (solarLongitude % 360 + 360) % 360;

    // 4. 判断当前节气
    const currentSolarTerm = getSolarTermByLongitude(solarLongitude);

    // 显示结果
    document.getElementById('inputTime').textContent = utcDate.toISOString();
    document.getElementById('solarLongitude').textContent = solarLongitude.toFixed(4); // 保留4位小数
    document.getElementById('solarTerm').textContent = currentSolarTerm;
    document.getElementById('result').style.display = 'block';
});