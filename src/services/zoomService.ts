import axios from 'axios';

const ZOOM_CLIENT_ID = import.meta.env.VITE_ZOOM_CLIENT_ID;
const ZOOM_CLIENT_SECRET = import.meta.env.VITE_ZOOM_CLIENT_SECRET;
const ZOOM_REDIRECT_URI = import.meta.env.VITE_ZOOM_REDIRECT_URI || 'http://localhost:5173/zoom-callback';

export interface ZoomMeeting {
  id: string;
  topic: string;
  start_time: string;
  duration: number;
  has_transcript: boolean;
}

export interface ZoomTranscript {
  meetingId: string;
  topic: string;
  text: string;
  participants: string[];
}

export const zoomService = {
  // Generate OAuth URL for user to authorize
  getAuthUrl(): string {
    const params = new URLSearchParams({
      client_id: ZOOM_CLIENT_ID,
      response_type: 'code',
      redirect_uri: ZOOM_REDIRECT_URI,
      scope: 'recording:read meeting:read',
    });

    return `https://zoom.us/oauth/authorize?${params.toString()}`;
  },

  // Exchange authorization code for access token
  async exchangeCodeForToken(code: string): Promise<string> {
    try {
      const response = await axios.post(
        'https://zoom.us/oauth/token',
        {},
        {
          params: {
            grant_type: 'authorization_code',
            code,
            redirect_uri: ZOOM_REDIRECT_URI,
          },
          auth: {
            username: ZOOM_CLIENT_ID,
            password: ZOOM_CLIENT_SECRET,
          },
        }
      );

      return response.data.access_token;
    } catch (error) {
      console.error('Failed to exchange code for token:', error);
      throw error;
    }
  },

  // Fetch user's meetings that have recordings/transcripts
  async getMeetings(accessToken: string): Promise<ZoomMeeting[]> {
    try {
      const response = await axios.get('https://api.zoom.us/v2/users/me/recordings', {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
        params: {
          page_size: 30,
        },
      });

      // Extract meetings with transcripts
      const meetings: ZoomMeeting[] = [];

      if (response.data.recording_files) {
        response.data.recording_files.forEach((file: any) => {
          if (file.recording_type === 'transcript') {
            meetings.push({
              id: file.id,
              topic: file.recording_type === 'transcript' ? 'Transcript' : file.topic || 'Meeting',
              start_time: file.recording_start,
              duration: file.file_size,
              has_transcript: true,
            });
          }
        });
      }

      return meetings;
    } catch (error) {
      console.error('Failed to fetch meetings:', error);
      throw error;
    }
  },

  // Fetch transcript for a specific meeting
  async getTranscript(accessToken: string, meetingId: string): Promise<ZoomTranscript> {
    try {
      const response = await axios.get(
        `https://api.zoom.us/v2/recordings/${meetingId}/transcript`,
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        }
      );

      // Parse VTT format transcript
      const text = parseTranscript(response.data);

      return {
        meetingId,
        topic: response.data.meeting_topic || 'Meeting',
        text,
        participants: extractParticipants(text),
      };
    } catch (error) {
      console.error('Failed to fetch transcript:', error);
      throw error;
    }
  },
};

// Helper: Parse VTT transcript format
function parseTranscript(data: any): string {
  if (typeof data === 'string') {
    // Parse VTT format
    const lines = data.split('\n');
    const text: string[] = [];

    for (const line of lines) {
      // Skip timestamps and metadata
      if (!line.includes('-->') && line.trim() && !line.includes('WEBVTT')) {
        text.push(line.trim());
      }
    }

    return text.join('\n');
  }

  // If already parsed
  if (Array.isArray(data)) {
    return data.map((item: any) => `${item.speaker}: ${item.text}`).join('\n');
  }

  return '';
}

// Helper: Extract speaker names
function extractParticipants(text: string): string[] {
  const participants = new Set<string>();
  const lines = text.split('\n');

  for (const line of lines) {
    // Look for "Speaker: text" pattern
    const match = line.match(/^([^:]+):/);
    if (match) {
      participants.add(match[1].trim());
    }
  }

  return Array.from(participants);
}
