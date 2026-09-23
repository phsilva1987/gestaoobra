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

    // Verify caller is global admin
    const { data: profile, error: profileError } = await userClient
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .maybeSingle();

    if (profileError || !profile || profile.role !== "admin") {
      return new Response(
        JSON.stringify({ error: "Apenas administradores podem gerenciar usuários." }),
        { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const body = await req.json();
    const action = (body.action || "").trim().toLowerCase();
    const targetUserId = (body.user_id || "").trim();

    if (!targetUserId) {
      return new Response(
        JSON.stringify({ error: "user_id é obrigatório." }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    if (targetUserId === user.id) {
      return new Response(
        JSON.stringify({ error: "Você não pode modificar sua própria conta por aqui." }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const adminClient = createClient(supabaseUrl, serviceRoleKey);

    if (action === "reset_password") {
      const newPassword = (body.new_password || "").trim();
      if (!newPassword || newPassword.length < 6) {
        return new Response(
          JSON.stringify({ error: "Senha deve ter no mínimo 6 caracteres." }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
        );
      }

      // Try the Auth Admin API first.
      const { error: updateError } = await adminClient.auth.admin.updateUserById(
        targetUserId,
        { password: newPassword },
      );

      if (updateError) {
        console.error("updateUserById failed for", targetUserId, updateError);

        // If the password itself is weak, don't fall back to the RPC —
        // tell the user to pick a stronger password.
        if (
          updateError.name === "AuthWeakPasswordError" ||
          (updateError.message && updateError.message.toLowerCase().includes("weak"))
        ) {
          return new Response(
            JSON.stringify({ error: "A senha é muito fraca. Use pelo menos 8 caracteres com letras, números e símbolos." }),
            { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
          );
        }

        // Fallback: update the password hash directly via RPC. The Auth Admin
        // API can fail with "Database error loading user" when the auth.users
        // row was not created by GoTrue itself (e.g. manually inserted).
        const { error: rpcError } = await adminClient.rpc(
          "admin_set_user_password" as never,
          { p_user_id: targetUserId, p_password: newPassword } as never,
        );

        if (rpcError) {
          console.error("admin_set_user_password fallback failed", rpcError);
          return new Response(
            JSON.stringify({ error: "Não foi possível redefinir a senha." }),
            { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
          );
        }
      }

      return new Response(
        JSON.stringify({ ok: true, message: "Senha redefinida com sucesso." }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    if (action === "delete") {
      // Verify target is not the last admin
      const { data: targetProfile } = await adminClient
        .from("profiles")
        .select("role")
        .eq("id", targetUserId)
        .maybeSingle();

      if (targetProfile?.role === "admin") {
        const { data: admins } = await adminClient
          .from("profiles")
          .select("id")
          .eq("role", "admin");

        if (admins && admins.length <= 1) {
          return new Response(
            JSON.stringify({ error: "Não é possível excluir o último administrador do sistema." }),
            { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
          );
        }
      }

      // Delete auth user (cascades to profile and project_operators)
      const { error: deleteError } = await adminClient.auth.admin.deleteUser(targetUserId);

      if (deleteError) {
        return new Response(
          JSON.stringify({ error: "Não foi possível excluir o usuário." }),
          { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
        );
      }

      return new Response(
        JSON.stringify({ ok: true, message: "Usuário excluído com sucesso." }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    return new Response(
      JSON.stringify({ error: "Ação inválida. Use 'reset_password' ou 'delete'." }),
      { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (err) {
    console.error("manage-user failed", err);
    return new Response(
      JSON.stringify({ error: "Erro interno do servidor." }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});
