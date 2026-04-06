// src/locationService.js
import cities from 'https://cdn.jsdelivr.net/npm/cities.json@1.1.50/+esm';

let regionsData = []; // Declare regionsData globally, it will be populated by fetch

// --- 加载 regions_data.json 的函数 ---
export async function loadRegionsData() {
    try {
        // Adjusted path for the example structure: src/regions_data.json
        const response = await fetch('./src/regions_data.json');
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        regionsData = await response.json();
        console.log("regions_data.json loaded successfully.");
        return true; // Indicate success
    } catch (error) {
        console.error("Failed to load regions_data.json:", error);
        // Error message handling will be done by uiManager
        return false; // Indicate failure
    }
}

export function getRegionsData() {
    return regionsData;
}

/**
 * 根据城市类型和输入值查找城市信息。
 * @param {'domestic' | 'overseas'} cityType - 城市类型。
 * @param {string} provinceId - 国内省份ID (domestic only)。
 * @param {string} cityCountyId - 国内城市/区县ID (domestic only)。
 * @param {string} overseasCityInput - 海外城市输入 (overseas only)。
 * @returns {Promise<Object | null>} 包含城市名称、经纬度和国家代码的对象，或 null。
 */
export async function findCityLocation(cityType, provinceId, cityCountyId, overseasCityInput) {
    if (cityType === 'domestic') {
        if (!provinceId || !cityCountyId) {
            throw new Error('请选择完整的省份和城市/区县。');
        }

        const province = regionsData.find(p => p.id === provinceId);
        const city = province?.children?.find(c => c.id === cityCountyId);

        if (city) {
            return {
                name: city.name,
                lat: parseFloat(city.center_lat),
                lng: parseFloat(city.center_lon),
                countryCode: 'CN'
            };
        } else {
            throw new Error('未能找到所选城市/区县的经纬度信息。');
        }

    } else { // overseas
        if (!overseasCityInput) {
            throw new Error('请输入城市名称。');
        }

        const foundCities = cities.filter(city =>
            city.name.toLowerCase().includes(overseasCityInput.toLowerCase())
        );

        if (foundCities.length === 0) {
            throw new Error(`未找到城市 "${overseasCityInput}" 的结果。`);
        }
        const cityData = foundCities[0];
        return {
            name: cityData.name,
            lat: parseFloat(cityData.lat),
            lng: parseFloat(cityData.lng),
            countryCode: cityData.country
        };
    }
}
