import { AnimatedQuote } from '@/components/landing/AnimatedQuote';
import { Button } from '@/components/ui/button';
import { prisma } from '@/lib/db';
import { startOfDay } from 'date-fns';
import Image from 'next/image';
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
    <div className="flex flex-col items-center justify-center min-h-screen bg-background p-4">
      <div className="flex flex-col items-center justify-center text-center space-y-8 max-w-2xl">
        <div className="flex flex-col items-center gap-4 animate-in fade-in slide-in-from-bottom-2 duration-700">
          <Image
            src="/thynetwork-logo.png"
            alt="ThyNetwork Logo"
            width={80}
            height={80}
            priority
          />
          <h1 className="text-4xl md:text-5xl font-bold tracking-tighter">
            ThyNetwork Time Track
          </h1>
          <p className="text-muted-foreground md:text-lg">
            Streamline your workflow, one click at a time.
          </p>
        </div>

        <AnimatedQuote quote={quote} />

        <div className="flex flex-col sm:flex-row gap-4 animate-in fade-in slide-in-from-bottom-6 duration-1200">
          <Button asChild size="lg">
            <Link href="/auth/login">Login</Link>
          </Button>
          <Button asChild variant="secondary" size="lg">
            <Link href="/auth/register">Register</Link>
          </Button>
        </div>
      </div>
      <footer className="absolute bottom-4 text-xs text-muted-foreground">
        © 2025 ThyNetwork Inc. All Rights Reserved
      </footer>
    </div>
  );
}
