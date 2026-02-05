import { useState, useMemo } from 'react';
import { format, subMonths, startOfMonth, endOfMonth, isWithinInterval, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Calendar } from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Card, CardContent } from '@/components/ui/card';

interface PeriodFilterProps {
  onPeriodChange: (startDate: Date | null, endDate: Date | null) => void;
}

export const PeriodFilter = ({ onPeriodChange }: PeriodFilterProps) => {
  const [selectedPeriod, setSelectedPeriod] = useState<string>('all');

  // Generate month options dynamically - last 12 months + current month
  const periodOptions = useMemo(() => {
    const now = new Date();
    const options = [
      { value: 'all', label: 'Todo o período', start: null, end: null },
    ];

    // Add individual months (current month + last 11 months = 12 months total)
    for (let i = 0; i < 12; i++) {
      const monthDate = subMonths(now, i);
      const monthStart = startOfMonth(monthDate);
      const monthEnd = endOfMonth(monthDate);
      const monthLabel = format(monthDate, 'MMMM yyyy', { locale: ptBR });
      
      options.push({
        value: `month-${i}`,
        label: monthLabel.charAt(0).toUpperCase() + monthLabel.slice(1),
        start: monthStart,
        end: monthEnd,
      });
    }

    return options;
  }, []);

  const handlePeriodChange = (value: string) => {
    setSelectedPeriod(value);
    const option = periodOptions.find(p => p.value === value);
    if (option) {
      onPeriodChange(option.start, option.end);
    }
  };

  const selectedOption = periodOptions.find(p => p.value === selectedPeriod);
  const periodLabel = selectedOption 
    ? selectedOption.start && selectedOption.end
      ? `${format(selectedOption.start, 'dd/MM/yyyy')} - ${format(selectedOption.end, 'dd/MM/yyyy')}`
      : 'Todo o período'
    : '';

  return (
    <Card className="bg-card border-border">
      <CardContent className="py-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
          <div className="flex items-center gap-2 text-muted-foreground">
            <Calendar className="h-5 w-5" />
            <span className="font-medium">Período:</span>
          </div>
          
          <Select value={selectedPeriod} onValueChange={handlePeriodChange}>
            <SelectTrigger className="w-full sm:w-[220px]">
              <SelectValue placeholder="Selecione o período" />
            </SelectTrigger>
            <SelectContent>
              {periodOptions.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {selectedPeriod !== 'all' && (
            <span className="text-sm text-muted-foreground">
              {periodLabel}
            </span>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

// Utility function to filter reports by date range
export const filterReportsByPeriod = <T extends { date: string }>(
  reports: T[],
  startDate: Date | null,
  endDate: Date | null
): T[] => {
  if (!startDate || !endDate) {
    return reports;
  }

  return reports.filter((report) => {
    const reportDate = parseISO(report.date);
    return isWithinInterval(reportDate, { start: startDate, end: endDate });
  });
};
