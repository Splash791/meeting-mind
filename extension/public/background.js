// Background service worker for MeetingMind extension

// Listen for messages from content scripts and popups
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'openSettings') {
    chrome.runtime.openOptionsPage();
  }

  if (request.action === 'startRecording') {
    // Signal to start bot recording
    chrome.tabs.sendMessage(sender.tab.id, {
      action: 'recordingStarted',
    });
  }
});

// Store meeting data when user ends a meeting
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (changeInfo.status === 'complete' && tab.url && tab.url.includes('zoom.us')) {
    // Meeting page loaded
    console.log('Zoom meeting detected:', tab.url);
  }
});

console.log('MeetingMind background service worker started');
