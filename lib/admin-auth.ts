import { createClient } from "@supabase/supabase-js";
import { NextRequest, NextResponse } from "next/server";

export async function verifyAdmin(request: NextRequest) {
  const authorization = request.headers.get("authorization");

  if (!authorization?.startsWith("Bearer ")) {
    return {
      authorized: false,
      response: NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      ),
    };
  }

  const token = authorization.replace("Bearer ", "");

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
  const secretKey = process.env.SUPABASE_SECRET_KEY!;
  const adminUserId = process.env.ADMIN_USER_ID;

  if (!adminUserId || !secretKey) {
    return {
      authorized: false,
      response: NextResponse.json(
        { error: "Admin configuration missing" },
        { status: 500 }
      ),
    };
  }

  const authClient = createClient(
    supabaseUrl,
    supabaseAnonKey,
    {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
    }
  );

  const { data, error } = await authClient.auth.getUser(token);

  if (error || !data.user || data.user.id !== adminUserId) {
    return {
      authorized: false,
      response: NextResponse.json(
        { error: "Access denied" },
        { status: 403 }
      ),
    };
  }

  const adminClient = createClient(
    supabaseUrl,
    secretKey,
    {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
    }
  );

  return {
    authorized: true,
    user: data.user,
    supabase: adminClient,
  };
}
