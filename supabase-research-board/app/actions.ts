"use server";

// Write operations, run on the server as Server Actions.
import { refresh } from "next/cache";
import { supabase } from "@/lib/supabase";

export type ActionResult = { error?: string };

function readIds(formData: FormData) {
  const creatorId = Number(formData.get("creatorId"));
  const shortId = String(formData.get("shortId") ?? "");
  if (!Number.isInteger(creatorId) || creatorId <= 0 || !/^[\w-]{1,20}$/.test(shortId)) {
    return null;
  }
  return { creatorId, shortId };
}

// CREATE / UPDATE: save a Short to the creator's board. Upsert means
// saving the same Short again just updates the note instead of failing
// on the (creator_id, short_id) primary key.
export async function saveToBoard(_prev: ActionResult, formData: FormData): Promise<ActionResult> {
  const ids = readIds(formData);
  if (!ids) return { error: "Invalid request." };

  const note = String(formData.get("note") ?? "").trim().slice(0, 200);

  const { error } = await supabase
    .from("research_board")
    .upsert({ creator_id: ids.creatorId, short_id: ids.shortId, note, saved_at: new Date().toISOString() });

  if (error) return { error: error.message };
  refresh();
  return {};
}

// DELETE: remove a Short from the creator's board.
export async function removeFromBoard(formData: FormData): Promise<void> {
  const ids = readIds(formData);
  if (!ids) return;

  const { error } = await supabase
    .from("research_board")
    .delete()
    .eq("creator_id", ids.creatorId)
    .eq("short_id", ids.shortId);

  if (error) throw new Error(error.message);
  refresh();
}
