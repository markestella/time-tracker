'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { CalendarIcon, LogIn, LogOut, Coffee, Briefcase, MessageSquareText } from 'lucide-react';
import { format, subDays, startOfDay, endOfDay } from 'date-fns';
import { DateRange } from 'react-day-picker';
import { ClockEvent, Message, Question } from '@prisma/client';

type QuestionWithAnswer = Pick<Question, 'content' | 'answer'>;
type MessageWithQuestions = Message & { questions: QuestionWithAnswer[] };
type ActivityEvent = ClockEvent & { message: MessageWithQuestions | null };
type GroupedActivities = { [key: string]: ActivityEvent[] };

interface ActivityHistoryProps {
  userId?: number;
}

const getActivityDetails = (type: string) => {
  switch (type) {
    case 'IN': return { text: 'Clocked In', Icon: LogIn };
    case 'OUT': return { text: 'Clocked Out', Icon: LogOut };
    case 'BREAK_START': return { text: 'Started Break', Icon: Coffee };
    case 'BREAK_END': return { text: 'Ended Break', Icon: Briefcase };
    default: return { text: 'Unknown', Icon: MessageSquareText };
  }
};

export function ActivityHistory({ userId }: ActivityHistoryProps) {
  const [activities, setActivities] = useState<ActivityEvent[]>([]);
  const [groupedActivities, setGroupedActivities] = useState<GroupedActivities>({});
  const [date, setDate] = useState<DateRange | undefined>({
    from: startOfDay(new Date()),
    to: endOfDay(new Date()),
  });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchActivities = async () => {
      if (date?.from && date?.to) {
        setIsLoading(true);
        const fromISO = date.from.toISOString();
        const toISO = date.to.toISOString();

        let apiUrl = `/api/activity?from=${fromISO}&to=${toISO}`;
        if (userId) {
          apiUrl += `&userId=${userId}`;
        }

        try {
          const res = await fetch(apiUrl);
          const data: ActivityEvent[] = await res.json();
          setActivities(data);
        } catch {
          setActivities([]);
        } finally {
          setIsLoading(false);
        }
      }
    };
    fetchActivities();
  }, [date, userId]);

  useEffect(() => {
    const group = activities.reduce((acc, event) => {
      const eventDate = format(new Date(event.timestamp), 'MMMM dd, yyyy');
      if (!acc[eventDate]) {
        acc[eventDate] = [];
      }
      acc[eventDate].push(event);
      return acc;
    }, {} as GroupedActivities);
    setGroupedActivities(group);
  }, [activities]);

  const handleTabChange = (value: string) => {
    const today = new Date();
    if (value === 'today') {
      setDate({ from: startOfDay(today), to: endOfDay(today) });
    } else if (value === 'yesterday') {
      const yesterday = subDays(today, 1);
      setDate({ from: startOfDay(yesterday), to: endOfDay(yesterday) });
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <CardTitle>Activity History</CardTitle>
          </div>
          <Tabs defaultValue="today" onValueChange={handleTabChange} className="w-full sm:w-auto">
            <TabsList className="grid w-full grid-cols-3 sm:w-auto">
              <TabsTrigger value="today">Today</TabsTrigger>
              <TabsTrigger value="yesterday">Yesterday</TabsTrigger>
              <TabsTrigger value="range">
                <Popover>
                  <PopoverTrigger asChild>
                    <span className="flex items-center gap-1">
                      <CalendarIcon className="h-4 w-4" />
                      Range
                    </span>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="end">
                    <Calendar
                      initialFocus
                      mode="range"
                      defaultMonth={date?.from}
                      selected={date}
                      onSelect={setDate}
                      numberOfMonths={2}
                    />
                  </PopoverContent>
                </Popover>
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-6 max-h-96 overflow-y-auto pr-2">
          {isLoading ? (
            <p className="text-center text-muted-foreground py-8">Loading history...</p>
          ) : Object.keys(groupedActivities).length > 0 ? (
            Object.entries(groupedActivities).map(([day, events]) => (
              <div key={day}>
                <h3 className="text-lg font-semibold mb-3">{day}</h3>
                <div className="space-y-4 relative pl-6">
                  <div className="absolute left-0 top-0 h-full w-0.5 bg-border -ml-px"></div>
                  {events.map((event) => {
                    const { text, Icon } = getActivityDetails(event.type);
                    return (
                      <div key={event.id} className="relative py-1">
                        <div className="absolute left-0 top-1/2 -translate-x-1/2 -translate-y-1/2 h-4 w-4 bg-background border-2 rounded-full z-10"></div>
                        <div className="flex items-center justify-between text-sm ml-6">
                          <div className="flex items-center gap-1">
                            <Icon className="h-4 w-4 text-muted-foreground" />
                            <p className="font-medium">{text}</p>
                            {event.type === 'OUT' && event.message && (
                              <Popover>
                                <PopoverTrigger asChild>
                                  <Button variant="ghost" size="icon" className="h-5 w-5 rounded-full">
                                    <MessageSquareText className="h-3 w-3 text-muted-foreground" />
                                  </Button>
                                </PopoverTrigger>
                                <PopoverContent className="w-64 sm:w-80">
                                  <div className="space-y-4">
                                    <div>
                                      <h4 className="font-medium leading-none">Daily Summary</h4>
                                      <p className="text-sm text-muted-foreground italic">&ldquo;{event.message.content}&rdquo;</p>
                                    </div>
                                    {event.message.questions.length > 0 && (
                                      <div className="space-y-2">
                                        <h4 className="font-medium leading-none">Questions & Answers</h4>
                                        {event.message.questions.map((qa, index) => (
                                          <div key={index} className="text-sm border-t pt-2">
                                            <p className="font-semibold text-foreground">Q: {qa.content}</p>
                                            {qa.answer ? <p className="text-green-600">A: {qa.answer}</p> : <p className="text-yellow-600 italic">A: Awaiting answer...</p>}
                                          </div>
                                        ))}
                                      </div>
                                    )}
                                  </div>
                                </PopoverContent>
                              </Popover>
                            )}
                          </div>
                          <p className="text-muted-foreground">{format(new Date(event.timestamp), 'h:mm a')}</p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))
          ) : (
            <p className="text-sm text-center text-muted-foreground py-8">No activity found for the selected period.</p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}