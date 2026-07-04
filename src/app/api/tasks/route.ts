import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { TaskPriority, TaskStatus } from '@prisma/client';
import { getServerSession } from 'next-auth';
import { NextResponse } from 'next/server';

const taskInclude = {
  _count: { select: { clockEvents: true } },
};

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const userId = parseInt(session.user.id);

  try {
    const tasks = await prisma.task.findMany({
      where: { userId },
      include: taskInclude,
      orderBy: [{ status: 'asc' }, { updatedAt: 'desc' }],
    });

    return NextResponse.json(tasks);
  } catch {
    return NextResponse.json({ error: 'Something went wrong' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { title, description, priority } = await req.json();
    const userId = parseInt(session.user.id);
    const cleanTitle = typeof title === 'string' ? title.trim() : '';
    const cleanDescription = typeof description === 'string' ? description.trim() : '';
    const cleanPriority = Object.values(TaskPriority).includes(priority) ? priority : TaskPriority.MEDIUM;

    if (!cleanTitle) {
      return NextResponse.json({ error: 'Task title is required' }, { status: 400 });
    }

    const task = await prisma.task.create({
      data: {
        title: cleanTitle,
        description: cleanDescription || null,
        priority: cleanPriority,
        status: TaskStatus.TODO,
        userId,
      },
      include: taskInclude,
    });

    return NextResponse.json(task, { status: 201 });
  } catch {
    return NextResponse.json({ error: 'Something went wrong' }, { status: 500 });
  }
}
