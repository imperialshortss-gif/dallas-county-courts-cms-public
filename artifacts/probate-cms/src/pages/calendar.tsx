import { Layout } from "@/components/layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { format, addDays, startOfWeek, startOfMonth, endOfMonth, endOfWeek, isSameMonth, isSameDay, addMonths, subMonths } from "date-fns";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon } from "lucide-react";
import { useListHearings, getListHearingsQueryKey } from "@workspace/api-client-react";

export default function Calendar() {
  const [currentMonth, setCurrentMonth] = useState(new Date());

  // In a real app we would pass the month range to filter
  const { data: hearings } = useListHearings({}, {
    query: { queryKey: getListHearingsQueryKey({}) }
  });

  const nextMonth = () => setCurrentMonth(addMonths(currentMonth, 1));
  const prevMonth = () => setCurrentMonth(subMonths(currentMonth, 1));
  const today = () => setCurrentMonth(new Date());

  const renderHeader = () => {
    return (
      <div className="flex justify-between items-center py-4 px-6 border-b">
        <div className="flex items-center gap-4">
          <h2 className="text-2xl font-serif font-bold text-foreground">
            {format(currentMonth, "MMMM yyyy")}
          </h2>
          <Button variant="outline" size="sm" onClick={today}>Today</Button>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="icon" onClick={prevMonth}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button variant="outline" size="icon" onClick={nextMonth}>
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>
    );
  };

  const renderDays = () => {
    const dateFormat = "EEEE";
    const days = [];
    let startDate = startOfWeek(currentMonth);

    for (let i = 0; i < 7; i++) {
      days.push(
        <div className="text-center font-semibold text-sm py-3 text-muted-foreground uppercase tracking-wider" key={i}>
          {format(addDays(startDate, i), dateFormat)}
        </div>
      );
    }
    return <div className="grid grid-cols-7 border-b bg-muted/20">{days}</div>;
  };

  const renderCells = () => {
    const monthStart = startOfMonth(currentMonth);
    const monthEnd = endOfMonth(monthStart);
    const startDate = startOfWeek(monthStart);
    const endDate = endOfWeek(monthEnd);

    const rows = [];
    let days = [];
    let day = startDate;
    let formattedDate = "";

    while (day <= endDate) {
      for (let i = 0; i < 7; i++) {
        formattedDate = format(day, "d");
        const cloneDay = day;
        
        // Find hearings for this day
        const dayHearings = hearings?.filter(h => isSameDay(new Date(h.hearingDate), cloneDay)) || [];
        
        days.push(
          <div
            className={`min-h-[120px] p-2 border-r border-b relative ${
              !isSameMonth(day, monthStart)
                ? "bg-muted/10 text-muted-foreground/50"
                : isSameDay(day, new Date())
                ? "bg-primary/5 text-primary font-semibold"
                : "bg-card text-foreground"
            }`}
            key={day.toString()}
          >
            <span className="text-sm absolute top-2 right-2">{formattedDate}</span>
            <div className="mt-6 flex flex-col gap-1">
              {dayHearings.map(h => (
                <div key={h.id} className="text-xs bg-primary/10 text-primary border border-primary/20 rounded px-1.5 py-1 truncate cursor-pointer hover:bg-primary/20 transition-colors" title={`${h.caseNumber} - ${h.hearingType}`}>
                  {format(new Date(h.hearingDate), 'h:mm a')} {h.caseNumber}
                </div>
              ))}
            </div>
          </div>
        );
        day = addDays(day, 1);
      }
      rows.push(
        <div className="grid grid-cols-7" key={day.toString()}>
          {days}
        </div>
      );
      days = [];
    }
    return <div className="flex flex-col flex-1">{rows}</div>;
  };

  return (
    <Layout>
      <div className="flex flex-col gap-6 h-full">
        <div>
          <h1 className="text-3xl font-serif font-bold text-foreground tracking-tight">Court Calendar</h1>
          <p className="text-muted-foreground mt-1">Monthly view of all scheduled hearings.</p>
        </div>

        <Card className="flex-1 flex flex-col overflow-hidden border-border shadow-sm">
          {renderHeader()}
          <div className="flex flex-col flex-1 overflow-auto">
            <div className="min-w-[800px] flex flex-col flex-1">
              {renderDays()}
              {renderCells()}
            </div>
          </div>
        </Card>
      </div>
    </Layout>
  );
}
