import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { getServerSession } from 'next-auth';
import { NextResponse } from 'next/server';

export async function PATCH(req: Request) {
  const session = await getServerSession(authOptions);
  if (session?.user?.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  try {
    const answers: { questionId: number; answer: string }[] = await req.json();

    if (!answers || answers.length === 0) {
      return NextResponse.json({ error: 'No answers provided' }, { status: 400 });
    }

    const updatePromises = answers.map(({ questionId, answer }) =>
      prisma.question.update({
        where: { id: questionId },
        data: { answer, isReadByUser: false },
      })
    );

    await Promise.all(updatePromises);

    return NextResponse.json({ message: 'Answers submitted successfully' }, { status: 200 });
  } catch {
    return NextResponse.json({ error: 'Failed to submit answers' }, { status: 500 });
  }
}