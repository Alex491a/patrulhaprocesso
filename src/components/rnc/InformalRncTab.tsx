import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Plus, Minus, UserPlus, FileWarning, Loader2 } from 'lucide-react';
import { useInformalRnc } from '@/hooks/useInformalRnc';

export const InformalRncTab = () => {
  const { records, isLoading, addInspector, incrementCount, decrementCount } = useInformalRnc();
  const [newName, setNewName] = useState('');

  const handleAdd = async () => {
    if (!newName.trim()) return;
    await addInspector(newName);
    setNewName('');
  };

  const totalRnc = records.reduce((sum, r) => sum + r.count, 0);

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
            <CardTitle>RNC Informal</CardTitle>
          </div>
          <CardDescription>
            Controle manual de RNCs informais por inspetor. Total: {totalRnc} RNC(s) registrada(s).
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Add inspector form */}
          <div className="flex gap-2">
            <Input
              placeholder="Nome do inspetor..."
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
              className="max-w-sm"
            />
            <Button onClick={handleAdd} size="sm" className="gap-1">
              <UserPlus className="h-4 w-4" />
              Adicionar
            </Button>
          </div>

          {/* Table */}
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Inspetor</TableHead>
                <TableHead className="text-center">RNCs Informais</TableHead>
                <TableHead className="text-center">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {records.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={3} className="text-center text-muted-foreground py-8">
                    Nenhum inspetor cadastrado. Adicione um inspetor acima.
                  </TableCell>
                </TableRow>
              ) : (
                records.map((record) => (
                  <TableRow key={record.id}>
                    <TableCell className="font-medium">{record.inspector_name}</TableCell>
                    <TableCell className="text-center">
                      <Badge variant={record.count > 0 ? 'default' : 'outline'}>
                        {record.count}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-center">
                      <div className="flex items-center justify-center gap-1">
                        <Button
                          variant="outline"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => decrementCount(record.id)}
                          disabled={record.count <= 0}
                        >
                          <Minus className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="default"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => incrementCount(record.id)}
                        >
                          <Plus className="h-4 w-4" />
                        </Button>
                      </div>
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
