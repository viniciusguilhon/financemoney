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
  const type = url.searchParams.get("type");

  // Public read for settings (no admin password required)
  if (req.method === "GET" && type === "settings") {
    const key = url.searchParams.get("key");
    if (key) {
      const { data, error } = await supabase.from("app_settings").select("value").eq("key", key).maybeSingle();
      if (error) {
        return new Response(JSON.stringify({ error: error.message }), {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (!data) {
        return new Response(JSON.stringify(null), {
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
      // Users listing with last_sign_in from auth
      if (type === "users") {
        const { data: profiles, error } = await supabase.from("profiles").select("id, nome, email, whatsapp, avatar_url, created_at").order("created_at", { ascending: false });
        if (error) throw error;

        // Get auth users for last_sign_in and banned status
        const { data: authData } = await supabase.auth.admin.listUsers({ perPage: 1000 });
        const authMap = new Map<string, { last_sign_in_at: string | null; banned: boolean }>();
        if (authData?.users) {
          for (const u of authData.users) {
            authMap.set(u.id, {
              last_sign_in_at: u.last_sign_in_at || null,
              banned: u.banned_until ? new Date(u.banned_until) > new Date() : false,
            });
          }
        }

        const enriched = (profiles || []).map((p) => ({
          ...p,
          last_sign_in_at: authMap.get(p.id)?.last_sign_in_at || null,
          banned: authMap.get(p.id)?.banned || false,
        }));

        return new Response(JSON.stringify(enriched), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      // Dashboard stats
      if (type === "dashboard") {
        const { data: profiles } = await supabase.from("profiles").select("id, created_at");
        const { data: authData } = await supabase.auth.admin.listUsers({ perPage: 1000 });
        
        const totalUsers = profiles?.length || 0;
        const now = new Date();
        const thisMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
        const newThisMonth = profiles?.filter(p => p.created_at.startsWith(thisMonth)).length || 0;
        
        const activeToday = authData?.users?.filter(u => {
          if (!u.last_sign_in_at) return false;
          const d = new Date(u.last_sign_in_at);
          return d.toDateString() === now.toDateString();
        }).length || 0;

        const bannedCount = authData?.users?.filter(u => u.banned_until && new Date(u.banned_until) > now).length || 0;

        return new Response(JSON.stringify({ totalUsers, newThisMonth, activeToday, bannedCount }), {
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

      // User management
      if (type === "users") {
        if (action === "update") {
          const { id, nome, whatsapp } = body;
          const { error } = await supabase.from("profiles").update({ nome, whatsapp }).eq("id", id);
          if (error) throw error;
          return new Response(JSON.stringify({ success: true }), {
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }
        if (action === "delete") {
          const { id } = body;
          const { error } = await supabase.auth.admin.deleteUser(id);
          if (error) throw error;
          return new Response(JSON.stringify({ success: true }), {
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }
        if (action === "ban") {
          const { id, ban } = body;
          const { error } = await supabase.auth.admin.updateUserById(id, {
            ban_duration: ban ? "876000h" : "none",
          });
          if (error) throw error;
          return new Response(JSON.stringify({ success: true }), {
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }
        if (action === "reset-password") {
          const { email } = body;
          const { error } = await supabase.auth.admin.generateLink({
            type: "recovery",
            email,
          });
          if (error) throw error;
          return new Response(JSON.stringify({ success: true }), {
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }
      }

      // Handle settings updates
      if (type === "settings") {
        if (action === "update") {
          const { key, value } = body;
          // Try update first, if no rows affected, insert
          const { data: existing } = await supabase.from("app_settings").select("id").eq("key", key).single();
          if (existing) {
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
          } else {
            const { data, error } = await supabase
              .from("app_settings")
              .insert({ key, value, updated_at: new Date().toISOString() })
              .select()
              .single();
            if (error) throw error;
            return new Response(JSON.stringify(data), {
              headers: { ...corsHeaders, "Content-Type": "application/json" },
            });
          }
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
