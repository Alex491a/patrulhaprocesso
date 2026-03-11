import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface RncRecord {
  inspector_name: string;
  date_str: string; // M/D/YY or MM/DD/YYYY format
}

function parseDate(dateStr: string): string {
  const parts = dateStr.split('/');
  if (parts.length !== 3) return dateStr;
  
  let month = parseInt(parts[0], 10);
  let day = parseInt(parts[1], 10);
  let year = parseInt(parts[2], 10);
  
  if (year < 100) {
    year = year >= 50 ? 1900 + year : 2000 + year;
  }
  
  return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { records } = await req.json() as { records: RncRecord[] };

    if (!records || !Array.isArray(records)) {
      return new Response(
        JSON.stringify({ error: "Invalid data: records array required" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 400 }
      );
    }

    console.log(`Processing ${records.length} informal RNC records...`);

    const insertData = records.map((r) => ({
      inspector_name: r.inspector_name.trim(),
      date: parseDate(r.date_str),
    }));

    const batchSize = 100;
    let inserted = 0;
    let errors: string[] = [];

    for (let i = 0; i < insertData.length; i += batchSize) {
      const batch = insertData.slice(i, i + batchSize);
      const { data, error } = await supabase
        .from('informal_rnc')
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
      JSON.stringify({ success: true, inserted, total: records.length, errors: errors.length > 0 ? errors : undefined }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 }
    );
  }
});
