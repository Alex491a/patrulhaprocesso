import { useState, useMemo } from 'react';
import { format, subMonths, startOfMonth, endOfMonth, isWithinInterval, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Calendar, ChevronDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Card, CardContent } from '@/components/ui/card';

export type PeriodType = 'all' | 'last-month' | 'last-3-months' | 'last-6-months' | 'last-12-months' | 'custom';

interface PeriodFilterProps {
  onPeriodChange: (startDate: Date | null, endDate: Date | null) => void;
}

export const PeriodFilter = ({ onPeriodChange }: PeriodFilterProps) => {
  const [selectedPeriod, setSelectedPeriod] = useState<PeriodType>('all');

  const periodOptions = useMemo(() => {
    const now = new Date();
    
    return [
      { value: 'all', label: 'Todo o período', start: null, end: null },
      { 
        value: 'last-month', 
        label: format(now, 'MMMM yyyy', { locale: ptBR }),
        start: startOfMonth(now),
        end: endOfMonth(now)
      },
      { 
        value: 'last-3-months', 
        label: 'Últimos 3 meses',
        start: startOfMonth(subMonths(now, 2)),
        end: endOfMonth(now)
      },
      { 
        value: 'last-6-months', 
        label: 'Últimos 6 meses',
        start: startOfMonth(subMonths(now, 5)),
        end: endOfMonth(now)
      },
      { 
        value: 'last-12-months', 
        label: 'Últimos 12 meses',
        start: startOfMonth(subMonths(now, 11)),
        end: endOfMonth(now)
      },
    ];
  }, []);

  const handlePeriodChange = (value: string) => {
    setSelectedPeriod(value as PeriodType);
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
                  <span className="capitalize">{option.label}</span>
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
