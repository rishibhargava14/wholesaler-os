"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  ArrowRight,
  Check,
  Eye,
  EyeOff,
  Globe,
  Loader2,
  Lock,
  Mail,
  Store,
} from "lucide-react";

import { register } from "@/lib/api/auth";

export default function RegisterPage() {
  const router = useRouter();

  const [form, setForm] =
    useState({
      name: "",
      subdomain: "",
      ownerEmail: "",
      password: "",
      confirmPassword: "",
    });

  const [showPassword, setShowPassword] =
    useState(false);

  const [showConfirmPassword, setShowConfirmPassword] =
    useState(false);

  const [loading, setLoading] =
    useState(false);

  const [error, setError] =
    useState("");

  function updateField(field, value) {
    setForm((current) => ({
      ...current,
      [field]: value,
    }));

    setError("");
  }

  function cleanSubdomain(value) {
    return value
      .toLowerCase()
      .trim()
      .replace(/\s+/g, "-")
      .replace(
        /[^a-z0-9-]/g,
        ""
      );
  }

  async function handleSubmit(event) {
    event.preventDefault();

    setError("");

    const name =
      form.name.trim();

    const subdomain =
      cleanSubdomain(
        form.subdomain
      );

    const ownerEmail =
      form.ownerEmail.trim();

    if (!name) {
      setError(
        "Please enter your company name."
      );
      return;
    }

    if (!subdomain) {
      setError(
        "Please choose a valid store subdomain."
      );
      return;
    }

    if (subdomain.length < 3) {
      setError(
        "Subdomain must contain at least 3 characters."
      );
      return;
    }

    if (!ownerEmail) {
      setError(
        "Please enter the owner email."
      );
      return;
    }

    if (!form.password) {
      setError(
        "Please enter a password."
      );
      return;
    }

    if (form.password.length < 6) {
      setError(
        "Password must contain at least 6 characters."
      );
      return;
    }

    if (
      form.password !==
      form.confirmPassword
    ) {
      setError(
        "Passwords do not match."
      );
      return;
    }

    try {
      setLoading(true);

      await register({
        name,
        subdomain,
        ownerEmail,
        password:
          form.password,
      });

      router.replace(
        "/dashboard"
      );
    } catch (err) {
      setError(
        err?.message ||
          "Unable to create your account."
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-[#f7f7f6]">
      <div className="grid min-h-screen lg:grid-cols-[0.9fr_1.1fr]">
        {/* Left information */}
        <div className="hidden bg-black p-10 text-white lg:flex lg:flex-col lg:justify-between xl:p-14">
          <div>
            <Link
              href="/login"
              className="inline-flex items-center gap-2 text-[10px] text-gray-500 transition hover:text-white"
            >
              <ArrowLeft size={13} />
              Back to sign in
            </Link>

            <div className="mt-16">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white text-black">
                <Store size={18} />
              </div>

              <p className="mt-8 text-[10px] font-medium uppercase tracking-[0.18em] text-gray-500">
                Get started
              </p>

              <h1 className="mt-4 max-w-md text-4xl font-semibold leading-tight tracking-tight">
                Create your wholesale workspace.
              </h1>

              <p className="mt-6 max-w-md text-sm leading-6 text-gray-400">
                Set up your company catalog and start
                managing products, customers, orders and
                stock.
              </p>

              <div className="mt-10 space-y-4">
                {[
                  "Manage your wholesale catalog",
                  "Track customers and outstanding credit",
                  "Create orders and manage stock",
                ].map((item) => (
                  <div
                    key={item}
                    className="flex items-center gap-3"
                  >
                    <div className="flex h-6 w-6 items-center justify-center rounded-full border border-gray-700">
                      <Check
                        size={12}
                        className="text-gray-300"
                      />
                    </div>

                    <span className="text-xs text-gray-400">
                      {item}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <p className="text-[10px] text-gray-600">
            Wholesaler OS · Business workspace
          </p>
        </div>

        {/* Register */}
        <div className="flex items-center justify-center px-5 py-10 sm:px-8 lg:py-14">
          <div className="w-full max-w-lg">
            {/* Mobile branding */}
            <div className="mb-9 flex items-center gap-3 lg:hidden">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-black text-white">
                <Store size={18} />
              </div>

              <div>
                <p className="text-sm font-semibold">
                  Wholesaler OS
                </p>

                <p className="text-[10px] text-gray-400">
                  Create your workspace
                </p>
              </div>
            </div>

            <div>
              <p className="text-[10px] font-medium uppercase tracking-[0.14em] text-gray-400">
                Account setup
              </p>

              <h2 className="mt-2 text-2xl font-semibold tracking-tight">
                Create your account
              </h2>

              <p className="mt-2 text-sm text-gray-500">
                Set up your wholesaler company in a few
                steps.
              </p>
            </div>

            {error && (
              <div className="mt-6 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-xs text-red-600">
                {error}
              </div>
            )}

            <form
              onSubmit={handleSubmit}
              className="mt-8 space-y-5"
            >
              {/* Company name */}
              <div>
                <label className="mb-2 block text-xs font-medium text-gray-700">
                  Company Name
                  <span className="ml-1 text-red-500">
                    *
                  </span>
                </label>

                <div className="relative">
                  <Store
                    size={15}
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                  />

                  <input
                    type="text"
                    value={form.name}
                    onChange={(event) =>
                      updateField(
                        "name",
                        event.target.value
                      )
                    }
                    placeholder="e.g. Demo Wholesale Mart"
                    autoComplete="organization"
                    className="h-11 w-full rounded-xl border border-gray-200 bg-white pl-10 pr-3 text-xs text-black outline-none transition placeholder:text-gray-400 focus:border-gray-400 focus:ring-2 focus:ring-gray-100"
                  />
                </div>
              </div>

              {/* Subdomain */}
              <div>
                <label className="mb-2 block text-xs font-medium text-gray-700">
                  Store Subdomain
                  <span className="ml-1 text-red-500">
                    *
                  </span>
                </label>

                <div className="flex">
                  <div className="relative flex-1">
                    <Globe
                      size={15}
                      className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                    />

                    <input
                      type="text"
                      value={
                        form.subdomain
                      }
                      onChange={(event) =>
                        updateField(
                          "subdomain",
                          cleanSubdomain(
                            event.target
                              .value
                          )
                        )
                      }
                      placeholder="yourstore"
                      autoComplete="off"
                      className="h-11 w-full rounded-l-xl border border-r-0 border-gray-200 bg-white pl-10 pr-3 text-xs text-black outline-none transition placeholder:text-gray-400 focus:border-gray-400 focus:ring-2 focus:ring-gray-100"
                    />
                  </div>

                  <div className="flex h-11 items-center rounded-r-xl border border-gray-200 bg-gray-50 px-3 text-[10px] text-gray-400">
                    .wholesaler
                  </div>
                </div>

                <p className="mt-1.5 text-[10px] text-gray-400">
                  Your public catalog will use this
                  subdomain.
                </p>
              </div>

              {/* Email */}
              <div>
                <label className="mb-2 block text-xs font-medium text-gray-700">
                  Owner Email
                  <span className="ml-1 text-red-500">
                    *
                  </span>
                </label>

                <div className="relative">
                  <Mail
                    size={15}
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                  />

                  <input
                    type="email"
                    value={
                      form.ownerEmail
                    }
                    onChange={(event) =>
                      updateField(
                        "ownerEmail",
                        event.target.value
                      )
                    }
                    placeholder="owner@company.com"
                    autoComplete="email"
                    className="h-11 w-full rounded-xl border border-gray-200 bg-white pl-10 pr-3 text-xs text-black outline-none transition placeholder:text-gray-400 focus:border-gray-400 focus:ring-2 focus:ring-gray-100"
                  />
                </div>
              </div>

              {/* Passwords */}
              <div className="grid gap-5 sm:grid-cols-2">
                <div>
                  <label className="mb-2 block text-xs font-medium text-gray-700">
                    Password
                    <span className="ml-1 text-red-500">
                      *
                    </span>
                  </label>

                  <div className="relative">
                    <Lock
                      size={15}
                      className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                    />

                    <input
                      type={
                        showPassword
                          ? "text"
                          : "password"
                      }
                      value={
                        form.password
                      }
                      onChange={(event) =>
                        updateField(
                          "password",
                          event.target.value
                        )
                      }
                      placeholder="Minimum 6 characters"
                      autoComplete="new-password"
                      className="h-11 w-full rounded-xl border border-gray-200 bg-white pl-10 pr-10 text-xs text-black outline-none transition placeholder:text-gray-400 focus:border-gray-400 focus:ring-2 focus:ring-gray-100"
                    />

                    <button
                      type="button"
                      onClick={() =>
                        setShowPassword(
                          (current) =>
                            !current
                        )
                      }
                      className="absolute right-2 top-1/2 flex h-7 w-7 -translate-y-1/2 items-center justify-center rounded-lg text-gray-400 hover:bg-gray-50 hover:text-black"
                    >
                      {showPassword ? (
                        <EyeOff size={14} />
                      ) : (
                        <Eye size={14} />
                      )}
                    </button>
                  </div>
                </div>

                <div>
                  <label className="mb-2 block text-xs font-medium text-gray-700">
                    Confirm Password
                    <span className="ml-1 text-red-500">
                      *
                    </span>
                  </label>

                  <div className="relative">
                    <Lock
                      size={15}
                      className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                    />

                    <input
                      type={
                        showConfirmPassword
                          ? "text"
                          : "password"
                      }
                      value={
                        form.confirmPassword
                      }
                      onChange={(event) =>
                        updateField(
                          "confirmPassword",
                          event.target.value
                        )
                      }
                      placeholder="Repeat password"
                      autoComplete="new-password"
                      className="h-11 w-full rounded-xl border border-gray-200 bg-white pl-10 pr-10 text-xs text-black outline-none transition placeholder:text-gray-400 focus:border-gray-400 focus:ring-2 focus:ring-gray-100"
                    />

                    <button
                      type="button"
                      onClick={() =>
                        setShowConfirmPassword(
                          (current) =>
                            !current
                        )
                      }
                      className="absolute right-2 top-1/2 flex h-7 w-7 -translate-y-1/2 items-center justify-center rounded-lg text-gray-400 hover:bg-gray-50 hover:text-black"
                    >
                      {showConfirmPassword ? (
                        <EyeOff size={14} />
                      ) : (
                        <Eye size={14} />
                      )}
                    </button>
                  </div>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-black text-xs font-medium text-white transition hover:bg-gray-800 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {loading ? (
                  <>
                    <Loader2
                      size={15}
                      className="animate-spin"
                    />
                    Creating workspace...
                  </>
                ) : (
                  <>
                    Create Workspace
                    <ArrowRight size={14} />
                  </>
                )}
              </button>
            </form>

            <p className="mt-7 text-center text-xs text-gray-500">
              Already have an account?{" "}
              <Link
                href="/login"
                className="font-medium text-black hover:underline"
              >
                Sign in
              </Link>
            </p>
          </div>
        </div>
      </div>
    </main>
  );
}