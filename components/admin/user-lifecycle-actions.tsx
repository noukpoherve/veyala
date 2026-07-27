"use client";

import { useRef, useState, useTransition } from "react";
import {
  archiveUserAction,
  hardDeleteUserAction,
  restoreUserAction,
} from "@/app/(admin)/admin/users/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

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
            Réactiver
          </Button>
        </form>
      ) : (
        <form action={archiveUserAction}>
          <input type="hidden" name="userId" value={userId} />
          <Button type="submit" size="sm" variant="outline">
            Archiver
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
        Effacer
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
            if (confirm !== "SUPPRIMER") return;
            const fd = new FormData();
            fd.set("userId", userId);
            fd.set("confirm", "SUPPRIMER");
            startTransition(() => {
              void hardDeleteUserAction(fd);
            });
          }}
        >
          <header className="space-y-1">
            <h3 className="font-display text-lg font-bold">Effacement RGPD</h3>
            <p className="text-sm text-slate-600">
              Supprime définitivement <strong>{email}</strong>, fichiers et historiques.
              Irréversible.
            </p>
          </header>
          <div className="space-y-1.5">
            <Label htmlFor={`hard-${userId}`}>Tapez SUPPRIMER</Label>
            <Input
              id={`hard-${userId}`}
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              placeholder="SUPPRIMER"
              autoComplete="off"
            />
          </div>
          <div className="flex justify-end gap-2">
            <Button type="submit" value="cancel" variant="outline">
              Annuler
            </Button>
            <Button
              type="submit"
              variant="destructive"
              disabled={confirm !== "SUPPRIMER" || pending}
            >
              {pending ? "Suppression…" : "Confirmer"}
            </Button>
          </div>
        </form>
      </dialog>
    </div>
  );
}
