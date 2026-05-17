import type { Session, TriggerInsight, SessionInsight } from '../types/analytics';

export const analyticsEngine = {
  // Calculate trigger breakdown across multiple sessions
  calculateTriggerBreakdown(sessions: Session[]) {
    if (sessions.length === 0) {
      return { gaze: 0, blink: 0, expression: 0, headPose: 0 };
    }

    let totalGaze = 0,
      totalBlink = 0,
      totalExpression = 0,
      totalHeadPose = 0;

    sessions.forEach((session) => {
      const snapshots = session.snapshots;
      if (snapshots.length === 0) return;

      snapshots.forEach((snap) => {
        totalGaze += snap.gaze;
        totalBlink += snap.blink;
        totalExpression += snap.expression;
        totalHeadPose += snap.headPose;
      });
    });

    const totalSnapshots = sessions.reduce((sum, s) => sum + s.snapshots.length, 0);
    if (totalSnapshots === 0) {
      return { gaze: 0, blink: 0, expression: 0, headPose: 0 };
    }

    const avgGaze = totalGaze / totalSnapshots;
    const avgBlink = totalBlink / totalSnapshots;
    const avgExpression = totalExpression / totalSnapshots;
    const avgHeadPose = totalHeadPose / totalSnapshots;

    const sum = avgGaze + avgBlink + avgExpression + avgHeadPose;

    return {
      gaze: Math.round((avgGaze / sum) * 100),
      blink: Math.round((avgBlink / sum) * 100),
      expression: Math.round((avgExpression / sum) * 100),
      headPose: Math.round((avgHeadPose / sum) * 100),
    };
  },

  // Get trigger insights with recommendations
  getTriggerInsights(sessions: Session[]): TriggerInsight[] {
    const breakdown = this.calculateTriggerBreakdown(sessions);

    const insights: TriggerInsight[] = [
      {
        trigger: 'gaze',
        frequency: breakdown.gaze,
        averageImpact: this.calculateAverageImpact(sessions, 'gaze'),
        recommendation: 'Keep the camera at eye level. Set a focal point above your monitor.',
      },
      {
        trigger: 'blink',
        frequency: breakdown.blink,
        averageImpact: this.calculateAverageImpact(sessions, 'blink'),
        recommendation: 'Blink consciously every 20 seconds. Take screen breaks to reduce eye strain.',
      },
      {
        trigger: 'expression',
        frequency: breakdown.expression,
        averageImpact: this.calculateAverageImpact(sessions, 'expression'),
        recommendation: 'Be aware of your resting face. Smile or raise your eyebrows slightly to appear more engaged.',
      },
      {
        trigger: 'headPose',
        frequency: breakdown.headPose,
        averageImpact: this.calculateAverageImpact(sessions, 'headPose'),
        recommendation: 'Keep your head upright. If resting your head, ensure your eyes stay on screen.',
      },
    ];

    return insights.sort((a, b) => b.frequency - a.frequency);
  },

  // Calculate average impact of a trigger (how much it lowers score)
  calculateAverageImpact(sessions: Session[], trigger: string): number {
    if (sessions.length === 0) return 0;

    let totalImpact = 0;
    let count = 0;

    sessions.forEach((session) => {
      session.snapshots.forEach((snap) => {
        let triggerScore = 0;
        if (trigger === 'gaze') triggerScore = snap.gaze;
        else if (trigger === 'blink') triggerScore = snap.blink;
        else if (trigger === 'expression') triggerScore = snap.expression;
        else if (trigger === 'headPose') triggerScore = snap.headPose;

        // Impact = how much below average this trigger is
        const impact = Math.max(0, 50 - triggerScore); // 50 is neutral baseline
        totalImpact += impact;
        count++;
      });
    });

    return Math.round(totalImpact / (count || 1));
  },

  // Find temporal patterns
  getTemporalPatterns(sessions: Session[]) {
    if (sessions.length === 0) return { bestHour: null, worstHour: null, peakTime: null };

    const hourlyEngagement: { [key: number]: number[] } = {};

    sessions.forEach((session) => {
      const date = new Date(session.startTime);
      const hour = date.getHours();

      if (!hourlyEngagement[hour]) {
        hourlyEngagement[hour] = [];
      }

      hourlyEngagement[hour].push(session.averageScore || 0);
    });

    const hourStats = Object.entries(hourlyEngagement).map(([hour, scores]) => ({
      hour: parseInt(hour),
      avgScore: scores.reduce((a, b) => a + b, 0) / scores.length,
    }));

    const bestHour = hourStats.reduce((prev, curr) =>
      curr.avgScore > prev.avgScore ? curr : prev
    );
    const worstHour = hourStats.reduce((prev, curr) =>
      curr.avgScore < prev.avgScore ? curr : prev
    );

    return {
      bestHour: bestHour?.hour,
      worstHour: worstHour?.hour,
      peakTime: formatHour(bestHour?.hour || 0),
    };
  },

  // Get weekly trend (avg engagement per day)
  getWeeklyTrend(sessions: Session[]) {
    const dayStats: { [key: number]: number[] } = {};

    sessions.forEach((session) => {
      const date = new Date(session.startTime);
      const dayOfWeek = date.getDay();

      if (!dayStats[dayOfWeek]) {
        dayStats[dayOfWeek] = [];
      }
      dayStats[dayOfWeek].push(session.averageScore || 0);
    });

    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const trend = days.map((day, index) => ({
      day,
      avgScore: dayStats[index]
        ? Math.round(
            dayStats[index].reduce((a, b) => a + b, 0) / dayStats[index].length
          )
        : 0,
    }));

    return trend;
  },

  // Generate behavioral insights
  generateBehavioralInsights(sessions: Session[]): SessionInsight[] {
    if (sessions.length === 0) return [];

    const insights: SessionInsight[] = [];

    // Trigger-based insight
    const triggerInsights = this.getTriggerInsights(sessions);
    const topTrigger = triggerInsights[0];
    if (topTrigger && topTrigger.frequency > 30) {
      insights.push({
        type: 'trigger',
        title: `Your #1 distraction: ${topTrigger.trigger}`,
        description: `${topTrigger.trigger} accounts for ${topTrigger.frequency}% of your engagement challenges.`,
        actionable: topTrigger.recommendation,
      });
    }

    // Temporal insight
    const temporal = this.getTemporalPatterns(sessions);
    if (temporal.bestHour !== null && temporal.peakTime) {
      insights.push({
        type: 'temporal',
        title: `You're most focused in the ${temporal.peakTime}`,
        description: `Schedule important meetings during your peak engagement hours.`,
      });
    }

    // Engagement level insight
    const avgEngagement = Math.round(
      sessions.reduce((sum, s) => sum + (s.averageScore || 0), 0) / sessions.length
    );
    if (avgEngagement < 50) {
      insights.push({
        type: 'behavioral',
        title: 'Engagement is below 50%',
        description: `Consider taking screen breaks or eliminating distractions.`,
        actionable: 'Try the Pomodoro technique: 25 min focused, 5 min break.',
      });
    }

    // Session duration insight
    const avgDuration = Math.round(
      sessions.reduce((sum, s) => sum + (s.duration || 0), 0) / sessions.length / 1000 / 60
    );
    if (avgDuration > 30) {
      insights.push({
        type: 'behavioral',
        title: `Long sessions (${avgDuration} min avg)`,
        description: 'You tend to have sustained engagement in longer meetings.',
        actionable: 'Use this to your advantage—schedule important discussions when you have time.',
      });
    }

    return insights;
  },

  // Week-over-week comparison
  compareWeeks(thisWeekSessions: Session[], lastWeekSessions: Session[]): SessionInsight[] {
    const thisWeekAvg = thisWeekSessions.length
      ? Math.round(
          thisWeekSessions.reduce((sum, s) => sum + (s.averageScore || 0), 0) /
            thisWeekSessions.length
        )
      : 0;

    const lastWeekAvg = lastWeekSessions.length
      ? Math.round(
          lastWeekSessions.reduce((sum, s) => sum + (s.averageScore || 0), 0) /
            lastWeekSessions.length
        )
      : 0;

    const improvement = thisWeekAvg - lastWeekAvg;

    if (improvement === 0 || lastWeekAvg === 0) {
      return [];
    }

    return [
      {
        type: 'trend',
        title:
          improvement > 0
            ? `📈 You're ${improvement}% more engaged this week!`
            : `📉 Engagement is ${Math.abs(improvement)}% lower than last week`,
        description: `This week: ${thisWeekAvg}% vs Last week: ${lastWeekAvg}%`,
      },
    ];
  },
};

function formatHour(hour: number): string {
  const suffix = hour >= 12 ? 'pm' : 'am';
  const displayHour = hour % 12 || 12;
  return `${displayHour}${suffix}`;
}
