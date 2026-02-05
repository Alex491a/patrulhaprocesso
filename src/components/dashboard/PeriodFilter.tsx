import { useState, useMemo } from 'react';
import { format, subMonths, startOfMonth, endOfMonth, isWithinInterval, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Calendar, Download, Settings } from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';

interface PeriodFilterProps {
  onPeriodChange: (startDate: Date | null, endDate: Date | null, periodLabel: string) => void;
  onMachineChange?: (machine: string | null) => void;
  onExportPDF?: () => void;
  machines?: string[];
}

export const PeriodFilter = ({ onPeriodChange, onMachineChange, onExportPDF, machines = [] }: PeriodFilterProps) => {
  const [selectedPeriod, setSelectedPeriod] = useState<string>('all');
  const [selectedMachine, setSelectedMachine] = useState<string>('all');

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

  // Sort machines alphabetically
  const sortedMachines = useMemo(() => {
    return [...machines].sort((a, b) => a.localeCompare(b, 'pt-BR'));
  }, [machines]);

  const handlePeriodChange = (value: string) => {
    setSelectedPeriod(value);
    const option = periodOptions.find(p => p.value === value);
    if (option) {
      onPeriodChange(option.start, option.end, option.label);
    }
  };

  const handleMachineChange = (value: string) => {
    setSelectedMachine(value);
    onMachineChange?.(value === 'all' ? null : value);
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
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 flex-wrap">
            {/* Period Filter */}
            <div className="flex items-center gap-2">
              <Calendar className="h-5 w-5 text-muted-foreground" />
              <span className="font-medium text-muted-foreground">Período:</span>
              <Select value={selectedPeriod} onValueChange={handlePeriodChange}>
                <SelectTrigger className="w-[200px]">
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
            </div>

            {/* Machine Filter */}
            {sortedMachines.length > 0 && (
              <div className="flex items-center gap-2">
                <Settings className="h-5 w-5 text-muted-foreground" />
                <span className="font-medium text-muted-foreground">Máquina:</span>
                <Select value={selectedMachine} onValueChange={handleMachineChange}>
                  <SelectTrigger className="w-[200px]">
                    <SelectValue placeholder="Selecione a máquina" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todas as máquinas</SelectItem>
                    {sortedMachines.map((machine) => (
                      <SelectItem key={machine} value={machine}>
                        {machine}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {selectedPeriod !== 'all' && (
              <span className="text-sm text-muted-foreground">
                {periodLabel}
              </span>
            )}
          </div>

          {onExportPDF && (
            <Button onClick={onExportPDF} variant="outline" className="gap-2">
              <Download className="h-4 w-4" />
              Exportar PDF
            </Button>
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

// Utility function to filter reports by machine
export const filterReportsByMachine = <T extends { machine: string }>(
  reports: T[],
  machine: string | null
): T[] => {
  if (!machine) {
    return reports;
  }

  return reports.filter((report) => report.machine === machine);
};
