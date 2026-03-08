"use strict";
console.log("FocusInFlow Content Script Loaded on this page.");
const OVERLAY_ID = 'focusinflow-warning-overlay';
function createWarningOverlay() {
    if (document.getElementById(OVERLAY_ID)) {
        return; // Overlay already exists
    }
    const overlay = document.createElement('div');
    overlay.id = OVERLAY_ID;
    overlay.style.position = 'fixed';
    overlay.style.top = '0';
    overlay.style.left = '0';
    overlay.style.width = '100vw';
    overlay.style.height = '100vh';
    overlay.style.backgroundColor = 'rgba(0, 0, 0, 0.7)';
    overlay.style.zIndex = '2147483647'; // Max z-index
    overlay.style.display = 'flex';
    overlay.style.justifyContent = 'center';
    overlay.style.alignItems = 'center';
    overlay.style.backdropFilter = 'blur(5px)';
    const messageBox = document.createElement('div');
    messageBox.style.padding = '40px';
    messageBox.style.background = '#fff';
    messageBox.style.borderRadius = '12px';
    messageBox.style.textAlign = 'center';
    messageBox.style.fontFamily = 'Arial, sans-serif';
    messageBox.style.color = '#333';
    messageBox.style.boxShadow = '0 10px 25px rgba(0, 0, 0, 0.2)';
    const title = document.createElement('h1');
    title.textContent = 'Stay Focused!';
    title.style.fontSize = '28px';
    title.style.margin = '0 0 10px 0';
    const message = document.createElement('p');
    message.textContent = 'This site is marked as distracting. Get back to your task and make progress!';
    message.style.fontSize = '18px';
    message.style.margin = '0';
    messageBox.appendChild(title);
    messageBox.appendChild(message);
    overlay.appendChild(messageBox);
    document.body.appendChild(overlay);
}
function removeWarningOverlay() {
    const overlay = document.getElementById(OVERLAY_ID);
    if (overlay) {
        overlay.remove();
    }
}
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.command === "showWarning") {
        createWarningOverlay();
        sendResponse({ status: "Warning shown" });
    }
    else if (message.command === "hideWarning") {
        removeWarningOverlay();
        sendResponse({ status: "Warning hidden" });
    }
    return true;
});
