// main.js
import { getSolarLongitudeForJD } from './src/astronomyUtils.js';
import { calculateBaZiPillars, getTenGod, getGanZhiForYear, getHiddenStems, getBaZiYearForUTC8DateTime } from './src/baziCore.js';
import { determineGrandCycleDirection, calculateGrandCycleStartAge, generateGrandCyclePillars } from './src/grandCycleUtils.js';
import { loadRegionsData, findCityLocation } from './src/locationService.js';
import { initializeUI, getFormInputs, displayError, clearError, clearResults, updateResultsDisplay } from './src/uiManager.js';
import { stemAttributes } from './src/constants.js'; // For current year ten god

const continueAskForm = document.getElementById('continueAskForm');
const followupQuestionInput = document.getElementById('followupQuestion');
const aiConversation = document.getElementById('aiConversation');
const aiStatus = document.getElementById('aiStatus');
const continueAskButton = document.getElementById('continueAskButton');

let latestChatContext = null;
let chatHistory = [];

function getCurrentUTC8DateTimeParts() {
    const now = new Date();
    const utc8Now = new Date(now.getTime() + 8 * 60 * 60 * 1000);

    return {
        year: utc8Now.getUTCFullYear(),
        month: utc8Now.getUTCMonth() + 1,
        day: utc8Now.getUTCDate(),
        hour: utc8Now.getUTCHours(),
        minute: utc8Now.getUTCMinutes(),
        second: utc8Now.getUTCSeconds()
    };
}

function formatDisplayDate(date) {
    return date.toISOString().replace('Z', ' ').replace('T', ' ').slice(0, 19) + ' UTC+8';
}

function buildChartContext({
    baziData,
    selectedLocation,
    gender,
    grandCycleData,
    currentFlowYear,
    currentYearGanZhi,
    currentYearTenGod,
    nextFlowYear,
    nextYearGanZhi,
    nextYearTenGod
}) {
    const hiddenStemsSummary = [
        ['年支', getHiddenStems(baziData.yearGanZhi[1]).join('、')],
        ['月支', getHiddenStems(baziData.monthGanZhi[1]).join('、')],
        ['日支', getHiddenStems(baziData.dayGanZhi[1]).join('、')],
        ['时支', getHiddenStems(baziData.hourGanZhi[1]).join('、')]
    ]
        .map(([label, value]) => `${label}藏干：${value || '无'}`)
        .join('\n');

    const grandCyclesSummary = grandCycleData.cycles
        .map((cycle, index) => {
            const startAge = grandCycleData.startAge.years + index * 10;
            const endAge = startAge + 9;
            return `${startAge}-${endAge}岁：${cycle.ganZhi}（${cycle.tenGod}）`;
        })
        .join('\n');

    return [
        '你是一名谨慎、清晰、会说明依据的中文八字解读助手。',
        '只能基于用户当前页面已经计算出的命盘参数回答，不要杜撰新的四柱结果，不要声称重新计算了出生信息。',
        '如果用户的问题超出当前命盘信息的支持范围，要明确说明限制。',
        '',
        `出生时间（UTC+8）：${formatDisplayDate(baziData.inputUtc8Date)}`,
        `出生地：${selectedLocation.name} (${selectedLocation.countryCode})`,
        `纬度：${selectedLocation.lat.toFixed(4)}，经度：${selectedLocation.lng.toFixed(4)}`,
        `当地真太阳时：${new Intl.DateTimeFormat('zh-CN', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit',
            hour12: false,
            timeZone: 'UTC'
        }).format(baziData.localDate)}`,
        `太阳黄经：${baziData.solarLongitude.toFixed(4)} 度`,
        `性别：${gender === 'male' ? '男' : '女'}`,
        `四柱：年柱 ${baziData.yearGanZhi}，月柱 ${baziData.monthGanZhi}，日柱 ${baziData.dayGanZhi}，时柱 ${baziData.hourGanZhi}`,
        `大运方向：${grandCycleData.direction === 'forward' ? '顺行' : '逆行'}`,
        `起运岁数：${grandCycleData.startAge.years}岁 ${grandCycleData.startAge.months}月 ${grandCycleData.startAge.days}日`,
        `当前流年：${currentFlowYear} 年，${currentYearGanZhi}（${currentYearTenGod}）`,
        `下一年流年：${nextFlowYear} 年，${nextYearGanZhi}（${nextYearTenGod}）`,
        '',
        hiddenStemsSummary,
        '',
        '大运列表：',
        grandCyclesSummary
    ].join('\n');
}

function resetAiChat(contextText) {
    latestChatContext = contextText;
    chatHistory = [];
    aiConversation.innerHTML = `
        <div class="chat-empty-state">
            可以继续问，例如：<span class="font-medium text-on-surface">“这个命盘的事业倾向如何？”</span>
        </div>
    `;
    aiStatus.textContent = '';
    aiStatus.style.display = 'none';
    followupQuestionInput.value = '';
    followupQuestionInput.disabled = false;
    continueAskButton.disabled = false;
}

function appendChatMessage(role, content) {
    const wrapper = document.createElement('article');
    wrapper.className = `chat-bubble ${role === 'user' ? 'chat-bubble-user' : 'chat-bubble-assistant'}`;
    wrapper.innerHTML = `
        <p class="chat-role">${role === 'user' ? '你的追问' : 'Worker AI 回答'}</p>
        <div class="chat-content">${content.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')}</div>
    `;

    const emptyState = aiConversation.querySelector('.chat-empty-state');
    if (emptyState) {
        emptyState.remove();
    }

    aiConversation.appendChild(wrapper);
}

