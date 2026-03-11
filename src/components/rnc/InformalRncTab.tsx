import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Plus, Trash2, FileWarning, Loader2 } from 'lucide-react';
import { useInformalRnc } from '@/hooks/useInformalRnc';

export const InformalRncTab = () => {
  const { records, isLoading, addRecord, deleteRecord } = useInformalRnc();
  const [inspectorName, setInspectorName] = useState('');
  const [date, setDate] = useState(() => new Date().toISOString().split('T')[0]);

  const handleAdd = async () => {
    if (!inspectorName.trim() || !date) return;
    await addRecord(inspectorName, date);
    setInspectorName('');
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <FileWarning className="h-5 w-5 text-primary" />
            <CardTitle>Registro de RNC Informal</CardTitle>
          </div>
          <CardDescription>
            Registre cada RNC informal individualmente. Total: {records.length} RNC(s) registrada(s).
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Add RNC form */}
          <div className="flex gap-2 flex-wrap">
            <Input
              placeholder="Nome do inspetor..."
              value={inspectorName}
              onChange={(e) => setInspectorName(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
              className="max-w-xs"
            />
            <Input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="max-w-[180px]"
            />
            <Button onClick={handleAdd} size="sm" className="gap-1">
              <Plus className="h-4 w-4" />
              Registrar RNC
            </Button>
          </div>

          {/* Table */}
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>#</TableHead>
                <TableHead>Inspetor</TableHead>
                <TableHead className="text-center">Data</TableHead>
                <TableHead className="text-center">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {records.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} className="text-center text-muted-foreground py-8">
                    Nenhuma RNC informal registrada. Utilize o formulário acima para registrar.
                  </TableCell>
                </TableRow>
              ) : (
                records.map((record, index) => (
                  <TableRow key={record.id}>
                    <TableCell className="text-muted-foreground">{index + 1}</TableCell>
                    <TableCell className="font-medium">{record.inspector_name}</TableCell>
                    <TableCell className="text-center">
                      <Badge variant="secondary">
                        {new Date(record.date + 'T00:00:00').toLocaleDateString('pt-BR')}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-center">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-destructive hover:text-destructive"
                        onClick={() => deleteRecord(record.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
};
