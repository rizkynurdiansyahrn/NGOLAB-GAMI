import { useEffect, useId, useRef, useState, type FormEvent } from "react";
import {
  BookOpen,
  Bot,
  Check,
  ChevronDown,
  ChevronUp,
  Eye,
  FileText,
  LoaderCircle,
  Plus,
  Send,
  Sparkles,
  Trash2,
  Upload,
  X,
} from "lucide-react";
import {
  MAX_SOURCES,
  MAX_FILE_BYTES,
  MAX_SOURCE_CHARACTERS,
  MAX_TOTAL_CHARACTERS,
  MAX_QUESTION_CHARACTERS,
} from "../../shared/studyCoachLimits.mjs";
import {
  readNotebook,
  writeNotebook,
  normalizeNotebook,
  sourceCharacterCount,
  notebookCharacterCount,
  type CoachMessage,
  type StudySource,
  type StudyCitation,
} from "../lib/studyNotebook";
import { fetchWithRetry } from "../lib/studyCoachFetch";

interface AIStudyCoachProps {
  taskTitle?: string;
  durationMinutes: number;
  conversationKey: string;
}

const STARTER_PROMPTS = [
  "Ringkas poin utama dari materi yang dipilih.",
  "Jelaskan konsep penting dalam materi dengan bahasa sederhana.",
  "Buat 3 soal latihan beserta pembahasannya berdasarkan materi.",
];

function coachResponseError(
  response: Response,
  payload: unknown,
  fallback: string,
) {
  if (
    payload &&
    typeof payload === "object" &&
    "error" in payload &&
    typeof payload.error === "string" &&
    payload.error.trim()
  )
    return payload.error;
  if (response.status === 404)
    return "Layanan Study Coach belum menyediakan fitur ini. Coba lagi setelah layanan diperbarui.";
  if (response.status >= 500)
    return "Layanan Study Coach belum tersedia. Silakan coba lagi sebentar.";
  return `${fallback} (HTTP ${response.status}).`;
}

function coachRequestError(error: unknown, fallback: string) {
  if (!(error instanceof Error)) return fallback;
  if (error.name === "TimeoutError")
    return "Permintaan terlalu lama diproses. Coba lagi atau gunakan materi yang lebih singkat.";
  if (
    error instanceof TypeError &&
    [
      "Failed to fetch",
      "Load failed",
      "NetworkError when attempting to fetch resource.",
    ].includes(error.message)
  )
    return "Koneksi ke Study Coach terputus. Pastikan aplikasi masih berjalan, lalu coba kembali.";
  return error.message || fallback;
}

