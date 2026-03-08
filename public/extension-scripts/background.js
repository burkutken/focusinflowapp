"use strict";
// extension/background.ts
console.log('FocusInFlow Background Script Loaded.');
const POMODORO_ALARM_NAME = 'pomodoroTimer';
const DEFAULT_WORK_MINUTES = 25;
const DEFAULT_BREAK_MINUTES = 5;
const DISTRACTING_SITES = [
    "www.youtube.com",
    "www.facebook.com",
    "www.twitter.com",
    "x.com",
    "www.instagram.com",
    "www.reddit.com",
    "www.tiktok.com",
    "www.netflix.com",
];
// Initialize all states in storage
chrome.runtime.onInstalled.addListener(() => {
    console.log('Extension installed or updated. Initializing state.');
    chrome.storage.local.set({
        timerState: {
            isRunning: false,
            mode: 'work',
            timeLeft: DEFAULT_WORK_MINUTES * 60,
            workMinutes: DEFAULT_WORK_MINUTES,
            breakMinutes: DEFAULT_BREAK_MINUTES,
        },
        siteTimeData: {},
        activityState: {
            activeTabId: null,
            activeTabDomain: null,
            startTime: null
        }
    });
});
// --- Timer Logic (Alarms) ---
chrome.alarms.onAlarm.addListener(async (alarm) => {
    if (alarm.name === POMODORO_ALARM_NAME) {
        const { timerState } = await chrome.storage.local.get('timerState');
        if (!timerState.isRunning) {
            chrome.alarms.clear(POMODORO_ALARM_NAME);
            checkDistractingSite(null); // Clear warning if timer stops
            return;
        }
        timerState.timeLeft -= 1;
        if (timerState.timeLeft < 0) {
            const oldMode = timerState.mode;
            timerState.mode = oldMode === 'work' ? 'break' : 'work';
            timerState.timeLeft = (timerState.mode === 'work' ? timerState.workMinutes : timerState.breakMinutes) * 60;
            timerState.isRunning = false;
            chrome.alarms.clear(POMODORO_ALARM_NAME);
            checkDistractingSite(null); // Clear warning on mode change
            chrome.notifications.create({
                type: 'basic',
                iconUrl: '/icons/icon128.png',
                title: 'FocusInFlow',
                message: oldMode === 'work' ? "Work session over! Time for a break." : "Break's over! Time for another focus session.",
                priority: 2
            });
        }
        await chrome.storage.local.set({ timerState });
        // Check for distracting sites on every tick
        const { activityState } = await chrome.storage.local.get('activityState');
        checkDistractingSite(activityState.activeTabId);
    }
});
// --- Activity Tracking Logic ---
function getDomain(url) {
    if (!url)
        return null;
    try {
        const urlObject = new URL(url);
        // Exclude internal chrome pages
        if (urlObject.protocol === 'chrome:')
            return null;
        return urlObject.hostname;
    }
    catch (e) {
        return null; // Invalid URL
    }
}
async function updateTimeSpent() {
    const { activityState, siteTimeData } = await chrome.storage.local.get(['activityState', 'siteTimeData']);
    if (activityState.startTime && activityState.activeTabDomain) {
        const endTime = Date.now();
        const secondsSpent = Math.round((endTime - activityState.startTime) / 1000);
        const currentTotal = siteTimeData[activityState.activeTabDomain] || 0;
        siteTimeData[activityState.activeTabDomain] = currentTotal + secondsSpent;
        console.log(`Spent ${secondsSpent}s on ${activityState.activeTabDomain}. New total: ${siteTimeData[activityState.activeTabDomain]}s`);
    }
    // Reset startTime for the new activity
    activityState.startTime = Date.now();
    await chrome.storage.local.set({ siteTimeData, activityState });
}
async function startTrackingTab(tabId, url) {
    await updateTimeSpent();
    const domain = getDomain(url);
    await chrome.storage.local.set({
        activityState: {
            activeTabId: tabId,
            activeTabDomain: domain,
            startTime: Date.now()
        }
    });
    console.log(`Start tracking: ${domain}`);
    checkDistractingSite(tabId);
}
async function stopTracking() {
    await updateTimeSpent();
    await chrome.storage.local.set({
        activityState: {
            activeTabId: null,
            activeTabDomain: null,
            startTime: null
        }
    });
    console.log('Tracking stopped.');
    checkDistractingSite(null); // Clear warnings when tracking stops
}
// --- Warning System Logic ---
async function checkDistractingSite(tabId) {
    if (tabId === null) {
        // A null tabId means we should hide any active warning
        const { activityState } = await chrome.storage.local.get('activityState');
        if (activityState.activeTabId) {
            try {
                await chrome.tabs.sendMessage(activityState.activeTabId, { command: "hideWarning" });
            }
            catch (e) {
                // Suppress errors if the tab is closed or content script isn't ready
            }
        }
        return;
    }
    const { timerState } = await chrome.storage.local.get('timerState');
    const tab = await chrome.tabs.get(tabId);
    const domain = getDomain(tab.url);
    const isDistracting = timerState.isRunning &&
        timerState.mode === 'work' &&
        domain &&
        DISTRACTING_SITES.includes(domain);
    try {
        if (isDistracting) {
            await chrome.tabs.sendMessage(tabId, { command: "showWarning" });
        }
        else {
            await chrome.tabs.sendMessage(tabId, { command: "hideWarning" });
        }
    }
    catch (e) {
        // This error often happens if the content script is not injected yet.
        // It's usually safe to ignore during initial page loads.
        // console.warn(`Could not send message to tab ${tabId}:`, e);
    }
}
// --- Event Listeners ---
chrome.tabs.onActivated.addListener(async (activeInfo) => {
    const tab = await chrome.tabs.get(activeInfo.tabId);
    startTrackingTab(activeInfo.tabId, tab.url);
});
chrome.tabs.onUpdated.addListener(async (tabId, changeInfo, tab) => {
    const { activityState } = await chrome.storage.local.get('activityState');
    if (tab.active && tabId === activityState.activeTabId && (changeInfo.url || changeInfo.status === 'complete')) {
        startTrackingTab(tabId, tab.url);
    }
});
chrome.windows.onFocusChanged.addListener(async (windowId) => {
    if (windowId === chrome.windows.WINDOW_ID_NONE) {
        stopTracking();
    }
    else {
        const [activeTab] = await chrome.tabs.query({ active: true, windowId: windowId });
        if (activeTab && activeTab.id) {
            startTrackingTab(activeTab.id, activeTab.url);
        }
    }
});
// --- Message Listener (for popup interaction) ---
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    const command = message.command;
    (async () => {
        const { timerState } = await chrome.storage.local.get('timerState');
        if (command === 'startTimer') {
            if (!timerState.isRunning) {
                timerState.isRunning = true;
                chrome.alarms.create(POMODORO_ALARM_NAME, { delayInMinutes: 1 / 60, periodInMinutes: 1 / 60 });
                await chrome.storage.local.set({ timerState });
                const { activityState } = await chrome.storage.local.get('activityState');
                checkDistractingSite(activityState.activeTabId);
                sendResponse({ status: "Timer started" });
            }
        }
        else if (command === 'pauseTimer') {
            if (timerState.isRunning) {
                timerState.isRunning = false;
                chrome.alarms.clear(POMODORO_ALARM_NAME);
                await chrome.storage.local.set({ timerState });
                const { activityState } = await chrome.storage.local.get('activityState');
                checkDistractingSite(activityState.activeTabId); // This will hide the warning
                sendResponse({ status: "Timer paused" });
            }
        }
        else if (command === 'resetTimer') {
            timerState.isRunning = false;
            timerState.mode = 'work';
            timerState.timeLeft = timerState.workMinutes * 60;
            chrome.alarms.clear(POMODORO_ALARM_NAME);
            await chrome.storage.local.set({ timerState });
            const { activityState } = await chrome.storage.local.get('activityState');
            checkDistractingSite(activityState.activeTabId); // This will hide the warning
            sendResponse({ status: "Timer reset" });
        }
        else if (command === 'getTimerState') {
            sendResponse({ timerState });
        }
    })();
    return true; // Indicates asynchronous response.
});
