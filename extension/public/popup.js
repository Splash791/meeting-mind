// Check if user is in a Zoom meeting
async function checkMeetingStatus() {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

  const isInMeeting = tab.url && tab.url.includes('zoom.us');
  const contentDiv = document.getElementById('content');

  if (!isInMeeting) {
    contentDiv.innerHTML = `
      <div style="text-align: center; padding: 20px; color: #9ca3af;">
        <p style="font-size: 14px; margin-bottom: 12px;">Not currently in a Zoom meeting</p>
        <p style="font-size: 12px;">Start or join a Zoom meeting to use MeetingMind</p>
      </div>
    `;
    document.getElementById('status').className = 'status inactive';
    return;
  }

  // We're in a meeting - show the dashboard
  document.getElementById('status').className = 'status';
  document.getElementById('status').textContent = 'In Meeting';

  contentDiv.innerHTML = `
    <div class="section">
      <div class="section-title">Engagement Metrics</div>
      <div class="metric">
        <span class="metric-label">Your Engagement</span>
        <span class="metric-value score-high" id="engagement-score">--</span>
      </div>
      <div class="metric">
        <span class="metric-label">Attention Trend</span>
        <span id="engagement-trend" style="color: #9ca3af; font-size: 12px;">--</span>
      </div>
    </div>

    <div class="section">
      <div class="section-title">Meeting Notes</div>
      <div class="notes-area">
        <textarea id="notes-input" placeholder="Add meeting notes here..."></textarea>
      </div>
    </div>

    <div class="section">
      <button id="end-btn" class="button">End & Summarize</button>
      <button id="settings-btn" class="button secondary" style="margin-top: 8px;">Settings</button>
    </div>

    <div id="summary-area" style="display: none; margin-top: 16px;">
      <div class="section-title">Summary</div>
      <div id="summary-content" style="background: rgba(0, 0, 0, 0.3); padding: 12px; border-radius: 6px; font-size: 12px; line-height: 1.5;">
      </div>
    </div>
  `;

  // Get engagement data from content script
  chrome.tabs.sendMessage(tab.id, { action: 'getEngagementData' }, (response) => {
    if (response && response.engagement !== undefined) {
      const score = response.engagement;
      document.getElementById('engagement-score').textContent = `${Math.round(score)}%`;

      // Color code based on score
      const scoreEl = document.getElementById('engagement-score');
      if (score >= 70) scoreEl.className = 'metric-value score-high';
      else if (score >= 40) scoreEl.className = 'metric-value score-medium';
      else scoreEl.className = 'metric-value score-low';

      // Show trend
      const trend = response.trend || 'stable';
      const trendEmoji = trend === 'up' ? '📈' : trend === 'down' ? '📉' : '➡️';
      document.getElementById('engagement-trend').textContent = `${trendEmoji} ${trend}`;
    }
  });

  // Load saved notes
  chrome.storage.local.get(['meetingNotes'], (result) => {
    if (result.meetingNotes) {
      document.getElementById('notes-input').value = result.meetingNotes;
    }
  });

  // Save notes on input
  document.getElementById('notes-input').addEventListener('change', (e) => {
    chrome.storage.local.set({ meetingNotes: e.target.value });
  });

  // End meeting button
  document.getElementById('end-btn').addEventListener('click', () => {
    const notes = document.getElementById('notes-input').value;
    summarizeMeeting(notes);
  });

  // Settings button
  document.getElementById('settings-btn').addEventListener('click', () => {
    chrome.runtime.openOptionsPage();
  });
}

// Summarize meeting with Claude
async function summarizeMeeting(notes) {
  const endBtn = document.getElementById('end-btn');
  endBtn.disabled = true;
  endBtn.textContent = 'Generating Summary...';

  try {
    // Get transcript from backend
    const response = await fetch('http://localhost:3000/api/summarize', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        notes: notes,
        transcript: '', // Would come from backend bot
      }),
    });

    if (!response.ok) throw new Error('Failed to summarize');

    const summary = await response.json();

    // Show summary
    document.getElementById('summary-area').style.display = 'block';
    const summaryContent = document.getElementById('summary-content');
    summaryContent.innerHTML = `
      <p><strong>Summary:</strong> ${summary.summary}</p>
      ${summary.actionItems.length > 0 ? `
        <p style="margin-top: 8px;"><strong>Action Items:</strong></p>
        <ul style="margin-left: 16px;">
          ${summary.actionItems.map(item => `<li>${item}</li>`).join('')}
        </ul>
      ` : ''}
    `;

    endBtn.textContent = 'Summary Generated!';
  } catch (error) {
    console.error('Summarization error:', error);
    endBtn.textContent = 'Failed to summarize';
    endBtn.disabled = false;
  }
}

// Initialize popup
checkMeetingStatus();

// Refresh engagement data every 2 seconds
setInterval(() => {
  if (document.getElementById('engagement-score')) {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      if (tabs[0]) {
        chrome.tabs.sendMessage(tabs[0].id, { action: 'getEngagementData' }, (response) => {
          if (response && response.engagement !== undefined) {
            const scoreEl = document.getElementById('engagement-score');
            scoreEl.textContent = `${Math.round(response.engagement)}%`;
          }
        }).catch(() => {
          // Tab might have been closed or connection lost
        });
      }
    });
  }
}, 2000);
