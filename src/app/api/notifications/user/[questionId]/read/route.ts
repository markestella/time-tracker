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
    
    await prisma.question.update({
      where: { id: questionId },
      data: { isReadByUser: true },
    });
    return NextResponse.json({ message: 'Notification marked as read' });
  } catch {
    return NextResponse.json({ error: 'Something went wrong' }, { status: 500 });
  }
}