import { useMemo, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Settings, AlertTriangle, ArrowUpDown } from 'lucide-react';
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

type SortField = 'totalReports' | 'totalNok' | 'nokRate' | 'rejectedCount';
type SortOrder = 'asc' | 'desc';

export const MachineStats = ({ reports }: MachineStatsProps) => {
  const [sortField, setSortField] = useState<SortField>('totalNok');
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc');

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
      
      const nokCount = report.requirements.filter((r) => r.status === 'NOK').length;

      machineMap.set(machine, {
        totalReports: current.totalReports + 1,
        totalNok: current.totalNok + nokCount,
        approvedCount: current.approvedCount + (report.overallStatus === 'APPROVED' ? 1 : 0),
        rejectedCount: current.rejectedCount + (report.overallStatus === 'REJECTED' ? 1 : 0),
      });
    });

    const data = Array.from(machineMap.entries()).map(([name, d]) => ({
      name,
      totalReports: d.totalReports,
      totalNok: d.totalNok,
      nokRate: d.totalReports > 0 ? (d.totalNok / d.totalReports) : 0,
      approvedCount: d.approvedCount,
      rejectedCount: d.rejectedCount,
    }));

    return data.sort((a, b) => {
      const multiplier = sortOrder === 'desc' ? -1 : 1;
      return (a[sortField] - b[sortField]) * multiplier;
    });
  }, [reports, sortField, sortOrder]);

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
        <div className="flex items-center gap-3 mt-3">
          <div className="flex items-center gap-2">
            <ArrowUpDown className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm text-muted-foreground">Ordenar por:</span>
          </div>
          <Select value={sortField} onValueChange={(v) => setSortField(v as SortField)}>
            <SelectTrigger className="w-[180px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="totalNok">Total NOK</SelectItem>
              <SelectItem value="totalReports">Auditorias</SelectItem>
              <SelectItem value="rejectedCount">Rejeitados</SelectItem>
              <SelectItem value="nokRate">Média NOK</SelectItem>
            </SelectContent>
          </Select>
          <Select value={sortOrder} onValueChange={(v) => setSortOrder(v as SortOrder)}>
            <SelectTrigger className="w-[140px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="desc">Maior → Menor</SelectItem>
              <SelectItem value="asc">Menor → Maior</SelectItem>
            </SelectContent>
          </Select>
        </div>
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
