"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/auth";
import { getRepositories } from "@/server/repositories";
import type { CollectionStatus } from "@/types";

const VALID_STATUSES: CollectionStatus[] = ["watching", "wishlist", "watched"];

/** Set (or clear, with null) the collection status of a movie for the signed-in user. */
export async function setCollectionAction(
  movieId: string,
  status: CollectionStatus | null,
): Promise<{ ok: boolean; error?: string }> {
  const session = await auth();
  if (!session?.user?.id) return { ok: false, error: "unauthenticated" };
  if (status !== null && !VALID_STATUSES.includes(status)) {
    return { ok: false, error: "invalid-status" };
  }
  await getRepositories().collections.set(session.user.id, movieId, status);
  revalidatePath("/collection");
  return { ok: true };
}
