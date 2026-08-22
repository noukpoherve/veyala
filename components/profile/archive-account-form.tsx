"use client";

import { useRef, useState, useTransition } from "react";
import { archiveOwnAccount } from "@/app/[locale]/(app)/profile/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useMessages } from "@/components/i18n/locale-provider";

/** Token the server action validates: identical in every locale. */
const CONFIRM_WORD = "DESACTIVER";

/**
 * Archive confirmation: native <dialog> + type DESACTIVER.
 * Soft-deactivates the account; an admin must restore access.
 */
export function ArchiveAccountForm() {
  const messages = useMessages();
  const m = messages.pages.archiveAccount;
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [confirm, setConfirm] = useState("");
  const [pending, startTransition] = useTransition();
  const canSubmit = confirm === CONFIRM_WORD;

  return (
    <>
      <Button type="button" variant="destructive" onClick={() => dialogRef.current?.showModal()}>
        {m.trigger}
      </Button>

      <dialog
        ref={dialogRef}
        className="w-[min(100%,28rem)] rounded-2xl border border-slate-200 bg-white p-0 shadow-xl backdrop:bg-slate-900/40"
        onClose={() => setConfirm("")}
      >
        <form
          method="dialog"
          className="space-y-4 p-6"
          onSubmit={(e) => {
            // Allow Cancel (value=cancel) to close without archiving.
            const submitter = (e.nativeEvent as SubmitEvent).submitter as HTMLButtonElement | null;
            if (submitter?.value === "cancel") return;
            e.preventDefault();
            if (!canSubmit) return;
            const fd = new FormData();
            fd.set("confirm", CONFIRM_WORD);
            startTransition(() => {
              void archiveOwnAccount(fd);
            });
          }}
        >
          <header className="space-y-1">
            <h3 className="font-display text-lg font-bold text-slate-900">{m.dialogTitle}</h3>
            <p className="text-sm leading-relaxed text-slate-600">{m.dialogBody}</p>
          </header>

          <div className="space-y-1.5">
            <Label htmlFor="confirm-archive">{m.confirmLabel(CONFIRM_WORD)}</Label>
            <Input
              id="confirm-archive"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              autoComplete="off"
              placeholder={CONFIRM_WORD}
              pattern={CONFIRM_WORD}
            />
          </div>

          <div className="flex flex-wrap justify-end gap-2">
            <Button type="submit" value="cancel" variant="outline">
              {messages.common.cancel}
            </Button>
            <Button type="submit" variant="destructive" disabled={!canSubmit || pending}>
              {pending ? m.pending : m.submit}
            </Button>
          </div>
        </form>
      </dialog>
    </>
  );
}
