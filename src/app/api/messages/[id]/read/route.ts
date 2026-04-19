import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { getServerSession } from 'next-auth';
import { NextResponse } from 'next/server';

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  if (session?.user?.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  try {
    await req.text();

    const { id } = await params;
    const messageId = parseInt(id);
    const updatedMessage = await prisma.message.update({
      where: { id: messageId },
      data: { isRead: true },
    });
    return NextResponse.json(updatedMessage, { status: 200 });
  } catch {
    return NextResponse.json({ error: 'Failed to update message' }, { status: 500 });
  }
}