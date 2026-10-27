"use client";

import { useActionState, useEffect, useState } from "react";
import { toast } from "sonner";
import { saveProduct } from "@/actions/admin/catalog";
import type { FormResult } from "@/actions/admin/utils";
import { ProductArt } from "@/components/product-art";
import { Field, FormMessage, Input, Select, Textarea } from "@/components/ui/form";
import { Panel } from "@/components/ui/misc";
import { SubmitButton } from "@/components/ui/submit-button";
import { formatINR, rupeesToPaise } from "@/lib/domain/money";

export type ProductFormValues = {
  id?: string;
  name: string;
  slug: string;
  tagline: string;
  description: string;
  categoryId: string;
  price: string;
  format: string;
  licence: "PERSONAL" | "COMMERCIAL";
  licenceSummary: string;
  includes: string;
  fileFormats: string;
  artwork: string;
  accentHue: number;
  includedWithPremium: boolean;
  commissionEligible: boolean;
  featured: boolean;
};

function Check({ name, label, hint, defaultChecked }: { name: string; label: string; hint: string; defaultChecked: boolean }) {
  return (
    <label className="flex items-start gap-3 rounded-[12px] border border-line p-3.5">
      <input type="checkbox" name={name} defaultChecked={defaultChecked} className="mt-0.5 size-4 accent-[var(--color-ink)]" />
      <span>
        <span className="block text-[13.5px] font-medium">{label}</span>
        <span className="block text-[12.5px] text-ink-3">{hint}</span>
      </span>
    </label>
  );
}

