"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { Pencil, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { createCategory, deleteCategory, updateCategory } from "@/actions/admin/catalog";
import type { FormResult } from "@/actions/admin/utils";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/dialog";
import { Field, Input } from "@/components/ui/form";
import { SubmitButton } from "@/components/ui/submit-button";
import { useActionToast } from "./controls";

export function CreateCategoryForm() {
  const [state, action] = useActionState<FormResult, FormData>(createCategory, {});
  const ref = useRef<HTMLFormElement>(null);
  useEffect(() => {
    if (state.ok) {
      toast.success(state.message);
      ref.current?.reset();
    }
  }, [state]);
  return (
    <form ref={ref} action={action} className="grid gap-4 sm:grid-cols-[1fr_1.6fr_auto] sm:items-start" noValidate>
      <Field label="Name" htmlFor="new-name" error={state.fieldErrors?.name}>
        <Input id="new-name" name="name" placeholder="e.g. Finance" aria-invalid={state.fieldErrors?.name ? true : undefined} />
      </Field>
      <Field label="Description" htmlFor="new-description" error={state.fieldErrors?.description}>
        <Input id="new-description" name="description" placeholder="One line shown in the marketplace" aria-invalid={state.fieldErrors?.description ? true : undefined} />
      </Field>
      <SubmitButton className="sm:mt-[26px]" pendingLabel="Adding…">
        Add category
      </SubmitButton>
    </form>
  );
}

export function CategoryRow({ category }: { category: { id: string; name: string; slug: string; description: string; products: number } }) {
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(category.name);
  const [description, setDescription] = useState(category.description);
  const { pending, run } = useActionToast();

  if (editing) {
    return (
      <div className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center">
        <Input aria-label="Category name" value={name} onChange={(e) => setName(e.target.value)} className="sm:w-56" />
        <Input aria-label="Category description" value={description} onChange={(e) => setDescription(e.target.value)} className="flex-1" />
        <div className="flex gap-2">
          <Button variant="secondary" size="sm" onClick={() => setEditing(false)} disabled={pending}>
            Cancel
          </Button>
          <Button size="sm" disabled={pending} onClick={() => run(() => updateCategory(category.id, { name, description }), (r) => r.ok && setEditing(false))}>
            Save
          </Button>
        </div>
      </div>
    );
  }
  return (
    <div className="flex items-center gap-4 p-4">
      <div className="min-w-0 flex-1">
        <p className="text-[14px] font-medium">
          {category.name} <span className="ml-1 font-mono text-[11.5px] font-normal text-ink-3">/{category.slug}</span>
        </p>
        <p className="text-[13px] text-ink-2">{category.description}</p>
      </div>
      <p className="shrink-0 text-[13px] tabular-nums text-ink-3">
        {category.products} product{category.products === 1 ? "" : "s"}
      </p>
      <Button variant="ghost" size="icon-sm" aria-label={`Edit ${category.name}`} onClick={() => setEditing(true)}>
        <Pencil />
      </Button>
      <ConfirmDialog
        trigger={
          <Button variant="ghost" size="icon-sm" aria-label={`Delete ${category.name}`}>
            <Trash2 />
          </Button>
        }
        title={`Delete “${category.name}”?`}
        description={
          category.products > 0
            ? `This category has ${category.products} product${category.products === 1 ? "" : "s"}, so it can't be deleted. Move them to another category first.`
            : "This can't be undone."
        }
        confirmLabel="Delete category"
        onConfirm={async () => {
          const r = await deleteCategory(category.id);
          if (r.ok) toast.success(r.message);
          else toast.error(r.error);
        }}
      />
    </div>
  );
}
