import { prisma } from '@/lib/db';
import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { Role } from '@prisma/client';
import { validatePassword } from '@/lib/utils';

export async function POST(req: Request) {
  try {
    const { firstName, lastName, username, email, password } = await req.json();

    if (!firstName || !lastName) {
      return NextResponse.json({ error: 'First and last name are required.' }, { status: 400 });
    }

    if (!validatePassword(password)) {
      return NextResponse.json({ error: 'Password does not meet the security requirements.' }, { status: 400 });
    }

    const existingUser = await prisma.user.findFirst({
      where: { OR: [{ email }, { username }] },
    });

    if (existingUser) {
      return NextResponse.json({ error: 'Email or username already exists' }, { status: 409 });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    await prisma.user.create({
      data: {
        firstName,
        lastName,
        username,
        email,
        password: hashedPassword,
        role: Role.EMPLOYEE,
      },
    });

    return NextResponse.json({ message: 'User registered successfully' }, { status: 201 });
  } catch {
    return NextResponse.json({ error: 'Something went wrong' }, { status: 500 });
  }
}