import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { getServerSession } from 'next-auth';
import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { type, message, questions } = await req.json();
    const userId = parseInt(session.user.id);

    if (!['IN', 'OUT', 'BREAK_START', 'BREAK_END'].includes(type)) {
      return NextResponse.json({ error: 'Invalid clock type' }, { status: 400 });
    }

    const clockEvent = await prisma.clockEvent.create({
      data: { type, userId },
    });

    if (type === 'OUT' && (message || questions?.length > 0)) {
      const createdMessage = await prisma.message.create({
        data: {
          content: message || "No summary provided.",
          clockEventId: clockEvent.id,
          userId,
        },
      });

      if (questions && questions.length > 0) {
        await prisma.question.createMany({
          data: questions.map((q: string) => ({
            content: q,
            messageId: createdMessage.id,
          })),
        });
      }
    }

    return NextResponse.json(clockEvent, { status: 201 });
  } catch {
    return NextResponse.json({ error: 'Something went wrong' }, { status: 500 });
  }
}