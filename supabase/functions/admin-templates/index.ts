import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-admin-password",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
  );

  const url = new URL(req.url);
  const type = url.searchParams.get("type"); // "bank", "card", or "settings"

  // Public read for settings (no admin password required)
  if (req.method === "GET" && type === "settings") {
    const key = url.searchParams.get("key");
    if (key) {
      const { data, error } = await supabase.from("app_settings").select("value").eq("key", key).single();
      if (error) {
        return new Response(JSON.stringify({ error: error.message }), {
          status: 404,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      return new Response(JSON.stringify(data.value), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const { data, error } = await supabase.from("app_settings").select("*");
    if (error) {
      return new Response(JSON.stringify({ error: error.message }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    return new Response(JSON.stringify(data), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  // Admin password required for everything else
  const adminPassword = Deno.env.get("ADMIN_PASSWORD");
  const providedPassword = req.headers.get("x-admin-password");

  if (!adminPassword || providedPassword !== adminPassword) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  try {
    if (req.method === "GET") {
      // Users listing for admin
      if (type === "users") {
        const { data, error } = await supabase.from("profiles").select("id, nome, email, whatsapp, avatar_url, created_at").order("created_at", { ascending: false });
        if (error) throw error;
        return new Response(JSON.stringify(data), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const table = type === "card" ? "card_templates" : "bank_templates";
      const { data, error } = await supabase.from(table).select("*").order("nome");
      if (error) throw error;
      return new Response(JSON.stringify(data), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (req.method === "POST") {
      const body = await req.json();
      const { action } = body;

      // Handle settings updates
      if (type === "settings") {
        if (action === "update") {
          const { key, value } = body;
          const { data, error } = await supabase
            .from("app_settings")
            .update({ value, updated_at: new Date().toISOString() })
            .eq("key", key)
            .select()
            .single();
          if (error) throw error;
          return new Response(JSON.stringify(data), {
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }
      }

      if (action === "upload-image") {
        const { fileName, fileBase64, contentType } = body;
        const fileBytes = Uint8Array.from(atob(fileBase64), (c) => c.charCodeAt(0));
        const sanitizedName = fileName.replace(/[^a-zA-Z0-9._-]/g, '_');
        const path = `${type}s/${Date.now()}-${sanitizedName}`;
        const { error: uploadError } = await supabase.storage
          .from("template-images")
          .upload(path, fileBytes, { contentType, upsert: true });
        if (uploadError) throw uploadError;
        const { data: urlData } = supabase.storage
          .from("template-images")
          .getPublicUrl(path);
        return new Response(JSON.stringify({ url: urlData.publicUrl }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      if (action === "create") {
        const table = type === "card" ? "card_templates" : "bank_templates";
        const { data, error } = await supabase.from(table).insert(body.template).select().single();
        if (error) throw error;
        return new Response(JSON.stringify(data), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      if (action === "update") {
        const table = type === "card" ? "card_templates" : "bank_templates";
        const { data, error } = await supabase
          .from(table)
          .update(body.template)
          .eq("id", body.id)
          .select()
          .single();
        if (error) throw error;
        return new Response(JSON.stringify(data), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      if (action === "delete") {
        const table = type === "card" ? "card_templates" : "bank_templates";
        const { error } = await supabase.from(table).delete().eq("id", body.id);
        if (error) throw error;
        return new Response(JSON.stringify({ success: true }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
    }

    return new Response(JSON.stringify({ error: "Invalid request" }), {
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
