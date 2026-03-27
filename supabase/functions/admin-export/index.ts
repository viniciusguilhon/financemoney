import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-admin-password, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const ALL_TABLES = [
  "profiles", "banks", "cards", "transactions", "bills",
  "categories", "investments", "savings_goals", "debts",
  "app_settings", "bank_templates", "card_templates",
];

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const adminPassword = Deno.env.get("ADMIN_PASSWORD");
  const providedPassword = req.headers.get("x-admin-password");
  if (!adminPassword || providedPassword !== adminPassword) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
  );

  const url = new URL(req.url);
  const action = url.searchParams.get("action");

  try {
    // Export a single table as CSV
    if (action === "export-csv") {
      const table = url.searchParams.get("table");
      if (!table || !ALL_TABLES.includes(table)) {
        return new Response(JSON.stringify({ error: "Tabela inválida" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const { data, error } = await supabase.from(table).select("*");
      if (error) throw error;

      if (!data || data.length === 0) {
        return new Response("(vazio)", {
          headers: {
            ...corsHeaders,
            "Content-Type": "text/csv; charset=utf-8",
            "Content-Disposition": `attachment; filename="${table}.csv"`,
          },
        });
      }

      const headers = Object.keys(data[0]);
      const csvRows = [
        headers.join(","),
        ...data.map(row =>
          headers.map(h => {
            const val = row[h];
            if (val === null || val === undefined) return "";
            const str = typeof val === "object" ? JSON.stringify(val) : String(val);
            return `"${str.replace(/"/g, '""')}"`;
          }).join(",")
        ),
      ];

      return new Response(csvRows.join("\n"), {
        headers: {
          ...corsHeaders,
          "Content-Type": "text/csv; charset=utf-8",
          "Content-Disposition": `attachment; filename="${table}.csv"`,
        },
      });
    }

    // Get SQL schema using Supabase's built-in SQL via REST
    if (action === "sql-schema") {
      const schemaSQL: string[] = [];
      const dbUrl = Deno.env.get("SUPABASE_DB_URL");
      
      if (!dbUrl) {
        // Fallback: generate schema from data inspection
        for (const table of ALL_TABLES) {
          const { data, error } = await supabase.from(table).select("*").limit(1);
          if (error || !data || data.length === 0) {
            schemaSQL.push(`-- Tabela: ${table} (sem dados para inferir schema)`);
            continue;
          }
          const row = data[0];
          const cols = Object.entries(row).map(([key, val]) => {
            let type = "text";
            if (typeof val === "number") type = Number.isInteger(val) ? "integer" : "numeric";
            else if (typeof val === "boolean") type = "boolean";
            else if (typeof val === "object" && val !== null) type = "jsonb";
            else if (typeof val === "string" && /^\d{4}-\d{2}-\d{2}T/.test(val)) type = "timestamp with time zone";
            else if (typeof val === "string" && /^[0-9a-f]{8}-/.test(val)) type = "uuid";
            return `  ${key} ${type}`;
          });
          schemaSQL.push(`CREATE TABLE public.${table} (\n${cols.join(",\n")}\n);`);
        }
      } else {
        // Use pg connection
        const { default: postgres } = await import("https://deno.land/x/postgresjs@v3.4.5/mod.js");
        const sql = postgres(dbUrl, { max: 1, idle_timeout: 5 });

        try {
          for (const table of ALL_TABLES) {
            const cols = await sql`
              SELECT column_name, udt_name, is_nullable, column_default
              FROM information_schema.columns
              WHERE table_schema = 'public' AND table_name = ${table}
              ORDER BY ordinal_position
            `;
            if (cols.length === 0) continue;

            const pkResult = await sql`
              SELECT kcu.column_name
              FROM information_schema.table_constraints tc
              JOIN information_schema.key_column_usage kcu ON tc.constraint_name = kcu.constraint_name AND tc.table_schema = kcu.table_schema
              WHERE tc.table_schema = 'public' AND tc.table_name = ${table} AND tc.constraint_type = 'PRIMARY KEY'
            `;
            const pkCols = pkResult.map((r: any) => r.column_name);

            const typeMap: Record<string, string> = {
              int4: "integer", int8: "bigint", float8: "double precision",
              bool: "boolean", timestamptz: "timestamp with time zone",
              jsonb: "jsonb", uuid: "uuid", numeric: "numeric", text: "text",
            };

            const colDefs = cols.map((col: any) => {
              const t = typeMap[col.udt_name] || col.udt_name;
              let def = `  ${col.column_name} ${t}`;
              if (col.is_nullable === "NO") def += " NOT NULL";
              if (col.column_default) def += ` DEFAULT ${col.column_default}`;
              return def;
            });

            if (pkCols.length > 0) {
              colDefs.push(`  PRIMARY KEY (${pkCols.join(", ")})`);
            }

            let stmt = `CREATE TABLE public.${table} (\n${colDefs.join(",\n")}\n);`;

            const rlsResult = await sql`
              SELECT relrowsecurity FROM pg_class 
              WHERE relname = ${table} 
              AND relnamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public')
            `;
            if (rlsResult.length > 0 && rlsResult[0].relrowsecurity) {
              stmt += `\n\nALTER TABLE public.${table} ENABLE ROW LEVEL SECURITY;`;
            }

            schemaSQL.push(stmt);
          }
          await sql.end();
        } catch (e) {
          try { await sql.end(); } catch {}
          // Fallback to data-based inference
          for (const table of ALL_TABLES) {
            if (schemaSQL.some(s => s.includes(`public.${table}`))) continue;
            schemaSQL.push(`-- Tabela: ${table} (erro ao obter schema: ${e.message})`);
          }
        }
      }

      return new Response(JSON.stringify({ sql: schemaSQL.join("\n\n-- ----------------------------------------\n\n") }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // List tables with row counts
    if (action === "list-tables") {
      const tableCounts: { name: string; count: number }[] = [];
      for (const table of ALL_TABLES) {
        const { count, error } = await supabase.from(table).select("*", { count: "exact", head: true });
        tableCounts.push({ name: table, count: error ? 0 : (count || 0) });
      }
      return new Response(JSON.stringify(tableCounts), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ error: "Ação inválida" }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
