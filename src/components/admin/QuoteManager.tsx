'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Calendar } from '@/components/ui/calendar';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { format } from 'date-fns';

export function QuoteManager() {
  const [date, setDate] = useState<Date | undefined>(new Date());
  const [quote, setQuote] = useState('');
  const [author, setAuthor] = useState('');
  

  const [isFetching, setIsFetching] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  
  const [quoteExists, setQuoteExists] = useState(false);

  useEffect(() => {
    if (date) {
      setIsFetching(true);
      setQuote('');
      setAuthor('');
      const dateString = format(date, 'yyyy-MM-dd');
      fetch(`/api/admin/quote?date=${dateString}`)
        .then(res => res.json())
        .then(data => {
          if (data) {
            setQuote(data.quote);
            setAuthor(data.author);
            setQuoteExists(true);
          } else {
            setQuote('');
            setAuthor('');
            setQuoteExists(false);
          }
        }).finally(() => setIsFetching(false));
    }
  }, [date]);
  
  const handleSave = async () => {
    if (!date || !quote || !author) {
      toast.error("Please select a date and fill out both quote and author fields.");
      return;
    }
    setIsSaving(true);
    try {
      const res = await fetch('/api/admin/quote', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ date, quote, author }),
      });
      if (res.ok) {
        toast.success(`Quote for ${format(date, 'MMMM dd')} has been saved!`);
        setQuoteExists(true);
      } else {
        throw new Error("Failed to save quote");
      }
    } catch {
      toast.error("An error occurred while saving the quote.");
    } finally {
      setIsSaving(false); 
    }
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Quote of the Day Manager</CardTitle>
        <CardDescription>Select a date to add or update its quote.</CardDescription>
      </CardHeader>
      <CardContent className="grid gap-6 md:grid-cols-2">
        <div className="flex justify-center">
          <Calendar
            mode="single"
            selected={date}
            onSelect={setDate}
            className="rounded-md border"
            disabled={isFetching || isSaving} 
          />
        </div>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="quote-text">Quote</Label>
            <Input 
              id="quote-text" 
              placeholder="The only way to do great work..." 
              value={quote} 
              onChange={(e) => setQuote(e.target.value)}
              disabled={isFetching}
            />
          </div>
           <div className="space-y-2">
            <Label htmlFor="quote-author">Author</Label>
            <Input 
              id="quote-author" 
              placeholder="Steve Jobs" 
              value={author} 
              onChange={(e) => setAuthor(e.target.value)}
              disabled={isFetching}
            />
          </div>
          <Button onClick={handleSave} disabled={isFetching || isSaving} className="w-full">
            {isSaving ? 'Saving...' : (quoteExists ? 'Update Quote' : 'Save Quote')}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}