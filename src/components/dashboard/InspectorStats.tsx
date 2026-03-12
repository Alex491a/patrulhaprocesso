import { useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { UserCheck, AlertTriangle } from 'lucide-react';
import { PatrolReport } from '@/types/patrol';

interface InspectorStatsProps {
  reports: PatrolReport[];
  getRncCountByInspector?: (inspectorName: string) => number;
  rncInspectorNames?: string[];
}

interface InspectorData {
  name: string;
  totalReports: number;
  totalNok: number;
  nokRate: number;
}

export const InspectorStats = ({ reports, getRncCountByInspector, rncInspectorNames = [] }: InspectorStatsProps) => {
  const inspectorData = useMemo((): InspectorData[] => {
    const inspectorMap = new Map<string, { totalReports: number; totalNok: number }>();

    reports.forEach((report) => {
      const auditor = report.auditors.trim();
      if (!auditor) return;

      const current = inspectorMap.get(auditor) || { totalReports: 0, totalNok: 0 };
      const nokCount = report.requirements.filter((r) => r.status === 'NOK').length;

      inspectorMap.set(auditor, {
        totalReports: current.totalReports + 1,
        totalNok: current.totalNok + nokCount,
      });
    });

    return Array.from(inspectorMap.entries())
      .map(([name, data]) => ({
        name,
        totalReports: data.totalReports,
        totalNok: data.totalNok,
        nokRate: data.totalReports > 0 ? (data.totalNok / data.totalReports) : 0,
      }))
      .sort((a, b) => b.totalReports - a.totalReports);
  }, [reports]);

  const totalInspectors = inspectorData.length;
  const totalReportsAll = inspectorData.reduce((sum, i) => sum + i.totalReports, 0);
  const totalNokAll = inspectorData.reduce((sum, i) => sum + i.totalNok, 0);

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <UserCheck className="h-5 w-5 text-primary" />
          <CardTitle>Estatísticas por Inspetor</CardTitle>
        </div>
        <CardDescription>
          Visão geral do desempenho de cada inspetor. Total de {totalInspectors} inspetor(es), {totalReportsAll} relatório(s), {totalNokAll} NOK(s).
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Inspetor</TableHead>
              <TableHead className="text-center">N° Auditorias</TableHead>
              <TableHead className="text-center">NOK em Auditoria</TableHead>
              <TableHead className="text-center">RNC Informais</TableHead>
              <TableHead className="text-center">Média NOK/Relatório</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {inspectorData.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center text-muted-foreground py-8">
                  Nenhum dado de inspetor encontrado
                </TableCell>
              </TableRow>
            ) : (
              inspectorData.map((inspector) => {
                const rncCount = getRncCountByInspector ? getRncCountByInspector(inspector.name) : 0;
                return (
                  <TableRow key={inspector.name}>
                    <TableCell className="font-medium">
                      <div className="flex items-center gap-2">
                        <UserCheck className="h-4 w-4 text-muted-foreground" />
                        {inspector.name}
                      </div>
                    </TableCell>
                    <TableCell className="text-center">
                      <Badge variant="secondary">{inspector.totalReports}</Badge>
                    </TableCell>
                    <TableCell className="text-center">
                      <Badge 
                        variant={inspector.totalNok > 0 ? "destructive" : "outline"}
                        className="gap-1"
                      >
                        {inspector.totalNok > 0 && <AlertTriangle className="h-3 w-3" />}
                        {inspector.totalNok}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-center">
                      <Badge variant={rncCount > 0 ? "default" : "outline"}>
                        {rncCount}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-center">
                      <span className={inspector.nokRate > 2 ? "text-destructive font-medium" : "text-muted-foreground"}>
                        {inspector.nokRate.toFixed(2)}
                      </span>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
};
