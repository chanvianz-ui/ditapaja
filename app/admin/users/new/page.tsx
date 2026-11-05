
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  UserPlus,
  UserRound,
  Mail,
  LockKeyhole,
  Eye,
  EyeOff,
  Copy,
  Check,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  Loader2,
} from "lucide-react";
import { supabase } from "@/lib/supabase";

export default function AddNewUserPage() {
  const router = useRouter();

  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [created, setCreated] = useState(false);
  const [copied, setCopied] = useState(false);

  async function handleCreateUser(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setError("");

    if (!fullName.trim() || !email.trim() || !password) {
      setError("Semua kolom wajib diisi.");
      return;
    }

    if (password.length < 8 || password.length > 72) {
      setError("Password harus terdiri dari 8 sampai 72 karakter.");
      return;
    }

    setLoading(true);

    try {
      const { data: sessionData, error: sessionError } =
        await supabase.auth.getSession();

      if (sessionError || !sessionData.session) {
        router.replace("/login");
        return;
      }

      const response = await fetch("/api/admin/users", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${sessionData.session.access_token}`,
        },
        body: JSON.stringify({
          fullName: fullName.trim(),
          email: email.trim().toLowerCase(),
          password,
        }),
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(
          result.error || "Gagal membuat akun pengguna."
        );
      }

      setCreated(true);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Terjadi kesalahan saat membuat akun."
      );
    } finally {
      setLoading(false);
    }
  }

  async function handleCopyCredentials() {
    const credentials = [
      "DiTapAja - Informasi Login",
      `Nama: ${fullName}`,
      `Email: ${email.trim().toLowerCase()}`,
      `Password sementara: ${password}`,
      "",
      "Silakan login dan ganti password setelah masuk.",
      "Login: https://ditapaja.vercel.app/login",
    ].join("\n");

    try {
      await navigator.clipboard.writeText(credentials);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch {
      setError("Gagal menyalin. Silakan salin informasi secara manual.");
    }
  }

  return (
    <main className="min-h-screen bg-[#f5f7fb] text-[#17243b]">
      {/* HEADER */}
      <header className="sticky top-0 z-20 border-b border-slate-200 bg-white/95 backdrop-blur-xl">
        <div className="mx-auto flex max-w-[1100px] items-center justify-between px-5 py-4 sm:px-8">
          <div className="flex items-center gap-3">
            <button
              onClick={() => router.push("/admin/users")}
              className="rounded-xl border border-slate-200 p-2.5 text-slate-500 transition hover:bg-blue-50 hover:text-[#155eef]"
              aria-label="Back to users"
            >
              <ArrowLeft size={18} />
            </button>

            <div>
              <h1 className="text-lg font-bold tracking-tight">
                DiTapAja
              </h1>
              <p className="text-xs text-slate-400">
                Admin Control Center
              </p>
            </div>
          </div>

          <div className="hidden items-center gap-2 rounded-full bg-blue-50 px-3 py-2 text-xs font-semibold text-[#155eef] sm:flex">
            <ShieldCheck size={15} />
            Super Admin
          </div>
        </div>
      </header>

      {/* CONTENT */}
      <div className="mx-auto max-w-[760px] px-5 py-8 sm:px-8 sm:py-12">
        {/* BREADCRUMB */}
        <div className="mb-6 flex items-center gap-2 text-xs text-slate-400">
          <button
            onClick={() => router.push("/admin")}
            className="transition hover:text-[#155eef]"
          >
            Admin Overview
          </button>

          <span>/</span>

          <button
            onClick={() => router.push("/admin/users")}
            className="transition hover:text-[#155eef]"
          >
            Users
          </button>

          <span>/</span>

          <span className="font-semibold text-[#155eef]">
            Add New User
          </span>
        </div>

        {created ? (
          /* SUCCESS STATE */
          <section className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
            <div className="px-6 py-10 text-center sm:px-10">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600">
                <CheckCircle2 size={34} />
              </div>

              <h2 className="mt-5 text-2xl font-bold tracking-tight">
                Account Created!
              </h2>

              <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-500">
                Akun pengguna berhasil dibuat. Simpan informasi login
                berikut dan berikan kepada pengguna.
              </p>

              <div className="mt-8 rounded-2xl border border-slate-200 bg-slate-50 p-5 text-left">
                <p className="mb-4 text-xs font-bold uppercase tracking-wider text-slate-400">
                  Login Credentials
                </p>

                <div className="space-y-4">
                  <div>
                    <p className="text-xs text-slate-400">Full Name</p>
                    <p className="mt-1 text-sm font-semibold">
                      {fullName}
                    </p>
                  </div>

                  <div>
                    <p className="text-xs text-slate-400">Email</p>
                    <p className="mt-1 break-all text-sm font-semibold">
                      {email.trim().toLowerCase()}
                    </p>
                  </div>

                  <div>
                    <p className="text-xs text-slate-400">
                      Temporary Password
                    </p>
                    <p className="mt-1 break-all font-mono text-sm font-semibold">
                      {password}
                    </p>
                  </div>
                </div>
              </div>

              <div className="mt-5 flex items-start gap-3 rounded-xl border border-amber-200 bg-amber-50 p-4 text-left">
                <AlertCircle
                  size={18}
                  className="mt-0.5 shrink-0 text-amber-600"
                />
                <p className="text-xs leading-5 text-amber-800">
                  Password ini adalah password sementara yang kamu
                  tentukan. Pengguna dapat menggantinya setelah login.
                  Jangan membagikan informasi ini kepada orang lain.
                </p>
              </div>

              <button
                onClick={handleCopyCredentials}
                className="mt-6 flex w-full items-center justify-center gap-2 rounded-xl bg-[#155eef] px-5 py-3.5 text-sm font-semibold text-white transition hover:bg-blue-700"
              >
                {copied ? <Check size={17} /> : <Copy size={17} />}
                {copied ? "Credentials Copied" : "Copy Credentials"}
              </button>

              <button
                onClick={() => router.push("/admin/users")}
                className="mt-3 w-full rounded-xl border border-slate-200 bg-white px-5 py-3.5 text-sm font-semibold text-slate-600 transition hover:bg-slate-50"
              >
                Back to User Management
              </button>
            </div>
          </section>
        ) : (
          <>
            {/* PAGE TITLE */}
            <div className="mb-7">
              <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-50 text-[#155eef]">
                <UserPlus size={23} />
              </div>

              <span className="text-xs font-bold uppercase tracking-wider text-[#155eef]">
                User Management
              </span>

              <h2 className="mt-2 text-2xl font-bold tracking-tight sm:text-3xl">
                Add New User
              </h2>

              <p className="mt-2 text-sm leading-6 text-slate-500">
                Create a new DiTapAja account and assign temporary
                login credentials.
              </p>
            </div>

            {/* FORM */}
            <form
              onSubmit={handleCreateUser}
              className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8"
            >
              <div className="mb-7 flex items-center justify-between border-b border-slate-100 pb-5">
                <div>
                  <h3 className="font-bold">Account Information</h3>
                  <p className="mt-1 text-xs text-slate-400">
                    Enter the user's account details.
                  </p>
                </div>

                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-[#155eef]">
                  <UserRound size={19} />
                </div>
              </div>

              {/* FULL NAME */}
              <div className="mb-5">
                <label
                  htmlFor="fullName"
                  className="mb-2 block text-sm font-semibold text-slate-700"
                >
                  Full Name
                </label>

                <div className="relative">
                  <UserRound
                    size={17}
                    className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
                  />

                  <input
                    id="fullName"
                    type="text"
                    value={fullName}
                    onChange={(event) =>
                      setFullName(event.target.value)
                    }
                    placeholder="Enter full name"
                    maxLength={100}
                    required
                    disabled={loading}
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 py-3.5 pl-11 pr-4 text-sm outline-none transition placeholder:text-slate-400 focus:border-blue-400 focus:bg-white focus:ring-4 focus:ring-blue-50 disabled:opacity-60"
                  />
                </div>
              </div>

              {/* EMAIL */}
              <div className="mb-5">
                <label
                  htmlFor="email"
                  className="mb-2 block text-sm font-semibold text-slate-700"
                >
                  Email Address
                </label>

                <div className="relative">
                  <Mail
                    size={17}
                    className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
                  />

                  <input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(event) =>
                      setEmail(event.target.value)
                    }
                    placeholder="user@example.com"
                    required
                    disabled={loading}
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 py-3.5 pl-11 pr-4 text-sm outline-none transition placeholder:text-slate-400 focus:border-blue-400 focus:bg-white focus:ring-4 focus:ring-blue-50 disabled:opacity-60"
                  />
                </div>
              </div>

              {/* PASSWORD */}
              <div className="mb-6">
                <label
                  htmlFor="password"
                  className="mb-2 block text-sm font-semibold text-slate-700"
                >
                  Temporary Password
                </label>

                <div className="relative">
                  <LockKeyhole
                    size={17}
                    className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
                  />

                  <input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(event) =>
                      setPassword(event.target.value)
                    }
                    placeholder="Minimum 8 characters"
                    minLength={8}
                    maxLength={72}
                    required
                    disabled={loading}
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 py-3.5 pl-11 pr-12 text-sm outline-none transition placeholder:text-slate-400 focus:border-blue-400 focus:bg-white focus:ring-4 focus:ring-blue-50 disabled:opacity-60"
                  />

                  <button
                    type="button"
                    onClick={() =>
                      setShowPassword((current) => !current)
                    }
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 transition hover:text-[#155eef]"
                    aria-label={
                      showPassword ? "Hide password" : "Show password"
                    }
                  >
                    {showPassword ? (
                      <EyeOff size={17} />
                    ) : (
                      <Eye size={17} />
                    )}
                  </button>
                </div>

                <p className="mt-2 text-xs text-slate-400">
                  Password must contain 8–72 characters.
                </p>
              </div>

              {/* INFO */}
              <div className="mb-6 flex items-start gap-3 rounded-xl border border-blue-100 bg-blue-50 p-4">
                <ShieldCheck
                  size={18}
                  className="mt-0.5 shrink-0 text-[#155eef]"
                />

                <p className="text-xs leading-5 text-blue-800">
                  Akun akan dibuat oleh Super Admin dan email akan
                  otomatis terverifikasi. Berikan kredensial login
                  kepada pengguna melalui jalur yang aman.
                </p>
              </div>

              {/* ERROR */}
              {error && (
                <div className="mb-5 flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
                  <AlertCircle
                    size={18}
                    className="mt-0.5 shrink-0"
                  />
                  <p>{error}</p>
                </div>
              )}

              {/* ACTIONS */}
              <div className="flex flex-col-reverse gap-3 sm:flex-row">
                <button
                  type="button"
                  onClick={() => router.push("/admin/users")}
                  disabled={loading}
                  className="flex-1 rounded-xl border border-slate-200 px-5 py-3.5 text-sm font-semibold text-slate-600 transition hover:bg-slate-50 disabled:opacity-50"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={loading}
                  className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-[#155eef] px-5 py-3.5 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {loading ? (
                    <>
                      <Loader2 size={17} className="animate-spin" />
                      Creating Account...
                    </>
                  ) : (
                    <>
                      <UserPlus size={17} />
                      Create Account
                    </>
                  )}
                </button>
              </div>
            </form>
          </>
        )}

        <footer className="py-8 text-center text-xs text-slate-400">
          DiTapAja Admin Control Center · Tap. Review. Grow.
        </footer>
      </div>
    </main>
  );
}
