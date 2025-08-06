import type { APIRoute } from "astro";
import { z } from "zod";

const flashcardSchema = z.object({
  question: z.string().min(1, "Question is required"),
  answer: z.string().min(1, "Answer is required"),
  tags: z.array(z.string()).optional(),
});

export const GET: APIRoute = async ({ locals }) => {
  try {
    const user = locals.user;
    if (!user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { "Content-Type": "application/json" },
      });
    }

    const { supabase } = locals;
    const { data: flashcards, error } = await supabase.from("flashcards").select("*").eq("user_id", user.id);

    if (error) {
      throw error;
    }

    return new Response(JSON.stringify({ flashcards }), {
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

export const POST: APIRoute = async ({ request, locals }) => {
  try {
    const user = locals.user;
    if (!user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { "Content-Type": "application/json" },
      });
    }

    const body = await request.json();
    const flashcard = flashcardSchema.parse(body);

    const { supabase } = locals;
    const { data, error } = await supabase
      .from("flashcards")
      .insert({
        ...flashcard,
        user_id: user.id,
      })
      .select()
      .single();

    if (error) {
      throw error;
    }

    return new Response(JSON.stringify({ flashcard: data }), {
      status: 201,
      headers: { "Content-Type": "application/json" },
    });
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
