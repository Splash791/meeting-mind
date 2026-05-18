# MeetingMind Chrome Extension + Bot Setup

A hybrid solution combining a Chrome Extension (real-time UI) with a Backend Bot (automated meeting joining & transcription).

## 🎯 **What It Does**

### **Chrome Extension**
- Detects when you're in a Zoom meeting
- Shows real-time engagement metrics
- Lets you take meeting notes
- Auto-generates summaries when meeting ends
- Syncs with the backend bot

### **Backend Bot**
- Joins Zoom meetings automatically
- Captures live transcript
- Records meeting audio
- Sends data to extension
- Processes summaries via Claude API

---

## 📋 **Setup: Extension (Client-Side)**

### **Step 1: Add Extension to Chrome**

1. Open Chrome → go to `chrome://extensions/`
2. Enable "Developer mode" (top right)
3. Click "Load unpacked"
4. Navigate to: `./extension/public/`
5. Click "Select Folder"

The extension should now appear in your extensions list.

### **Step 2: Pin the Extension**
1. Click the extensions icon in Chrome toolbar
2. Find "MeetingMind"
3. Click the pin icon to keep it visible

---

## 🤖 **Setup: Backend Bot (Server-Side)**

### **Step 1: Install Dependencies**

```bash
cd extension/server
npm install
```

### **Step 2: Configure Environment**

Create `extension/server/.env`:

```
PORT=3000
CLAUDE_API_KEY=your_claude_key_here
ZOOM_CLIENT_ID=your_zoom_id_here
ZOOM_CLIENT_SECRET=your_zoom_secret_here
```

### **Step 3: Start Server**

```bash
npm run dev
```

Server runs on `http://localhost:3000`

---

## 🧪 **Test It Out**

### **Extension Testing:**

1. Start a Zoom meeting (or join one)
2. The MeetingMind extension popup should show:
   - "In Meeting" status
   - Your engagement score (will be simulated: 75%)
   - Engagement trend (📈 📉 ➡️)
   - Note-taking area
   - End & Summarize button

3. Type some notes in the notes area
4. Click "End & Summarize"
5. Extension calls backend to generate summary
6. Summary displays in the popup

### **Backend Testing:**

```bash
# Health check
curl http://localhost:3000/health

# Test summarization
curl -X POST http://localhost:3000/api/summarize \
  -H "Content-Type: application/json" \
  -d '{
    "notes": "Discussed new roadmap",
    "transcript": "We decided to prioritize mobile"
  }'

# Test bot status
curl -X POST http://localhost:3000/api/extension/bot-status \
  -H "Content-Type: application/json" \
  -d '{"meetingId": "123"}'
```

---

## 🚀 **How to Use**

### **During a Meeting:**

1. **Real-time Engagement**: Watch your engagement score in the overlay
2. **Take Notes**: Type notes in the extension popup
3. **Check Metrics**: Refresh popup to see latest engagement
4. **Monitor Bot**: See bot status (recording, participants, duration)

### **After Meeting:**

1. **End & Summarize**: Click the button in popup
2. **Wait for AI**: Claude generates summary (~5 seconds)
3. **View Summary**: See action items, decisions, next steps
4. **Export**: Copy summary to clipboard (future feature)

---

## 🔧 **Architecture**

```
Chrome Extension (Popup UI)
    ↓ (WebSocket connection)
Backend Server (Node.js)
    ↓ (Zoom SDK)
Zoom Meeting (Bot joins)
    ↓ (Transcript stream)
Claude API (Summarization)
    ↓
Extension displays summary
```

---

## 📊 **Current Limitations**

- Bot doesn't actually join yet (requires Zoom SDK setup)
- Engagement metrics are simulated (would use MediaPipe from main app)
- Transcript is placeholder (would come from Zoom API)
- No actual recording yet (future: use Zoom SDK)

### **To Make It Fully Functional:**

1. **Get Zoom SDK credentials** (similar to earlier setup)
2. **Integrate MediaPipe** from main MeetingMind app
3. **Connect Zoom bot SDK** to actually join meetings
4. **Stream transcripts** from Zoom API in real-time
5. **Record audio** using WebRTC

---

## 📦 **Files Structure**

```
extension/
├── public/
│   ├── manifest.json       (Extension config)
│   ├── popup.html          (Popup UI)
│   ├── popup.js            (Popup logic)
│   ├── content.js          (Zoom page injection)
│   ├── background.js       (Service worker)
│   └── icons/              (Extension icons - to add)
├── server/
│   ├── server.js           (Backend API)
│   ├── package.json        (Dependencies)
│   └── .env                (Configuration)
└── README.md               (This file)
```

---

## 🎮 **Next Steps**

1. **Test the extension** in Chrome
2. **Start the server** on port 3000
3. **Join a Zoom meeting** and see the extension appear
4. **Type notes** and summarize

After hackathon:
- Add real Zoom bot joining (Zoom SDK)
- Stream live transcripts
- Integrate real engagement detection
- Add meeting recording
- Build team dashboard

---

## ❓ **Troubleshooting**

### "Extension shows 'Not in meeting'"
- Make sure you're actually on a Zoom meeting URL
- Check that the content script loaded (check browser console)
- Reload the extension

### "Summarization fails"
- Check server is running: `curl http://localhost:3000/health`
- Verify Claude API key is set
- Check server logs for errors

### "No engagement score showing"
- Engagement is currently simulated at 75%
- In production, would come from main MeetingMind app
- Check that window.__meetingMindEngagement is injected

---

## 💡 **Cool Ideas to Add**

1. **Real-time transcript scrolling** in popup
2. **Meeting sentiment analysis** (happy, frustrated, confused)
3. **AI-powered talking points** during meeting
4. **Slack integration** (post summary to Slack)
5. **Meeting effectiveness score**
6. **Participant engagement comparison**
7. **Distraction alerts** ("You're looking away, refocus!")
8. **Post-meeting tasks** (create calendar events from action items)

---

**Happy meeting summaries! 🎉**
