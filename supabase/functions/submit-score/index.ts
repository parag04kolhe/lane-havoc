import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const MAX_SCORE = 500000;

serve(async (req) => {
  const headers = {
    "Content-Type": "application/json",
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "content-type",
  };

  if (req.method === "OPTIONS") {
    return new Response("ok", { headers });
  }

  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405, headers
    });
  }

  let body;
  try {
    body = await req.json();
  } catch {
    return new Response(JSON.stringify({ error: "Invalid JSON" }), {
      status: 400, headers
    });
  }

  const { name, score } = body;

  if (typeof score !== "number" || !Number.isInteger(score)) {
    return new Response(JSON.stringify({ error: "Invalid score" }), {
      status: 400, headers
    });
  }
  if (score <= 0 || score > MAX_SCORE) {
    return new Response(JSON.stringify({ error: "Score out of range" }), {
      status: 400, headers
    });
  }
  if (typeof name !== "string" || name.trim().length < 1 || name.trim().length > 16) {
    return new Response(JSON.stringify({ error: "Invalid name" }), {
      status: 400, headers
    });
  }

  const clientIp = req.headers.get("x-forwarded-for") || "unknown";
  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

  const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000).toISOString();
  const { count } = await supabase
    .from("scores")
    .select("*", { count: "exact", head: true })
    .eq("client_ip", clientIp)
    .gte("created_at", fiveMinutesAgo);

  if ((count ?? 0) >= 1) {
    return new Response(JSON.stringify({ error: "Rate limit exceeded" }), {
      status: 429, headers
    });
  }

  const { error } = await supabase.from("scores").insert({
    name: name.trim(),
    score,
    client_ip: clientIp,
  });

  if (error) {
    return new Response(JSON.stringify({ error: "DB error" }), {
      status: 500, headers
    });
  }

  return new Response(JSON.stringify({ success: true }), { status: 201, headers });
});