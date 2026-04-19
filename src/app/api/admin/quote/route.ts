import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { getServerSession } from 'next-auth';
import { NextRequest, NextResponse } from 'next/server';
import { startOfDay } from 'date-fns';

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (session?.user?.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const { searchParams } = new URL(req.url);
  const date = searchParams.get('date');

  if (!date) {
    return NextResponse.json({ error: 'Date parameter is required' }, { status: 400 });
  }
  
  const targetDate = startOfDay(new Date(date));

  const quote = await prisma.quoteOfTheDay.findUnique({
    where: { date: targetDate },
  });

  return NextResponse.json(quote);
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (session?.user?.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }
  
  try {
    const { quote, author, date } = await req.json();
    const targetDate = startOfDay(new Date(date));

    const result = await prisma.quoteOfTheDay.upsert({
      where: { date: targetDate },
      update: { quote, author },
      create: { quote, author, date: targetDate },
    });

    return NextResponse.json(result, { status: 200 });
  } catch {
    return NextResponse.json({ error: 'Something went wrong' }, { status: 500 });
  }
}