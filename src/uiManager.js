// src/uiManager.js
import { getRegionsData } from './locationService.js';
import { stemAttributes } from './constants.js';

// --- DOM 元素引用 ---
const cityTypeRadios = document.querySelectorAll('input[name="cityType"]');
const domesticCitySelectionDiv = document.getElementById('domesticCitySelection');
const overseasCitySelectionDiv = document.getElementById('overseasCitySelection');
const provinceSelect = document.getElementById('provinceSelect');
const cityCountySelect = document.getElementById('cityCountySelect');
const cityInput = document.getElementById('cityInput'); // Overseas city input
const errorMessageDisplay = document.getElementById('errorMessage');

const resultSection = document.getElementById('result');
const inputTimeUTC8Display = document.getElementById('inputTimeUTC8');
const inputTimeUTCDisplay = document.getElementById('inputTimeUTC');
const cityNameDisplay = document.getElementById('cityNameDisplay');
const countryCodeDisplay = document.getElementById('countryCodeDisplay');
const latitudeDisplay = document.getElementById('latitudeDisplay');
const longitudeDisplay = document.getElementById('longitudeDisplay');
const timezoneOffsetDisplay = document.getElementById('timezoneOffsetDisplay');
const localTimeDisplay = document.getElementById('localTimeDisplay');
const solarLongitudeDisplay = document.getElementById('solarLongitude');

const yearPillarDisplay = document.getElementById('yearPillarDisplay');
const monthPillarDisplay = document.getElementById('monthPillarDisplay');
const dayPillarDisplay = document.getElementById('dayPillarDisplay');
const hourPillarDisplay = document.getElementById('hourPillarDisplay');

const yearBranchHiddenStemsContainer = document.getElementById('yearBranchHiddenStems');
const monthBranchHiddenStemsContainer = document.getElementById('monthBranchHiddenStems');
const dayBranchHiddenStemsContainer = document.getElementById('dayBranchHiddenStems');
const hourBranchHiddenStemsContainer = document.getElementById('hourBranchHiddenStems');

const grandCycleDirectionDisplay = document.getElementById('grandCycleDirectionDisplay');
const grandCycleStartAgeDisplay = document.getElementById('grandCycleStartAgeDisplay');
const grandCyclesContainer = document.getElementById('grandCyclesDisplay');

const currentGregorianYearDisplay = document.getElementById('currentGregorianYearDisplay');
const currentYearPillarDisplay = document.getElementById('currentYearPillarDisplay');


// --- 辅助函数：填充省份/直辖市下拉框 ---
export function populateProvinces() {
    provinceSelect.innerHTML = '<option value="">请选择省份/直辖市</option>';
    const regions = getRegionsData();
    if (regions && regions.length > 0) {
        regions.forEach(province => {
            const option = document.createElement('option');
            option.value = province.id;
            option.textContent = province.name;
            provinceSelect.appendChild(option);
        });
    }
    cityCountySelect.innerHTML = '<option value="">请选择城市/区县</option>';
}

