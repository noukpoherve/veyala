import "server-only";
import { db } from "@/lib/db";

export type WeekBucket = { label: string; count: number; start: Date };

export type DashboardStats = {
  balance: number;
  cvsTotal: number;
  cvsLast30Days: number;
  avgMatchGain: number | null;
  bestMatchAfter: number | null;
  creditsSpent30Days: number;
  weeks: WeekBucket[];
};

function startOfWeek(d: Date): Date {
  const x = new Date(d);
  const day = x.getDay(); // 0 Sun
  const diff = day === 0 ? -6 : 1 - day; // Monday start
  x.setHours(0, 0, 0, 0);
  x.setDate(x.getDate() + diff);
  return x;
}

/** Aggregates activity metrics for the user dashboard (SSR). */
export async function getDashboardStats(userId: string): Promise<DashboardStats> {
  const now = new Date();
  const since30 = new Date(now);
  since30.setDate(since30.getDate() - 30);
  const sinceWeeks = startOfWeek(now);
  sinceWeeks.setDate(sinceWeeks.getDate() - 7 * 7); // 8 weeks window

  const [credits, cvs, spent] = await Promise.all([
    db.credits.findUnique({ where: { userId }, select: { balance: true } }),
    db.generatedCV.findMany({
      where: { userId, createdAt: { gte: sinceWeeks } },
      select: {
        createdAt: true,
        matchScoreBefore: true,
        matchScoreAfter: true,
      },
      orderBy: { createdAt: "asc" },
    }),
    db.creditTransaction.aggregate({
      where: {
        userId,
        reason: "GENERATION",
        createdAt: { gte: since30 },
        delta: { lt: 0 },
      },
      _sum: { delta: true },
    }),
  ]);

  const cvsLast30Days = cvs.filter((c) => c.createdAt >= since30).length;
  const withScores = cvs.filter((c) => c.matchScoreBefore != null && c.matchScoreAfter != null) as {
    matchScoreBefore: number;
    matchScoreAfter: number;
  }[];
  const avgMatchGain =
    withScores.length > 0
      ? Math.round(
          withScores.reduce((s, c) => s + (c.matchScoreAfter - c.matchScoreBefore), 0) /
            withScores.length
        )
      : null;
  const bestMatchAfter =
    withScores.length > 0 ? Math.max(...withScores.map((c) => c.matchScoreAfter)) : null;

  const weeks: WeekBucket[] = [];
  for (let i = 7; i >= 0; i--) {
    const start = startOfWeek(now);
    start.setDate(start.getDate() - 7 * i);
    const end = new Date(start);
    end.setDate(end.getDate() + 7);
    const count = cvs.filter((c) => c.createdAt >= start && c.createdAt < end).length;
    const label = new Intl.DateTimeFormat("fr-FR", { day: "numeric", month: "short" }).format(
      start
    );
    weeks.push({ label, count, start });
  }

  const cvsTotal = await db.generatedCV.count({ where: { userId } });

  return {
    balance: credits?.balance ?? 0,
    cvsTotal,
    cvsLast30Days,
    avgMatchGain,
    bestMatchAfter,
    creditsSpent30Days: Math.abs(spent._sum.delta ?? 0),
    weeks,
  };
}
