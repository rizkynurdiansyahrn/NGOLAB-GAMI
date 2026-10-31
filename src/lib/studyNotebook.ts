import {
  MAX_SOURCES,
  MAX_SOURCE_CHARACTERS,
  MAX_TOTAL_CHARACTERS,
  MAX_PDF_PAGES,
} from "../../shared/studyCoachLimits.mjs";

export interface StudySection {
  text: string;
  page?: number;
}

export interface StudySource {
  id: string;
  name: string;
  kind: "pdf" | "docx" | "txt" | "md" | "note";
  sections: StudySection[];
  enabled: boolean;
}

export interface StudyCitation {
  sourceId: string;
  sourceName: string;
  location: string;
  quote: string;
}

export interface CoachMessage {
  role: "user" | "assistant";
  text: string;
  citations?: StudyCitation[];
  notFound?: boolean;
  model?: string;
  grounded?: boolean;
}

export interface StudyNotebook {
  sources: StudySource[];
  messages: CoachMessage[];
}

export function sourceCharacterCount(source: StudySource): number {
  return source.sections.reduce(
    (count, section) => count + section.text.length,
    0,
  );
}

export function notebookCharacterCount(sources: StudySource[]): number {
  return sources.reduce(
    (count, source) => count + sourceCharacterCount(source),
    0,
  );
}

export function normalizeNotebook(value: unknown): StudyNotebook {
  if (!value || typeof value !== "object") return { sources: [], messages: [] };
  const data = value as Record<string, unknown>;
  const sources: StudySource[] = [];
  const knownIds = new Set<string>();
  for (const value of Array.isArray(data.sources)
    ? data.sources.slice(0, MAX_SOURCES)
    : []) {
    if (!value || typeof value !== "object") continue;
    const source = value as Record<string, unknown>;
    if (
      typeof source.id !== "string" ||
      !source.id ||
      source.id.length > 100 ||
      knownIds.has(source.id) ||
      typeof source.name !== "string" ||
      !source.name.trim() ||
      !Array.isArray(source.sections) ||
      !["pdf", "docx", "txt", "md", "note"].includes(String(source.kind))
    )
      continue;
    const sections: StudySection[] = source.sections
      .slice(0, MAX_PDF_PAGES)
      .flatMap((value: unknown) => {
        if (!value || typeof value !== "object") return [];
        const section = value as Record<string, unknown>;
        if (typeof section.text !== "string" || !section.text.trim()) return [];
        const page =
          typeof section.page === "number" &&
          Number.isInteger(section.page) &&
          section.page > 0
            ? section.page
            : undefined;
        return [{ text: section.text, ...(page ? { page } : {}) }];
      });
    const item: StudySource = {
      id: source.id,
      name: source.name.trim().slice(0, 200),
      kind: source.kind as StudySource["kind"],
      sections,
      enabled: source.enabled !== false,
    };
    if (
      !sections.length ||
      sourceCharacterCount(item) > MAX_SOURCE_CHARACTERS ||
      notebookCharacterCount([...sources, item]) > MAX_TOTAL_CHARACTERS
    )
      continue;
    knownIds.add(item.id);
    sources.push(item);
  }
  const messages: CoachMessage[] = (
    Array.isArray(data.messages) ? data.messages.slice(-40) : []
  ).flatMap((value: unknown) => {
    if (!value || typeof value !== "object") return [];
    const message = value as Record<string, unknown>;
    if (
      (message.role !== "user" && message.role !== "assistant") ||
      typeof message.text !== "string" ||
      !message.text.trim()
    )
      return [];
    const citations: StudyCitation[] = (
      Array.isArray(message.citations) ? message.citations.slice(0, 12) : []
    ).flatMap((value: unknown) => {
      if (!value || typeof value !== "object") return [];
      const citation = value as Record<string, unknown>;
      if (
        typeof citation.sourceId !== "string" ||
        !knownIds.has(citation.sourceId) ||
        typeof citation.sourceName !== "string" ||
        typeof citation.location !== "string" ||
        typeof citation.quote !== "string"
      )
        return [];
      return [
        {
          sourceId: citation.sourceId,
          sourceName: citation.sourceName.slice(0, 200),
          location: citation.location.slice(0, 80),
          quote: citation.quote.slice(0, 600),
        },
      ];
    });
    return [
      {
        role: message.role,
        text: message.text.slice(0, 10_000),
        citations,
        notFound: message.notFound === true,
        model: typeof message.model === "string" ? message.model : undefined,
        grounded: typeof message.grounded === "boolean" ? message.grounded : undefined,
      },
    ];
  });
  return { sources, messages };
}

function openDatabase(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open("ngolab-study-notebooks", 1);
    request.onupgradeneeded = () =>
      request.result.createObjectStore("notebooks");
    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);
    request.onblocked = () =>
      reject(new Error("Penyimpanan materi sedang digunakan tab lain."));
  });
}

export async function readNotebook(key: string): Promise<StudyNotebook> {
  const database = await openDatabase();
  try {
    return await new Promise((resolve, reject) => {
      const transaction = database.transaction("notebooks", "readonly");
      const request = transaction.objectStore("notebooks").get(key);
      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve(normalizeNotebook(request.result));
    });
  } finally {
    database.close();
  }
}

export async function writeNotebook(
  key: string,
  notebook: StudyNotebook,
): Promise<void> {
  const database = await openDatabase();
  try {
    await new Promise<void>((resolve, reject) => {
      const transaction = database.transaction("notebooks", "readwrite");
      transaction.objectStore("notebooks").put(notebook, key);
      transaction.oncomplete = () => resolve();
      transaction.onerror = () => reject(transaction.error);
      transaction.onabort = () => reject(transaction.error);
    });
  } finally {
    database.close();
  }
}
