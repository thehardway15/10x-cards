import type { APIRoute } from "astro";
import { createSupabaseServerInstance } from "../../../db/supabase.client";
import { z } from "zod";
import { createToken } from "../../../lib/auth/jwt";

const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, "Current password is required"),
  newPassword: z.string().min(8, "New password must be at least 8 characters long"),
});

export const POST: APIRoute = async ({ request, locals }) => {
  try {
    const body = await request.json();
    const { newPassword } = changePasswordSchema.parse(body);

    const user = locals.user;
    if (!user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { "Content-Type": "application/json" },
      });
    }

    const supabase = createSupabaseServerInstance({ headers: request.headers });

    // Update password
    const { error } = await supabase.auth.updateUser({
      password: newPassword,
    });

    if (error) {
      return new Response(JSON.stringify({ error: error.message }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Generate new token
    const token = await createToken(user);

    return new Response(
      JSON.stringify({
        message: "Password changed successfully",
        token,
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    if (error instanceof z.ZodError) {
      return new Response(JSON.stringify({ error: error.errors[0].message }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
};
