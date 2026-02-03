import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const DEFAULT_REQUIREMENTS = [
  { id: 1, description: 'Desenho está em conformidade com a peça produzida' },
  { id: 2, description: 'O desenho adquiri o carimbo de liberação para produção' },
  { id: 3, description: 'Existe informações de auto controle (Freq. Medição, tolerância e outro)' },
  { id: 4, description: 'Revisão do desenho está em conformidade com a apresentada na OP' },
  { id: 5, description: 'Apontamento no PRODWIN está coerente com o número de OP' },
  { id: 6, description: 'Planilha de liberação para produção está assinada e item Aprovado para produção sem restrição' },
  { id: 7, description: 'O plano de controle está sendo devidamente preenchido' },
  { id: 8, description: 'O Plano de controle está descrito na Ordem de Produção e desenho amarelo' },
  { id: 9, description: 'Item possui rastreabilidade e está sendo realizado corretamente (data ou n° operador)' },
  { id: 10, description: 'Todos os instrumentos necessários para controle em processo estão disponíveis' },
  { id: 11, description: 'Instrumentos estão armazenados de forma adequada (ex: longe de ferramentas de corte)' },
  { id: 12, description: 'Operador tem conhecimento para utilização de todos os instrumentos de controle' },
  { id: 13, description: 'Operador tem pleno conhecimento das suas obrigações e evidencia-se que as segue' },
  { id: 14, description: 'Operador tem conhecimento em caso de itens fundido de realizar a inspeção visual após usinado' },
  { id: 15, description: 'Peça que está sendo produzida está devidamente identificada' },
  { id: 16, description: 'Local de trabalho está somente com peças aprovadas, identificação e localização apropriada' },
  { id: 17, description: 'Rebarbação está adequada' },
  { id: 18, description: 'Peça que está sendo fabricada está com todos os dimensionais Aprovados' },
  { id: 19, description: 'Peças estão sendo acondicionadas de maneira a manter a integridade' },
];

interface ReportRow {
  machine: string;
  part: string;
  inspector: string;
  client: string;
  op: string;
  date: string;
  operator: string;
  statuses: string[];
}

function parseStatus(status: string): 'OK' | 'NOK' | 'N/A' {
  const normalized = status?.trim()?.toUpperCase() || '';
  if (normalized === 'OK') return 'OK';
  if (normalized === 'NOK') return 'NOK';
  return 'N/A';
}

function parseDate(dateStr: string): string {
  // Handle MM/DD/YY format
  const parts = dateStr.split('/');
  if (parts.length === 3) {
    const month = parseInt(parts[0], 10);
    const day = parseInt(parts[1], 10);
    let year = parseInt(parts[2], 10);
    
    // Convert 2-digit year to 4-digit
    if (year < 100) {
      year = year >= 50 ? 1900 + year : 2000 + year;
    }
    
    // Return YYYY-MM-DD format
    return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
  }
  
  // If already in a valid format, return as-is
  return dateStr;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { reports } = await req.json() as { reports: ReportRow[] };

    if (!reports || !Array.isArray(reports)) {
      return new Response(
        JSON.stringify({ error: "Invalid data: reports array required" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 400 }
      );
    }

    console.log(`Processing ${reports.length} reports...`);

    const insertData = reports.map((row) => {
      const requirements = DEFAULT_REQUIREMENTS.map((req, index) => ({
        id: req.id,
        description: req.description,
        status: parseStatus(row.statuses[index] || ''),
        evidence: '',
      }));

      const hasNok = requirements.some((r) => r.status === 'NOK');

      return {
        machine: row.machine?.slice(0, 100) || '',
        auditor: row.inspector?.slice(0, 200) || '',
        client: row.client?.slice(0, 200) || '',
        op: row.op?.slice(0, 50) || '',
        date: parseDate(row.date),
        operator: row.operator?.slice(0, 200) || '',
        requirements: requirements,
        approved: !hasNok,
      };
    });

    // Insert in batches of 100
    const batchSize = 100;
    let inserted = 0;
    let errors: string[] = [];

    for (let i = 0; i < insertData.length; i += batchSize) {
      const batch = insertData.slice(i, i + batchSize);
      
      const { data, error } = await supabase
        .from('patrol_reports')
        .insert(batch)
        .select('id');

      if (error) {
        console.error(`Batch ${i / batchSize + 1} error:`, error);
        errors.push(`Batch ${i / batchSize + 1}: ${error.message}`);
      } else {
        inserted += data?.length || 0;
      }
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        inserted,
        total: reports.length,
        errors: errors.length > 0 ? errors : undefined
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("Error:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 }
    );
  }
});
