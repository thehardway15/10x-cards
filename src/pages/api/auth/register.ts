import type { APIRoute } from "astro";
import { createSupabaseServerInstance } from "../../../db/supabase.client";
import { z } from "zod";
import type { User } from "@supabase/supabase-js";
import type { createSupabaseServerInstance as CreateSupabaseServerInstance } from "../../../db/supabase.client";

interface Locals {
  supabase: ReturnType<typeof CreateSupabaseServerInstance> | null;
  user: User | null;
}

const registerSchema = z.object({
  email: z.string().email("Invalid email format"),
  password: z
    .string()
    .min(8, "Password must be at least 8 characters long")
    .regex(/[A-Za-z]/, "Password must contain at least one letter")
    .regex(/[0-9]/, "Password must contain at least one number"),
});

export const POST: APIRoute = async ({ request, cookies, locals }) => {
  try {
    const body = await request.json();
    const { email, password } = registerSchema.parse(body);

    // Use Supabase instance from locals if available, otherwise create new one
    const supabase =
      (locals as Locals).supabase ||
      createSupabaseServerInstance({
        headers: request.headers,
        cookies,
      });

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
    });

    if (error) {
      return new Response(JSON.stringify({ error: error.message }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Don't generate token on registration as user needs to verify email first
    return new Response(
      JSON.stringify({
        message: "Registration successful. Please check your email to verify your account.",
        user: {
          id: data.user?.id,
          email: data.user?.email,
        },
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
