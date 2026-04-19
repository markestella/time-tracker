import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { getServerSession } from 'next-auth';
import { NextResponse } from 'next/server';

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const userId = parseInt(session.user.id);
    const answeredQuestions = await prisma.question.findMany({
      where: {
        message: {
          userId: userId,
        },
        answer: {
          not: null,
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
    return NextResponse.json(answeredQuestions);
  } catch {
    return NextResponse.json({ error: 'Something went wrong' }, { status: 500 });
  }
}