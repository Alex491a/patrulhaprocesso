import { AlertTriangle, CheckCircle2, TrendingUp } from 'lucide-react';
import { RequirementStats } from '@/types/patrol';
import { cn } from '@/lib/utils';

interface RecurrenceTableProps {
  stats: RequirementStats[];
}

export const RecurrenceTable = ({ stats }: RecurrenceTableProps) => {
  const sortedStats = [...stats].sort((a, b) => b.recurrenceRate - a.recurrenceRate);

  return (
    <div className="card-elevated overflow-hidden animate-slide-up">
      <div className="p-6 border-b border-border">
        <div className="flex items-center gap-3">
          <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-warning/10">
            <TrendingUp className="w-5 h-5 text-warning" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-foreground">Análise de Reincidência</h3>
            <p className="text-sm text-muted-foreground">Taxa de não conformidade por requisito</p>
          </div>
        </div>
      </div>

      <div className="overflow-x-auto scrollbar-thin">
        <table className="w-full">
          <thead>
            <tr className="bg-muted/50">
              <th className="text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider px-6 py-4">
                #
              </th>
              <th className="text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider px-6 py-4">
                Requisito
              </th>
              <th className="text-center text-xs font-semibold text-muted-foreground uppercase tracking-wider px-6 py-4">
                OK
              </th>
              <th className="text-center text-xs font-semibold text-muted-foreground uppercase tracking-wider px-6 py-4">
                NOK
              </th>
              <th className="text-center text-xs font-semibold text-muted-foreground uppercase tracking-wider px-6 py-4">
                N/A
              </th>
              <th className="text-center text-xs font-semibold text-muted-foreground uppercase tracking-wider px-6 py-4">
                Taxa Reincidência
              </th>
              <th className="text-center text-xs font-semibold text-muted-foreground uppercase tracking-wider px-6 py-4">
                Status
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {sortedStats.map((stat) => (
              <tr key={stat.requirementId} className="table-row-hover">
                <td className="px-6 py-4">
                  <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-muted text-sm font-medium text-muted-foreground">
                    {stat.requirementId}
                  </span>
                </td>
                <td className="px-6 py-4">
                  <p className="text-sm text-foreground line-clamp-2 max-w-md">
                    {stat.description}
                  </p>
                </td>
                <td className="px-6 py-4 text-center">
                  <span className="badge-ok">{stat.okCount}</span>
                </td>
                <td className="px-6 py-4 text-center">
                  <span className="badge-nok">{stat.nokCount}</span>
                </td>
                <td className="px-6 py-4 text-center">
                  <span className="badge-na">{stat.naCount}</span>
                </td>
                <td className="px-6 py-4">
                  <div className="flex items-center justify-center gap-2">
                    <div className="w-24 h-2 bg-muted rounded-full overflow-hidden">
                      <div
                        className={cn(
                          'h-full rounded-full transition-all duration-500',
                          stat.recurrenceRate > 20
                            ? 'bg-destructive'
                            : stat.recurrenceRate > 10
                            ? 'bg-warning'
                            : 'bg-success'
                        )}
                        style={{ width: `${Math.min(stat.recurrenceRate, 100)}%` }}
                      />
                    </div>
                    <span
                      className={cn(
                        'text-sm font-medium min-w-[3rem] text-right',
                        stat.recurrenceRate > 20
                          ? 'text-destructive'
                          : stat.recurrenceRate > 10
                          ? 'text-warning'
                          : 'text-success'
                      )}
                    >
                      {stat.recurrenceRate.toFixed(1)}%
                    </span>
                  </div>
                </td>
                <td className="px-6 py-4 text-center">
                  {stat.recurrenceRate > 15 ? (
                    <div className="inline-flex items-center gap-1 text-destructive">
                      <AlertTriangle className="w-4 h-4" />
                      <span className="text-xs font-medium">Atenção</span>
                    </div>
                  ) : (
                    <div className="inline-flex items-center gap-1 text-success">
                      <CheckCircle2 className="w-4 h-4" />
                      <span className="text-xs font-medium">Normal</span>
                    </div>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
