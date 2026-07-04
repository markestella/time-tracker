import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { TaskPriority, TaskStatus } from '@prisma/client';
import { getServerSession } from 'next-auth';
import { NextRequest, NextResponse } from 'next/server';

const taskInclude = {
  _count: { select: { clockEvents: true } },
};

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function PATCH(req: NextRequest, context: RouteContext) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { id } = await context.params;
  const taskId = parseInt(id);
  const userId = parseInt(session.user.id);

  if (Number.isNaN(taskId)) {
    return NextResponse.json({ error: 'Invalid task id' }, { status: 400 });
  }

  try {
    const task = await prisma.task.findFirst({
      where: { id: taskId, userId },
    });

    if (!task) {
      return NextResponse.json({ error: 'Task not found' }, { status: 404 });
    }

    const { title, description, status, priority } = await req.json();
    const data: {
      title?: string;
      description?: string | null;
      status?: TaskStatus;
      priority?: TaskPriority;
      completedAt?: Date | null;
    } = {};

    if (typeof title === 'string') {
      const cleanTitle = title.trim();
      if (!cleanTitle) {
        return NextResponse.json({ error: 'Task title is required' }, { status: 400 });
      }
      data.title = cleanTitle;
    }

    if (typeof description === 'string') {
      data.description = description.trim() || null;
    }

    if (Object.values(TaskPriority).includes(priority)) {
      data.priority = priority;
    }

    if (Object.values(TaskStatus).includes(status)) {
      data.status = status;
      data.completedAt = status === TaskStatus.DONE ? new Date() : null;
    }

    const updatedTask = await prisma.task.update({
      where: { id: taskId },
      data,
      include: taskInclude,
    });

    return NextResponse.json(updatedTask);
  } catch {
    return NextResponse.json({ error: 'Something went wrong' }, { status: 500 });
  }
}

export async function DELETE(_req: NextRequest, context: RouteContext) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { id } = await context.params;
  const taskId = parseInt(id);
  const userId = parseInt(session.user.id);

  if (Number.isNaN(taskId)) {
    return NextResponse.json({ error: 'Invalid task id' }, { status: 400 });
  }

  try {
    const task = await prisma.task.findFirst({
      where: { id: taskId, userId },
    });

    if (!task) {
      return NextResponse.json({ error: 'Task not found' }, { status: 404 });
    }

    await prisma.task.delete({ where: { id: taskId } });
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: 'Something went wrong' }, { status: 500 });
  }
}
