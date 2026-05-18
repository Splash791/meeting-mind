# MeetingMind Extension + Bot

Real-time meeting assistant for Zoom with AI-powered summaries.

## 🎯 **Quick Start**

### **1. Load Extension**
```bash
# Go to chrome://extensions/
# Enable "Developer mode"
# Click "Load unpacked"
# Select: ./extension/public/
```

### **2. Start Backend Server**
```bash
cd extension/server
npm install
npm run dev
```

Server will run on `http://localhost:3000`

### **3. Join a Zoom Meeting**
The extension will automatically:
- Detect the meeting
- Show engagement metrics
- Enable note-taking
- Auto-summarize when meeting ends

---

## 📁 **Structure**

```
extension/
├── public/           (Chrome Extension files)
│   ├── manifest.json (Extension config)
│   ├── popup.html    (Popup interface)
│   ├── popup.js      (Popup logic)
│   ├── content.js    (Zoom page injection)
│   └── background.js (Service worker)
│
└── server/           (Backend bot server)
    ├── server.js     (Express API)
    └── package.json  (Dependencies)
```

---

## 🚀 **Features**

- ✅ Detect Zoom meetings automatically
- ✅ Real-time engagement display
- ✅ Meeting notes integration
- ✅ AI-powered meeting summaries
- ✅ Action item extraction
- ✅ Backend bot support (joining, recording)
- ✅ Claude API integration

---

## 📖 **Documentation**

See `../EXTENSION_SETUP.md` for complete setup instructions.

---

## 🛠️ **Tech Stack**

**Frontend:**
- Chrome Extension API
- Vanilla JavaScript
- CSS3

**Backend:**
- Express.js
- Zoom SDK (placeholder)
- Claude API

---

## 💬 **How It Works**

1. **Extension detects Zoom meeting** (watches zoom.us tab)
2. **Injects overlay with engagement metrics** into Zoom page
3. **Shows popup UI** with controls and notes area
4. **User takes notes** during meeting
5. **Clicks "End & Summarize"** when meeting ends
6. **Backend processes transcript** and generates summary using Claude
7. **Extension displays summary** in popup

---

## 🎮 **Current Demo**

- Engagement score: Simulated at 75%
- Transcript: Placeholder (would come from Zoom API)
- Bot joining: Not yet implemented (requires Zoom SDK)
- Summarization: Fully functional with Claude API

---

## ⚙️ **Environment Variables**

Create `server/.env`:
```
PORT=3000
CLAUDE_API_KEY=your_key_here
ZOOM_CLIENT_ID=your_id_here
ZOOM_CLIENT_SECRET=your_secret_here
```

---

## 🔗 **Related Files**

- Main app: `../src/` (MeetingMind React app)
- Zoom integration: `../src/services/zoomService.ts`
- Setup guide: `../ZOOM_SETUP.md`

---

**Built for the AI-for-Good hackathon 2026** 🚀
