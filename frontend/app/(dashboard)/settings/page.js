"use client";

import { useEffect, useState } from "react";
import {
  AlertCircle,
  Check,
  ChevronDown,
  CreditCard,
  Eye,
  EyeOff,
  FileText,
  Globe,
  Loader2,
  MessageCircle,
  RefreshCw,
  Save,
  Settings as SettingsIcon,
  ShieldCheck,
  Wallet,
} from "lucide-react";

import {
  getSettings,
  updateSettings,
  getDefaultSettings,
} from "@/lib/api/settings";

import { getCurrentCompany } from "@/lib/api/auth";

const LANGUAGES = [
  {
    value: "English",
    label: "English",
  },
  {
    value: "Hindi",
    label: "हिन्दी",
  },
  {
    value: "Marathi",
    label: "मराठी",
  },
];

function Toggle({
  checked,
  onChange,
  disabled = false,
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      disabled={disabled}
      onClick={() => onChange(!checked)}
      className={`relative h-6 w-11 shrink-0 rounded-full transition ${
        checked
          ? "bg-black"
          : "bg-gray-200"
      } ${
        disabled
          ? "cursor-not-allowed opacity-50"
          : ""
      }`}
    >
      <span
        className={`absolute top-1 h-4 w-4 rounded-full bg-white shadow-sm transition ${
          checked
            ? "left-6"
            : "left-1"
        }`}
      />
    </button>
  );
}

function PasswordField({
  label,
  value,
  onChange,
  placeholder,
  description,
}) {
  const [visible, setVisible] =
    useState(false);

  return (
    <div>
      <label className="mb-2 block text-xs font-medium text-gray-700">
        {label}
      </label>

      <div className="relative">
        <input
          type={visible ? "text" : "password"}
          value={value}
          onChange={(event) =>
            onChange(event.target.value)
          }
          placeholder={placeholder}
          className="h-10 w-full rounded-lg border border-gray-200 bg-gray-50 px-3 pr-10 text-xs text-black outline-none transition placeholder:text-gray-400 focus:border-gray-400 focus:bg-white"
        />

        <button
          type="button"
          onClick={() =>
            setVisible((current) => !current)
          }
          className="absolute right-2 top-1/2 flex h-7 w-7 -translate-y-1/2 items-center justify-center rounded-md text-gray-400 hover:bg-gray-100 hover:text-gray-700"
          aria-label={
            visible
              ? "Hide value"
              : "Show value"
          }
        >
          {visible ? (
            <EyeOff size={14} />
          ) : (
            <Eye size={14} />
          )}
        </button>
      </div>

      {description && (
        <p className="mt-1.5 text-[10px] leading-4 text-gray-400">
          {description}
        </p>
      )}
    </div>
  );
}

