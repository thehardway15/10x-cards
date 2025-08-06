import type { APIRoute } from "astro";
import { z } from "zod";
import { GenerationService } from "../../lib/services/generation.service";
import type { User } from "@supabase/supabase-js";
import type { createSupabaseServerInstance } from "../../db/supabase.client";

interface Locals {
  supabase: ReturnType<typeof createSupabaseServerInstance> | null;
  user: User | null;
}

const generationRequestSchema = z.object({
  sourceText: z
    .string()
    .min(1000, "Text must be at least 1,000 characters")
    .max(10000, "Text must not exceed 10,000 characters"),
  options: z
    .object({
      language: z.string().optional(),
      difficulty: z.string().optional(),
      count: z.number().min(1).max(10).optional(),
    })
    .optional(),
});

export const POST: APIRoute = async ({ request, locals }) => {
  try {
    const user = (locals as Locals).user;
    if (!user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { "Content-Type": "application/json" },
      });
    }

    const body = await request.json();
    console.log("Received generation request:", { body, userId: user.id });

    const { sourceText } = generationRequestSchema.parse(body);

    const { supabase } = locals as Locals;
    if (!supabase) {
      return new Response(JSON.stringify({ error: "Supabase client not available" }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Create generation service and generate flashcards
    const generationService = new GenerationService(supabase);
    const result = await generationService.createGeneration({ sourceText }, user.id);

    return new Response(JSON.stringify(result), {
      status: 201,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Generation API error:", error);

    if (error instanceof z.ZodError) {
      console.error("Validation error:", error.errors);
      return new Response(JSON.stringify({ error: error.errors[0].message }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    console.error("Generation error:", error);
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
};

export const GET: APIRoute = async ({ locals }) => {
  try {
    const user = (locals as Locals).user;
    if (!user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { "Content-Type": "application/json" },
      });
    }

    const { supabase } = locals as Locals;
    if (!supabase) {
      return new Response(JSON.stringify({ error: "Supabase client not available" }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      });
    }

    const { data: generations, error } = await supabase
      .from("generations")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });

    if (error) {
      throw error;
    }

    return new Response(JSON.stringify({ generations }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch {
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
};