function createStreamingAssistantMessage() {
    const wrapper = document.createElement('article');
    wrapper.className = 'chat-bubble chat-bubble-assistant';
    wrapper.innerHTML = `
        <p class="chat-role">Worker AI 回答</p>
        <div class="chat-content"></div>
    `;

    const emptyState = aiConversation.querySelector('.chat-empty-state');
    if (emptyState) {
        emptyState.remove();
    }

    aiConversation.appendChild(wrapper);
    return wrapper.querySelector('.chat-content');
}

function decodeSseChunk(rawChunk) {
    const lines = rawChunk
        .split('\n')
        .map((line) => line.trim())
        .filter((line) => line.startsWith('data:'))
        .map((line) => line.slice(5).trim())
        .filter(Boolean);

    let text = '';
    let done = false;

    for (const line of lines) {
        if (line === '[DONE]') {
            done = true;
            continue;
        }

        try {
            const parsed = JSON.parse(line);
            if (typeof parsed.response === 'string') {
                text += parsed.response;
            } else if (typeof parsed.text === 'string') {
                text += parsed.text;
            }

            if (parsed.done === true) {
                done = true;
            }
        } catch {
            text += line;
        }
    }

    return { text, done };
}

async function handleContinueAskSubmit(event) {
    event.preventDefault();

    const question = followupQuestionInput.value.trim();
    if (!question || !latestChatContext) {
        return;
    }

    appendChatMessage('user', question);
    chatHistory.push({ role: 'user', content: question });

    followupQuestionInput.value = '';
    followupQuestionInput.disabled = true;
    continueAskButton.disabled = true;
    aiStatus.textContent = 'Worker AI 正在整理当前命盘上下文并生成回答...';
    aiStatus.style.display = 'block';
    const streamingContentNode = createStreamingAssistantMessage();
    let streamedAnswer = '';

    try {
        const response = await fetch('/api/chat', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                stream: true,
                messages: [
                    {
                        role: 'user',
                        content: [
                            '以下是当前命盘的已知结果，请你后续所有回答都严格以这些信息为准，不要说你没看到命盘。',
                            '',
                            latestChatContext
                        ].join('\n')
                    },
                    {
                        role: 'assistant',
                        content: '我已收到并记住这份命盘结果，后续将严格基于这些信息回答。'
                    },
                    ...chatHistory.slice(-8),
                    {
                        role: 'user',
                        content: question
                    }
                ]
            })
        });
        if (!response.ok) {
            const data = await response.json().catch(() => ({}));
            throw new Error(data.error || 'Worker AI 请求失败。');
        }

        if (!response.body) {
            throw new Error('Worker AI 没有返回可读取的流。');
        }

        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        let buffer = '';

        while (true) {
            const { value, done } = await reader.read();
            if (done) {
                break;
            }

            buffer += decoder.decode(value, { stream: true });
            const events = buffer.split('\n\n');
            buffer = events.pop() || '';

            for (const eventChunk of events) {
                const { text } = decodeSseChunk(eventChunk);
                if (text) {
                    streamedAnswer += text;
                    streamingContentNode.textContent = streamedAnswer;
                    aiConversation.scrollTop = aiConversation.scrollHeight;
                }
            }
        }

        if (buffer.trim()) {
            const { text } = decodeSseChunk(buffer);
            if (text) {
                streamedAnswer += text;
                streamingContentNode.textContent = streamedAnswer;
            }
        }

        const answer = streamedAnswer.trim();
        if (!answer) {
            throw new Error('Worker AI 没有返回有效内容。');
        }

        chatHistory.push({ role: 'assistant', content: answer });
        aiStatus.textContent = '已带入当前命盘参数。你可以继续追问。';
    } catch (error) {
        if (!streamedAnswer) {
            streamingContentNode.textContent = error.message || '调用 Worker AI 时发生错误。';
        }
        aiStatus.textContent = error.message || '调用 Worker AI 时发生错误。';
    } finally {
        followupQuestionInput.disabled = false;
        continueAskButton.disabled = false;
        followupQuestionInput.focus();
    }
}

document.addEventListener('DOMContentLoaded', async () => {
    const dataLoaded = await loadRegionsData();
    if (!dataLoaded) {
        displayError('无法加载地区数据，请刷新页面重试或检查文件路径。');
        return;
    }
    initializeUI();
    continueAskForm.addEventListener('submit', handleContinueAskSubmit);
    followupQuestionInput.disabled = true;
    continueAskButton.disabled = true;
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
    const currentFlowYear = getBaZiYearForUTC8DateTime(getCurrentUTC8DateTimeParts());
    const currentYearGanZhi = getGanZhiForYear(currentFlowYear);
    const currentYearTenGod = getTenGod(baziData.dayMasterAttributes, stemAttributes[currentYearGanZhi[0]]);

    // --- 下一年流年计算 ---
    const nextFlowYear = currentFlowYear + 1;
    const nextYearGanZhi = getGanZhiForYear(nextFlowYear);
    const nextYearTenGod = getTenGod(baziData.dayMasterAttributes, stemAttributes[nextYearGanZhi[0]]);

    resetAiChat(buildChartContext({
        baziData,
        selectedLocation,
        gender,
        grandCycleData,
        currentFlowYear,
        currentYearGanZhi,
        currentYearTenGod,
        nextFlowYear,
        nextYearGanZhi,
        nextYearTenGod
    }));

    // Update UI with all calculated data
    updateResultsDisplay(
        baziData,
        selectedLocation,
        gender,
        grandCycleData,
        currentFlowYear,
        currentYearGanZhi,
        currentYearTenGod,
        nextFlowYear, // <-- 新增：传递下一年流年年份
        nextYearGanZhi,    // <-- 新增：传递下一年干支
        nextYearTenGod,    // <-- 新增：传递下一年十神
        getTenGod,
        getHiddenStems
    );
});
