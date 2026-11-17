import { createClient } from "@supabase/supabase-js";
import { NextRequest, NextResponse } from "next/server";

function unauthorized(status: 401 | 403 | 500, message: string) {
  return {
    authorized: false as const,
    response: NextResponse.json({ error: message }, { status }),
  };
}

export async function verifyAdmin(request: NextRequest) {
  const authorization = request.headers.get("authorization") || "";
  const bearerMatch = authorization.match(/^Bearer\s+(.+)$/i);
  const token = bearerMatch?.[1]?.trim();

  if (!token) {
    return unauthorized(401, "Unauthorized");
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  const secretKey = process.env.SUPABASE_SECRET_KEY;

  // Fail closed if any required server configuration is missing.
  if (!supabaseUrl || !supabaseAnonKey || !secretKey) {
    console.error("Admin authentication is missing required server configuration.");
    return unauthorized(500, "Admin authentication is not configured.");
  }

  let authClient;
  try {
    authClient = createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
        detectSessionInUrl: false,
      },
    });
  } catch (error) {
    console.error("Admin auth client initialization failed:", error);
    return unauthorized(500, "Admin authentication is unavailable.");
  }

  const { data, error } = await authClient.auth.getUser(token);

  if (error || !data.user) {
    return unauthorized(401, "Invalid or expired session.");
  }

  // Authorization uses trusted Supabase app_metadata, never user-editable user_metadata.
  if (data.user.app_metadata?.role !== "superadmin") {
    return unauthorized(403, "Access denied");
  }

  const adminClient = createClient(supabaseUrl, secretKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
      detectSessionInUrl: false,
    },
  });

  return {
    authorized: true as const,
    user: data.user,
    supabase: adminClient,
  };
}
