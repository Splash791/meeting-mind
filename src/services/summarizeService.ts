const CLAUDE_API_KEY = import.meta.env.VITE_CLAUDE_API_KEY;

export interface MeetingSummary {
  summary: string;
  actionItems: string[];
  keyDecisions: string[];
  blockers: string[];
  nextSteps: string[];
}

export const summarizeService = {
  async summarizeMeeting(transcript: string): Promise<MeetingSummary> {
    if (!CLAUDE_API_KEY) {
      throw new Error('Claude API key not configured');
    }

    const prompt = `You are a meeting summary expert. Analyze this meeting transcript and provide:

1. A 3-4 sentence summary of the meeting
2. Action items in format "Person: Task by deadline"
3. Key decisions made
4. Any blockers or risks mentioned
5. Suggested next steps

Format your response as JSON:
{
  "summary": "...",
  "actionItems": ["...", "..."],
  "keyDecisions": ["...", "..."],
  "blockers": ["...", "..."],
  "nextSteps": ["...", "..."]
}

Transcript:
${transcript.substring(0, 8000)}`;

    try {
      const response = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': CLAUDE_API_KEY,
          'anthropic-version': '2023-06-01',
        },
        body: JSON.stringify({
          model: 'claude-opus-4-7',
          max_tokens: 1024,
          messages: [
            {
              role: 'user',
              content: prompt,
            },
          ],
        }),
      });

      if (!response.ok) {
        throw new Error(`Claude API error: ${response.statusText}`);
      }

      const data = await response.json();
      const content = data.content[0].text;

      // Parse JSON from response
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error('Failed to parse Claude response');
      }

      const parsed = JSON.parse(jsonMatch[0]);

      return {
        summary: parsed.summary || 'No summary available',
        actionItems: Array.isArray(parsed.actionItems) ? parsed.actionItems : [],
        keyDecisions: Array.isArray(parsed.keyDecisions) ? parsed.keyDecisions : [],
        blockers: Array.isArray(parsed.blockers) ? parsed.blockers : [],
        nextSteps: Array.isArray(parsed.nextSteps) ? parsed.nextSteps : [],
      };
    } catch (error) {
      console.error('Failed to summarize meeting:', error);
      throw error;
    }
  },
};
