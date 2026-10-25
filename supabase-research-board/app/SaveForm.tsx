"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { saveToBoard, type ActionResult } from "./actions";

function SubmitButton({ saved }: { saved: boolean }) {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="shrink-0 rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-red-700 disabled:opacity-50"
    >
      {pending ? "Saving..." : saved ? "Update note" : "Save to board"}
    </button>
  );
}

export default function SaveForm({
  creatorId,
  shortId,
  savedNote,
}: {
  creatorId: number;
  shortId: string;
  savedNote: string | null;
}) {
  const [state, formAction] = useActionState<ActionResult, FormData>(saveToBoard, {});

  return (
    <form action={formAction} className="mt-4 flex flex-col gap-2 sm:flex-row">
      <input type="hidden" name="creatorId" value={creatorId} />
      <input type="hidden" name="shortId" value={shortId} />
      <input
        type="text"
        name="note"
        maxLength={200}
        defaultValue={savedNote ?? ""}
        placeholder="Note to yourself (optional)"
        aria-label="Note"
        className="w-full min-w-0 rounded-lg border-2 border-gray-200 px-3 py-2 text-sm outline-none focus:border-red-500"
      />
      <SubmitButton saved={savedNote !== null} />
      {state.error && <p className="text-sm text-red-600">{state.error}</p>}
    </form>
  );
}
