import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Shield, AlertTriangle } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

// ⚠️ AVISO DE SEGURANÇA: Esta é uma implementação básica com credenciais fixas.
// NÃO É SEGURO para produção - qualquer pessoa pode ver as credenciais no código-fonte.
// Para segurança real, use autenticação com backend (Lovable Cloud/Supabase).
const CREDENTIALS = {
  login: 'INSPETOR DE LINHA',
  password: 'IDL2026',
};

interface SimpleLoginProps {
  onLogin: () => void;
}

export const SimpleLogin = ({ onLogin }: SimpleLoginProps) => {
  const [login, setLogin] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [attempts, setAttempts] = useState(0);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (login.toUpperCase() === CREDENTIALS.login && password === CREDENTIALS.password) {
      // Armazena estado de login na sessão (não persiste após fechar navegador)
      sessionStorage.setItem('patrol_authenticated', 'true');
      onLogin();
    } else {
      setAttempts(prev => prev + 1);
      setError('Login ou senha incorretos. Tente novamente.');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-industrial-50 to-industrial-100 flex items-center justify-center p-4">
      <Card className="w-full max-w-md shadow-xl">
        <CardHeader className="text-center space-y-4">
          <div className="mx-auto w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center">
            <Shield className="w-8 h-8 text-primary" />
          </div>
          <CardTitle className="text-2xl font-bold text-industrial-800">
            Patrulha de Processo
          </CardTitle>
          <CardDescription>
            Sistema de Gestão de Qualidade
          </CardDescription>
        </CardHeader>
        
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="login">Login</Label>
              <Input
                id="login"
                type="text"
                placeholder="Digite seu login"
                value={login}
                onChange={(e) => setLogin(e.target.value)}
                required
                autoComplete="username"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="password">Senha</Label>
              <Input
                id="password"
                type="password"
                placeholder="Digite sua senha"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                autoComplete="current-password"
              />
            </div>

            {error && (
              <Alert variant="destructive">
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            {attempts >= 3 && (
              <Alert>
                <AlertDescription className="text-sm text-muted-foreground">
                  Dica: Entre em contato com o administrador do sistema se esqueceu suas credenciais.
                </AlertDescription>
              </Alert>
            )}

            <Button type="submit" className="w-full" size="lg">
              Entrar
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};
