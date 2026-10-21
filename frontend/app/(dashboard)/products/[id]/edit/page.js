"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  ImagePlus,
  Package,
  Save,
  X,
} from "lucide-react";

import { getProduct, updateProduct } from "@/lib/api/products";

const initialForm = {
  name: "",
  sku: "",
  category: "",
  mrp: "",
  wholesalePrice: "",
  retailPrice: "",
  gstPercent: "",
  stock: "",
  minStock: "",
  unit: "pcs",
  tallyItemId: "",
  status: "active",
};

export default function EditProductPage() {
  const params = useParams();
  const router = useRouter();

  const productId = params.id;

  const [form, setForm] = useState(initialForm);
  const [existingImages, setExistingImages] = useState([]);
  const [newImages, setNewImages] = useState([]);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!productId) return;

    loadProduct();
  }, [productId]);

  async function loadProduct() {
    try {
      setLoading(true);
      setError("");

      const response = await getProduct(productId);

      const product =
        response?.product ||
        response?.data ||
        response;

      setForm({
        name: product.name || "",
        sku: product.sku || "",
        category: product.category || "",
        mrp: product.mrp ?? "",
        wholesalePrice:
          product.wholesalePrice ?? "",
        retailPrice:
          product.retailPrice ?? "",
        gstPercent:
          product.gstPercent ?? "",
        stock: product.stock ?? "",
        minStock: product.minStock ?? "",
        unit: product.unit || "pcs",
        tallyItemId:
          product.tallyItemId || "",
        status: product.status || "active",
      });

      setExistingImages(
        Array.isArray(product.images)
          ? product.images
          : []
      );
    } catch (err) {
      setError(
        err.message || "Failed to load product."
      );
    } finally {
      setLoading(false);
    }
  }

  function handleChange(e) {
    const { name, value } = e.target;

    setForm((current) => ({
      ...current,
      [name]: value,
    }));
  }

  function handleNewImages(e) {
    const files = Array.from(e.target.files || []);

    setNewImages((current) => [
      ...current,
      ...files,
    ]);
  }

  function removeNewImage(index) {
    setNewImages((current) =>
      current.filter(
        (_, imageIndex) => imageIndex !== index
      )
    );
  }

  function removeExistingImage(index) {
    setExistingImages((current) =>
      current.filter(
        (_, imageIndex) => imageIndex !== index
      )
    );
  }

  async function handleSubmit(e) {
    e.preventDefault();

    setError("");

    if (!form.name.trim() || !form.sku.trim()) {
      setError("Product name and SKU are required.");
      return;
    }

    try {
      setSaving(true);
      const formData = new FormData();

      Object.entries(form).forEach(([key, value]) => {
        formData.append(key, String(value ?? ""));
      });
      newImages.forEach((file) => formData.append("images", file));

      await updateProduct(productId, formData);
      router.push("/products");
      router.refresh();
    } catch (err) {
      setError(err?.message || "Failed to update product.");
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-7 w-48 animate-pulse rounded bg-gray-100" />
        <div className="h-96 animate-pulse rounded-xl border border-gray-200 bg-white" />
        <div className="h-64 animate-pulse rounded-xl border border-gray-200 bg-white" />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Link
          href="/products"
          className="flex h-9 w-9 items-center justify-center rounded-lg border border-gray-200 text-gray-500 transition hover:bg-gray-50 hover:text-black"
        >
          <ArrowLeft size={17} />
        </Link>

        <div>
          <h2 className="text-xl font-semibold tracking-tight text-black">
            Edit Product
          </h2>

          <p className="mt-1 text-sm text-gray-500">
            Update product information and inventory settings.
          </p>
        </div>
      </div>

      {error && (
        <div className="rounded-lg border border-amber-100 bg-amber-50 px-4 py-3 text-sm text-amber-700">
          {error}
        </div>
      )}

      <form
        onSubmit={handleSubmit}
        className="space-y-5"
      >
        {/* Basic */}
        <section className="rounded-xl border border-gray-200 bg-white">
          <SectionHeader
            icon={Package}
            title="Basic Information"
            description="Product identification and category details."
          />

          <div className="grid grid-cols-1 gap-5 p-5 md:grid-cols-2">
            <Field
              label="Product Name"
              name="name"
              value={form.name}
              onChange={handleChange}
              required
            />

            <Field
              label="SKU"
              name="sku"
              value={form.sku}
              onChange={handleChange}
              required
            />

            <Field
              label="Category"
              name="category"
              value={form.category}
              onChange={handleChange}
              required
            />

            <SelectField
              label="Unit"
              name="unit"
              value={form.unit}
              onChange={handleChange}
              options={[
                {
                  value: "pcs",
                  label: "Pieces (pcs)",
                },
                {
                  value: "kg",
                  label: "Kilogram (kg)",
                },
                {
                  value: "box",
                  label: "Box",
                },
              ]}
            />
          </div>
        </section>

        {/* Pricing */}
        <section className="rounded-xl border border-gray-200 bg-white">
          <SectionHeader
            title="Pricing"
            description="Set your MRP and selling prices."
          />

          <div className="grid grid-cols-1 gap-5 p-5 md:grid-cols-3">
            <NumberField
              label="MRP"
              name="mrp"
              value={form.mrp}
              onChange={handleChange}
            />

            <NumberField
              label="Wholesale Price"
              name="wholesalePrice"
              value={form.wholesalePrice}
              onChange={handleChange}
              required
            />

            <NumberField
              label="Retail Price"
              name="retailPrice"
              value={form.retailPrice}
              onChange={handleChange}
            />

            <NumberField
              label="GST %"
              name="gstPercent"
              value={form.gstPercent}
              onChange={handleChange}
              min="0"
              max="100"
              step="0.01"
            />
          </div>
        </section>

        {/* Stock */}
        <section className="rounded-xl border border-gray-200 bg-white">
          <SectionHeader
            title="Stock"
            description="Set the current inventory and low-stock threshold."
          />

          <div className="grid grid-cols-1 gap-5 p-5 md:grid-cols-2">
            <NumberField
              label="Current Stock"
              name="stock"
              value={form.stock}
              onChange={handleChange}
              min="0"
            />

            <NumberField
              label="Minimum Stock Alert"
              name="minStock"
              value={form.minStock}
              onChange={handleChange}
              min="0"
            />
          </div>
        </section>

        {/* Images */}
        <section className="rounded-xl border border-gray-200 bg-white">
          <SectionHeader
            icon={ImagePlus}
            title="Product Images"
            description="Manage product images."
          />

          <div className="p-5">
            {existingImages.length > 0 && (
              <>
                <p className="mb-3 text-xs font-medium text-gray-500">
                  Current Images
                </p>

                <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                  {existingImages.map(
                    (image, index) => (
                      <div
                        key={`${image}-${index}`}
                        className="group relative aspect-square overflow-hidden rounded-lg border border-gray-200 bg-gray-100"
                      >
                        <img
                          src={
                            typeof image === "string"
                              ? image
                              : image.url
                          }
                          alt={form.name}
                          className="h-full w-full object-cover"
                        />

                        <button
                          type="button"
                          onClick={() =>
                            removeExistingImage(
                              index
                            )
                          }
                          className="absolute right-2 top-2 flex h-7 w-7 items-center justify-center rounded-full bg-black/70 text-white opacity-0 transition group-hover:opacity-100"
                        >
                          <X size={14} />
                        </button>
                      </div>
                    )
                  )}
                </div>
              </>
            )}

            <label className="mt-4 flex min-h-[120px] cursor-pointer flex-col items-center justify-center rounded-xl border border-dashed border-gray-300 bg-gray-50/50 transition hover:border-gray-400 hover:bg-gray-50">
              <ImagePlus
                size={18}
                className="text-gray-500"
              />

              <p className="mt-2 text-sm font-medium text-gray-700">
                Add new images
              </p>

              <input
                type="file"
                accept="image/*"
                multiple
                onChange={handleNewImages}
                className="hidden"
              />
            </label>

            {newImages.length > 0 && (
              <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
                {newImages.map((file, index) => (
                  <div
                    key={`${file.name}-${index}`}
                    className="group relative aspect-square overflow-hidden rounded-lg border border-gray-200"
                  >
                    <img
                      src={URL.createObjectURL(file)}
                      alt={file.name}
                      className="h-full w-full object-cover"
                    />

                    <button
                      type="button"
                      onClick={() =>
                        removeNewImage(index)
                      }
                      className="absolute right-2 top-2 flex h-7 w-7 items-center justify-center rounded-full bg-black/70 text-white"
                    >
                      <X size={14} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </section>

        {/* Settings */}
        <section className="rounded-xl border border-gray-200 bg-white">
          <SectionHeader
            title="Additional Settings"
            description="Optional product configuration."
          />

          <div className="grid grid-cols-1 gap-5 p-5 md:grid-cols-2">
            <Field
              label="Tally Item ID"
              name="tallyItemId"
              value={form.tallyItemId}
              onChange={handleChange}
            />

            <SelectField
              label="Status"
              name="status"
              value={form.status}
              onChange={handleChange}
              options={[
                {
                  value: "active",
                  label: "Active",
                },
                {
                  value: "inactive",
                  label: "Inactive",
                },
              ]}
            />
          </div>
        </section>

        {/* Actions */}
        <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
          <Link
            href="/products"
            className="inline-flex h-10 items-center justify-center rounded-lg border border-gray-200 px-5 text-sm font-medium text-gray-600 transition hover:bg-gray-50 hover:text-black"
          >
            Cancel
          </Link>

          <button
            type="submit"
            disabled={saving}
            className="inline-flex h-10 items-center justify-center gap-2 rounded-lg bg-black px-5 text-sm font-medium text-white transition hover:bg-gray-800 disabled:opacity-60"
          >
            <Save size={15} />
            {saving
              ? "Saving..."
              : "Save Changes"}
          </button>
        </div>
      </form>
    </div>
  );
}

function SectionHeader({
  icon: Icon,
  title,
  description,
}) {
  return (
    <div className="flex items-center gap-3 border-b border-gray-100 px-5 py-4">
      {Icon && (
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gray-100">
          <Icon size={17} className="text-gray-500" />
        </div>
      )}

      <div>
        <h3 className="text-sm font-semibold text-gray-800">
          {title}
        </h3>

        <p className="mt-0.5 text-xs text-gray-400">
          {description}
        </p>
      </div>
    </div>
  );
}

function Field({
  label,
  required,
  ...props
}) {
  return (
    <div>
      <label className="mb-1.5 block text-xs font-medium text-gray-600">
        {label}
        {required && (
          <span className="ml-1 text-red-500">*</span>
        )}
      </label>

      <input
        {...props}
        className="h-10 w-full rounded-lg border border-gray-200 bg-gray-50 px-3 text-sm text-gray-700 outline-none transition placeholder:text-gray-400 focus:border-gray-400 focus:bg-white"
      />
    </div>
  );
}

function NumberField({
  label,
  required,
  ...props
}) {
  return (
    <div>
      <label className="mb-1.5 block text-xs font-medium text-gray-600">
        {label}
        {required && (
          <span className="ml-1 text-red-500">*</span>
        )}
      </label>

      <input
        type="number"
        {...props}
        className="h-10 w-full rounded-lg border border-gray-200 bg-gray-50 px-3 text-sm text-gray-700 outline-none transition placeholder:text-gray-400 focus:border-gray-400 focus:bg-white"
      />
    </div>
  );
}

function SelectField({
  label,
  options,
  ...props
}) {
  return (
    <div>
      <label className="mb-1.5 block text-xs font-medium text-gray-600">
        {label}
      </label>

      <select
        {...props}
        className="h-10 w-full rounded-lg border border-gray-200 bg-gray-50 px-3 text-sm text-gray-700 outline-none transition focus:border-gray-400 focus:bg-white"
      >
        {options.map((option) => (
          <option
            key={option.value}
            value={option.value}
          >
            {option.label}
          </option>
        ))}
      </select>
    </div>
  );
}