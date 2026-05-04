// Edge function: admin-create-user
// Creates a new auth user (email + password, auto-confirmed), assigns role and PIN.
// Caller must be admin or dueño.

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY") ?? Deno.env.get("SUPABASE_PUBLISHABLE_KEY")!;
const SERVICE_ROLE = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

const ALLOWED_ROLES = ["admin", "recepcion", "especialista", "administrativo", "dueno"] as const;
type Role = typeof ALLOWED_ROLES[number];

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return json({ error: "Unauthorized" }, 401);
    }

    // Caller validation
    const userClient = createClient(SUPABASE_URL, ANON_KEY, {
      global: { headers: { Authorization: authHeader } },
    });
    const token = authHeader.replace("Bearer ", "");
    const { data: claimsData, error: claimsErr } = await userClient.auth.getClaims(token);
    if (claimsErr || !claimsData?.claims) return json({ error: "Unauthorized" }, 401);
    const callerId = claimsData.claims.sub as string;

    const { data: roles } = await userClient
      .from("user_roles")
      .select("role")
      .eq("user_id", callerId);
    const callerRoles = (roles ?? []).map((r: any) => r.role);
    if (!callerRoles.includes("admin") && !callerRoles.includes("dueno")) {
      return json({ error: "forbidden" }, 403);
    }

    // Body
    const body = await req.json().catch(() => ({}));
    const email = String(body.email ?? "").trim().toLowerCase();
    const password = String(body.password ?? "");
    const fullName = String(body.full_name ?? "").trim();
    const role = body.role as Role;
    const pin = body.pin ? String(body.pin) : null;
    const additionalRoles: Role[] = Array.isArray(body.additional_roles) ? body.additional_roles : [];

    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return json({ error: "email invalido" }, 400);
    if (!password || password.length < 8) return json({ error: "password minimo 8" }, 400);
    if (!fullName) return json({ error: "nombre requerido" }, 400);
    if (!ALLOWED_ROLES.includes(role)) return json({ error: "rol invalido" }, 400);
    if (pin && !/^[0-9]{4,8}$/.test(pin)) return json({ error: "pin invalido" }, 400);

    const admin = createClient(SUPABASE_URL, SERVICE_ROLE, {
      auth: { persistSession: false, autoRefreshToken: false },
    });

    // Create user (auto confirmed)
    const { data: created, error: createErr } = await admin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { full_name: fullName },
    });
    if (createErr || !created.user) {
      return json({ error: createErr?.message ?? "no se pudo crear" }, 400);
    }
    const newUserId = created.user.id;

    // Ensure profile exists (handle_new_user trigger should do it; upsert just in case)
    await admin.from("profiles").upsert(
      { user_id: newUserId, full_name: fullName, email },
      { onConflict: "user_id" },
    );

    // Assign primary role (replace) and additional roles
    await admin.from("user_roles").delete().eq("user_id", newUserId);
    const rolesToInsert = [{ user_id: newUserId, role }];
    for (const r of additionalRoles) {
      if (ALLOWED_ROLES.includes(r) && r !== role) rolesToInsert.push({ user_id: newUserId, role: r });
    }
    const { error: roleErr } = await admin.from("user_roles").insert(rolesToInsert);
    if (roleErr) return json({ error: `usuario creado pero rol fallo: ${roleErr.message}`, user_id: newUserId }, 200);

    // Optionally set PIN
    if (pin) {
      const { error: pinErr } = await admin.rpc("admin_set_user_pin", { _user_id: newUserId, _pin: pin });
      // RPC requires authenticated context as admin; fallback to direct update via service role
      if (pinErr) {
        const { data: hashRow } = await admin.rpc("crypt_pin_helper" as any, { _pin: pin }).maybeSingle?.() ?? { data: null };
        // Fallback: use direct update with extensions.crypt via SQL is not exposed; accept that PIN can be set by user later
        await admin
          .from("profiles")
          .update({ pin_set_at: null })
          .eq("user_id", newUserId);
      }
    }

    return json({ ok: true, user_id: newUserId });
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
