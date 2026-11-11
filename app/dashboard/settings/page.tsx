
"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  Settings,
  LockKeyhole,
  Eye,
  EyeOff,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  Loader2,
  KeyRound,
  UserRound,
  Mail,
} from "lucide-react";
import { supabase } from "@/lib/supabase";

export default function AccountSettingsPage() {
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [email, setEmail] = useState("");
  const [fullName, setFullName] = useState("");

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    async function loadAccount() {
      try {
        const { data, error } = await supabase.auth.getUser();

        if (error || !data.user) {
          router.replace("/login");
          return;
        }

        setEmail(data.user.email ?? "");

        const { data: profile } = await supabase
          .from("profiles")
          .select("full_name")
          .eq("id", data.user.id)
          .maybeSingle();

        setFullName(
          profile?.full_name ||
          data.user.user_metadata?.full_name ||
          ""
        );
      } catch (err) {
        console.error("Account loading error:", err);
        setError("Gagal memuat informasi akun.");
      } finally {
        setLoading(false);
      }
    }

    loadAccount();
  }, [router]);

  async function handleChangePassword(
    event: React.FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    setError("");
    setSuccess("");

    if (!currentPassword) {
      setError("Masukkan password saat ini untuk verifikasi keamanan.");
      return;
    }

    if (newPassword.length < 8) {
      setError("Password baru minimal 8 karakter.");
      return;
    }

    if (newPassword.length > 72) {
      setError("Password maksimal 72 karakter.");
      return;
    }

    if (newPassword !== confirmPassword) {
      setError("Konfirmasi password tidak cocok.");
      return;
    }

    setSaving(true);

    try {
      // Re-authenticate before changing sensitive account credentials.
      const { error: verifyError } = await supabase.auth.signInWithPassword({
        email,
        password: currentPassword,
      });

      if (verifyError) {
        throw new Error("Password saat ini tidak benar. Periksa kembali.");
      }

      const { error: updateError } = await supabase.auth.updateUser({
        password: newPassword,
      });

      if (updateError) {
        throw updateError;
      }

      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      setShowCurrentPassword(false);
      setShowPassword(false);
      setShowConfirmPassword(false);

      setSuccess("Password berhasil diperbarui.");
    } catch (err) {
      console.error("Password update error:", err);

      setError(
        err instanceof Error
          ? err.message
          : "Gagal memperbarui password. Silakan coba lagi."
      );
    } finally {
      setSaving(false);
    }
  }

  async function handleLogout() {
    await supabase.auth.signOut();
    router.replace("/login");
  }

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#f7f9fc]">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-[#f7f9fc] text-[#17243b]">
      {/* HEADER */}
      <header className="sticky top-0 z-20 border-b border-slate-200 bg-white/95 backdrop-blur-xl">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-3.5 sm:px-8 sm:py-4">
          <div className="flex items-center gap-3">
            <button
              onClick={() => router.push("/dashboard")}
              className="rounded-xl border border-slate-200 p-2.5 text-slate-500 transition hover:bg-blue-50 hover:text-blue-700"
              aria-label="Back to dashboard"
            >
              <ArrowLeft size={18} />
            </button>

            <div>
              <a
                href="/"
                className="text-lg font-bold tracking-tight"
              >
                DiTap<span className="text-blue-600">Aja.</span>
              </a>
              <p className="text-xs text-slate-400">
                Account Settings
              </p>
            </div>
          </div>

          <button
            onClick={handleLogout}
            className="rounded-xl border border-slate-200 px-4 py-2.5 text-xs font-semibold text-slate-500 transition hover:border-red-200 hover:bg-red-50 hover:text-red-600"
          >
            Sign Out
          </button>
        </div>
      </header>

      {/* CONTENT */}
      <div className="mx-auto max-w-5xl px-4 py-6 sm:px-8 sm:py-9">
        {/* BREADCRUMB */}
        <div className="mb-6 flex items-center gap-2 text-xs text-slate-400">
          <button
            onClick={() => router.push("/dashboard")}
            className="transition hover:text-blue-600"
          >
            Dashboard
          </button>

          <span>/</span>

          <span className="font-semibold text-blue-600">
            Account Settings
          </span>
        </div>

        {/* TITLE */}
        <div className="mb-7">
          <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-50 to-indigo-100 text-blue-700 ring-1 ring-blue-100">
            <Settings size={23} />
          </div>

          <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
            Account Settings
          </h1>

          <p className="mt-2 text-sm leading-6 text-slate-500">
            Kelola informasi akun dan keamanan password DiTapAja kamu.
          </p>
        </div>

        <div className="grid items-start gap-5 lg:grid-cols-[0.85fr_1.15fr]">
          {/* ACCOUNT INFORMATION */}
          <section className="h-fit rounded-2xl border border-slate-200/90 bg-white p-4 shadow-sm transition-shadow hover:shadow-md sm:p-6">
            <div className="flex items-center gap-3 border-b border-slate-100 pb-5">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
                <UserRound size={19} />
              </div>

              <div>
                <h2 className="font-bold">Account Information</h2>
                <p className="text-xs text-slate-400">
                  Informasi akun kamu
                </p>
              </div>
            </div>

            <div className="mt-6 space-y-5">
              <div>
                <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-slate-400">
                  Full Name
                </p>

                <div className="rounded-xl border border-slate-100 bg-slate-50/80 px-4 py-3.5 text-sm font-semibold">
                  {fullName || "Belum diatur"}
                </div>
              </div>

              <div>
                <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-slate-400">
                  Email Address
                </p>

                <div className="flex items-center gap-3 rounded-xl border border-slate-100 bg-slate-50/80 px-4 py-3.5">
                  <Mail size={16} className="text-slate-400" />
                  <span className="break-all text-sm font-semibold">
                    {email}
                  </span>
                </div>
              </div>

              <div className="flex items-start gap-3 rounded-xl border border-blue-100 bg-blue-50 p-4">
                <ShieldCheck
                  size={19}
                  className="mt-0.5 shrink-0 text-blue-600"
                />

                <p className="text-xs leading-5 text-blue-800">
                  Akun kamu dilindungi oleh Supabase Authentication.
                  Gunakan password yang kuat dan jangan bagikan
                  informasi login kepada orang lain.
                </p>
              </div>
            </div>
          </section>

          {/* CHANGE PASSWORD */}
          <section className="rounded-2xl border border-slate-200/90 bg-white p-4 shadow-sm transition-shadow hover:shadow-md sm:p-7">
            <div className="flex items-center gap-3 border-b border-slate-100 pb-5">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600">
                <KeyRound size={19} />
              </div>

              <div>
                <h2 className="font-bold">Change Password</h2>
                <p className="text-xs text-slate-400">
                  Perbarui password akun kamu
                </p>
              </div>
            </div>

            <form
              onSubmit={handleChangePassword}
              className="mt-6 space-y-5"
            >
              {/* CURRENT PASSWORD */}
              <div>
                <label
                  htmlFor="currentPassword"
                  className="mb-2 block text-sm font-semibold text-slate-700"
                >
                  Current Password
                </label>
                <div className="relative">
                  <LockKeyhole
                    size={17}
                    className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
                  />
                  <input
                    id="currentPassword"
                    type={showCurrentPassword ? "text" : "password"}
                    value={currentPassword}
                    onChange={(event) => setCurrentPassword(event.target.value)}
                    placeholder="Enter current password"
                    required
                    disabled={saving}
                    autoComplete="current-password"
                    className="w-full rounded-xl border border-slate-200 bg-slate-50/80 py-3.5 pl-11 pr-12 text-sm outline-none transition-all placeholder:text-slate-400 focus:border-blue-400 focus:bg-white focus:ring-4 focus:ring-blue-50 disabled:cursor-not-allowed disabled:opacity-60"
                  />
                  <button
                    type="button"
                    onClick={() => setShowCurrentPassword((current) => !current)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-blue-600"
                    aria-label="Toggle current password visibility"
                  >
                    {showCurrentPassword ? <EyeOff size={17} /> : <Eye size={17} />}
                  </button>
                </div>
                <p className="mt-2 text-xs text-slate-400">
                  Verifikasi password saat ini sebelum menggantinya.
                </p>
              </div>

              {/* NEW PASSWORD */}
              <div>
                <label
                  htmlFor="newPassword"
                  className="mb-2 block text-sm font-semibold text-slate-700"
                >
                  New Password
                </label>

                <div className="relative">
                  <LockKeyhole
                    size={17}
                    className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
                  />

                  <input
                    id="newPassword"
                    type={showPassword ? "text" : "password"}
                    value={newPassword}
                    onChange={(event) =>
                      setNewPassword(event.target.value)
                    }
                    placeholder="Enter new password"
                    minLength={8}
                    maxLength={72}
                    required
                    disabled={saving}
                    autoComplete="new-password"
                    className="w-full rounded-xl border border-slate-200 bg-slate-50/80 py-3.5 pl-11 pr-12 text-sm outline-none transition-all placeholder:text-slate-400 focus:border-blue-400 focus:bg-white focus:ring-4 focus:ring-blue-50 disabled:cursor-not-allowed disabled:opacity-60"
                  />

                  <button
                    type="button"
                    onClick={() =>
                      setShowPassword((current) => !current)
                    }
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-blue-600"
                    aria-label="Toggle password visibility"
                  >
                    {showPassword ? (
                      <EyeOff size={17} />
                    ) : (
                      <Eye size={17} />
                    )}
                  </button>
                </div>

                <p className="mt-2 text-xs text-slate-400">
                  Minimal 8 karakter dan maksimal 72 karakter.
                </p>
              </div>

              {/* CONFIRM PASSWORD */}
              <div>
                <label
                  htmlFor="confirmPassword"
                  className="mb-2 block text-sm font-semibold text-slate-700"
                >
                  Confirm New Password
                </label>

                <div className="relative">
                  <LockKeyhole
                    size={17}
                    className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
                  />

                  <input
                    id="confirmPassword"
                    type={showConfirmPassword ? "text" : "password"}
                    value={confirmPassword}
                    onChange={(event) =>
                      setConfirmPassword(event.target.value)
                    }
                    placeholder="Confirm new password"
                    minLength={8}
                    maxLength={72}
                    required
                    disabled={saving}
                    autoComplete="new-password"
                    className="w-full rounded-xl border border-slate-200 bg-slate-50/80 py-3.5 pl-11 pr-12 text-sm outline-none transition-all placeholder:text-slate-400 focus:border-blue-400 focus:bg-white focus:ring-4 focus:ring-blue-50 disabled:cursor-not-allowed disabled:opacity-60"
                  />

                  <button
                    type="button"
                    onClick={() =>
                      setShowConfirmPassword((current) => !current)
                    }
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-blue-600"
                    aria-label="Toggle confirmation visibility"
                  >
                    {showConfirmPassword ? (
                      <EyeOff size={17} />
                    ) : (
                      <Eye size={17} />
                    )}
                  </button>
                </div>
              </div>

              {/* ERROR */}
              {error && (
                <div className="flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
                  <AlertCircle
                    size={18}
                    className="mt-0.5 shrink-0"
                  />
                  <p>{error}</p>
                </div>
              )}

              {/* SUCCESS */}
              {success && (
                <div className="flex items-start gap-3 rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-700">
                  <CheckCircle2
                    size={18}
                    className="mt-0.5 shrink-0"
                  />
                  <p>{success}</p>
                </div>
              )}

              <button
                type="submit"
                disabled={saving || !currentPassword || !newPassword || !confirmPassword}
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-blue-600 px-5 py-3.5 text-sm font-semibold text-white shadow-lg shadow-blue-600/20 transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {saving ? (
                  <>
                    <Loader2 size={17} className="animate-spin" />
                    Updating Password...
                  </>
                ) : (
                  <>
                    <LockKeyhole size={17} />
                    Update Password
                  </>
                )}
              </button>
            </form>
          </section>
        </div>

        <footer className="py-10 text-center text-xs text-slate-400">
          DiTapAja · Account Security
        </footer>
      </div>
    </main>
  );
}
