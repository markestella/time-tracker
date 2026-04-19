import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { getServerSession } from 'next-auth';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const from = searchParams.get('from');
  const to = searchParams.get('to');
  const targetUserIdParam = searchParams.get('userId'); 

  if (!from || !to) {
    return NextResponse.json({ error: 'Missing date range parameters' }, { status: 400 });
  }
  
  let userIdToQuery: number;

  if (targetUserIdParam) {
    if (session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }
    userIdToQuery = parseInt(targetUserIdParam);
  } else {
    userIdToQuery = parseInt(session.user.id);
  }

  try {
    const startDate = new Date(from);
    const endDate = new Date(to);

    const activities = await prisma.clockEvent.findMany({
      where: {
        userId: userIdToQuery,
        timestamp: { gte: startDate, lte: endDate },
      },
      include: {
        message: { include: { questions: { select: { content: true, answer: true } } } },
      },
      orderBy: { timestamp: 'desc' },
    });

    return NextResponse.json(activities);
  } catch {
    return NextResponse.json({ error: 'Something went wrong' }, { status: 500 });
  }
}