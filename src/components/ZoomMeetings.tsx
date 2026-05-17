import { useState, useEffect } from 'react';
import { zoomService, type ZoomMeeting, type ZoomTranscript } from '../services/zoomService';
import { summarizeService, type MeetingSummary } from '../services/summarizeService';
import { Loader, CheckCircle, AlertCircle } from 'lucide-react';

interface MeetingWithSummary extends ZoomMeeting {
  transcript?: ZoomTranscript;
  summary?: MeetingSummary;
  loading?: boolean;
  error?: string;
}

export function ZoomMeetings() {
  const [isConnected, setIsConnected] = useState(false);
  const [meetings, setMeetings] = useState<MeetingWithSummary[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [expandedMeeting, setExpandedMeeting] = useState<string | null>(null);

  // Check if user is already connected (token in localStorage)
  useEffect(() => {
    const token = localStorage.getItem('zoom_access_token');
    if (token) {
      setIsConnected(true);
      fetchMeetings(token);
    }
  }, []);

  // Handle OAuth callback
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const code = params.get('code');

    if (code && !isConnected) {
      exchangeAuthCode(code);
    }
  }, [isConnected]);

  const exchangeAuthCode = async (code: string) => {
    try {
      setLoading(true);
      const token = await zoomService.exchangeCodeForToken(code);
      localStorage.setItem('zoom_access_token', token);
      setIsConnected(true);
      await fetchMeetings(token);
      // Clean up URL
      window.history.replaceState({}, document.title, window.location.pathname);
    } catch (err) {
      setError('Failed to connect to Zoom. Please try again.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchMeetings = async (token: string) => {
    try {
      setLoading(true);
      setError(null);
      const fetchedMeetings = await zoomService.getMeetings(token);
      setMeetings(fetchedMeetings);
    } catch (err) {
      setError('Failed to fetch meetings. Please reconnect.');
      setIsConnected(false);
      localStorage.removeItem('zoom_access_token');
    } finally {
      setLoading(false);
    }
  };

  const connectZoom = () => {
    const authUrl = zoomService.getAuthUrl();
    window.location.href = authUrl;
  };

  const summarizeMeeting = async (meeting: MeetingWithSummary) => {
    const token = localStorage.getItem('zoom_access_token');
    if (!token) return;

    try {
      setMeetings((prev) =>
        prev.map((m) =>
          m.id === meeting.id ? { ...m, loading: true, error: undefined } : m
        )
      );

      // Fetch transcript
      const transcript = await zoomService.getTranscript(token, meeting.id);

      // Summarize
      const summary = await summarizeService.summarizeMeeting(transcript.text);

      // Update meeting
      setMeetings((prev) =>
        prev.map((m) =>
          m.id === meeting.id
            ? { ...m, transcript, summary, loading: false }
            : m
        )
      );
      setExpandedMeeting(meeting.id);
    } catch (err) {
      setMeetings((prev) =>
        prev.map((m) =>
          m.id === meeting.id
            ? { ...m, error: 'Failed to summarize', loading: false }
            : m
        )
      );
    }
  };

  const disconnect = () => {
    localStorage.removeItem('zoom_access_token');
    setIsConnected(false);
    setMeetings([]);
    setError(null);
  };

  if (!isConnected) {
    return (
      <div className="flex flex-col items-center justify-center p-8 rounded-lg bg-surface border border-surface-border">
        <div className="text-center">
          <h2 className="text-xl font-bold text-white mb-2">Connect Zoom</h2>
          <p className="text-white/60 mb-6">
            Connect your Zoom account to access meeting transcripts and auto-generate summaries
          </p>
          <button
            onClick={connectZoom}
            disabled={loading}
            className="px-6 py-3 bg-neon-blue hover:bg-neon-blue/80 text-white font-semibold rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Connecting...' : 'Connect Zoom Account'}
          </button>
          {error && (
            <p className="text-red-400 text-sm mt-4">{error}</p>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-xl font-bold text-white">Recent Meetings</h2>
          <p className="text-white/60 text-sm">Zoom meetings with transcripts</p>
        </div>
        <button
          onClick={disconnect}
          className="px-3 py-1 text-xs bg-red-500/20 hover:bg-red-500/30 text-red-400 rounded transition-colors"
        >
          Disconnect
        </button>
      </div>

      {loading && meetings.length === 0 ? (
        <div className="flex items-center justify-center p-8">
          <Loader className="animate-spin text-neon-blue mr-2" />
          <span className="text-white/60">Loading meetings...</span>
        </div>
      ) : meetings.length === 0 ? (
        <div className="p-8 rounded-lg bg-surface border border-surface-border text-center text-white/60">
          No meetings with transcripts found
        </div>
      ) : (
        <div className="space-y-3">
          {meetings.map((meeting) => (
            <div
              key={meeting.id}
              className="bg-surface border border-surface-border rounded-lg p-4 transition-all hover:border-neon-blue/50"
            >
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <h3 className="font-semibold text-white">{meeting.topic}</h3>
                    {meeting.summary && <CheckCircle className="w-4 h-4 text-green-400" />}
                    {meeting.error && <AlertCircle className="w-4 h-4 text-red-400" />}
                  </div>
                  <p className="text-xs text-white/50 mt-1">
                    {new Date(meeting.start_time).toLocaleString()}
                  </p>
                </div>
                <button
                  onClick={() => {
                    if (meeting.summary) {
                      setExpandedMeeting(expandedMeeting === meeting.id ? null : meeting.id);
                    } else {
                      summarizeMeeting(meeting);
                    }
                  }}
                  disabled={meeting.loading}
                  className="px-3 py-1 text-sm bg-neon-blue/20 hover:bg-neon-blue/40 text-neon-blue rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {meeting.loading ? (
                    <span className="flex items-center gap-1">
                      <Loader className="w-3 h-3 animate-spin" />
                    </span>
                  ) : meeting.summary ? (
                    'View'
                  ) : (
                    'Summarize'
                  )}
                </button>
              </div>

              {/* Expanded summary */}
              {expandedMeeting === meeting.id && meeting.summary && (
                <div className="mt-4 pt-4 border-t border-surface-border space-y-3 text-sm">
                  <div>
                    <p className="text-neon-green font-semibold mb-1">Summary</p>
                    <p className="text-white/80">{meeting.summary.summary}</p>
                  </div>

                  {meeting.summary.actionItems.length > 0 && (
                    <div>
                      <p className="text-neon-yellow font-semibold mb-1">Action Items</p>
                      <ul className="space-y-1">
                        {meeting.summary.actionItems.map((item, i) => (
                          <li key={i} className="text-white/70 flex items-start gap-2">
                            <span className="text-neon-yellow">•</span>
                            {item}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {meeting.summary.keyDecisions.length > 0 && (
                    <div>
                      <p className="text-neon-blue font-semibold mb-1">Key Decisions</p>
                      <ul className="space-y-1">
                        {meeting.summary.keyDecisions.map((item, i) => (
                          <li key={i} className="text-white/70 flex items-start gap-2">
                            <span className="text-neon-blue">•</span>
                            {item}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {meeting.summary.blockers.length > 0 && (
                    <div>
                      <p className="text-red-400 font-semibold mb-1">Blockers</p>
                      <ul className="space-y-1">
                        {meeting.summary.blockers.map((item, i) => (
                          <li key={i} className="text-white/70 flex items-start gap-2">
                            <span className="text-red-400">⚠️</span>
                            {item}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              )}

              {meeting.error && (
                <p className="text-red-400 text-xs mt-2">{meeting.error}</p>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
