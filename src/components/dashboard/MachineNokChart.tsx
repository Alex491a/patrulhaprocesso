import { useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, ResponsiveContainer, Cell } from 'recharts';
import { BarChart3 } from 'lucide-react';
import { PatrolReport } from '@/types/patrol';

interface MachineNokChartProps {
  reports: PatrolReport[];
}

export const MachineNokChart = ({ reports }: MachineNokChartProps) => {
  const chartData = useMemo(() => {
    const machineMap = new Map<string, number>();

    reports.forEach((report) => {
      const machine = report.machine.trim();
      if (!machine) return;

      const nokCount = report.requirements.filter((r) => r.status === 'NOK').length;
      machineMap.set(machine, (machineMap.get(machine) || 0) + nokCount);
    });

    return Array.from(machineMap.entries())
      .map(([name, totalNok]) => ({ name, totalNok }))
      .sort((a, b) => b.totalNok - a.totalNok)
      .slice(0, 15); // Top 15 machines
  }, [reports]);

  const maxNok = Math.max(...chartData.map(d => d.totalNok), 1);

  const chartConfig = {
    totalNok: {
      label: 'Total NOK',
      color: 'hsl(var(--destructive))',
    },
  };

  const getBarColor = (value: number) => {
    const ratio = value / maxNok;
    if (ratio > 0.7) return 'hsl(var(--destructive))';
    if (ratio > 0.4) return 'hsl(var(--warning, 38 92% 50%))';
    return 'hsl(var(--primary))';
  };

  if (chartData.length === 0) {
    return null;
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <BarChart3 className="h-5 w-5 text-primary" />
          <CardTitle>NOKs por Máquina</CardTitle>
        </div>
        <CardDescription>
          Top 15 máquinas com maior quantidade de NOKs
        </CardDescription>
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig} className="h-[400px] w-full">
          <BarChart
            data={chartData}
            layout="vertical"
            margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
          >
            <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} />
            <XAxis type="number" />
            <YAxis 
              type="category" 
              dataKey="name" 
              width={120}
              tick={{ fontSize: 12 }}
              tickLine={false}
            />
            <ChartTooltip 
              content={<ChartTooltipContent />}
              cursor={{ fill: 'hsl(var(--muted))' }}
            />
            <Bar 
              dataKey="totalNok" 
              radius={[0, 4, 4, 0]}
              maxBarSize={30}
            >
              {chartData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={getBarColor(entry.totalNok)} />
              ))}
            </Bar>
          </BarChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
};
