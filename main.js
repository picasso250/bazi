// main.js
import { getSolarLongitudeForJD } from './src/astronomyUtils.js';
import { calculateBaZiPillars, getTenGod, getGanZhiForYear, getHiddenStems } from './src/baziCore.js';
import { determineGrandCycleDirection, calculateGrandCycleStartAge, generateGrandCyclePillars } from './src/grandCycleUtils.js';
import { loadRegionsData, findCityLocation } from './src/locationService.js';
import { initializeUI, getFormInputs, displayError, clearError, clearResults, updateResultsDisplay } from './src/uiManager.js';
import { stemAttributes } from './src/constants.js'; // For current year ten god

document.addEventListener('DOMContentLoaded', async () => {
    const dataLoaded = await loadRegionsData();
    if (!dataLoaded) {
        displayError('无法加载地区数据，请刷新页面重试或检查文件路径。');
        return;
    }
    initializeUI();
});

document.getElementById('combinedQueryForm').addEventListener('submit', async function(event) {
    event.preventDefault();

    clearResults();
    clearError();

    const {
        year, month, day, hour, minute, gender,
        cityType, provinceId, cityCountyId, overseasCityInput
    } = getFormInputs();

    let selectedLocation;
    try {
        selectedLocation = await findCityLocation(cityType, provinceId, cityCountyId, overseasCityInput);
    } catch (error) {
        displayError(error.message);
        return;
    }

    // Prepare birthDateTime object for baziCore
    const birthDateTimeUTC8 = { year, month, day, hour, minute, second: 0 };

    let baziData;
    try {
        baziData = calculateBaZiPillars(birthDateTimeUTC8, selectedLocation);

        // Calculate solar longitude separately for display
        baziData.solarLongitude = getSolarLongitudeForJD(baziData.birthJD);

    } catch (error) {
        displayError(error.message);
        return;
    }

    // --- 大运计算 ---
    let grandCycleDirection;
    let grandCycleStartAgeResult;
    let grandCyclesList;

    try {
        grandCycleDirection = determineGrandCycleDirection(baziData.yearGanZhi[0], gender);
        grandCycleStartAgeResult = calculateGrandCycleStartAge(
            baziData.birthJD,
            baziData.birthMonthTerm,
            baziData.allBaziMonthJDs,
            grandCycleDirection
        );
        grandCyclesList = generateGrandCyclePillars(
            baziData.monthGanZhi,
            grandCycleDirection,
            8, // Number of cycles to generate
            baziData.dayMasterAttributes
        );
    } catch (error) {
        displayError('计算大运时出错: ' + error.message);
        return;
    }

    const grandCycleData = {
        direction: grandCycleDirection,
        startAge: grandCycleStartAgeResult,
        cycles: grandCyclesList
    };

    // --- 流年计算 ---
    const currentGregorianYear = new Date().getUTCFullYear();
    const currentYearGanZhi = getGanZhiForYear(currentGregorianYear);
    const currentYearTenGod = getTenGod(baziData.dayMasterAttributes, stemAttributes[currentYearGanZhi[0]]);

    // Update UI with all calculated data
    updateResultsDisplay(
        baziData,
        selectedLocation,
        gender,
        grandCycleData,
        currentYearGanZhi,
        currentYearTenGod,
        getTenGod, // Pass getTenGod function
        getHiddenStems // Pass getHiddenStems function
    );
});
