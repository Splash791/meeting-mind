// MeetingMind Backend Server
// Handles Zoom bot joining, transcription, and summarization

import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import axios from 'axios';

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 3000;
const CLAUDE_API_KEY = process.env.CLAUDE_API_KEY;
const ZOOM_CLIENT_ID = process.env.ZOOM_CLIENT_ID;
const ZOOM_CLIENT_SECRET = process.env.ZOOM_CLIENT_SECRET;

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', message: 'MeetingMind backend running' });
});

// Summarize meeting transcript
app.post('/api/summarize', async (req, res) => {
  try {
    const { notes, transcript } = req.body;

    if (!CLAUDE_API_KEY) {
      return res.status(400).json({ error: 'Claude API key not configured' });
    }

    const prompt = `Analyze this meeting transcript and notes:

Transcript:
${transcript || '(No transcript available)'}

User Notes:
${notes || '(No notes taken)'}

Provide:
1. 2-3 sentence summary
2. Action items (format: "Person: Task by date")
3. Key decisions
4. Next steps

Format as JSON:
{
  "summary": "...",
  "actionItems": ["...", "..."],
  "keyDecisions": ["...", "..."],
  "nextSteps": ["...", "..."]
}`;

    const response = await axios.post(
      'https://api.anthropic.com/v1/messages',
      {
        model: 'claude-opus-4-7',
        max_tokens: 1024,
        messages: [
          {
            role: 'user',
            content: prompt,
          },
        ],
      },
      {
        headers: {
          'x-api-key': CLAUDE_API_KEY,
          'anthropic-version': '2023-06-01',
          'content-type': 'application/json',
        },
      }
    );

    const content = response.data.content[0].text;
    const jsonMatch = content.match(/\{[\s\S]*\}/);

    if (!jsonMatch) {
      return res.status(500).json({ error: 'Failed to parse Claude response' });
    }

    const summary = JSON.parse(jsonMatch[0]);
    res.json(summary);
  } catch (error) {
    console.error('Summarization error:', error);
    res.status(500).json({
      error: 'Failed to summarize meeting',
      summary: 'Meeting completed',
      actionItems: [],
      keyDecisions: [],
      nextSteps: [],
    });
  }
});

// Bot endpoint: Join meeting
app.post('/api/bot/join', async (req, res) => {
  try {
    const { meetingId, userName } = req.body;

    // This would use Zoom SDK to join the meeting
    // For now, we'll just simulate it
    console.log(`Bot joining meeting ${meetingId} as ${userName}`);

    res.json({
      status: 'joined',
      meetingId,
      botId: `bot-${Date.now()}`,
      message: 'Bot successfully joined meeting',
    });
  } catch (error) {
    console.error('Join error:', error);
    res.status(500).json({ error: 'Failed to join meeting' });
  }
});

// Bot endpoint: Get live transcript
app.get('/api/bot/transcript/:meetingId', async (req, res) => {
  try {
    const { meetingId } = req.params;

    // This would stream live transcript from the meeting
    // For now, return a placeholder

    res.json({
      meetingId,
      transcript: 'Live transcript would appear here...',
      participants: ['User', 'Bot'],
    });
  } catch (error) {
    console.error('Transcript error:', error);
    res.status(500).json({ error: 'Failed to get transcript' });
  }
});

// Extension endpoint: Get bot status
app.post('/api/extension/bot-status', async (req, res) => {
  try {
    const { meetingId } = req.body;

    res.json({
      isActive: true,
      meetingId,
      recordingStatus: 'recording',
      participants: 2,
      duration: 1234, // seconds
    });
  } catch (error) {
    console.error('Status error:', error);
    res.status(500).json({ error: 'Failed to get bot status' });
  }
});

app.listen(PORT, () => {
  console.log(`MeetingMind backend running on http://localhost:${PORT}`);
  console.log('Endpoints:');
  console.log('  POST /api/summarize - Summarize meeting');
  console.log('  POST /api/bot/join - Bot joins meeting');
  console.log('  GET /api/bot/transcript/:meetingId - Get live transcript');
  console.log('  POST /api/extension/bot-status - Get bot status');
});
