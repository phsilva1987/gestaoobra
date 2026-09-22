import { createClient } from "npm:@supabase/supabase-js@2.45.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return new Response(
      JSON.stringify({ error: "Method not allowed" }),
      { status: 405, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: "Missing authorization header" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const userClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authHeader } },
    });

    const { data: { user }, error: userError } = await userClient.auth.getUser();
    if (userError || !user) {
      return new Response(
        JSON.stringify({ error: "Unauthorized" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const body = await req.json();
    const email = (body.email || "").trim().toLowerCase();
    const name = (body.name || "").trim();
    const projectId = body.project_id;
    const projectRole = body.project_role || "operator";

    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return new Response(
        JSON.stringify({ error: "E-mail inválido." }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }
    if (!projectId) {
      return new Response(
        JSON.stringify({ error: "project_id é obrigatório." }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }
    if (projectRole !== "admin" && projectRole !== "operator") {
      return new Response(
        JSON.stringify({ error: "project_role deve ser 'admin' ou 'operator'." }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const adminClient = createClient(supabaseUrl, serviceRoleKey);

    // Verify caller is admin of the project
    const { data: membership, error: memError } = await adminClient
      .from("project_operators")
      .select("role")
      .eq("project_id", projectId)
      .eq("user_id", user.id)
      .maybeSingle();

    if (memError || !membership || membership.role !== "admin") {
      return new Response(
        JSON.stringify({ error: "Você não possui permissão para esta ação." }),
        { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    // Check if user already exists by email
    const { data: existingUsers } = await adminClient.auth.admin.listUsers();
    const existingUser = existingUsers?.users?.find(
      (u: { email?: string }) => u.email?.toLowerCase() === email,
    );

    let userId: string;

    if (existingUser) {
      userId = existingUser.id;

      // Check if already a member
      const { data: existingMember } = await adminClient
        .from("project_operators")
        .select("user_id")
        .eq("project_id", projectId)
        .eq("user_id", userId)
        .maybeSingle();

      if (existingMember) {
        return new Response(
          JSON.stringify({ error: "Este usuário já pertence ao projeto." }),
          { status: 409, headers: { ...corsHeaders, "Content-Type": "application/json" } },
        );
      }

      // Update name if provided and profile name is empty
      if (name) {
        await adminClient
          .from("profiles")
          .update({ name })
          .eq("id", userId)
          .eq("name", "");
      }
    } else {
      // Invite new user via Supabase Auth Admin API
      const { data: inviteData, error: inviteError } = await adminClient.auth.admin.inviteUserByEmail(
        email,
        { data: { name } },
      );

      if (inviteError) {
        console.error("inviteUserByEmail failed", inviteError);
        return new Response(
          JSON.stringify({ error: "Não foi possível enviar o convite." }),
          { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
        );
      }

      userId = inviteData.user.id;
    }

    // Create membership
    const { error: insertError } = await adminClient
      .from("project_operators")
      .insert({
        project_id: projectId,
        user_id: userId,
        role: projectRole,
      });

    if (insertError) {
      if (insertError.code === "23505") {
        return new Response(
          JSON.stringify({ error: "Este usuário já pertence ao projeto." }),
          { status: 409, headers: { ...corsHeaders, "Content-Type": "application/json" } },
        );
      }
      throw insertError;
    }

    // Neutral response: it must not reveal whether the address already has an account.
    return new Response(
      JSON.stringify({
        ok: true,
        message: "Convite processado. O usuário receberá acesso ao projeto.",
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (err) {
    console.error("invite-project-user failed", err);
    return new Response(
      JSON.stringify({ error: "Erro interno do servidor." }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});
