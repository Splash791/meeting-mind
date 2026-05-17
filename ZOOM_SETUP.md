# Zoom Meeting Summarizer Setup Guide

This guide walks you through setting up the Zoom integration to auto-summarize your meetings using AI.

## Step 1: Get Zoom API Credentials

1. Go to [Zoom Marketplace](https://marketplace.zoom.us/develop/create)
2. Click "Create" → "Server-to-Server OAuth App"
3. Fill in the app details:
   - **App Name**: MeetingMind
   - **Company**: Your name/company
   - **Developer Name**: Your name
4. On the OAuth settings page, you'll see:
   - `Client ID`
   - `Client Secret` (keep this private!)
5. Set Redirect URL: `http://localhost:5173/zoom-callback`

## Step 2: Get Claude API Key

1. Go to [Anthropic Console](https://console.anthropic.com/)
2. Click "API Keys" in the sidebar
3. Create a new API key
4. Copy it (you won't be able to see it again)

## Step 3: Configure Environment Variables

1. Copy `.env.example` to `.env.local`:
   ```bash
   cp .env.example .env.local
   ```

2. Fill in the values:
   ```
   VITE_ZOOM_CLIENT_ID=your_client_id_here
   VITE_ZOOM_CLIENT_SECRET=your_client_secret_here
   VITE_ZOOM_REDIRECT_URI=http://localhost:5173/zoom-callback
   VITE_CLAUDE_API_KEY=your_api_key_here
   ```

## Step 4: Test the Integration

1. Start the dev server:
   ```bash
   npm run dev
   ```

2. Open http://localhost:5173

3. Go to the "Meetings" tab in the dashboard

4. Click "Connect Zoom Account"

5. You'll be redirected to Zoom to authorize

6. After authorizing, you should see your recent meetings

7. Click "Summarize" on any meeting to generate a summary

## Features

### Meeting Summary
- Auto-generated 3-4 sentence overview
- Extracted from full transcript using Claude

### Action Items
- Automatically extracted tasks
- Format: "Person: Task by deadline"

### Key Decisions
- Important decisions made during the meeting

### Blockers
- Issues or blockers mentioned

### Next Steps
- Suggested follow-up actions

## Pricing

### Zoom API
- Free tier: 40-minute meetings
- No cost for transcript reading

### Claude API
- ~$0.01 per meeting summary
- 1000 meetings = ~$10
- Extremely cheap for the value

## Troubleshooting

### "Failed to connect to Zoom"
- Check that your Client ID and Secret are correct
- Make sure the redirect URL matches exactly
- Clear browser cache and try again

### "Claude API error"
- Verify your API key is correct
- Check that you have API credits/aren't rate limited
- See https://console.anthropic.com for usage stats

### "No meetings found"
- Zoom needs to have recordings with transcripts
- Make sure transcription was enabled during the meeting
- Only meetings from the last 30 days appear by default

## Next Steps

After this works, consider:
- Export summaries as text/PDF
- Slack integration (post summaries to Slack)
- Calendar integration (auto-detect which meeting just ended)
- Overlay engagement metrics from MeetingMind camera
