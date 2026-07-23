"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { currentAdmin } from "@/server/admin";
import {
  AdminServiceError,
  deleteMovie,
  saveMovie,
} from "@/server/services/admin.service";
import type {
  AdminEpisodeInput,
  AdminMovieInput,
  AdminSourceInput,
} from "@/server/repositories/types";
import type { MovieType, Resolution } from "@/types";

export interface AdminActionState {
  error?: string;
}

function parseSources(raw: unknown): AdminSourceInput[] {
  if (!Array.isArray(raw)) return [];
  return raw.map((entry) => {
    const source = (entry ?? {}) as Record<string, unknown>;
    return {
      resolution: String(source.resolution ?? "") as Resolution,
      sourceType: source.sourceType === "hls" ? "hls" : "mp4",
      oneDrivePath: typeof source.oneDrivePath === "string" ? source.oneDrivePath : null,
      fallbackUrl: typeof source.fallbackUrl === "string" ? source.fallbackUrl : null,
    };
  });
}

function parseEpisodes(json: string): AdminEpisodeInput[] {
  let parsed: unknown;
  try {
    parsed = JSON.parse(json);
  } catch {
    return [];
  }
  if (!Array.isArray(parsed)) return [];
  return parsed.map((raw) => {
    const ep = (raw ?? {}) as Record<string, unknown>;
    return {
      season: Number(ep.season) || 1,
      number: Number(ep.number) || 0,
      title: typeof ep.title === "string" ? ep.title : "",
      duration: Number(ep.duration) || 0,
      sources: parseSources(ep.sources),
    };
  });
}

function parseMovieForm(formData: FormData): AdminMovieInput {
  const str = (key: string) => String(formData.get(key) ?? "").trim();
  const type: MovieType = str("type") === "series" ? "series" : "single";
  return {
    slug: str("slug").toLowerCase(),
    title: str("title"),
    originalTitle: str("originalTitle"),
    description: str("description"),
    type,
    posterUrl: str("posterUrl"),
    backdropUrl: str("backdropUrl"),
    year: Number(str("year")),
    duration: Number(str("duration")) || 0,
    country: str("country"),
    quality: str("quality"),
    rating: Number(str("rating")) || 0,
    featured: formData.get("featured") === "on",
    genres: formData.getAll("genres").map(String),
    episodes: parseEpisodes(str("episodes")),
  };
}

export async function saveMovieAction(
  _prev: AdminActionState,
  formData: FormData,
): Promise<AdminActionState> {
  if (!(await currentAdmin())) return { error: "Bạn không có quyền quản trị." };

  const id = String(formData.get("id") ?? "") || null;
  try {
    await saveMovie(id, parseMovieForm(formData));
  } catch (error) {
    if (error instanceof AdminServiceError) return { error: error.message };
    console.error("saveMovieAction failed:", error);
    return { error: "Lưu phim thất bại, vui lòng thử lại." };
  }
  revalidatePath("/admin");
  redirect(`/admin?saved=1`);
}

export async function deleteMovieAction(id: string): Promise<{ ok: boolean; error?: string }> {
  if (!(await currentAdmin())) return { ok: false, error: "Bạn không có quyền quản trị." };
  try {
    await deleteMovie(id);
  } catch (error) {
    if (error instanceof AdminServiceError) return { ok: false, error: error.message };
    console.error("deleteMovieAction failed:", error);
    return { ok: false, error: "Xóa phim thất bại." };
  }
  revalidatePath("/admin");
  return { ok: true };
}
