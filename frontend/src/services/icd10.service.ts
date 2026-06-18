import { api } from "./api";
import type { Icd10ChapterResponse, Icd10CodeResponse } from "@/types/api";

/**
 * Complete WHO ICD-10 2019 (MKB-10) catalog — 12 221 codes served by the
 * backend from the official WHO distribution. Chapters are cached for the
 * session since the catalog only changes with a new WHO release.
 */
let chaptersCache: Icd10ChapterResponse[] | null = null;

export const icd10Service = {
  search: (q: string, limit = 20) =>
    api
      .get<Icd10CodeResponse[]>("/icd10/search", { params: { q, limit } })
      .then((r) => r.data),

  chapters: async () => {
    if (!chaptersCache) {
      chaptersCache = (await api.get<Icd10ChapterResponse[]>("/icd10/chapters")).data;
    }
    return chaptersCache;
  },

  chapterCodes: (chapterNumber: number) =>
    api
      .get<Icd10CodeResponse[]>(`/icd10/chapters/${chapterNumber}/codes`)
      .then((r) => r.data),
};