// --- 辅助函数：填充城市/区县下拉框 ---
export function populateCities(provinceId) {
    cityCountySelect.innerHTML = '<option value="">请选择城市/区县</option>';
    const regions = getRegionsData();
    if (regions && regions.length > 0) {
        const selectedProvince = regions.find(p => p.id === provinceId);
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

export function initializeUI() {
    populateProvinces(); // Initial population
    cityInput.removeAttribute('required'); // Overseas input not required by default

    // Set up radio button listeners
    cityTypeRadios.forEach(radio => {
        radio.addEventListener('change', function() {
            if (this.value === 'domestic') {
                domesticCitySelectionDiv.style.display = 'flex';
                overseasCitySelectionDiv.style.display = 'none';
                cityInput.removeAttribute('required');
                provinceSelect.setAttribute('required', 'true');
                cityCountySelect.setAttribute('required', 'true');
                populateProvinces(); // Re-populate provinces when switching to domestic
                cityInput.value = ''; // Clear overseas city input
                clearError();
            } else { // overseas
                domesticCitySelectionDiv.style.display = 'none';
                overseasCitySelectionDiv.style.display = 'flex';
                cityInput.setAttribute('required', 'true');
                provinceSelect.removeAttribute('required');
                cityCountySelect.removeAttribute('required');
                // Clear domestic dropdowns to prevent stale data
                provinceSelect.innerHTML = '<option value="">请选择省份/直辖市</option>';
                cityCountySelect.innerHTML = '<option value="">请选择城市/区县</option>';
                clearError();
            }
        });
    });

    // Set up province select listener
    provinceSelect.addEventListener('change', function() {
        populateCities(this.value);
        clearError();
    });
}

export function getFormInputs() {
    return {
        year: parseInt(document.getElementById('year').value),
        month: parseInt(document.getElementById('month').value),
        day: parseInt(document.getElementById('day').value),
        hour: parseInt(document.getElementById('hour').value),
        minute: parseInt(document.getElementById('minute').value),
        gender: document.querySelector('input[name="gender"]:checked').value,
        cityType: document.querySelector('input[name="cityType"]:checked').value,
        provinceId: provinceSelect.value,
        cityCountyId: cityCountySelect.value,
        overseasCityInput: cityInput.value.trim(),
    };
}

export function displayError(message) {
    errorMessageDisplay.textContent = message;
    errorMessageDisplay.style.display = 'block';
    resultSection.style.display = 'none'; // Hide results if there's an error
    // --- 优化：错误信息出现时也滚动到错误信息 ---
    errorMessageDisplay.scrollIntoView({ behavior: 'smooth', block: 'center' });
    // --- 结束优化 ---
}

export function clearError() {
    errorMessageDisplay.textContent = '';
    errorMessageDisplay.style.display = 'none';
}

export function clearResults() {
    resultSection.style.display = 'none';
    yearPillarDisplay.textContent = '';
    monthPillarDisplay.textContent = '';
    dayPillarDisplay.textContent = '';
    hourPillarDisplay.textContent = '';
    yearBranchHiddenStemsContainer.innerHTML = '';
    monthBranchHiddenStemsContainer.innerHTML = '';
    dayBranchHiddenStemsContainer.innerHTML = '';
    hourBranchHiddenStemsContainer.innerHTML = '';
    grandCycleDirectionDisplay.textContent = '';
    grandCycleStartAgeDisplay.textContent = '';
    grandCyclesContainer.innerHTML = '';
    currentGregorianYearDisplay.textContent = '';
    currentYearPillarDisplay.textContent = '';
}


export function updateResultsDisplay(baziData, location, gender, grandCycleData, currentYearGanZhi, currentYearTenGod, getTenGod, getHiddenStems) {
    clearError();

    const {
        inputUtc8Date, utcDate, timezoneOffsetHours, localDate,
        yearGanZhi, monthGanZhi, dayGanZhi, hourGanZhi,
        dayMasterAttributes, solarLongitude
    } = baziData;

    const { name: selectedCityName, countryCode: selectedCountryCode, lat: selectedCityLat, lng: selectedCityLng } = location;

    inputTimeUTC8Display.textContent = inputUtc8Date.toISOString().replace('Z', ' ').replace('T', ' ').slice(0, 19) + ' UTC+8';
    inputTimeUTCDisplay.textContent = utcDate.toISOString().replace('T', ' ').slice(0, 19) + ' UTC';
    cityNameDisplay.textContent = selectedCityName;
    countryCodeDisplay.textContent = selectedCountryCode;
    latitudeDisplay.textContent = selectedCityLat.toFixed(4);
    longitudeDisplay.textContent = selectedCityLng.toFixed(4);
    timezoneOffsetDisplay.textContent = timezoneOffsetHours.toFixed(4);

    const localTimeFormatter = new Intl.DateTimeFormat('zh-CN', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: false,
        timeZone: 'UTC' // localDate is already adjusted to "true solar time", so display it as UTC
    });
    localTimeDisplay.textContent = localTimeFormatter.format(localDate);

    solarLongitudeDisplay.textContent = solarLongitude.toFixed(4);

    yearPillarDisplay.textContent = `${yearGanZhi} (${getTenGod(dayMasterAttributes, stemAttributes[yearGanZhi[0]])})`;
    monthPillarDisplay.textContent = `${monthGanZhi} (${getTenGod(dayMasterAttributes, stemAttributes[monthGanZhi[0]])})`;

    let dayPillarGenderText = gender === 'male' ? '(日元 - 元男)' : '(日元 - 元女)';
    dayPillarDisplay.textContent = `${dayGanZhi} ${dayPillarGenderText}`;

    hourPillarDisplay.textContent = `${hourGanZhi} (${getTenGod(dayMasterAttributes, stemAttributes[hourGanZhi[0]])})`;

    const pillars = [
        { branch: yearGanZhi[1], container: yearBranchHiddenStemsContainer },
        { branch: monthGanZhi[1], container: monthBranchHiddenStemsContainer },
        { branch: dayGanZhi[1], container: dayBranchHiddenStemsContainer },
        { branch: hourGanZhi[1], container: hourBranchHiddenStemsContainer },
    ];

    pillars.forEach(pillar => {
        pillar.container.innerHTML = ''; // Clear previous
        const hiddenStems = getHiddenStems(pillar.branch);
        hiddenStems.forEach(stem => {
            const stemAttributesForHidden = stemAttributes[stem];
            const element = stemAttributesForHidden.element;
            const tenGod = getTenGod(dayMasterAttributes, stemAttributesForHidden);
            const p = document.createElement('p');
            p.innerHTML = `<ruby>${stem}<rp>(</rp><rt class="element-${element}">${element}</rt><rp>)</rp></ruby> (${tenGod})`;
            pillar.container.appendChild(p);
        });
    });

    // Grand Cycles
    const { direction: grandCycleDirection, startAge, cycles: grandCycles } = grandCycleData;
    grandCycleDirectionDisplay.textContent = grandCycleDirection === 'forward' ? '顺行' : '逆行';
    grandCycleStartAgeDisplay.textContent = `${startAge.years}岁 ${startAge.months}月 ${startAge.days}日`;

    grandCyclesContainer.innerHTML = ''; // Clear previous
    grandCycles.forEach((gc, index) => {
        const itemDiv = document.createElement('div');
        itemDiv.classList.add('grand-cycle-item');
        const startAgeCalc = startAge.years + (index * 10);
        const endAgeCalc = startAgeCalc + 9;
        itemDiv.innerHTML = `
            <p class="age-range">${startAgeCalc}岁起 ~ ${endAgeCalc}岁止</p>
            <p><strong>${gc.ganZhi}</strong> (${gc.tenGod})</p>
        `;
        grandCyclesContainer.appendChild(itemDiv);
    });

    // Current Year Pillar
    currentGregorianYearDisplay.textContent = new Date().getUTCFullYear();
    const currentYearPillarStrong = document.getElementById('currentYearPillarDisplay');
    currentYearPillarStrong.textContent = `${currentYearGanZhi} (${currentYearTenGod})`;


    resultSection.style.display = 'block';
    // --- 优化：滚动到结果部分 ---
    resultSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
    // --- 结束优化 ---
}