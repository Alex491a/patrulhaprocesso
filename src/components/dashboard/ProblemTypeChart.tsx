import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { PieChart as PieChartIcon } from 'lucide-react';
import { ProblemByType } from '@/types/patrol';

interface ProblemTypeChartProps {
  data: ProblemByType[];
}

const COLORS = [
  'hsl(0, 72%, 51%)',
  'hsl(15, 80%, 48%)',
  'hsl(30, 85%, 50%)',
  'hsl(38, 95%, 50%)',
  'hsl(45, 90%, 50%)',
  'hsl(175, 70%, 40%)',
  'hsl(195, 85%, 40%)',
  'hsl(215, 90%, 45%)',
];

export const ProblemTypeChart = ({ data }: ProblemTypeChartProps) => {
  const top8Problems = data.slice(0, 8);

  const chartData = top8Problems.map((item, index) => ({
    name: `#${index + 1}`,
    fullName: item.type,
    count: item.count,
    percentage: item.percentage,
  }));

  return (
    <div className="card-elevated overflow-hidden animate-slide-up">
      <div className="p-6 border-b border-border">
        <div className="flex items-center gap-3">
          <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-destructive/10">
            <PieChartIcon className="w-5 h-5 text-destructive" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-foreground">Problemas por Tipo</h3>
            <p className="text-sm text-muted-foreground">Top 8 não conformidades mais frequentes</p>
          </div>
        </div>
      </div>

      <div className="p-6">
        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={chartData}
              layout="vertical"
              margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(220, 15%, 88%)" />
              <XAxis type="number" stroke="hsl(220, 10%, 45%)" fontSize={12} />
              <YAxis
                dataKey="name"
                type="category"
                stroke="hsl(220, 10%, 45%)"
                fontSize={12}
                width={40}
              />
              <Tooltip
                content={({ active, payload }) => {
                  if (active && payload && payload.length) {
                    const data = payload[0].payload;
                    return (
                      <div className="bg-card border border-border rounded-lg p-3 shadow-lg max-w-xs">
                        <p className="text-xs text-muted-foreground mb-1">Problema:</p>
                        <p className="text-sm font-medium text-foreground mb-2 line-clamp-3">
                          {data.fullName}
                        </p>
                        <div className="flex items-center gap-4 text-sm">
                          <span className="text-foreground font-semibold">
                            {data.count} ocorrências
                          </span>
                          <span className="text-muted-foreground">
                            ({data.percentage.toFixed(1)}%)
                          </span>
                        </div>
                      </div>
                    );
                  }
                  return null;
                }}
              />
              <Bar dataKey="count" radius={[0, 4, 4, 0]}>
                {chartData.map((_, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="mt-6 space-y-2">
          {top8Problems.map((problem, index) => (
            <div key={index} className="flex items-start gap-3 text-sm">
              <span
                className="w-6 h-6 rounded flex items-center justify-center text-xs font-bold shrink-0 text-white"
                style={{ backgroundColor: COLORS[index % COLORS.length] }}
              >
                {index + 1}
              </span>
              <p className="text-muted-foreground line-clamp-1">{problem.type}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