export default function AIStudyCoach({
  taskTitle,
  durationMinutes,
  conversationKey,
}: AIStudyCoachProps) {
  const componentId = useId();
  const [isOpen, setIsOpen] = useState(false);
  const [sources, setSources] = useState<StudySource[]>([]);
  const [messages, setMessages] = useState<CoachMessage[]>([]);
  const [hydratedKey, setHydratedKey] = useState("");
  const [draft, setDraft] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadName, setUploadName] = useState("");
  const [error, setError] = useState("");
  const [sourceError, setSourceError] = useState("");
  const [statusHint, setStatusHint] = useState("");
  const [serviceNotice, setServiceNotice] = useState("");
  const [storageNotice, setStorageNotice] = useState("");
  const [showNoteForm, setShowNoteForm] = useState(false);
  const [noteTitle, setNoteTitle] = useState("");
  const [noteText, setNoteText] = useState("");
  const [preview, setPreview] = useState<{
    sourceId: string;
    quote?: string;
  } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const endOfMessagesRef = useRef<HTMLDivElement>(null);
  const previewRef = useRef<HTMLDivElement>(null);
  const keyRef = useRef(conversationKey);
  const requestRef = useRef<AbortController | null>(null);
  const uploadRef = useRef<AbortController | null>(null);
  const savesRef = useRef<Promise<void>>(Promise.resolve());
  keyRef.current = conversationKey;

  const busy = isSending || isUploading || hydratedKey !== conversationKey;
  const activeSources = sources.filter((source) => source.enabled);
  const activeSourceIds = new Set(activeSources.map((source) => source.id));
  const previewSource = sources.find(
    (source) => source.id === preview?.sourceId,
  );
  const totalCharacters = notebookCharacterCount(sources);

  useEffect(() => {
    let cancelled = false;
    requestRef.current?.abort();
    uploadRef.current?.abort();
    requestRef.current = null;
    uploadRef.current = null;
    setSources([]);
    setMessages([]);
    setHydratedKey("");
    setDraft("");
    setError("");
    setSourceError("");
    setStorageNotice("");
    setIsSending(false);
    setIsUploading(false);
    setPreview(null);
    setShowNoteForm(false);
    setNoteTitle("");
    setNoteText("");
    setStatusHint("");
    setServiceNotice("");
    void savesRef.current
      .then(() => readNotebook(conversationKey))
      .then((notebook) => {
        if (cancelled) return;
        setSources(notebook.sources);
        setMessages(notebook.messages);
        setHydratedKey(conversationKey);
      })
      .catch(() => {
        if (cancelled) return;
        setStorageNotice(
          "Penyimpanan browser belum tersedia. Materi dan percakapan hanya bertahan selama halaman ini terbuka.",
        );
        setHydratedKey(conversationKey);
      });
    return () => {
      cancelled = true;
      requestRef.current?.abort();
      uploadRef.current?.abort();
    };
  }, [conversationKey]);

  useEffect(() => {
    if (hydratedKey !== conversationKey) return;
    const key = conversationKey;
    const snapshot = { sources, messages: messages.slice(-40) };
    savesRef.current = savesRef.current
      .then(() => writeNotebook(key, snapshot))
      .catch(() => {
        if (keyRef.current === key)
          setStorageNotice(
            "Materi belum dapat disimpan di browser. Materi tetap dapat dipakai selama halaman ini terbuka.",
          );
      });
  }, [sources, messages, hydratedKey, conversationKey]);

  useEffect(() => {
    if (isOpen)
      endOfMessagesRef.current?.scrollIntoView({
        behavior: "smooth",
        block: "nearest",
      });
  }, [messages, isSending, isOpen]);

  // Beri tahu pengguna ketika jawaban membutuhkan waktu sangat panjang.
  useEffect(() => {
    if (!isSending) return;
    const timer = setTimeout(() => {
      setStatusHint(
        (current) =>
          current ||
          "Masih menyiapkan jawaban. Layanan AI membutuhkan waktu ekstra, mohon tunggu.",
      );
    }, 45_000);
    return () => clearTimeout(timer);
  }, [isSending]);

  // Periksa kesiapan layanan sekali saat panel dibuka, agar masalah
  // konfigurasi terlihat lebih awal daripada setelah menunggu puluhan detik.
  const serviceCheckRef = useRef(false);
  useEffect(() => {
    if (!isOpen || serviceCheckRef.current) return;
    serviceCheckRef.current = true;
    const controller = new AbortController();
    void (async () => {
      try {
        const response = await fetch("/api/health", {
          signal: AbortSignal.any([
            controller.signal,
            AbortSignal.timeout(10_000),
          ]),
        });
        const data = response.ok ? await response.json() : null;
        if (data && data.studyCoachConfigured === false)
          setServiceNotice(
            "Layanan Study Coach belum dikonfigurasi di server. Jawaban belum dapat dihasilkan sampai konfigurasi diperbaiki.",
          );
        else if (data) setServiceNotice("");
      } catch {
        /* Pemeriksaan awal hanya informasi; kegagalan diabaikan. */
      }
    })();
    return () => controller.abort();
  }, [isOpen]);

  const updateSources = (updated: StudySource[]) => {
    setSources(updated);
    setMessages([]);
    setError("");
    setSourceError("");
    setPreview(null);
  };

  const uploadFiles = async (files: File[]) => {
    if (!files.length || busy || uploadRef.current || requestRef.current)
      return;
    if (sources.length + files.length > MAX_SOURCES) {
      setSourceError(
        `Maksimal ${MAX_SOURCES} sumber. Hapus sumber yang tidak diperlukan sebelum menambahkan file.`,
      );
      return;
    }
    const controller = new AbortController();
    const requestKey = conversationKey;
    uploadRef.current = controller;
    setIsUploading(true);
    setSourceError("");
    let updated = sources;
    const failures: string[] = [];
    for (const file of files) {
      if (controller.signal.aborted) break;
      setUploadName(file.name);
      try {
        if (!/\.(pdf|docx|txt|md)$/i.test(file.name))
          throw new Error(
            "Format yang didukung: PDF, DOCX, TXT, dan Markdown (.md).",
          );
        if (file.size > MAX_FILE_BYTES)
          throw new Error("Ukuran file maksimal 10 MB.");
        const body = new FormData();
        body.append("file", file);
        // Unggahan juga dapat terkena gangguan sesaat layanan, jadi pakai
        // percobaan ulang otomatis yang sama seperti pengiriman pertanyaan.
        const response = await fetchWithRetry(
          "/api/study-coach/sources/file",
          { method: "POST", body },
          {
            attempts: 2,
            timeoutMs: 90_000,
            signal: controller.signal,
            onRetry: ({ attempt, attempts }) =>
              setStatusHint(
                `Pemroses file sedang sibuk. Mengunggah ulang (${attempt + 1} dari ${attempts})…`,
              ),
          },
        );
        const data = await response.json().catch(() => null);
        if (!response.ok)
          throw new Error(
            coachResponseError(response, data, "Unggahan materi gagal"),
          );
        const source = normalizeNotebook({ sources: [data?.source] })
          .sources[0];
        if (!source)
          throw new Error(
            "Isi file belum dapat dibaca. Coba tempel teks materi sebagai catatan.",
          );
        if (notebookCharacterCount([...updated, source]) > MAX_TOTAL_CHARACTERS)
          throw new Error(
            "Jumlah teks materi melebihi batas. Hapus sumber yang tidak diperlukan.",
          );
        updated = [...updated, source];
      } catch (error) {
        if (controller.signal.aborted) break;
        failures.push(
          `${file.name}: ${coachRequestError(error, "Unggahan gagal.")}`,
        );
      }
    }
    if (
      keyRef.current === requestKey &&
      uploadRef.current === controller &&
      !controller.signal.aborted
    ) {
      if (updated !== sources) updateSources(updated);
      setSourceError(failures.join("\n"));
      setIsUploading(false);
      setUploadName("");
      uploadRef.current = null;
      setStatusHint("");
    }
  };

  const addNote = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (busy || !noteText.trim()) return;
    if (sources.length >= MAX_SOURCES) {
      setSourceError(`Maksimal ${MAX_SOURCES} sumber per tugas belajar.`);
      return;
    }
    const source: StudySource = {
      id:
        globalThis.crypto?.randomUUID?.() ??
        `note-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`,
      name: noteTitle.trim() || "Catatan belajar",
      kind: "note",
      enabled: true,
      sections: [{ text: noteText.trim() }],
    };
    if (sourceCharacterCount(source) > MAX_SOURCE_CHARACTERS) {
      setSourceError(
        `Catatan maksimal ${MAX_SOURCE_CHARACTERS.toLocaleString("id-ID")} karakter. Pisahkan menjadi beberapa bagian.`,
      );
      return;
    }
    if (notebookCharacterCount([...sources, source]) > MAX_TOTAL_CHARACTERS) {
      setSourceError(
        "Jumlah teks materi melebihi batas. Hapus sumber yang tidak diperlukan.",
      );
      return;
    }
    updateSources([...sources, source]);
    setNoteTitle("");
    setNoteText("");
    setShowNoteForm(false);
  };

  const showCitation = (citation: StudyCitation) => {
    setPreview({ sourceId: citation.sourceId, quote: citation.quote });
    requestAnimationFrame(() =>
      previewRef.current?.scrollIntoView({
        behavior: "smooth",
        block: "center",
      }),
    );
  };

  const sendMessage = async (rawMessage: string) => {
    const message = rawMessage.trim();
    if (!message || busy || requestRef.current || uploadRef.current) return;
    if (!activeSources.length) {
      setSourceError("Tambahkan dan pilih materi sebelum mengirim pertanyaan.");
      return;
    }
    const controller = new AbortController();
    const requestKey = conversationKey;
    requestRef.current = controller;
    const history = messages
      .slice(-6)
      .map(({ role, text }) => ({ role, text }));
    setMessages((current) => [...current, { role: "user", text: message }]);
    setDraft("");
    setError("");
    setStatusHint("");
    setIsSending(true);
    try {
      // Percobaan ulang otomatis menjaga jawaban tetap muncul ketika layanan
      // RAG memutus permintaan lama (misalnya balasan 502) sesekali.
      const response = await fetchWithRetry(
        "/api/study-coach",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            message,
            taskTitle: taskTitle ?? "",
            durationMinutes,
            history,
            sources: activeSources,
          }),
        },
        {
          attempts: 3,
          timeoutMs: 90_000,
          signal: controller.signal,
          onRetry: ({ attempt, attempts }) =>
            setStatusHint(
              `Layanan AI sedang sibuk. Menghubungkan ulang otomatis (${attempt + 1} dari ${attempts})…`,
            ),
        },
      );
      const data = await response.json().catch(() => null);
      if (!response.ok)
        throw new Error(
          coachResponseError(response, data, "Coach belum dapat menjawab"),
        );
      if (
        typeof data?.answer !== "string" ||
        !data.answer.trim() ||
        typeof data.notFound !== "boolean" ||
        !Array.isArray(data.citations)
      ) {
        throw new Error(
          "Coach belum mengirim jawaban dengan rujukan materi yang lengkap.",
        );
      }
      const citations: StudyCitation[] = data.citations;
      if (
        citations.some(
          (citation) =>
            !citation ||
            !activeSourceIds.has(citation.sourceId) ||
            typeof citation.quote !== "string" ||
            typeof citation.sourceName !== "string" ||
            typeof citation.location !== "string",
        ) ||
        (!data.notFound && !citations.length)
      )
        throw new Error("Rujukan jawaban belum sesuai materi yang dipilih.");
      if (
        keyRef.current === requestKey &&
        requestRef.current === controller &&
        !controller.signal.aborted
      ) {
        setMessages((current) => [
          ...current.slice(-39),
          {
            role: "assistant",
            text: data.answer.trim(),
            citations,
            notFound: data.notFound,
          },
        ]);
      }
    } catch (error) {
      if (
        keyRef.current === requestKey &&
        requestRef.current === controller &&
        !controller.signal.aborted
      ) {
        setError(
          coachRequestError(error, "Koneksi ke Study Coach gagal. Coba lagi."),
        );
        setDraft(message);
        setMessages((current) =>
          current.at(-1)?.role === "user" && current.at(-1)?.text === message
            ? current.slice(0, -1)
            : current,
        );
      }
    } finally {
      if (requestRef.current === controller) {
        setIsSending(false);
        requestRef.current = null;
      }
      setStatusHint("");
    }
  };

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    void sendMessage(draft);
  };

  return (
    <section className="relative z-10 mb-5 overflow-hidden rounded-3xl border border-violet-100 bg-white shadow-sm">
      <button
        type="button"
        onClick={() => setIsOpen((open) => !open)}
        aria-expanded={isOpen}
        aria-controls={`${componentId}-coach`}
        className="flex w-full items-center gap-3 p-4 text-left transition hover:bg-violet-50/40 sm:p-5"
      >
        <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-violet-50 text-violet-600">
          <Sparkles className="h-5 w-5" />
        </span>
        <span className="min-w-0 flex-1">
          <span className="block text-sm font-black text-slate-900">
            AI Study Coach
          </span>
          <span className="mt-0.5 block text-xs leading-relaxed text-slate-500">
            Tambahkan materi, lalu pahami isinya bersama AI dengan rujukan
            sumber.
          </span>
        </span>
        <span className="hidden shrink-0 rounded-full bg-violet-50 px-2.5 py-1 text-[10px] font-extrabold text-violet-700 sm:inline-flex">
          Sesuai materi
        </span>
        {isOpen ? (
          <ChevronUp className="h-5 w-5 shrink-0 text-slate-400" />
        ) : (
          <ChevronDown className="h-5 w-5 shrink-0 text-slate-400" />
        )}
      </button>

      {isOpen && (
        <div
          id={`${componentId}-coach`}
          className="border-t border-violet-100 p-4 sm:p-5"
        >
          <div className="mb-4 flex items-start gap-2 rounded-2xl bg-violet-50/70 px-3.5 py-3 text-xs leading-relaxed text-violet-950">
            <Bot className="mt-0.5 h-4 w-4 shrink-0 text-violet-600" />
            <p>
              {taskTitle ? (
                <>
                  <span className="font-extrabold">Tugas: </span>
                  {taskTitle}
                </>
              ) : (
                "Tambahkan sumber untuk topik yang ingin kamu pelajari."
              )}
              <span className="mt-0.5 block text-[10px] font-semibold text-violet-700">
                Sesi fokus: {durationMinutes} menit
              </span>
            </p>
          </div>
          <div className="grid items-start gap-5 xl:grid-cols-[minmax(250px,0.85fr)_minmax(0,1.4fr)]">
            <div className="min-w-0 space-y-3">
              <div className="flex items-center justify-between gap-2">
                <h3 className="flex items-center gap-2 text-sm font-extrabold text-slate-900">
                  <BookOpen className="h-4 w-4 text-violet-600" /> Materi saya
                </h3>
                <span className="text-[10px] font-bold text-slate-400">
                  {sources.length}/{MAX_SOURCES} sumber
                </span>
              </div>
              <div
                onDragOver={(event) => event.preventDefault()}
                onDrop={(event) => {
                  event.preventDefault();
                  void uploadFiles(Array.from(event.dataTransfer.files));
                }}
                className="rounded-2xl border border-dashed border-violet-200 bg-violet-50/40 p-4 text-center"
              >
                <Upload className="mx-auto mb-2 h-6 w-6 text-violet-500" />
                <p className="text-xs font-bold text-slate-700">
                  Unggah atau letakkan file materi di sini
                </p>
                <p className="mt-1 text-[10px] leading-relaxed text-slate-500">
                  PDF, DOCX, TXT, Markdown · Maksimal 10 MB per file
                </p>
                <p className="mt-1 text-[10px] leading-relaxed text-slate-500">
                  PDF perlu berisi teks yang bisa dipilih. Scan atau tulisan
                  tangan perlu diubah menjadi teks (OCR) terlebih dahulu.
                </p>
                <input
                  ref={fileInputRef}
                  type="file"
                  multiple
                  accept=".pdf,.docx,.txt,.md"
                  className="hidden"
                  aria-label="Pilih file materi belajar"
                  disabled={busy || sources.length >= MAX_SOURCES}
                  onChange={(event) => {
                    const files = Array.from(event.target.files || []);
                    event.target.value = "";
                    void uploadFiles(files);
                  }}
                />
                <div className="mt-3 flex flex-wrap justify-center gap-2">
                  <button
                    type="button"
                    disabled={busy || sources.length >= MAX_SOURCES}
                    onClick={() => fileInputRef.current?.click()}
                    className="rounded-xl bg-violet-600 px-3 py-2 text-xs font-bold text-white hover:bg-violet-700 disabled:opacity-50"
                  >
                    Pilih file
                  </button>
                  <button
                    type="button"
                    disabled={busy || sources.length >= MAX_SOURCES}
                    onClick={() => setShowNoteForm((open) => !open)}
                    className="flex items-center gap-1 rounded-xl border border-violet-200 bg-white px-3 py-2 text-xs font-bold text-violet-700 disabled:opacity-50"
                  >
                    <Plus className="h-3.5 w-3.5" /> Tempel materi
                  </button>
                </div>
              </div>
              {isUploading && (
                <p
                  role="status"
                  className="flex items-center gap-2 break-all text-xs text-violet-700"
                >
                  <LoaderCircle className="h-4 w-4 shrink-0 animate-spin" />{" "}
                  Membaca {uploadName}…
                </p>
              )}
              {hydratedKey !== conversationKey && (
                <p role="status" className="text-xs text-slate-500">
                  Memuat materi tersimpan…
                </p>
              )}
              {showNoteForm && (
                <form
                  onSubmit={addNote}
                  className="space-y-2 rounded-2xl border border-slate-200 bg-white p-3"
                >
                  <label
                    htmlFor={`${componentId}-title`}
                    className="block text-xs font-bold text-slate-700"
                  >
                    Judul materi
                  </label>
                  <input
                    id={`${componentId}-title`}
                    value={noteTitle}
                    onChange={(event) => setNoteTitle(event.target.value)}
                    maxLength={200}
                    placeholder="Contoh: Catatan kuliah Bab 1"
                    disabled={busy}
                    className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs text-slate-800 outline-none focus:border-violet-400"
                  />
                  <label
                    htmlFor={`${componentId}-note`}
                    className="block text-xs font-bold text-slate-700"
                  >
                    Isi materi
                  </label>
                  <textarea
                    id={`${componentId}-note`}
                    rows={6}
                    maxLength={MAX_SOURCE_CHARACTERS + 1}
                    value={noteText}
                    onChange={(event) => setNoteText(event.target.value)}
                    placeholder="Tempel isi catatan, artikel, atau transkrip yang akan kamu pelajari. Tautan saja belum dapat dibaca."
                    disabled={busy}
                    className="w-full resize-y rounded-xl border border-slate-200 px-3 py-2 text-xs leading-relaxed text-slate-800 outline-none focus:border-violet-400"
                  />
                  <p
                    className={`text-right text-[10px] ${noteText.length > MAX_SOURCE_CHARACTERS ? "text-red-600" : "text-slate-400"}`}
                  >
                    {noteText.length.toLocaleString("id-ID")}/
                    {MAX_SOURCE_CHARACTERS.toLocaleString("id-ID")} karakter
                  </p>
                  <div className="flex justify-end gap-2">
                    <button
                      type="button"
                      disabled={busy}
                      onClick={() => setShowNoteForm(false)}
                      className="px-3 py-2 text-xs font-bold text-slate-500"
                    >
                      Batal
                    </button>
                    <button
                      type="submit"
                      disabled={busy || !noteText.trim()}
                      className="rounded-xl bg-violet-600 px-3 py-2 text-xs font-bold text-white disabled:opacity-50"
                    >
                      Tambahkan sumber
                    </button>
                  </div>
                </form>
              )}
              {sourceError && (
                <p
                  role="alert"
                  className="whitespace-pre-wrap break-words rounded-xl bg-amber-50 px-3 py-2 text-xs leading-relaxed text-amber-800"
                >
                  {sourceError}
                </p>
              )}
              {serviceNotice && (
                <p
                  role="alert"
                  className="rounded-xl bg-amber-50 px-3 py-2 text-xs leading-relaxed text-amber-800"
                >
                  {serviceNotice}
                </p>
              )}
              {!sources.length && hydratedKey === conversationKey && (
                <p className="rounded-xl bg-slate-50 p-3 text-xs leading-relaxed text-slate-500">
                  Belum ada materi. Coach mulai menjawab setelah kamu
                  menambahkan sumber.
                </p>
              )}
              <ul className="space-y-2">
                {sources.map((source) => (
                  <li
                    key={source.id}
                    className={`flex items-start gap-2 rounded-xl border p-3 ${source.enabled ? "border-violet-200 bg-violet-50/30" : "border-slate-200 bg-slate-50"}`}
                  >
                    <input
                      type="checkbox"
                      checked={source.enabled}
                      disabled={busy}
                      onChange={() =>
                        updateSources(
                          sources.map((item) =>
                            item.id === source.id
                              ? { ...item, enabled: !item.enabled }
                              : item,
                          ),
                        )
                      }
                      aria-label={`Gunakan sumber ${source.name}`}
                      className="mt-1 shrink-0 accent-violet-600"
                    />
                    <FileText className="mt-0.5 h-4 w-4 shrink-0 text-violet-500" />
                    <div className="min-w-0 flex-1">
                      <p className="break-words text-xs font-bold text-slate-800">
                        {source.name}
                      </p>
                      <p className="mt-1 text-[10px] text-slate-500">
                        {source.kind.toUpperCase()} ·{" "}
                        {sourceCharacterCount(source).toLocaleString("id-ID")}{" "}
                        karakter
                        {source.kind === "pdf"
                          ? ` · ${source.sections.length} halaman berisi teks`
                          : ""}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setPreview({ sourceId: source.id })}
                      title="Lihat isi materi"
                      aria-label={`Lihat isi ${source.name}`}
                      className="rounded-lg p-1 text-slate-400 hover:bg-white hover:text-violet-600"
                    >
                      <Eye className="h-4 w-4" />
                    </button>
                    <button
                      type="button"
                      disabled={busy}
                      onClick={() =>
                        updateSources(
                          sources.filter((item) => item.id !== source.id),
                        )
                      }
                      title="Hapus sumber"
                      aria-label={`Hapus sumber ${source.name}`}
                      className="rounded-lg p-1 text-slate-400 hover:bg-red-50 hover:text-red-500 disabled:opacity-40"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </li>
                ))}
              </ul>
              {sources.length > 0 && (
                <p className="text-[10px] leading-relaxed text-slate-500">
                  {activeSources.length} sumber dipilih ·{" "}
                  {totalCharacters.toLocaleString("id-ID")}/
                  {MAX_TOTAL_CHARACTERS.toLocaleString("id-ID")} karakter.
                  Mengubah pilihan materi memulai percakapan baru.
                </p>
              )}
              {storageNotice && (
                <p
                  role="status"
                  className="rounded-xl bg-amber-50 p-3 text-[11px] leading-relaxed text-amber-800"
                >
                  {storageNotice}
                </p>
              )}
              <p className="text-[10px] leading-relaxed text-slate-400">
                Materi tersimpan di browser ini untuk akun dan tugas yang sama.
                Isi sumber terpilih dikirim ke layanan AI saat kamu bertanya.
              </p>
            </div>

            <div className="min-w-0 space-y-3">
              {previewSource && (
                <div
                  ref={previewRef}
                  className="rounded-2xl border border-violet-200 bg-white p-3"
                >
                  <div className="mb-2 flex items-start justify-between gap-2">
                    <h4 className="break-words text-xs font-extrabold text-violet-800">
                      {previewSource.name}
                    </h4>
                    <button
                      type="button"
                      onClick={() => setPreview(null)}
                      aria-label="Tutup pratinjau materi"
                      className="p-1 text-slate-400"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                  {preview?.quote && (
                    <blockquote className="mb-3 border-l-2 border-violet-400 bg-violet-50 p-3 text-xs leading-relaxed text-violet-900">
                      Kutipan rujukan: “{preview.quote}”
                    </blockquote>
                  )}
                  <div className="max-h-72 space-y-4 overflow-y-auto rounded-xl bg-slate-50 p-3">
                    {previewSource.sections
                      .filter(
                        (section) =>
                          !preview?.quote ||
                          section.text
                            .normalize("NFKC")
                            .replace(/\s+/g, " ")
                            .includes(
                              preview.quote
                                .normalize("NFKC")
                                .replace(/\s+/g, " "),
                            ),
                      )
                      .map((section, index) => (
                        <div key={index}>
                          <p className="mb-1 text-[10px] font-bold text-violet-600">
                            {section.page
                              ? `Halaman ${section.page}`
                              : "Isi materi"}
                          </p>
                          <p className="whitespace-pre-wrap break-words text-xs leading-relaxed text-slate-700">
                            {section.text}
                          </p>
                        </div>
                      ))}
                  </div>
                </div>
              )}
              <div className="flex items-center justify-between gap-2">
                <h3 className="text-sm font-extrabold text-slate-900">
                  Belajar dari materi
                </h3>
                <span className="flex items-center gap-1 text-[10px] font-bold text-violet-600">
                  <Check className="h-3.5 w-3.5" /> Rujukan dapat dibuka
                </span>
              </div>
              <div
                className="max-h-[480px] min-h-48 space-y-3 overflow-y-auto rounded-2xl border border-slate-100 bg-slate-50/70 p-3 sm:p-4"
                aria-live="polite"
                aria-label="Percakapan dengan AI Study Coach"
              >
                {messages.length === 0 && (
                  <div className="flex min-h-40 flex-col justify-center">
                    <p className="mb-3 text-center text-xs leading-relaxed text-slate-500">
                      {activeSources.length
                        ? "Pilih bantuan atau tulis pertanyaan tentang sumbermu."
                        : "Tambahkan materi terlebih dahulu. Coach akan menggunakan sumber yang kamu pilih."}
                    </p>
                    <div className="flex flex-wrap justify-center gap-2">
                      {STARTER_PROMPTS.map((prompt) => (
                        <button
                          key={prompt}
                          type="button"
                          disabled={busy || !activeSources.length}
                          onClick={() => void sendMessage(prompt)}
                          className="rounded-2xl border border-violet-200 bg-white px-3 py-2 text-[11px] font-bold text-violet-700 transition hover:bg-violet-50 disabled:cursor-not-allowed disabled:opacity-40"
                        >
                          {prompt}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
                {messages.map((message, index) => (
                  <div
                    key={`${message.role}-${index}`}
                    className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}
                  >
                    <div
                      className={`max-w-[95%] rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed ${message.role === "user" ? "rounded-br-md bg-[#FF5500] text-white" : "rounded-bl-md border border-slate-200 bg-white text-slate-700"}`}
                    >
                      {message.role === "assistant" && (
                        <p className="mb-1 text-[10px] font-extrabold uppercase tracking-wide text-violet-600">
                          Study Coach
                          {message.notFound ? " · Materi belum mencukupi" : ""}
                        </p>
                      )}
                      <p className="whitespace-pre-wrap break-words">
                        {message.text}
                      </p>
                      {Boolean(message.citations?.length) && (
                        <div className="mt-3 space-y-2 border-t border-slate-100 pt-2">
                          <p className="text-[10px] font-bold text-slate-500">
                            Rujukan materi
                          </p>
                          {message.citations?.map((citation, citationIndex) => (
                            <button
                              key={citationIndex}
                              type="button"
                              onClick={() => showCitation(citation)}
                              className="block w-full rounded-xl bg-violet-50 p-2.5 text-left hover:bg-violet-100"
                            >
                              <span className="block text-[11px] font-bold text-violet-700">
                                [{citationIndex + 1}] {citation.sourceName} ·{" "}
                                {citation.location}
                              </span>
                              <span className="mt-1 block text-[11px] leading-relaxed text-slate-600">
                                “{citation.quote}”
                              </span>
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
                {isSending && (
                  <div className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-3.5 py-2.5 text-xs font-semibold text-slate-500">
                    <LoaderCircle className="h-4 w-4 animate-spin text-violet-600" />{" "}
                    Coach sedang menyiapkan materi dan menyusun jawaban.
                    Proses ini dapat memerlukan beberapa menit.
                  </div>
                )}
                {statusHint && (
                  <p
                    role="status"
                    className="px-1 text-xs leading-relaxed text-violet-600"
                  >
                    {statusHint}
                  </p>
                )}
                <div ref={endOfMessagesRef} />
              </div>
              {error && (
                <p
                  role="alert"
                  className="rounded-xl bg-amber-50 px-3 py-2 text-xs leading-relaxed text-amber-800"
                >
                  {error}
                </p>
              )}
              <form onSubmit={handleSubmit} className="flex items-end gap-2">
                <label className="sr-only" htmlFor={`${componentId}-message`}>
                  Tulis pertanyaan tentang materi
                </label>
                <textarea
                  id={`${componentId}-message`}
                  rows={2}
                  maxLength={MAX_QUESTION_CHARACTERS}
                  value={draft}
                  disabled={busy || !activeSources.length}
                  onChange={(event) => setDraft(event.target.value)}
                  onKeyDown={(event) => {
                    if (
                      event.key === "Enter" &&
                      !event.shiftKey &&
                      !event.nativeEvent.isComposing
                    ) {
                      event.preventDefault();
                      void sendMessage(draft);
                    }
                  }}
                  placeholder={
                    activeSources.length
                      ? "Tanyakan sesuatu berdasarkan materi yang dipilih…"
                      : "Tambahkan dan pilih materi untuk mulai bertanya…"
                  }
                  className="min-h-12 min-w-0 flex-1 resize-y rounded-2xl border border-slate-200 bg-white px-3.5 py-3 text-sm text-slate-800 outline-none focus:border-violet-400 focus:ring-2 focus:ring-violet-100 disabled:bg-slate-50"
                />
                <button
                  type="submit"
                  disabled={!draft.trim() || busy || !activeSources.length}
                  aria-label="Kirim pertanyaan tentang materi"
                  className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-violet-600 text-white hover:bg-violet-700 disabled:cursor-not-allowed disabled:bg-slate-300"
                >
                  {isSending ? (
                    <LoaderCircle className="h-5 w-5 animate-spin" />
                  ) : (
                    <Send className="h-5 w-5" />
                  )}
                </button>
              </form>
              <p className="text-[10px] leading-relaxed text-slate-400">
                Coach mengacu pada sumber terpilih. Periksa kutipan rujukan saat
                belajar; jika informasi belum ditemukan, tambahkan materi yang
                relevan.
              </p>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
