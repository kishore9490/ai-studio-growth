"use client";

import Link from "next/link";
import { useState, useTransition } from "react";
import { toast } from "sonner";
import { Banknote, Loader2, Share2 } from "lucide-react";
import { joinAffiliateProgramme, leaveAffiliateProgramme, submitPayoutRequest } from "@/actions/affiliate";
import { Button } from "@/components/ui/button";
import { copyText } from "@/components/ui/copy-button";
import { ConfirmDialog, Dialog } from "@/components/ui/dialog";
import { Field, Textarea } from "@/components/ui/form";

export function JoinProgrammeForm() {
  const [accepted, setAccepted] = useState(false);
  const [pending, start] = useTransition();
  return (
    <div>
      <label className="flex items-start gap-2.5 text-[14px] text-ink-2">
        <input type="checkbox" checked={accepted} onChange={(e) => setAccepted(e.target.checked)} className="mt-0.5 size-4 accent-[var(--color-ink)]" />
        <span>
          I understand the programme is in test mode, commissions are only recorded for verified eligible product sales, earnings are not
          guaranteed, and payouts are currently disabled. I&apos;ve read the{" "}
          <Link href="/legal/affiliate-disclosure" target="_blank" className="text-ink underline underline-offset-2">
            Affiliate Disclosure
          </Link>
          .
        </span>
      </label>
      <Button
        className="mt-5"
        disabled={!accepted || pending}
        onClick={() =>
          start(async () => {
            const res = await joinAffiliateProgramme(accepted);
            if (res.ok) toast.success(res.message);
            else toast.error(res.error);
          })
        }
      >
        {pending && <Loader2 className="animate-spin" />} Join the programme — free
      </Button>
    </div>
  );
}

export function ShareButton({ url }: { url: string }) {
  return (
    <Button
      variant="secondary"
      onClick={async () => {
        const data = { title: "LifeOS Digital", text: "Practical digital tools and resources I use:", url };
        if (typeof navigator !== "undefined" && navigator.share) {
          try {
            await navigator.share(data);
            return;
          } catch {
            /* user cancelled — fall back to copying */
          }
        }
        if (await copyText(url)) toast.success("Link copied — sharing isn't available in this browser.");
      }}
    >
      <Share2 /> Share
    </Button>
  );
}

export function PayoutRequestButton({ disabled, reason }: { disabled: boolean; reason?: string }) {
  const [open, setOpen] = useState(false);
  const [note, setNote] = useState("");
  const [pending, start] = useTransition();
  return (
    <div>
      <Dialog
        open={open}
        onOpenChange={setOpen}
        title="Request a test payout"
        description="Payouts are disabled while the programme is in test mode. Your request is recorded for review only — no money will be sent."
        trigger={
          <Button variant="secondary" disabled={disabled}>
            <Banknote /> Request payout
          </Button>
        }
      >
        <Field label="Note for the reviewer" htmlFor="payout-note" optional>
          <Textarea id="payout-note" value={note} maxLength={300} onChange={(e) => setNote(e.target.value)} />
        </Field>
        <div className="mt-5 flex justify-end gap-2">
          <Button variant="secondary" onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <Button
            disabled={pending}
            onClick={() =>
              start(async () => {
                const res = await submitPayoutRequest(note);
                if (res.ok) {
                  toast.success(res.message);
                  setOpen(false);
                } else toast.error(res.error);
              })
            }
          >
            {pending && <Loader2 className="animate-spin" />} Submit request
          </Button>
        </div>
      </Dialog>
      {reason && <p className="mt-2 text-[12.5px] text-ink-3">{reason}</p>}
    </div>
  );
}

export function LeaveProgrammeButton() {
  return (
    <ConfirmDialog
      trigger={<button type="button" className="text-[13px] text-ink-3 underline-offset-4 hover:text-ink hover:underline">Leave the programme</button>}
      title="Leave the affiliate programme?"
      description="No new commissions will be recorded for you. Existing records stay in the ledger for audit purposes. You can rejoin later."
      confirmLabel="Leave programme"
      onConfirm={async () => {
        const res = await leaveAffiliateProgramme();
        if (res.ok) toast.success(res.message);
        else toast.error(res.error);
      }}
    />
  );
}
