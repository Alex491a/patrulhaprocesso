import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';
import { Activity } from 'lucide-react';

interface OverallStatusChartProps {
  approved: number;
  rejected: number;
}

export const OverallStatusChart = ({ approved, rejected }: OverallStatusChartProps) => {
  const data = [
    { name: 'Aprovados', value: approved, color: 'hsl(145, 65%, 42%)' },
    { name: 'Rejeitados', value: rejected, color: 'hsl(0, 72%, 51%)' },
  ];

  const total = approved + rejected;

  return (
    <div className="card-elevated overflow-hidden animate-slide-up">
      <div className="p-6 border-b border-border">
        <div className="flex items-center gap-3">
          <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-primary/10">
            <Activity className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-foreground">Status Geral</h3>
            <p className="text-sm text-muted-foreground">Distribuição de aprovações</p>
          </div>
        </div>
      </div>

      <div className="p-6">
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={data}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={90}
                paddingAngle={5}
                dataKey="value"
              >
                {data.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip
                content={({ active, payload }) => {
                  if (active && payload && payload.length) {
                    const data = payload[0].payload;
                    const percentage = total > 0 ? ((data.value / total) * 100).toFixed(1) : 0;
                    return (
                      <div className="bg-card border border-border rounded-lg p-3 shadow-lg">
                        <p className="text-sm font-medium text-foreground">{data.name}</p>
                        <p className="text-sm text-muted-foreground">
                          {data.value} relatórios ({percentage}%)
                        </p>
                      </div>
                    );
                  }
                  return null;
                }}
              />
              <Legend
                content={({ payload }) => (
                  <div className="flex justify-center gap-6 mt-4">
                    {payload?.map((entry, index) => (
                      <div key={index} className="flex items-center gap-2">
                        <div
                          className="w-3 h-3 rounded-full"
                          style={{ backgroundColor: entry.color }}
                        />
                        <span className="text-sm text-muted-foreground">{entry.value}</span>
                      </div>
                    ))}
                  </div>
                )}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>

        <div className="mt-4 grid grid-cols-2 gap-4">
          <div className="text-center p-4 rounded-lg bg-success/5 border border-success/20">
            <p className="text-2xl font-bold text-success">{approved}</p>
            <p className="text-xs text-muted-foreground">Aprovados</p>
          </div>
          <div className="text-center p-4 rounded-lg bg-destructive/5 border border-destructive/20">
            <p className="text-2xl font-bold text-destructive">{rejected}</p>
            <p className="text-xs text-muted-foreground">Rejeitados</p>
          </div>
        </div>
      </div>
    </div>
  );
};
