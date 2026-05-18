// Content script that runs on Zoom pages
// This script injected the engagement tracking overlay

let engagementData = {
  engagement: 75,
  trend: 'stable',
  lastUpdate: Date.now(),
};

// Detect if we're in an active Zoom meeting
function isInZoomMeeting() {
  const meetingElements = document.querySelectorAll('[data-test-id="participantName"]');
  return meetingElements.length > 0;
}

// Listen for messages from popup
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'getEngagementData') {
    // Get engagement data from the tab
    // In a real implementation, this would come from MediaPipe face detection
    // For now, we're simulating it

    // If the tab has engagement data injected, use that
    const dataFromPage = window.__meetingMindEngagement;
    if (dataFromPage) {
      sendResponse({
        engagement: dataFromPage.score,
        trend: dataFromPage.trend,
      });
    } else {
      // Fallback: return simulated data
      // In real implementation, the main MeetingMind app would inject this
      sendResponse(engagementData);
    }
  }
});

// Inject overlay into Zoom meeting
function injectOverlay() {
  if (document.getElementById('meetingmind-overlay')) {
    return; // Already injected
  }

  const overlay = document.createElement('div');
  overlay.id = 'meetingmind-overlay';
  overlay.innerHTML = `
    <div style="
      position: fixed;
      top: 20px;
      right: 20px;
      width: 240px;
      background: rgba(15, 23, 42, 0.95);
      border: 1px solid rgba(14, 165, 233, 0.3);
      border-radius: 12px;
      padding: 16px;
      z-index: 10000;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
      color: #e5e7eb;
      box-shadow: 0 10px 40px rgba(0, 0, 0, 0.3);
    ">
      <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 12px;">
        <span style="font-size: 20px;">🎯</span>
        <span style="font-weight: 600; font-size: 14px;">MeetingMind</span>
      </div>

      <div style="background: rgba(0, 0, 0, 0.3); padding: 12px; border-radius: 8px;">
        <div style="font-size: 12px; color: #9ca3af; margin-bottom: 4px;">Your Engagement</div>
        <div style="
          font-size: 32px;
          font-weight: 700;
          color: #22c55e;
          margin-bottom: 8px;
        " id="mm-engagement-display">75%</div>
        <div style="
          height: 4px;
          background: rgba(255, 255, 255, 0.1);
          border-radius: 2px;
          overflow: hidden;
        ">
          <div style="
            height: 100%;
            width: 75%;
            background: linear-gradient(90deg, #22c55e 0%, #0ea5e9 100%);
            transition: width 0.3s ease;
          " id="mm-engagement-bar"></div>
        </div>
      </div>

      <div style="
        margin-top: 12px;
        padding-top: 12px;
        border-top: 1px solid rgba(255, 255, 255, 0.1);
        font-size: 12px;
        color: #9ca3af;
      ">
        <div>📝 Recording enabled</div>
        <div style="margin-top: 4px;">🤖 Bot ready</div>
      </div>

      <button style="
        width: 100%;
        margin-top: 12px;
        padding: 8px;
        background: linear-gradient(135deg, #0ea5e9 0%, #0284c7 100%);
        color: white;
        border: none;
        border-radius: 6px;
        font-weight: 600;
        font-size: 12px;
        cursor: pointer;
      " id="mm-settings-btn">Settings</button>
    </div>
  `;

  document.body.appendChild(overlay);

  // Update engagement in real-time
  setInterval(() => {
    const engagementDisplay = document.getElementById('mm-engagement-display');
    const engagementBar = document.getElementById('mm-engagement-bar');

    if (engagementDisplay) {
      const currentEngagement = window.__meetingMindEngagement?.score || 75;
      engagementDisplay.textContent = `${Math.round(currentEngagement)}%`;
      engagementBar.style.width = `${currentEngagement}%`;

      // Update color based on engagement
      if (currentEngagement >= 70) {
        engagementDisplay.style.color = '#22c55e';
      } else if (currentEngagement >= 40) {
        engagementDisplay.style.color = '#f59e0b';
      } else {
        engagementDisplay.style.color = '#ef4444';
      }
    }
  }, 1000);

  // Settings button
  document.getElementById('mm-settings-btn').addEventListener('click', () => {
    chrome.runtime.sendMessage({ action: 'openSettings' });
  });
}

// Watch for when meeting starts
setInterval(() => {
  if (isInZoomMeeting()) {
    injectOverlay();
  }
}, 1000);

// Also check immediately
if (isInZoomMeeting()) {
  injectOverlay();
}

console.log('MeetingMind content script loaded');
