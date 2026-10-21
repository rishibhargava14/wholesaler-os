"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowLeft, Building2, User, CreditCard } from "lucide-react";
import { useRouter } from "next/navigation";

import { createCustomer } from "@/lib/api/customers";

const initialForm = {
  shopName: "",
  ownerName: "",
  phone: "",
  email: "",
  address: "",
  gstNo: "",
  priceListId: "pl-retail",
  priceListName: "Retail",
  creditLimit: "",
  creditDays: "",
};

function Field({
  label,
  name,
  value,
  onChange,
  placeholder,
  type = "text",
  required = false,
}) {
  return (
    <div>
      <label
        htmlFor={name}
        className="mb-1.5 block text-xs font-medium text-gray-600"
      >
        {label}
        {required && (
          <span className="ml-1 text-red-500">*</span>
        )}
      </label>

      <input
        id={name}
        name={name}
        type={type}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        required={required}
        className="h-10 w-full rounded-lg border border-gray-200 bg-gray-50 px-3 text-sm text-black outline-none transition placeholder:text-gray-400 focus:border-gray-400 focus:bg-white"
      />
    </div>
  );
}

function Section({
  icon: Icon,
  title,
  description,
  children,
}) {
  return (
    <div className="rounded-2xl border border-gray-200 bg-white shadow-sm">
      <div className="border-b border-gray-100 px-5 py-4">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gray-100 text-gray-600">
            <Icon size={17} strokeWidth={1.8} />
          </div>

          <div>
            <h2 className="text-sm font-semibold text-black">
              {title}
            </h2>

            {description && (
              <p className="mt-0.5 text-xs text-gray-400">
                {description}
              </p>
            )}
          </div>
        </div>
      </div>

      <div className="p-5">{children}</div>
    </div>
  );
}

export default function NewCustomerPage() {
  const router = useRouter();

  const [form, setForm] = useState(initialForm);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  function handleChange(event) {
    const { name, value } = event.target;

    setForm((current) => ({
      ...current,
      [name]: value,
    }));
  }

  function handlePriceListChange(event) {
    const value = event.target.value;

    const names = {
      "pl-retail": "Retail",
      "pl-wholesale": "Wholesale",
      "pl-vip": "VIP",
    };

    setForm((current) => ({
      ...current,
      priceListId: value,
      priceListName: names[value] || value,
    }));
  }

  async function handleSubmit(event) {
    event.preventDefault();

    try {
      setSaving(true);
      setError("");

      const data = await createCustomer({
        ...form,
        creditLimit: Number(
          form.creditLimit || 0
        ),
        creditDays: Number(
          form.creditDays || 0
        ),
      });

      const id =
        data?.customer?._id ||
        data?.customer?.id;

      if (id) {
        router.push(`/customers/${id}`);
      } else {
        router.push("/customers");
      }
    } catch (err) {
      setError(
        err?.message ||
          "Unable to create customer."
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      {/* Header */}
      <div className="flex items-start gap-3">
        <Link
          href="/customers"
          className="mt-1 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-gray-200 bg-white text-gray-500 transition hover:bg-gray-50 hover:text-black"
        >
          <ArrowLeft size={17} />
        </Link>

        <div>
          <p className="text-xs font-medium uppercase tracking-[0.14em] text-gray-400">
            Customer Management
          </p>

          <h1 className="mt-1 text-xl font-semibold tracking-tight text-black">
            Add Customer
          </h1>

          <p className="mt-1 text-sm text-gray-500">
            Create a new shop and configure its pricing
            and credit policy.
          </p>
        </div>
      </div>

      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
          {error}
        </div>
      )}

      <form
        onSubmit={handleSubmit}
        className="space-y-5"
      >
        {/* Shop Information */}
        <Section
          icon={Building2}
          title="Shop Information"
          description="Basic details about the customer shop."
        >
          <div className="grid gap-4 sm:grid-cols-2">
            <Field
              label="Shop Name"
              name="shopName"
              value={form.shopName}
              onChange={handleChange}
              placeholder="e.g. Shree Ganesh Kirana"
              required
            />

            <Field
              label="Owner Name"
              name="ownerName"
              value={form.ownerName}
              onChange={handleChange}
              placeholder="e.g. Rajesh Patil"
              required
            />

            <Field
              label="Phone"
              name="phone"
              value={form.phone}
              onChange={handleChange}
              placeholder="10 digit phone number"
              type="tel"
              required
            />

            <Field
              label="Email"
              name="email"
              value={form.email}
              onChange={handleChange}
              placeholder="shop@example.com"
              type="email"
            />

            <div className="sm:col-span-2">
              <label
                htmlFor="address"
                className="mb-1.5 block text-xs font-medium text-gray-600"
              >
                Address
              </label>

              <textarea
                id="address"
                name="address"
                value={form.address}
                onChange={handleChange}
                placeholder="Shop address"
                rows={3}
                className="w-full resize-none rounded-lg border border-gray-200 bg-gray-50 px-3 py-2.5 text-sm text-black outline-none transition placeholder:text-gray-400 focus:border-gray-400 focus:bg-white"
              />
            </div>

            <Field
              label="GST Number"
              name="gstNo"
              value={form.gstNo}
              onChange={handleChange}
              placeholder="GST registration number"
            />
          </div>
        </Section>

        {/* Pricing */}
        <Section
          icon={User}
          title="Pricing"
          description="Choose the price list used for this customer."
        >
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label
                htmlFor="priceListId"
                className="mb-1.5 block text-xs font-medium text-gray-600"
              >
                Price List
                <span className="ml-1 text-red-500">
                  *
                </span>
              </label>

              <select
                id="priceListId"
                value={form.priceListId}
                onChange={handlePriceListChange}
                required
                className="h-10 w-full rounded-lg border border-gray-200 bg-gray-50 px-3 text-sm text-gray-700 outline-none focus:border-gray-400"
              >
                <option value="pl-retail">
                  Retail
                </option>

                <option value="pl-wholesale">
                  Wholesale
                </option>

                <option value="pl-vip">
                  VIP
                </option>
              </select>
            </div>
          </div>
        </Section>

        {/* Credit */}
        <Section
          icon={CreditCard}
          title="Credit Policy"
          description="Set the customer's credit limit and payment period."
        >
          <div className="grid gap-4 sm:grid-cols-2">
            <Field
              label="Credit Limit"
              name="creditLimit"
              value={form.creditLimit}
              onChange={handleChange}
              placeholder="e.g. 50000"
              type="number"
              required
            />

            <Field
              label="Credit Days"
              name="creditDays"
              value={form.creditDays}
              onChange={handleChange}
              placeholder="e.g. 30"
              type="number"
              required
            />
          </div>
        </Section>

        {/* Actions */}
        <div className="flex items-center justify-end gap-3 rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
          <Link
            href="/customers"
            className="inline-flex h-10 items-center justify-center rounded-lg border border-gray-200 px-4 text-sm font-medium text-gray-600 transition hover:bg-gray-50 hover:text-black"
          >
            Cancel
          </Link>

          <button
            type="submit"
            disabled={saving}
            className="inline-flex h-10 items-center justify-center rounded-lg bg-black px-5 text-sm font-medium text-white transition hover:bg-gray-800 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {saving
              ? "Creating..."
              : "Create Customer"}
          </button>
        </div>
      </form>
    </div>
  );
}