export function ProductForm({
  initial,
  categories,
  artworkKeys,
}: {
  initial: ProductFormValues;
  categories: { id: string; name: string }[];
  artworkKeys: string[];
}) {
  const [state, action] = useActionState<FormResult, FormData>(saveProduct, {});
  const [artwork, setArtwork] = useState(initial.artwork);
  const [hue, setHue] = useState(initial.accentHue);
  const [name, setName] = useState(initial.name);
  const [price, setPrice] = useState(initial.price);
  const fe = state.fieldErrors ?? {};
  const aria = (k: string) => ({ "aria-invalid": fe[k] ? true : undefined, "aria-describedby": fe[k] ? `${k}-error` : undefined }) as const;
  const parsedPrice = rupeesToPaise(price);

  useEffect(() => {
    if (state.ok && state.message) toast.success(state.message);
  }, [state]);

  return (
    <form action={action} className="grid grid-cols-1 gap-8 lg:grid-cols-[1fr_340px]" noValidate>
      {initial.id && <input type="hidden" name="id" value={initial.id} />}
      <div className="space-y-6">
        <FormMessage>{state.error}</FormMessage>

        <Panel className="space-y-5 p-6">
          <h2 className="text-[15px] font-semibold">Basics</h2>
          <div className="grid gap-5 sm:grid-cols-2">
            <Field label="Name" htmlFor="name" error={fe.name}>
              <Input id="name" name="name" value={name} onChange={(e) => setName(e.target.value)} required {...aria("name")} />
            </Field>
            <Field label="URL slug" htmlFor="slug" error={fe.slug} hint={initial.id ? "Changing this breaks existing links." : "Leave blank to generate from the name."}>
              <Input id="slug" name="slug" defaultValue={initial.slug} placeholder="e.g. creator-content-calendar" className="font-mono text-[13px]" {...aria("slug")} />
            </Field>
          </div>
          <Field label="Tagline" htmlFor="tagline" error={fe.tagline}>
            <Input id="tagline" name="tagline" defaultValue={initial.tagline} maxLength={140} {...aria("tagline")} />
          </Field>
          <Field label="Description" htmlFor="description" error={fe.description} hint="Describe exactly what the customer gets. No income claims or invented social proof.">
            <Textarea id="description" name="description" defaultValue={initial.description} rows={5} {...aria("description")} />
          </Field>
          <div className="grid gap-5 sm:grid-cols-2">
            <Field label="Category" htmlFor="categoryId" error={fe.categoryId}>
              <Select id="categoryId" name="categoryId" defaultValue={initial.categoryId} {...aria("categoryId")}>
                <option value="">Choose a category</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </Select>
            </Field>
            <Field label="Format" htmlFor="format" error={fe.format} hint="e.g. Template, Toolkit, Workbook">
              <Input id="format" name="format" defaultValue={initial.format} {...aria("format")} />
            </Field>
          </div>
        </Panel>

        <Panel className="space-y-5 p-6">
          <h2 className="text-[15px] font-semibold">Pricing & licence</h2>
          <div className="grid gap-5 sm:grid-cols-2">
            <Field
              label="Price (₹, excluding tax)"
              htmlFor="price"
              error={fe.price}
              hint={parsedPrice === null ? "Enter rupees, e.g. 499 or 499.50" : parsedPrice === 0 ? "Free product — claimed without checkout" : `Stored as ${parsedPrice.toLocaleString("en-IN")} paise · ${formatINR(parsedPrice, { exact: true })}`}
            >
              <Input id="price" name="price" inputMode="decimal" value={price} onChange={(e) => setPrice(e.target.value)} {...aria("price")} />
            </Field>
            <Field label="Licence" htmlFor="licence">
              <Select id="licence" name="licence" defaultValue={initial.licence}>
                <option value="PERSONAL">Personal use</option>
                <option value="COMMERCIAL">Commercial use</option>
              </Select>
            </Field>
          </div>
          <Field label="Licence summary" htmlFor="licenceSummary" error={fe.licenceSummary} hint="Shown on the product page in plain language.">
            <Textarea id="licenceSummary" name="licenceSummary" defaultValue={initial.licenceSummary} rows={2} {...aria("licenceSummary")} />
          </Field>
          <div className="grid gap-3 sm:grid-cols-3">
            <Check name="includedWithPremium" label="Included with Premium" hint="Premium members get it at no extra cost." defaultChecked={initial.includedWithPremium} />
            <Check name="commissionEligible" label="Commission eligible" hint="Counts toward test-mode referral commissions." defaultChecked={initial.commissionEligible} />
            <Check name="featured" label="Featured" hint="Highlighted on the homepage." defaultChecked={initial.featured} />
          </div>
        </Panel>

        <Panel className="space-y-5 p-6">
          <h2 className="text-[15px] font-semibold">What&apos;s included</h2>
          <Field label="Includes (one per line)" htmlFor="includes" error={fe.includes}>
            <Textarea id="includes" name="includes" defaultValue={initial.includes} rows={5} {...aria("includes")} />
          </Field>
          <Field label="File formats" htmlFor="fileFormats" hint="Comma-separated, e.g. Markdown, CSV">
            <Input id="fileFormats" name="fileFormats" defaultValue={initial.fileFormats} />
          </Field>
        </Panel>

        <div className="flex justify-end">
          <SubmitButton pendingLabel="Saving…">{initial.id ? "Save changes" : "Create draft"}</SubmitButton>
        </div>
      </div>

      <aside className="space-y-4 lg:sticky lg:top-20 lg:self-start">
        <Panel className="overflow-hidden">
          <ProductArt artwork={artwork} hue={hue} className="aspect-[4/3] w-full" label={`Artwork preview for ${name || "product"}`} />
          <div className="border-t border-line p-4">
            <p className="text-[14px] font-semibold">{name || "Untitled product"}</p>
            <p className="text-[13px] text-ink-3">{parsedPrice === null ? "—" : parsedPrice === 0 ? "Free" : formatINR(parsedPrice, { exact: true })}</p>
          </div>
        </Panel>
        <Panel className="space-y-4 p-4">
          <Field label="Artwork" htmlFor="artwork" error={fe.artwork}>
            <Select id="artwork" name="artwork" value={artwork} onChange={(e) => setArtwork(e.target.value)}>
              {artworkKeys.map((k) => (
                <option key={k} value={k}>
                  {k[0].toUpperCase() + k.slice(1)}
                </option>
              ))}
            </Select>
          </Field>
          <Field label={`Accent hue · ${hue}°`} htmlFor="accentHue" error={fe.accentHue}>
            <input
              id="accentHue"
              name="accentHue"
              type="range"
              min={0}
              max={359}
              value={hue}
              onChange={(e) => setHue(Number(e.target.value))}
              className="w-full accent-[var(--color-ink)]"
              style={{ background: "transparent" }}
            />
          </Field>
        </Panel>
      </aside>
    </form>
  );
}
