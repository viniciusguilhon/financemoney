import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-admin-password",
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
        return new Response("", {
          headers: {
            ...corsHeaders,
            "Content-Type": "text/csv",
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

    // Get SQL schema for all tables
    if (action === "sql-schema") {
      const { data: columns, error } = await supabase.rpc("get_table_schemas").catch(() => ({ data: null, error: { message: "Function not found" } }));
      
      // Fallback: build schema from information_schema via raw query
      const schemaSQL: string[] = [];
      
      for (const table of ALL_TABLES) {
        const { data: rows, error: fetchErr } = await supabase.from(table).select("*").limit(0);
        // We'll build CREATE TABLE from known types
      }

      // Use a simpler approach: query information_schema
      const dbUrl = Deno.env.get("SUPABASE_DB_URL");
      if (dbUrl) {
        // Use postgres connection to get schema
        const { default: postgres } = await import("https://deno.land/x/postgresjs@v3.4.4/mod.js");
        const sql = postgres(dbUrl, { max: 1 });
        
        try {
          for (const table of ALL_TABLES) {
            const cols = await sql`
              SELECT column_name, data_type, is_nullable, column_default, udt_name
              FROM information_schema.columns
              WHERE table_schema = 'public' AND table_name = ${table}
              ORDER BY ordinal_position
            `;
            
            if (cols.length === 0) continue;

            // Get primary key
            const pkResult = await sql`
              SELECT kcu.column_name
              FROM information_schema.table_constraints tc
              JOIN information_schema.key_column_usage kcu ON tc.constraint_name = kcu.constraint_name
              WHERE tc.table_schema = 'public' AND tc.table_name = ${table} AND tc.constraint_type = 'PRIMARY KEY'
            `;
            const pkCols = pkResult.map((r: any) => r.column_name);

            let createStmt = `CREATE TABLE public.${table} (\n`;
            const colDefs: string[] = [];
            
            for (const col of cols) {
              let typeName = col.udt_name;
              if (typeName === "int4") typeName = "integer";
              else if (typeName === "int8") typeName = "bigint";
              else if (typeName === "float8") typeName = "double precision";
              else if (typeName === "bool") typeName = "boolean";
              else if (typeName === "timestamptz") typeName = "timestamp with time zone";
              else if (typeName === "jsonb") typeName = "jsonb";
              else if (typeName === "uuid") typeName = "uuid";
              else if (typeName === "numeric") typeName = "numeric";
              else if (typeName === "text") typeName = "text";
              
              let def = `  ${col.column_name} ${typeName}`;
              if (col.is_nullable === "NO") def += " NOT NULL";
              if (col.column_default) def += ` DEFAULT ${col.column_default}`;
              colDefs.push(def);
            }
            
            if (pkCols.length > 0) {
              colDefs.push(`  PRIMARY KEY (${pkCols.join(", ")})`);
            }
            
            createStmt += colDefs.join(",\n");
            createStmt += "\n);";
            
            // Get RLS status
            const rlsResult = await sql`
              SELECT relrowsecurity FROM pg_class WHERE relname = ${table} AND relnamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public')
            `;
            if (rlsResult.length > 0 && rlsResult[0].relrowsecurity) {
              createStmt += `\n\nALTER TABLE public.${table} ENABLE ROW LEVEL SECURITY;`;
            }

            // Get RLS policies
            const policies = await sql`
              SELECT polname, polcmd, polqual::text, polwithcheck::text
              FROM pg_policy
              WHERE polrelid = (SELECT oid FROM pg_class WHERE relname = ${table} AND relnamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public'))
            `;
            
            for (const pol of policies) {
              const cmdMap: Record<string, string> = { r: "SELECT", a: "INSERT", w: "UPDATE", d: "DELETE", "*": "ALL" };
              createStmt += `\n\nCREATE POLICY "${pol.polname}" ON public.${table}\n  FOR ${cmdMap[pol.polcmd] || "ALL"}\n  TO public`;
              if (pol.polqual) createStmt += `\n  USING (${pol.polqual})`;
              if (pol.polwithcheck) createStmt += `\n  WITH CHECK (${pol.polwithcheck})`;
              createStmt += ";";
            }

            schemaSQL.push(createStmt);
          }
          
          await sql.end();
        } catch (e) {
          await sql.end();
          throw e;
        }
      }

      return new Response(JSON.stringify({ sql: schemaSQL.join("\n\n-- ---\n\n") }), {
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
