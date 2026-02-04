import { useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Settings, AlertTriangle } from 'lucide-react';
import { PatrolReport } from '@/types/patrol';

interface MachineStatsProps {
  reports: PatrolReport[];
}

interface MachineData {
  name: string;
  totalReports: number;
  totalNok: number;
  nokRate: number;
  approvedCount: number;
  rejectedCount: number;
}

export const MachineStats = ({ reports }: MachineStatsProps) => {
  const machineData = useMemo((): MachineData[] => {
    const machineMap = new Map<string, { 
      totalReports: number; 
      totalNok: number;
      approvedCount: number;
      rejectedCount: number;
    }>();

    reports.forEach((report) => {
      const machine = report.machine.trim();
      if (!machine) return;

      const current = machineMap.get(machine) || { 
        totalReports: 0, 
        totalNok: 0,
        approvedCount: 0,
        rejectedCount: 0
      };
      
      // Count NOK items in this report
      const nokCount = report.requirements.filter((r) => r.status === 'NOK').length;

      machineMap.set(machine, {
        totalReports: current.totalReports + 1,
        totalNok: current.totalNok + nokCount,
        approvedCount: current.approvedCount + (report.overallStatus === 'APPROVED' ? 1 : 0),
        rejectedCount: current.rejectedCount + (report.overallStatus === 'REJECTED' ? 1 : 0),
      });
    });

    return Array.from(machineMap.entries())
      .map(([name, data]) => ({
        name,
        totalReports: data.totalReports,
        totalNok: data.totalNok,
        nokRate: data.totalReports > 0 ? (data.totalNok / data.totalReports) : 0,
        approvedCount: data.approvedCount,
        rejectedCount: data.rejectedCount,
      }))
      .sort((a, b) => b.totalNok - a.totalNok);
  }, [reports]);

  const totalMachines = machineData.length;
  const totalReportsAll = machineData.reduce((sum, m) => sum + m.totalReports, 0);
  const totalNokAll = machineData.reduce((sum, m) => sum + m.totalNok, 0);

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <Settings className="h-5 w-5 text-primary" />
          <CardTitle>Índice de Auditoria por Máquina</CardTitle>
        </div>
        <CardDescription>
          Visão geral de auditorias e NOKs por máquina. Total de {totalMachines} máquina(s), {totalReportsAll} auditoria(s), {totalNokAll} NOK(s).
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="max-h-[400px] overflow-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Máquina</TableHead>
                <TableHead className="text-center">Auditorias</TableHead>
                <TableHead className="text-center">Aprovados</TableHead>
                <TableHead className="text-center">Rejeitados</TableHead>
                <TableHead className="text-center">Total NOK</TableHead>
                <TableHead className="text-center">Média NOK/Auditoria</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {machineData.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                    Nenhum dado de máquina encontrado
                  </TableCell>
                </TableRow>
              ) : (
                machineData.map((machine) => (
                  <TableRow key={machine.name}>
                    <TableCell className="font-medium">
                      <div className="flex items-center gap-2">
                        <Settings className="h-4 w-4 text-muted-foreground" />
                        {machine.name}
                      </div>
                    </TableCell>
                    <TableCell className="text-center">
                      <Badge variant="secondary">{machine.totalReports}</Badge>
                    </TableCell>
                    <TableCell className="text-center">
                      <Badge variant="outline" className="text-success border-success/50">
                        {machine.approvedCount}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-center">
                      <Badge 
                        variant={machine.rejectedCount > 0 ? "destructive" : "outline"}
                      >
                        {machine.rejectedCount}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-center">
                      <Badge 
                        variant={machine.totalNok > 0 ? "destructive" : "outline"}
                        className="gap-1"
                      >
                        {machine.totalNok > 0 && <AlertTriangle className="h-3 w-3" />}
                        {machine.totalNok}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-center">
                      <span className={machine.nokRate > 2 ? "text-destructive font-medium" : "text-muted-foreground"}>
                        {machine.nokRate.toFixed(2)}
                      </span>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
};
