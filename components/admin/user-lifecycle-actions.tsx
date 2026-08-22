"use client";

import { useRef, useState, useTransition } from "react";
import {
  archiveUserAction,
  hardDeleteUserAction,
  restoreUserAction,
} from "@/app/[locale]/(admin)/admin/users/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useMessages } from "@/components/i18n/locale-provider";

/** The server action only accepts this exact token, whatever the UI language. */
const SERVER_CONFIRM_TOKEN = "SUPPRIMER";

export function AdminUserLifecycleActions({
  userId,
  email,
  archived,
  isSelf,
}: {
  userId: string;
  email: string;
  archived: boolean;
  isSelf: boolean;
}) {
  const m = useMessages();
  const t = m.adminUi.lifecycle;
  const hardDeleteRef = useRef<HTMLDialogElement>(null);
  const [confirm, setConfirm] = useState("");
  const [pending, startTransition] = useTransition();

  if (isSelf) return null;

  return (
    <div className="flex flex-wrap items-center gap-1.5">
      {archived ? (
        <form action={restoreUserAction}>
          <input type="hidden" name="userId" value={userId} />
          <Button type="submit" size="sm" variant="outline">
            {t.restore}
          </Button>
        </form>
      ) : (
        <form action={archiveUserAction}>
          <input type="hidden" name="userId" value={userId} />
          <Button type="submit" size="sm" variant="outline">
            {t.archive}
          </Button>
        </form>
      )}

      <Button
        type="button"
        size="sm"
        variant="ghost"
        className="text-destructive"
        onClick={() => hardDeleteRef.current?.showModal()}
      >
        {t.erase}
      </Button>

      <dialog
        ref={hardDeleteRef}
        className="w-[min(100%,28rem)] rounded-2xl border border-slate-200 bg-white p-0 shadow-xl backdrop:bg-slate-900/40"
        onClose={() => setConfirm("")}
      >
        <form
          method="dialog"
          className="space-y-4 p-6"
          onSubmit={(e) => {
            const submitter = (e.nativeEvent as SubmitEvent).submitter as HTMLButtonElement | null;
            if (submitter?.value === "cancel") return;
            e.preventDefault();
            if (confirm !== t.confirmToken) return;
            const fd = new FormData();
            fd.set("userId", userId);
            fd.set("confirm", SERVER_CONFIRM_TOKEN);
            startTransition(() => {
              void hardDeleteUserAction(fd);
            });
          }}
        >
          <header className="space-y-1">
            <h3 className="font-display text-lg font-bold">{t.dialogTitle}</h3>
            <p className="text-sm text-slate-600">
              {t.dialogBodyBefore}
              <strong>{email}</strong>
              {t.dialogBodyAfter}
            </p>
          </header>
          <div className="space-y-1.5">
            <Label htmlFor={`hard-${userId}`}>{t.confirmLabel(t.confirmToken)}</Label>
            <Input
              id={`hard-${userId}`}
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              placeholder={t.confirmToken}
              autoComplete="off"
            />
          </div>
          <div className="flex justify-end gap-2">
            <Button type="submit" value="cancel" variant="outline">
              {m.common.cancel}
            </Button>
            <Button
              type="submit"
              variant="destructive"
              disabled={confirm !== t.confirmToken || pending}
            >
              {pending ? t.deleting : m.common.confirm}
            </Button>
          </div>
        </form>
      </dialog>
    </div>
  );
}
