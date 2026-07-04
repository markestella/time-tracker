import { AnimatedQuote } from '@/components/landing/AnimatedQuote';
import { BrandMark } from '@/components/brand/BrandMark';
import { Button } from '@/components/ui/button';
import { prisma } from '@/lib/db';
import { startOfDay } from 'date-fns';
import Link from 'next/link';

async function getQuoteOfTheDay() {
  try {
    const today = startOfDay(new Date());
    const quote = await prisma.quoteOfTheDay.findUnique({
      where: { date: today },
    });

    if (quote) {
      return { quote: quote.quote, author: quote.author };
    }
  } catch {
    // Use the fallback quote if the database is unavailable during build/startup.
  }

  return {
    quote: 'What happens is not as important as how you react to what happens.',
    author: 'Ellen Glasgow',
  };
}

export default async function LandingPage() {
  const quote = await getQuoteOfTheDay();

  return (
    <div className="min-h-screen px-4 py-5">
      <header className="mx-auto flex w-full max-w-6xl items-center justify-between">
        <BrandMark />
        <Button asChild variant="outline">
          <Link href="/auth/login">Sign In</Link>
        </Button>
      </header>

      <main className="mx-auto grid min-h-[calc(100vh-7rem)] w-full max-w-6xl items-center gap-10 py-10 lg:grid-cols-[1.05fr_0.95fr]">
        <section className="space-y-8">
          <div className="max-w-2xl space-y-5 animate-in fade-in slide-in-from-bottom-2 duration-700">
            <div className="inline-flex rounded-md border bg-card px-3 py-1 text-sm font-medium text-muted-foreground">
              Time tracking with task clarity
            </div>
            <h1 className="text-4xl font-semibold tracking-normal text-foreground md:text-6xl">
              Mckbyte TimeTracker
            </h1>
            <p className="max-w-xl text-lg leading-8 text-muted-foreground">
              A focused workspace for clocking time, planning daily tasks, and keeping work summaries connected.
            </p>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row animate-in fade-in slide-in-from-bottom-6 duration-1200">
            <Button asChild size="lg">
              <Link href="/auth/login">Login</Link>
            </Button>
            <Button asChild variant="secondary" size="lg">
              <Link href="/auth/register">Register</Link>
            </Button>
          </div>

          <AnimatedQuote quote={quote} />
        </section>

        <section className="rounded-lg border bg-card p-5 shadow-sm">
          <div className="grid gap-4">
            <div className="flex items-center justify-between rounded-md bg-secondary p-4">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Current focus</p>
                <p className="text-lg font-semibold">Design review and QA pass</p>
              </div>
              <span className="rounded-md bg-primary px-3 py-1 text-sm font-medium text-primary-foreground">Live</span>
            </div>
            <div className="grid gap-3 sm:grid-cols-3">
              <div className="rounded-md border p-4">
                <p className="text-sm text-muted-foreground">Today</p>
                <p className="mt-2 text-2xl font-semibold">7h 25m</p>
              </div>
              <div className="rounded-md border p-4">
                <p className="text-sm text-muted-foreground">Tasks done</p>
                <p className="mt-2 text-2xl font-semibold">4</p>
              </div>
              <div className="rounded-md border p-4">
                <p className="text-sm text-muted-foreground">Breaks</p>
                <p className="mt-2 text-2xl font-semibold">2</p>
              </div>
            </div>
            <div className="space-y-3 rounded-md border p-4">
              <div className="flex items-center justify-between">
                <p className="font-medium">Linked task plan</p>
                <p className="text-sm text-muted-foreground">75%</p>
              </div>
              <div className="h-2 rounded-full bg-muted">
                <div className="h-2 w-3/4 rounded-full bg-primary" />
              </div>
              <p className="text-sm text-muted-foreground">
                Track time against the work that matters, then close the day with a clean summary.
              </p>
            </div>
          </div>
        </section>
      </main>

      <footer className="mx-auto w-full max-w-6xl pb-4 text-xs text-muted-foreground">
        © 2026 Mckbyte TimeTracker. All Rights Reserved.
      </footer>
    </div>
  );
}
