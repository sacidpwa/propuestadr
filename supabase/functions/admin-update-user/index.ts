// Edge function: admin-update-user
// Updates a user's email and/or full name. Caller must be admin or dueño.

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY") ?? Deno.env.get("SUPABASE_PUBLISHABLE_KEY")!;
const SERVICE_ROLE = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) return json({ error: "Unauthorized" }, 401);

    const userClient = createClient(SUPABASE_URL, ANON_KEY, {
      global: { headers: { Authorization: authHeader } },
    });
    const token = authHeader.replace("Bearer ", "");
    const { data: claimsData, error: claimsErr } = await userClient.auth.getClaims(token);
    if (claimsErr || !claimsData?.claims) return json({ error: "Unauthorized" }, 401);
    const callerId = claimsData.claims.sub as string;

    const { data: roles } = await userClient.from("user_roles").select("role").eq("user_id", callerId);
    const callerRoles = (roles ?? []).map((r: any) => r.role);
    if (!callerRoles.includes("admin") && !callerRoles.includes("dueno")) {
      return json({ error: "forbidden" }, 403);
    }

    const body = await req.json().catch(() => ({}));
    const targetUserId = String(body.user_id ?? "");
    const newEmail = body.email ? String(body.email).trim().toLowerCase() : null;
    const newName = body.full_name ? String(body.full_name).trim() : null;

    if (!targetUserId) return json({ error: "user_id requerido" }, 400);
    if (!newEmail && !newName) return json({ error: "nada que actualizar" }, 400);
    if (newEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(newEmail)) return json({ error: "email invalido" }, 400);

    const admin = createClient(SUPABASE_URL, SERVICE_ROLE, {
      auth: { persistSession: false, autoRefreshToken: false },
    });

    // Update auth user
    const authUpdate: Record<string, unknown> = {};
    if (newEmail) {
      authUpdate.email = newEmail;
      authUpdate.email_confirm = true;
    }
    if (newName) authUpdate.user_metadata = { full_name: newName };

    if (Object.keys(authUpdate).length > 0) {
      const { error: updErr } = await admin.auth.admin.updateUserById(targetUserId, authUpdate);
      if (updErr) return json({ error: updErr.message }, 400);
    }

    // Update profile
    const profileUpdate: Record<string, unknown> = { updated_at: new Date().toISOString() };
    if (newEmail) profileUpdate.email = newEmail;
    if (newName) profileUpdate.full_name = newName;
    await admin.from("profiles").update(profileUpdate).eq("user_id", targetUserId);

    // Mirror email on specialists if linked
    if (newEmail) {
      await admin.from("specialists").update({ email: newEmail }).eq("user_id", targetUserId);
    }
    if (newName) {
      await admin.from("specialists").update({ full_name: newName }).eq("user_id", targetUserId);
    }

    return json({ ok: true });
  } catch (e) {
    return json({ error: (e as Error).message }, 500);
  }

  function json(payload: unknown, status = 200) {
    return new Response(JSON.stringify(payload), {
      status,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
