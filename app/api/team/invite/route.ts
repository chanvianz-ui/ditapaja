import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const dynamic = "force-dynamic";

function clients() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  const secret = process.env.SUPABASE_SECRET_KEY;
  if (!url || !anon || !secret) throw new Error("Server authentication is not configured.");
  return {
    authClient: createClient(url, anon, { auth: { persistSession: false, autoRefreshToken: false } }),
    admin: createClient(url, secret, { auth: { persistSession: false, autoRefreshToken: false } })
  };
}

async function ownerFromRequest(request: NextRequest, authClient: ReturnType<typeof createClient>) {
  const header = request.headers.get("authorization") || "";
  const token = header.startsWith("Bearer ") ? header.slice(7) : "";
  if (!token) return null;
  const { data, error } = await authClient.auth.getUser(token);
  return error ? null : data.user;
}

export async function GET(request: NextRequest) {
  try {
    const { authClient, admin } = clients();
    const owner = await ownerFromRequest(request, authClient);
    if (!owner) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const { data, error } = await admin.from("business_team_members")
      .select("id,member_user_id,member_email,role,created_at")
      .eq("owner_user_id", owner.id).order("created_at", { ascending: false });
    if (error) throw error;
    return NextResponse.json({ members: data || [] });
  } catch (error) {
    console.error("Team list error:", error);
    return NextResponse.json({ error: "Tidak dapat memuat anggota tim." }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const { authClient, admin } = clients();
    const owner = await ownerFromRequest(request, authClient);
    if (!owner) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const body = await request.json();
    const email = typeof body.email === "string" ? body.email.trim().toLowerCase() : "";
    const role = body.role === "manager" ? "manager" : "viewer";
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json({ error: "Alamat email tidak valid." }, { status: 400 });
    }
    if (email === (owner.email || "").toLowerCase()) {
      return NextResponse.json({ error: "Pemilik akun tidak perlu diundang sebagai anggota." }, { status: 400 });
    }
    const { data: existing } = await admin.from("business_team_members")
      .select("id").eq("owner_user_id", owner.id).eq("member_email", email).maybeSingle();
    if (existing) return NextResponse.json({ error: "Email ini sudah terdaftar di tim." }, { status: 409 });

    const { data: invited, error: inviteError } = await admin.auth.admin.inviteUserByEmail(email, {
      data: { ditapaja_invited_by: owner.id }
    });
    if (inviteError) {
      return NextResponse.json({ error: "Undangan gagal dikirim. Jika email sudah memiliki akun DiTapAja, undangan melalui email belum didukung untuk akun yang sudah terdaftar." }, { status: 400 });
    }
    const { error: insertError } = await admin.from("business_team_members").insert({
      owner_user_id: owner.id, member_user_id: invited.user.id, member_email: email, role
    });
    if (insertError) throw insertError;
    return NextResponse.json({ success: true, email, role });
  } catch (error) {
    console.error("Team invitation error:", error);
    return NextResponse.json({ error: "Terjadi kesalahan saat mengirim undangan." }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { authClient, admin } = clients();
    const owner = await ownerFromRequest(request, authClient);
    if (!owner) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const id = request.nextUrl.searchParams.get("id");
    if (!id) return NextResponse.json({ error: "Member ID wajib diisi." }, { status: 400 });
    const { error } = await admin.from("business_team_members").delete().eq("id", id).eq("owner_user_id", owner.id);
    if (error) throw error;
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Team removal error:", error);
    return NextResponse.json({ error: "Gagal menghapus anggota tim." }, { status: 500 });
  }
}