export default function SettingsPage() {
  const [settings, setSettings] =
    useState(getDefaultSettings());

  const [company, setCompany] =
    useState(null);

  const [loading, setLoading] =
    useState(true);

  const [saving, setSaving] =
    useState(false);

  const [saved, setSaved] =
    useState(false);

  const [error, setError] =
    useState("");

  async function loadSettings() {
    try {
      setLoading(true);
      setError("");

      const currentCompany =
        getCurrentCompany();

      setCompany(currentCompany);

      const data = await getSettings();

      setSettings({
        ...getDefaultSettings(),
        ...data,
        creditPolicy: {
          ...getDefaultSettings()
            .creditPolicy,
          ...(data?.creditPolicy || {}),
        },
      });
    } catch (err) {
      setError(
        err?.message ||
          "Unable to load settings."
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadSettings();
  }, []);

  function updateField(field, value) {
    setSettings((current) => ({
      ...current,
      [field]: value,
    }));

    setSaved(false);
  }

  function updateCreditPolicy(
    field,
    value
  ) {
    setSettings((current) => ({
      ...current,
      creditPolicy: {
        ...current.creditPolicy,
        [field]: value,
      },
    }));

    setSaved(false);
  }

  async function handleSave(event) {
    event.preventDefault();

    setError("");
    setSaved(false);

    if (
      settings.creditPolicy
        .defaultCreditDays < 0
    ) {
      setError(
        "Credit days cannot be negative."
      );
      return;
    }

    if (
      settings.creditPolicy
        .warningDaysBeforeDue < 0
    ) {
      setError(
        "Warning days cannot be negative."
      );
      return;
    }

    try {
      setSaving(true);

      await updateSettings(settings);

      setSaved(true);

      setTimeout(() => {
        setSaved(false);
      }, 3000);
    } catch (err) {
      setError(
        err?.message ||
          "Unable to save settings."
      );
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="flex items-center gap-2 text-xs text-gray-400">
          <Loader2
            size={16}
            className="animate-spin"
          />
          Loading settings...
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-[10px] font-medium uppercase tracking-[0.14em] text-gray-400">
            Configuration
          </p>

          <h1 className="mt-1 text-xl font-semibold tracking-tight text-black">
            Settings
          </h1>

          <p className="mt-1 text-sm text-gray-500">
            Manage your company, payments,
            integrations and credit policy.
          </p>
        </div>

        <button
          type="button"
          onClick={loadSettings}
          disabled={loading || saving}
          className="inline-flex h-9 items-center justify-center gap-2 self-start rounded-lg border border-gray-200 bg-white px-3 text-[10px] font-medium text-gray-500 transition hover:bg-gray-50 hover:text-black disabled:opacity-50 sm:self-auto"
        >
          <RefreshCw
            size={13}
            className={
              loading
                ? "animate-spin"
                : ""
            }
          />
          Reload
        </button>
      </div>

      {/* Alerts */}
      {error && (
        <div className="flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-xs text-red-600">
          <AlertCircle
            size={16}
            className="mt-0.5 shrink-0"
          />

          <div>
            <p className="font-medium">
              Something went wrong
            </p>

            <p className="mt-0.5">
              {error}
            </p>
          </div>
        </div>
      )}

      {saved && (
        <div className="flex items-center gap-3 rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-xs text-green-600">
          <Check size={16} />

          <p>
            Settings saved successfully.
          </p>
        </div>
      )}

      <form
        onSubmit={handleSave}
        className="space-y-5"
      >
        {/* Company */}
        <section className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
          <div className="border-b border-gray-100 px-5 py-4">
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gray-100 text-gray-600">
                <SettingsIcon size={17} />
              </div>

              <div>
                <h2 className="text-sm font-semibold text-black">
                  Company Information
                </h2>

                <p className="mt-0.5 text-xs text-gray-400">
                  Basic details for your wholesaler
                  account.
                </p>
              </div>
            </div>
          </div>

          <div className="grid gap-5 p-5 md:grid-cols-2">
            <div>
              <label className="mb-2 block text-xs font-medium text-gray-700">
                Company Name
              </label>

              <input
                type="text"
                value={
                  company?.name || ""
                }
                readOnly
                placeholder="Company name"
                className="h-10 w-full rounded-lg border border-gray-200 bg-gray-100 px-3 text-xs text-gray-600 outline-none"
              />

              <p className="mt-1.5 text-[10px] text-gray-400">
                Company name is managed through your
                account.
              </p>
            </div>

            <div>
              <label className="mb-2 block text-xs font-medium text-gray-700">
                Owner Email
              </label>

              <input
                type="email"
                value={
                  company?.ownerEmail || ""
                }
                readOnly
                placeholder="owner@example.com"
                className="h-10 w-full rounded-lg border border-gray-200 bg-gray-100 px-3 text-xs text-gray-600 outline-none"
              />
            </div>

            <div>
              <label className="mb-2 block text-xs font-medium text-gray-700">
                GST Number
              </label>

              <div className="relative">
                <FileText
                  size={14}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                />

                <input
                  type="text"
                  value={settings.gstNo}
                  onChange={(event) =>
                    updateField(
                      "gstNo",
                      event.target.value.toUpperCase()
                    )
                  }
                  placeholder="e.g. 27ABCDE1234F1Z5"
                  className="h-10 w-full rounded-lg border border-gray-200 bg-gray-50 pl-9 pr-3 text-xs uppercase text-black outline-none transition placeholder:normal-case placeholder:text-gray-400 focus:border-gray-400 focus:bg-white"
                />
              </div>
            </div>

            <div>
              <label className="mb-2 block text-xs font-medium text-gray-700">
                Language
              </label>

              <div className="relative">
                <Globe
                  size={14}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                />

                <select
                  value={settings.language}
                  onChange={(event) =>
                    updateField(
                      "language",
                      event.target.value
                    )
                  }
                  className="h-10 w-full appearance-none rounded-lg border border-gray-200 bg-gray-50 pl-9 pr-9 text-xs text-black outline-none transition focus:border-gray-400 focus:bg-white"
                >
                  {LANGUAGES.map(
                    (language) => (
                      <option
                        key={
                          language.value
                        }
                        value={
                          language.value
                        }
                      >
                        {language.label}
                      </option>
                    )
                  )}
                </select>

                <ChevronDown
                  size={14}
                  className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-gray-400"
                />
              </div>

              <p className="mt-1.5 text-[10px] text-gray-400">
                Choose the language used by the
                application.
              </p>
            </div>
          </div>
        </section>

        {/* Payment */}
        <section className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
          <div className="border-b border-gray-100 px-5 py-4">
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gray-100 text-gray-600">
                <Wallet size={17} />
              </div>

              <div>
                <h2 className="text-sm font-semibold text-black">
                  Payment Settings
                </h2>

                <p className="mt-0.5 text-xs text-gray-400">
                  Configure payment information used
                  for customer orders.
                </p>
              </div>
            </div>
          </div>

          <div className="grid gap-5 p-5 md:grid-cols-2">
            <div>
              <label className="mb-2 block text-xs font-medium text-gray-700">
                UPI ID
              </label>

              <div className="relative">
                <CreditCard
                  size={14}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                />

                <input
                  type="text"
                  value={settings.upiId}
                  onChange={(event) =>
                    updateField(
                      "upiId",
                      event.target.value
                    )
                  }
                  placeholder="business@upi"
                  className="h-10 w-full rounded-lg border border-gray-200 bg-gray-50 pl-9 pr-3 text-xs text-black outline-none transition placeholder:text-gray-400 focus:border-gray-400 focus:bg-white"
                />
              </div>

              <p className="mt-1.5 text-[10px] text-gray-400">
                Used when sharing payment details with
                customers.
              </p>
            </div>

            <div>
              <PasswordField
                label="Razorpay Key"
                value={settings.razorpayKey}
                onChange={(value) =>
                  updateField(
                    "razorpayKey",
                    value
                  )
                }
                placeholder="Enter Razorpay key"
                description="Keep payment credentials private."
              />
            </div>
          </div>
        </section>

        {/* WhatsApp */}
        <section className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
          <div className="border-b border-gray-100 px-5 py-4">
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gray-100 text-gray-600">
                <MessageCircle size={17} />
              </div>

              <div>
                <h2 className="text-sm font-semibold text-black">
                  WhatsApp Integration
                </h2>

                <p className="mt-0.5 text-xs text-gray-400">
                  Configure the token used for WhatsApp
                  notifications.
                </p>
              </div>
            </div>
          </div>

          <div className="p-5">
            <div className="max-w-2xl">
              <PasswordField
                label="WhatsApp Token"
                value={
                  settings.whatsappToken
                }
                onChange={(value) =>
                  updateField(
                    "whatsappToken",
                    value
                  )
                }
                placeholder="Enter WhatsApp API token"
                description="This token is used for order confirmations, invoices, credit reminders and low-stock alerts."
              />
            </div>

            <div className="mt-4 flex items-start gap-3 rounded-xl border border-gray-200 bg-gray-50 p-4">
              <ShieldCheck
                size={16}
                className="mt-0.5 shrink-0 text-gray-500"
              />

              <div>
                <p className="text-xs font-medium text-gray-700">
                  Keep your token secure
                </p>

                <p className="mt-1 text-[10px] leading-4 text-gray-400">
                  Do not expose WhatsApp credentials in
                  publicly accessible frontend code.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Tally */}
        <section className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
          <div className="border-b border-gray-100 px-5 py-4">
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gray-100 text-gray-600">
                <RefreshCw size={17} />
              </div>

              <div>
                <h2 className="text-sm font-semibold text-black">
                  Tally Sync
                </h2>

                <p className="mt-0.5 text-xs text-gray-400">
                  Control inventory synchronization with
                  Tally.
                </p>
              </div>
            </div>
          </div>

          <div className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-xs font-medium text-black">
                Enable Tally Sync
              </p>

              <p className="mt-1 max-w-xl text-[10px] leading-4 text-gray-400">
                When enabled, inventory synchronization
                can be used to keep stock information
                aligned with Tally.
              </p>
            </div>

            <Toggle
              checked={settings.tallySync}
              onChange={(value) =>
                updateField(
                  "tallySync",
                  value
                )
              }
            />
          </div>
        </section>

        {/* Credit Policy */}
        <section className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
          <div className="border-b border-gray-100 px-5 py-4">
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gray-100 text-gray-600">
                <ShieldCheck size={17} />
              </div>

              <div>
                <h2 className="text-sm font-semibold text-black">
                  Credit Policy
                </h2>

                <p className="mt-0.5 text-xs text-gray-400">
                  Configure how customer credit is
                  handled.
                </p>
              </div>
            </div>
          </div>

          <div className="space-y-5 p-5">
            {/* Enable */}
            <div className="flex flex-col gap-4 rounded-xl bg-gray-50 p-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-xs font-medium text-black">
                  Allow Credit Sales
                </p>

                <p className="mt-1 text-[10px] leading-4 text-gray-400">
                  Allow customers to place orders using
                  credit.
                </p>
              </div>

              <Toggle
                checked={
                  settings.creditPolicy
                    .enabled
                }
                onChange={(value) =>
                  updateCreditPolicy(
                    "enabled",
                    value
                  )
                }
              />
            </div>

            <div className="grid gap-5 md:grid-cols-2">
              <div>
                <label className="mb-2 block text-xs font-medium text-gray-700">
                  Default Credit Days
                </label>

                <input
                  type="number"
                  min="0"
                  step="1"
                  value={
                    settings.creditPolicy
                      .defaultCreditDays
                  }
                  onChange={(event) =>
                    updateCreditPolicy(
                      "defaultCreditDays",
                      Number(
                        event.target.value
                      )
                    )
                  }
                  className="h-10 w-full rounded-lg border border-gray-200 bg-gray-50 px-3 text-xs text-black outline-none transition focus:border-gray-400 focus:bg-white"
                />

                <p className="mt-1.5 text-[10px] text-gray-400">
                  Default number of days before credit
                  becomes due.
                </p>
              </div>

              <div>
                <label className="mb-2 block text-xs font-medium text-gray-700">
                  Reminder Before Due
                </label>

                <div className="relative">
                  <input
                    type="number"
                    min="0"
                    step="1"
                    value={
                      settings.creditPolicy
                        .warningDaysBeforeDue
                    }
                    onChange={(event) =>
                      updateCreditPolicy(
                        "warningDaysBeforeDue",
                        Number(
                          event.target.value
                        )
                      )
                    }
                    className="h-10 w-full rounded-lg border border-gray-200 bg-gray-50 px-3 pr-14 text-xs text-black outline-none transition focus:border-gray-400 focus:bg-white"
                  />

                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] text-gray-400">
                    days
                  </span>
                </div>

                <p className="mt-1.5 text-[10px] text-gray-400">
                  Number of days before the due date to
                  send a reminder.
                </p>
              </div>
            </div>

            <div className="flex flex-col gap-4 rounded-xl border border-gray-200 p-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-xs font-medium text-black">
                  Allow Orders Above Credit Limit
                </p>

                <p className="mt-1 text-[10px] leading-4 text-gray-400">
                  Allow credit orders even when the
                  customer has reached their configured
                  credit limit.
                </p>
              </div>

              <Toggle
                checked={
                  settings.creditPolicy
                    .allowOverLimit
                }
                onChange={(value) =>
                  updateCreditPolicy(
                    "allowOverLimit",
                    value
                  )
                }
              />
            </div>
          </div>
        </section>

        {/* Save */}
        <div className="sticky bottom-4 z-10 flex flex-col gap-3 rounded-xl border border-gray-200 bg-white/95 p-3 shadow-lg backdrop-blur sm:flex-row sm:items-center sm:justify-between">
          <div className="hidden sm:block">
            <p className="text-xs font-medium text-black">
              Settings
            </p>

            <p className="text-[10px] text-gray-400">
              Save your configuration changes.
            </p>
          </div>

          <div className="flex w-full gap-2 sm:w-auto">
            <button
              type="button"
              onClick={loadSettings}
              disabled={saving}
              className="h-10 flex-1 rounded-lg border border-gray-200 bg-white px-4 text-xs font-medium text-gray-600 transition hover:bg-gray-50 hover:text-black disabled:opacity-50 sm:flex-none"
            >
              Reset
            </button>

            <button
              type="submit"
              disabled={saving}
              className="inline-flex h-10 flex-1 items-center justify-center gap-2 rounded-lg bg-black px-5 text-xs font-medium text-white transition hover:bg-gray-800 disabled:cursor-not-allowed disabled:opacity-50 sm:flex-none"
            >
              {saving ? (
                <>
                  <Loader2
                    size={14}
                    className="animate-spin"
                  />
                  Saving...
                </>
              ) : (
                <>
                  <Save size={14} />
                  Save Changes
                </>
              )}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}