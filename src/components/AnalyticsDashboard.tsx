import { useState, useMemo } from 'react';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import { analyticsEngine } from '../utils/analyticsEngine';
import { ZoomMeetings } from './ZoomMeetings';
import type { Session } from '../types/analytics';

const TRIGGER_COLORS = {
  gaze: '#3b82f6',
  blink: '#10b981',
  expression: '#f59e0b',
  headPose: '#8b5cf6',
};

const TAB_NAMES = ['Today', 'Weekly', 'Triggers', 'Insights', 'Goals', 'Meetings'] as const;

interface AnalyticsDashboardProps {
  currentSession: Session | null;
  allSessions: Session[];
}

export function AnalyticsDashboard({
  currentSession,
  allSessions,
}: AnalyticsDashboardProps) {
  const [activeTab, setActiveTab] = useState<typeof TAB_NAMES[number]>('Today');

  // Get relevant session data for tabs
  const todaysSessions = useMemo(() => {
    const now = new Date();
    const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    return allSessions.filter((s) => s.startTime > startOfDay.getTime());
  }, [allSessions]);

  const weekSessions = useMemo(() => {
    const now = Date.now();
    const weekAgo = now - 7 * 24 * 60 * 60 * 1000;
    return allSessions.filter((s) => s.startTime > weekAgo);
  }, [allSessions]);

  const triggerInsights = useMemo(() => {
    return analyticsEngine.getTriggerInsights(weekSessions);
  }, [weekSessions]);

  const behavioralInsights = useMemo(() => {
    return analyticsEngine.generateBehavioralInsights(weekSessions);
  }, [weekSessions]);

  const weeklyTrend = useMemo(() => {
    return analyticsEngine.getWeeklyTrend(weekSessions);
  }, [weekSessions]);

  const temporalPatterns = useMemo(() => {
    return analyticsEngine.getTemporalPatterns(weekSessions);
  }, [weekSessions]);

  // Current session line chart data (last 5 mins, 30-second intervals)
  const currentSessionChartData = useMemo(() => {
    if (!currentSession || currentSession.snapshots.length === 0) {
      return [];
    }
    // Sample every ~30 seconds to keep data manageable
    const data = currentSession.snapshots
      .filter((_, i) => i % 3 === 0)
      .map((snap) => ({
        time: new Date(snap.timestamp).toLocaleTimeString([], {
          hour: '2-digit',
          minute: '2-digit',
        }),
        score: snap.score,
      }));
    return data.slice(-10); // Last ~5 minutes
  }, [currentSession]);

  // Current session trigger breakdown pie chart
  const currentTriggerData = useMemo(() => {
    if (!currentSession || currentSession.snapshots.length === 0) {
      return [];
    }
    const totalGaze = currentSession.snapshots.reduce((sum, s) => sum + s.gaze, 0);
    const totalBlink = currentSession.snapshots.reduce(
      (sum, s) => sum + s.blink,
      0
    );
    const totalExpression = currentSession.snapshots.reduce(
      (sum, s) => sum + s.expression,
      0
    );
    const totalHeadPose = currentSession.snapshots.reduce(
      (sum, s) => sum + s.headPose,
      0
    );
    const total = totalGaze + totalBlink + totalExpression + totalHeadPose;
    if (total === 0) return [];
    return [
      { name: 'Gaze', value: Math.round((totalGaze / total) * 100) },
      { name: 'Blink', value: Math.round((totalBlink / total) * 100) },
      { name: 'Expression', value: Math.round((totalExpression / total) * 100) },
      { name: 'Head Pose', value: Math.round((totalHeadPose / total) * 100) },
    ];
  }, [currentSession]);

  // Trigger comparison bar chart data
  const triggerBarData = useMemo(() => {
    return triggerInsights.map((insight) => ({
      name: insight.trigger.charAt(0).toUpperCase() + insight.trigger.slice(1),
      frequency: insight.frequency,
      impact: insight.averageImpact,
    }));
  }, [triggerInsights]);

  // Format duration
  const formatDuration = (ms: number) => {
    const minutes = Math.floor(ms / 60000);
    const seconds = Math.floor((ms % 60000) / 1000);
    return `${minutes}m ${seconds}s`;
  };

  const renderMeetingsTab = () => (
    <ZoomMeetings />
  );

  // Render tabs
  const renderTodayTab = () => (
    <div className="space-y-6">
      {currentSession && currentSession.snapshots.length > 0 ? (
        <>
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg p-4">
              <div className="text-sm text-gray-600">Current Score</div>
              <div className="text-3xl font-bold text-blue-600">
                {currentSession.snapshots[currentSession.snapshots.length - 1].score}%
              </div>
            </div>
            <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-lg p-4">
              <div className="text-sm text-gray-600">Duration</div>
              <div className="text-lg font-semibold text-green-600">
                {formatDuration(Date.now() - currentSession.startTime)}
              </div>
            </div>
          </div>

          {currentSessionChartData.length > 0 && (
            <div className="bg-white rounded-lg p-4 border border-gray-200">
              <h3 className="text-sm font-semibold mb-3 text-gray-700">
                Engagement Trend (Last 5 min)
              </h3>
              <ResponsiveContainer width="100%" height={200}>
                <LineChart data={currentSessionChartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="time" tick={{ fontSize: 12 }} />
                  <YAxis domain={[0, 100]} />
                  <Tooltip />
                  <Line
                    type="monotone"
                    dataKey="score"
                    stroke="#3b82f6"
                    dot={false}
                    strokeWidth={2}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          )}

          {currentTriggerData.length > 0 && (
            <div className="bg-white rounded-lg p-4 border border-gray-200">
              <h3 className="text-sm font-semibold mb-3 text-gray-700">
                Signal Breakdown
              </h3>
              <ResponsiveContainer width="100%" height={200}>
                <PieChart>
                  <Pie
                    data={currentTriggerData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    dataKey="value"
                    label
                  >
                    {currentTriggerData.map((_, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={
                          Object.values(TRIGGER_COLORS)[index % 4]
                        }
                      />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
          )}
        </>
      ) : (
        <div className="bg-gray-50 rounded-lg p-8 text-center">
          <p className="text-gray-500">Start a session to see today's analytics</p>
        </div>
      )}

      {todaysSessions.length > 0 && (
        <div className="bg-white rounded-lg p-4 border border-gray-200">
          <h3 className="text-sm font-semibold mb-3 text-gray-700">
            Sessions Today
          </h3>
          <div className="space-y-2">
            {todaysSessions.map((session) => (
              <div
                key={session.id}
                className="flex justify-between items-center p-2 bg-gray-50 rounded"
              >
                <span className="text-sm text-gray-600">
                  {new Date(session.startTime).toLocaleTimeString([], {
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </span>
                <span className="text-sm font-semibold text-gray-900">
                  {session.averageScore || 0}%
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );

  const renderWeeklyTab = () => (
    <div className="space-y-6">
      {weekSessions.length === 0 ? (
        <div className="bg-gray-50 rounded-lg p-8 text-center">
          <p className="text-gray-500">Need more data to show weekly trends</p>
        </div>
      ) : (
        <>
          <div className="bg-white rounded-lg p-4 border border-gray-200">
            <h3 className="text-sm font-semibold mb-3 text-gray-700">
              Weekly Engagement
            </h3>
            <ResponsiveContainer width="100%" height={250}>
              <LineChart data={weeklyTrend}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="day" tick={{ fontSize: 12 }} />
                <YAxis domain={[0, 100]} />
                <Tooltip />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="avgScore"
                  stroke="#3b82f6"
                  name="Avg Score"
                  strokeWidth={2}
                  dot={{ r: 4 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>

          {temporalPatterns.bestHour !== null && (
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-lg p-4">
                <div className="text-sm text-gray-600">Best Time</div>
                <div className="text-lg font-semibold text-green-600">
                  {temporalPatterns.peakTime}
                </div>
              </div>
              {temporalPatterns.worstHour !== null && (
                <div className="bg-gradient-to-br from-red-50 to-red-100 rounded-lg p-4">
                  <div className="text-sm text-gray-600">Slowest Time</div>
                  <div className="text-lg font-semibold text-red-600">
                    {temporalPatterns.worstHour}:00
                  </div>
                </div>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );

  const renderTriggersTab = () => (
    <div className="space-y-6">
      {triggerBarData.length === 0 ? (
        <div className="bg-gray-50 rounded-lg p-8 text-center">
          <p className="text-gray-500">Need more data to analyze triggers</p>
        </div>
      ) : (
        <>
          <div className="bg-white rounded-lg p-4 border border-gray-200">
            <h3 className="text-sm font-semibold mb-3 text-gray-700">
              Signal Frequency & Impact
            </h3>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={triggerBarData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="frequency" fill="#3b82f6" name="Frequency %" />
                <Bar dataKey="impact" fill="#ef4444" name="Impact %" />
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="space-y-3">
            {triggerInsights.map((insight) => (
              <div
                key={insight.trigger}
                className="bg-white rounded-lg p-4 border border-gray-200"
              >
                <div className="flex items-start justify-between mb-2">
                  <h4 className="font-semibold text-gray-900 capitalize">
                    {insight.trigger}
                  </h4>
                  <span className="text-sm font-bold text-gray-600">
                    {insight.frequency}%
                  </span>
                </div>
                <p className="text-sm text-gray-600 mb-2">
                  Avg Impact: {insight.averageImpact}%
                </p>
                <p className="text-sm text-blue-600">{insight.recommendation}</p>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );

  const renderInsightsTab = () => (
    <div className="space-y-4">
      {behavioralInsights.length === 0 ? (
        <div className="bg-gray-50 rounded-lg p-8 text-center">
          <p className="text-gray-500">
            Generate more sessions to unlock personalized insights
          </p>
        </div>
      ) : (
        behavioralInsights.map((insight, idx) => (
          <div key={idx} className="bg-white rounded-lg p-4 border border-gray-200">
            <div className="flex items-start gap-3">
              <div className="text-2xl">
                {insight.type === 'trigger' && '🎯'}
                {insight.type === 'temporal' && '⏰'}
                {insight.type === 'behavioral' && '💡'}
                {insight.type === 'trend' && '📈'}
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-gray-900 text-sm mb-1">
                  {insight.title}
                </h3>
                <p className="text-sm text-gray-600 mb-2">{insight.description}</p>
                {insight.actionable && (
                  <p className="text-sm text-blue-600 font-medium">
                    💭 {insight.actionable}
                  </p>
                )}
              </div>
            </div>
          </div>
        ))
      )}
    </div>
  );

  const renderGoalsTab = () => (
    <div className="space-y-4">
      <div className="bg-white rounded-lg p-4 border border-gray-200">
        <h3 className="font-semibold text-gray-900 mb-3">Weekly Goals</h3>
        <div className="space-y-3">
          <div>
            <div className="flex justify-between mb-1">
              <span className="text-sm font-medium text-gray-700">
                Maintain 70%+ engagement
              </span>
              <span className="text-sm text-gray-600">3/5 sessions</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div className="bg-blue-600 h-2 rounded-full" style={{ width: '60%' }}></div>
            </div>
          </div>

          <div>
            <div className="flex justify-between mb-1">
              <span className="text-sm font-medium text-gray-700">
                Reduce gaze distractions
              </span>
              <span className="text-sm text-gray-600">28% → 25%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className="bg-green-600 h-2 rounded-full"
                style={{ width: '75%' }}
              ></div>
            </div>
          </div>

          <div>
            <div className="flex justify-between mb-1">
              <span className="text-sm font-medium text-gray-700">
                Improve consistency
              </span>
              <span className="text-sm text-gray-600">Tracking...</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className="bg-amber-600 h-2 rounded-full"
                style={{ width: '45%' }}
              ></div>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
        <p className="text-sm text-blue-900">
          💭 <strong>Tip:</strong> Goals update as you collect more engagement data. Keep
          collecting sessions to see your progress!
        </p>
      </div>
    </div>
  );

  return (
    <div className="flex flex-col h-full bg-white rounded-lg shadow-lg overflow-hidden">
      {/* Tab Navigation */}
      <div className="flex border-b border-gray-200 bg-gray-50">
        {TAB_NAMES.map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`flex-1 px-4 py-3 text-sm font-medium transition-colors ${
              activeTab === tab
                ? 'text-blue-600 border-b-2 border-blue-600 bg-white'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div className="flex-1 overflow-y-auto p-4">
        {activeTab === 'Today' && renderTodayTab()}
        {activeTab === 'Weekly' && renderWeeklyTab()}
        {activeTab === 'Triggers' && renderTriggersTab()}
        {activeTab === 'Insights' && renderInsightsTab()}
        {activeTab === 'Goals' && renderGoalsTab()}
        {activeTab === 'Meetings' && renderMeetingsTab()}
      </div>
    </div>
  );
}
