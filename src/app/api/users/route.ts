import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { Role } from '@prisma/client';
import { getServerSession } from 'next-auth';
import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';

export async function GET() {
    const session = await getServerSession(authOptions);
    if (session?.user?.role !== 'ADMIN') {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }
    
    const users = await prisma.user.findMany({
        where: { role: 'EMPLOYEE' },
        orderBy: { createdAt: 'desc' },
        include: {
            clockEvents: {
                orderBy: { timestamp: 'desc' },
                take: 1,
            }
        }
    });
    return NextResponse.json(users);
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (session?.user?.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  try {
    const { firstName, lastName, username, email, password } = await req.json();
    const hashedPassword = await bcrypt.hash(password, 10);

    const newUser = await prisma.user.create({
      data: { 
        firstName, 
        lastName, 
        username, 
        email, 
        password: hashedPassword, 
        role: Role.EMPLOYEE 
      }
    });
    return NextResponse.json(newUser, { status: 201 });
  } catch {
    return NextResponse.json({ error: 'User with this email or username may already exist.' }, { status: 409 });
  }
}