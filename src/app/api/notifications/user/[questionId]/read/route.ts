import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { getServerSession } from 'next-auth';
import { NextResponse } from 'next/server';

export async function PATCH(req: Request, { params }: { params: Promise<{ questionId: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    await req.text();
    const { questionId: qId } = await params;
    const questionId = parseInt(qId);

    if (Number.isNaN(questionId)) {
      return NextResponse.json({ error: 'Invalid question id' }, { status: 400 });
    }
    
    const result = await prisma.question.updateMany({
      where: {
        id: questionId,
        message: {
          userId: parseInt(session.user.id),
        },
      },
      data: { isReadByUser: true },
    });

    if (result.count === 0) {
      return NextResponse.json({ error: 'Question not found' }, { status: 404 });
    }

    return NextResponse.json({ message: 'Notification marked as read' });
  } catch {
    return NextResponse.json({ error: 'Something went wrong' }, { status: 500 });
  }
}
