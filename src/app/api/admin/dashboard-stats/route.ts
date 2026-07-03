import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { getServerSession } from 'next-auth';
import { NextResponse } from 'next/server';

export async function GET() {
  const session = await getServerSession(authOptions);
  if (session?.user?.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const activeUsersQuery = prisma.user.findMany({
        where: { role: 'EMPLOYEE' },
        include: { clockEvents: { orderBy: { timestamp: 'desc' }, take: 1 } },
    });
    
    const clockedInTodayQuery = prisma.clockEvent.count({
        where: { type: 'IN', timestamp: { gte: today } },
    });

    const [activeUsers, clockedInToday] = await Promise.all([activeUsersQuery, clockedInTodayQuery]);

    const onBreak = activeUsers.filter(user => user.clockEvents[0]?.type === 'BREAK_START').length;
    
    const currentlyClockedIn = activeUsers.filter(user => ['IN', 'BREAK_START', 'BREAK_END'].includes(user.clockEvents[0]?.type)).length;

    return NextResponse.json({
        activeUsers: currentlyClockedIn,
        clockedInToday,
        onBreak,
    });

  } catch {
    return NextResponse.json({ error: 'Something went wrong' }, { status: 500 });
  }
}
