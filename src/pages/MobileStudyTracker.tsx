import React, { useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import {
  AlertTriangle,
  BookOpen,
  Check,
  CheckCircle2,
  Clock3,
  Coins,
  History,
  ListChecks,
  Pause,
  Play,
  Plus,
  RefreshCw,
  ShieldCheck,
  Sparkles,
  Timer,
  X,
} from "lucide-react";
import { AppUser } from "../data/appData";
import { earnPoints } from "../lib/pointlab";
import AIStudyCoach from "../components/AIStudyCoach";

export type TaskStatus = "todo" | "in_progress" | "completed";

export interface Task {
  id: string;
  title: string;
  status: TaskStatus;
  createdAt: string;
  completedAt?: string;
}

export type StudySessionStatus =
  | "running"
  | "paused"
  | "evaluation"
  | "completed"
  | "cancelled";

export interface StudySession {
  id: string;
  taskId: string;
  taskTitle: string;
  durationMinutes: number;
  remainingSeconds: number;
  focusedSeconds: number;
  status: StudySessionStatus;
  startedAt: string;
  updatedAt: string;
  endedAt?: string;
  outcome?: "completed" | "in_progress";
  rewardCoins?: number;
  bonusCoins?: number;
  rewardStatus?: "credited" | "pending" | "local";
}

type LegacyStudySession = Omit<StudySession, "status"> & { status: "focus_check" };

interface MobileStudyTrackerProps {
  userId: string | null;
  user: AppUser;
  accessToken?: string | null;
  onRefreshUser?: () => void;
  isActive?: boolean;
}

interface StudyHistoryItem {
  id: string;
  createdAt: string;
  taskTitle: string;
  durationMinutes: number;
  coins: number;
  outcome?: "completed" | "in_progress";
}

interface StudyRewardBudget {
  earnedCoins: number;
  cooldownUntil: string | null;
}

const DURATIONS = [15, 25, 45, 60] as const;
const IDLE_PAUSE_MS = 80_000;
const STUDY_REWARD_CAP = 200;
const STUDY_COOLDOWN_MS = 3 * 24 * 60 * 60 * 1000;
const COMPLETED_COINS_PER_MINUTE = 5;
const IN_PROGRESS_COINS_PER_MINUTE = 3;
const COMPLETION_BONUS_COINS = 20;

function createId(prefix: string): string {
  return `${prefix}-${globalThis.crypto?.randomUUID?.() ?? `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`}`;
}

function readJson<T>(key: string, fallback: T): T {
  try {
    const value = localStorage.getItem(key);
    return value ? (JSON.parse(value) as T) : fallback;
  } catch {
    return fallback;
  }
}

function writeJson(key: string, value: unknown): void {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // Keep the current session usable when browser storage is unavailable.
  }
}

function formatTime(totalSeconds: number): string {
  const safeSeconds = Math.max(0, Math.floor(totalSeconds));
  const minutes = Math.floor(safeSeconds / 60);
  const seconds = safeSeconds % 60;
  return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
}

function formatDate(value: string): string {
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? "Baru saja"
    : date.toLocaleString("id-ID", { dateStyle: "medium", timeStyle: "short" });
}

function formatRemainingTime(milliseconds: number): string {
  const totalMinutes = Math.max(0, Math.ceil(milliseconds / 60_000));
  const days = Math.floor(totalMinutes / (24 * 60));
  const hours = Math.floor((totalMinutes % (24 * 60)) / 60);
  const minutes = totalMinutes % 60;
  return [days > 0 ? `${days} hari` : "", hours > 0 ? `${hours} jam` : "", minutes > 0 ? `${minutes} menit` : ""]
    .filter(Boolean)
    .join(" ") || "kurang dari 1 menit";
}

function normalizeHistory(value: unknown): StudyHistoryItem[] {
  const records = Array.isArray(value)
    ? value
    : value && typeof value === "object" && "sessions" in value && Array.isArray(value.sessions)
      ? value.sessions
      : [];

  return records.map((entry, index) => {
    const row = entry && typeof entry === "object" ? (entry as Record<string, unknown>) : {};
    const duration = Number(row.durationMinutes ?? row.duration ?? 0);
    const coins = Number(row.coins ?? row.points ?? 0);
    const outcome = row.outcome === "completed" || row.outcome === "in_progress" ? row.outcome : undefined;
    return {
      id: String(row.id ?? `remote-${index}`),
      createdAt: String(row.createdAt ?? row.created_at ?? new Date().toISOString()),
      taskTitle: String(row.taskTitle ?? row.task_title ?? row.notes ?? "Sesi Gami-Study"),
      durationMinutes: Number.isFinite(duration) ? duration : 0,
      coins: Number.isFinite(coins) ? coins : 0,
      outcome,
    };
  });
}

function statusLabel(status: TaskStatus): string {
  if (status === "completed") return "Selesai";
  if (status === "in_progress") return "Berlangsung";
  return "Belum dikerjakan";
}

export default function MobileStudyTracker({ userId, user, accessToken = null, onRefreshUser, isActive = true }: MobileStudyTrackerProps) {
  const storageKey = `gami_study_${userId ?? "guest"}`;
  const [tasks, setTasks] = useState<Task[]>([]);
  const [selectedTaskId, setSelectedTaskId] = useState("");
  const [session, setSession] = useState<StudySession | null>(null);
  const [history, setHistory] = useState<StudyHistoryItem[]>([]);
  const [rewardBudget, setRewardBudget] = useState<StudyRewardBudget>({ earnedCoins: 0, cooldownUntil: null });
  const [clockNow, setClockNow] = useState(Date.now());
  const [durationMinutes, setDurationMinutes] = useState<number>(25);
  const [quickTaskTitle, setQuickTaskTitle] = useState("");
  const [taskError, setTaskError] = useState("");
  const [sessionNotice, setSessionNotice] = useState("");
  const [showCancelConfirm, setShowCancelConfirm] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submissionNote, setSubmissionNote] = useState("");
  const [hydratedForKey, setHydratedForKey] = useState("");

  const sessionRef = useRef<StudySession | null>(null);
  const lastTickAtRef = useRef(Date.now());
  const hiddenAtRef = useRef<number | null>(null);
  const lastActivityAtRef = useRef(Date.now());
  const submissionLockRef = useRef(false);

  const selectedTask = useMemo(
    () => tasks.find((task) => task.id === selectedTaskId && task.status !== "completed"),
    [tasks, selectedTaskId],
  );

  const isSessionLive = session?.status === "running" || session?.status === "paused";
  const isRewardBudgetReady = hydratedForKey === storageKey;
  const cooldownUntilMs = rewardBudget.cooldownUntil ? Date.parse(rewardBudget.cooldownUntil) : null;
  const isStudyLocked = isRewardBudgetReady && (rewardBudget.earnedCoins >= STUDY_REWARD_CAP || (cooldownUntilMs !== null && cooldownUntilMs > clockNow));
  const availableStudyCoins = !isRewardBudgetReady || isStudyLocked ? 0 : Math.max(0, STUDY_REWARD_CAP - rewardBudget.earnedCoins);
  const progressPercent = session
    ? Math.min(100, Math.max(0, (session.focusedSeconds / (session.durationMinutes * 60)) * 100))
    : 0;

  const commitSession = (nextSession: StudySession | null) => {
    sessionRef.current = nextSession;
    setSession(nextSession);
  };

  useEffect(() => {
    const savedTasks = readJson<Task[] | null>(`${storageKey}_tasks`, null);
    const restoredTasks = Array.isArray(savedTasks) ? savedTasks : [];
    setTasks(restoredTasks);

    const savedSelection = readJson<string>(`${storageKey}_selected_task`, "");
    setSelectedTaskId(restoredTasks.some((task) => task.id === savedSelection && task.status !== "completed")
      ? savedSelection
      : restoredTasks.find((task) => task.status !== "completed")?.id ?? "");

    const savedDuration = readJson<number>(`${storageKey}_duration`, 25);
    setDurationMinutes(DURATIONS.includes(savedDuration as (typeof DURATIONS)[number]) ? savedDuration : 25);

    const restoredSession = readJson<(StudySession | LegacyStudySession) | null>(`${storageKey}_session`, null);
    if (restoredSession && (restoredSession.status === "running" || restoredSession.status === "focus_check")) {
      const pausedSession: StudySession = {
        ...restoredSession,
        status: "paused",
        updatedAt: new Date().toISOString(),
      };
      sessionRef.current = pausedSession;
      setSession(pausedSession);
      setSessionNotice("Sesi sebelumnya dipulihkan dalam keadaan dijeda. Lanjutkan saat kamu siap.");
    } else {
      sessionRef.current = restoredSession;
      setSession(restoredSession);
      setSessionNotice("");
    }

    const localHistory = readJson<StudyHistoryItem[]>(`${storageKey}_history`, []);
    setHistory(Array.isArray(localHistory) ? localHistory : []);

    const savedBudget = readJson<Partial<StudyRewardBudget> | null>(`${storageKey}_reward_budget`, null);
    const earnedCoins = Math.max(0, Number(savedBudget?.earnedCoins) || 0);
    const parsedCooldown = typeof savedBudget?.cooldownUntil === "string" ? Date.parse(savedBudget.cooldownUntil) : Number.NaN;
    if (Number.isFinite(parsedCooldown) && parsedCooldown > Date.now()) {
      setRewardBudget({ earnedCoins: Math.min(STUDY_REWARD_CAP, earnedCoins), cooldownUntil: new Date(parsedCooldown).toISOString() });
    } else if (Number.isFinite(parsedCooldown) && parsedCooldown <= Date.now()) {
      setRewardBudget({ earnedCoins: 0, cooldownUntil: null });
    } else if (earnedCoins >= STUDY_REWARD_CAP) {
      setRewardBudget({ earnedCoins: STUDY_REWARD_CAP, cooldownUntil: new Date(Date.now() + STUDY_COOLDOWN_MS).toISOString() });
    } else {
      setRewardBudget({ earnedCoins, cooldownUntil: null });
    }
    setClockNow(Date.now());
    setHydratedForKey(storageKey);
  }, [storageKey]);

  useEffect(() => {
    if (hydratedForKey !== storageKey) return;
    writeJson(`${storageKey}_tasks`, tasks);
    writeJson(`${storageKey}_selected_task`, selectedTaskId);
    writeJson(`${storageKey}_duration`, durationMinutes);
  }, [storageKey, hydratedForKey, tasks, selectedTaskId, durationMinutes]);

  useEffect(() => {
    if (hydratedForKey !== storageKey) return;
    writeJson(`${storageKey}_session`, session);
  }, [storageKey, hydratedForKey, session]);

  useEffect(() => {
    if (hydratedForKey !== storageKey) return;
    writeJson(`${storageKey}_history`, history);
  }, [storageKey, hydratedForKey, history]);

  useEffect(() => {
    if (hydratedForKey !== storageKey) return;
    writeJson(`${storageKey}_reward_budget`, rewardBudget);
  }, [storageKey, hydratedForKey, rewardBudget]);

  useEffect(() => {
    const budgetKey = `${storageKey}_reward_budget`;
    const syncBudgetFromAnotherTab = (event: StorageEvent) => {
      if (event.key !== budgetKey || !event.newValue) return;
      try {
        const nextBudget = JSON.parse(event.newValue) as Partial<StudyRewardBudget>;
        const earnedCoins = Math.max(0, Math.min(STUDY_REWARD_CAP, Number(nextBudget.earnedCoins) || 0));
        const cooldownUntil = typeof nextBudget.cooldownUntil === "string" ? nextBudget.cooldownUntil : null;
        setRewardBudget({ earnedCoins, cooldownUntil });
      } catch {
        // Ignore malformed values from another tab.
      }
    };

    window.addEventListener("storage", syncBudgetFromAnotherTab);
    return () => window.removeEventListener("storage", syncBudgetFromAnotherTab);
  }, [storageKey]);

  useEffect(() => {
    if (!rewardBudget.cooldownUntil) return;
    const cooldownUntil = Date.parse(rewardBudget.cooldownUntil);
    const intervalId = window.setInterval(() => {
      const now = Date.now();
      setClockNow(now);
      if (now >= cooldownUntil) setRewardBudget({ earnedCoins: 0, cooldownUntil: null });
    }, 1000);
    return () => window.clearInterval(intervalId);
  }, [rewardBudget.cooldownUntil]);

  useEffect(() => {
    if (!userId) return;
    let isCurrent = true;

    fetch(`https://geasture.kolab.top/api/users/${userId}/study-sessions`, { cache: "no-store" })
      .then(async (response) => {
        if (!response.ok) throw new Error(`Study history request failed: ${response.status}`);
        return normalizeHistory(await response.json());
      })
      .then((remoteHistory) => {
        if (!isCurrent) return;
        setHistory(remoteHistory);
        writeJson(`${storageKey}_history`, remoteHistory);
      })
      .catch(() => {
        // Local history remains available when the study API is offline.
      });

    return () => {
      isCurrent = false;
    };
  }, [storageKey, userId]);

  useEffect(() => {
    if (session?.status !== "running") return;
    lastTickAtRef.current = Date.now();

    const intervalId = window.setInterval(() => {
      if (document.visibilityState === "hidden") return;
      const current = sessionRef.current;
      if (!current || current.status !== "running") return;

      const now = Date.now();
      const elapsedSeconds = Math.floor((now - lastTickAtRef.current) / 1000);
      if (elapsedSeconds < 1) return;
      lastTickAtRef.current += elapsedSeconds * 1000;
      const focusedSeconds = Math.min(elapsedSeconds, current.remainingSeconds);
      const remainingSeconds = Math.max(0, current.remainingSeconds - focusedSeconds);

      if (remainingSeconds === 0) {
        commitSession({
          ...current,
          remainingSeconds: 0,
          focusedSeconds: current.focusedSeconds + focusedSeconds,
          status: "evaluation",
          endedAt: new Date(now).toISOString(),
          updatedAt: new Date(now).toISOString(),
        });
        return;
      }

      commitSession({
        ...current,
        remainingSeconds,
        focusedSeconds: current.focusedSeconds + focusedSeconds,
        updatedAt: new Date(now).toISOString(),
      });
    }, 250);

    return () => window.clearInterval(intervalId);
  }, [session?.status]);

  useEffect(() => {
    if (session?.status !== "running") return;

    lastActivityAtRef.current = Date.now();

    const markActivity = () => {
      // Browser APIs cannot observe activity in another browser tab. Start a fresh
      // idle window when this tab becomes visible again instead of pausing on return.
      if (document.visibilityState === "visible") lastActivityAtRef.current = Date.now();
    };

    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") lastActivityAtRef.current = Date.now();
    };

    const activityEvents = [
      "pointermove", "pointerdown", "pointerup", "mousemove", "mousedown",
      "touchstart", "touchmove", "keydown", "keyup", "wheel", "scroll",
      "click", "input", "change", "focusin", "submit",
    ] as const;
    activityEvents.forEach((eventName) => window.addEventListener(eventName, markActivity, { capture: true, passive: true }));
    document.addEventListener("visibilitychange", handleVisibilityChange);

    const idleIntervalId = window.setInterval(() => {
      if (document.visibilityState !== "visible") {
        lastActivityAtRef.current = Date.now();
        return;
      }

      const current = sessionRef.current;
      if (!current || current.status !== "running") return;
      if (Date.now() - lastActivityAtRef.current < IDLE_PAUSE_MS) return;

      commitSession({ ...current, status: "paused", updatedAt: new Date().toISOString() });
      setSessionNotice("Tidak ada aktivitas selama 1 menit 20 detik. Sesi dijeda otomatis; lanjutkan kembali saat siap.");
    }, 500);

    return () => {
      window.clearInterval(idleIntervalId);
      activityEvents.forEach((eventName) => window.removeEventListener(eventName, markActivity, true));
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [session?.status]);

  useEffect(() => {
    const recordAwayTime = () => {
      if (hiddenAtRef.current !== null) return;
      hiddenAtRef.current = Date.now();
    };

    const resumeFromAwayTime = () => {
      if (hiddenAtRef.current === null) return;
      hiddenAtRef.current = null;
      const current = sessionRef.current;
      const now = Date.now();
      if (current?.status === "running") {
        const elapsedSeconds = Math.max(0, Math.floor((now - lastTickAtRef.current) / 1000));
        if (elapsedSeconds > 0) {
          const focusedSeconds = Math.min(elapsedSeconds, current.remainingSeconds);
          const remainingSeconds = Math.max(0, current.remainingSeconds - focusedSeconds);
          if (remainingSeconds === 0) {
            commitSession({
              ...current,
              remainingSeconds: 0,
              focusedSeconds: current.focusedSeconds + focusedSeconds,
              status: "evaluation",
              endedAt: new Date(now).toISOString(),
              updatedAt: new Date(now).toISOString(),
            });
          } else {
            commitSession({
              ...current,
              remainingSeconds,
              focusedSeconds: current.focusedSeconds + focusedSeconds,
              updatedAt: new Date(now).toISOString(),
            });
          }
          lastTickAtRef.current += elapsedSeconds * 1000;
        }
      } else {
        lastTickAtRef.current = now;
      }
    };

    const handleVisibilityChange = () => {
      if (document.visibilityState === "hidden") recordAwayTime();
      else resumeFromAwayTime();
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    window.addEventListener("pagehide", recordAwayTime);
    window.addEventListener("pageshow", resumeFromAwayTime);
    if (!isActive || document.visibilityState === "hidden") recordAwayTime();
    else resumeFromAwayTime();
    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      window.removeEventListener("pagehide", recordAwayTime);
      window.removeEventListener("pageshow", resumeFromAwayTime);
    };
  }, [isActive]);

  const addQuickTask = () => {
    const title = quickTaskTitle.trim();
    if (!title) {
      setTaskError("Tulis nama tugas sebelum menambahkannya.");
      return;
    }

    const task: Task = {
      id: createId("task"),
      title: title.slice(0, 80),
      status: "todo",
      createdAt: new Date().toISOString(),
    };
    setTasks((currentTasks) => [task, ...currentTasks]);
    setSelectedTaskId(task.id);
    setQuickTaskTitle("");
    setTaskError("");
  };

  const startSession = () => {
    if (!isRewardBudgetReady) {
      setTaskError("Sedang memuat limit reward. Coba mulai lagi sebentar.");
      return;
    }
    if (isStudyLocked) {
      setTaskError("Batas koin Gami-Study tercapai. Coba lagi setelah masa limit berakhir.");
      return;
    }
    if (!selectedTask) {
      setTaskError("Pilih atau buat tugas terlebih dahulu untuk memulai sesi.");
      return;
    }

    const now = new Date();
    const nextSession: StudySession = {
      id: createId("study"),
      taskId: selectedTask.id,
      taskTitle: selectedTask.title,
      durationMinutes,
      remainingSeconds: durationMinutes * 60,
      focusedSeconds: 0,
      status: "running",
      startedAt: now.toISOString(),
      updatedAt: now.toISOString(),
    };
    setTasks((currentTasks) => currentTasks.map((task) =>
      task.id === selectedTask.id ? { ...task, status: "in_progress" } : task,
    ));
    setSessionNotice("");
    setSubmissionNote("");
    setShowCancelConfirm(false);
    lastTickAtRef.current = Date.now();
    commitSession(nextSession);
  };

  const pauseSession = () => {
    const current = sessionRef.current;
    if (!current || current.status !== "running") return;
    commitSession({ ...current, status: "paused", updatedAt: new Date().toISOString() });
    setSessionNotice("Sesi dijeda. Kamu bisa melanjutkannya kapan saja.");
  };

  const resumeSession = () => {
    const current = sessionRef.current;
    if (!current || current.status !== "paused") return;
    lastTickAtRef.current = Date.now();
    commitSession({ ...current, status: "running", updatedAt: new Date().toISOString() });
    setSessionNotice("");
  };

  const cancelSession = () => {
    const current = sessionRef.current;
    if (!current) return;
    commitSession({ ...current, status: "cancelled", updatedAt: new Date().toISOString() });
    setShowCancelConfirm(false);
    setSessionNotice("");
  };

  const finishSession = async (taskCompleted: boolean) => {
    const current = sessionRef.current;
    if (!current || current.status !== "evaluation" || submissionLockRef.current) return;
    submissionLockRef.current = true;
    setIsSubmitting(true);
    setSubmissionNote("");

    const focusedMinutes = current.focusedSeconds / 60;
    const requestedBaseCoins = taskCompleted
      ? Math.floor(focusedMinutes * COMPLETED_COINS_PER_MINUTE)
      : Math.floor(focusedMinutes * IN_PROGRESS_COINS_PER_MINUTE);
    const requestedBonusCoins = taskCompleted ? COMPLETION_BONUS_COINS : 0;
    const requestedCoins = requestedBaseCoins + requestedBonusCoins;
    const nowMs = Date.now();
    const activeCooldownUntil = rewardBudget.cooldownUntil && Date.parse(rewardBudget.cooldownUntil) > nowMs
      ? rewardBudget.cooldownUntil
      : null;
    const cooldownExpired = Boolean(rewardBudget.cooldownUntil && Date.parse(rewardBudget.cooldownUntil) <= nowMs);
    const budgetEarnedBeforeSession = activeCooldownUntil
      ? STUDY_REWARD_CAP
      : cooldownExpired ? 0 : rewardBudget.earnedCoins;
    const coinsLeftBeforeSession = activeCooldownUntil
      ? 0
      : Math.max(0, STUDY_REWARD_CAP - budgetEarnedBeforeSession);
    const earnedCoins = Math.min(requestedCoins, coinsLeftBeforeSession);
    const nextBudgetEarned = Math.min(STUDY_REWARD_CAP, budgetEarnedBeforeSession + earnedCoins);
    const cooldownUntil = activeCooldownUntil ?? (nextBudgetEarned >= STUDY_REWARD_CAP
      ? new Date(nowMs + STUDY_COOLDOWN_MS).toISOString()
      : null);
    const nextRewardBudget: StudyRewardBudget = {
      earnedCoins: nextBudgetEarned,
      cooldownUntil,
    };
    setRewardBudget(nextRewardBudget);
    const capNote = earnedCoins < requestedCoins
      ? `Batas ${STUDY_REWARD_CAP} koin tercapai; reward sesi ini dibatasi menjadi ${earnedCoins} koin.`
      : "";

    const awardedBonusCoins = Math.min(requestedBonusCoins, Math.max(0, earnedCoins - requestedBaseCoins));
    const now = new Date().toISOString();
    const outcome = taskCompleted ? "completed" : "in_progress";
    const updatedTaskStatus: TaskStatus = taskCompleted ? "completed" : "in_progress";
    const historyItem: StudyHistoryItem = {
      id: current.id,
      createdAt: now,
      taskTitle: current.taskTitle,
      durationMinutes: Math.round(current.focusedSeconds / 60),
      coins: earnedCoins,
      outcome,
    };

    setTasks((currentTasks) => currentTasks.map((task) => task.id === current.taskId
      ? { ...task, status: updatedTaskStatus, ...(taskCompleted ? { completedAt: now } : {}) }
      : task,
    ));
    const updatedHistory = [historyItem, ...history.filter((item) => item.id !== current.id)].slice(0, 50);
    setHistory(updatedHistory);
    writeJson(`${storageKey}_history`, updatedHistory);

    let rewardStatus: StudySession["rewardStatus"] = userId && earnedCoins === 0 ? "credited" : "local";
    let remoteSessionSaved = false;
    if (userId) {
      try {
        const sessionResponse = await fetch(`https://geasture.kolab.top/api/users/${userId}/study-sessions`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            task_id: current.taskId,
            task_title: current.taskTitle,
            task_status: updatedTaskStatus,
            outcome,
            duration: historyItem.durationMinutes,
            planned_duration: current.durationMinutes,
            focused_seconds: current.focusedSeconds,
            notes: `Gami-Study: ${current.taskTitle}`,
            points: earnedCoins,
            coins: earnedCoins,
            session_id: current.id,
            study_reward_cap: STUDY_REWARD_CAP,
            study_reward_period_days: 3,
            study_reward_total: nextRewardBudget.earnedCoins,
            study_reward_cooldown_until: nextRewardBudget.cooldownUntil,
          }),
        });
        remoteSessionSaved = sessionResponse.ok;
      } catch {
        remoteSessionSaved = false;
      }

      if (earnedCoins > 0) {
        // API resmi Loyalty Points (PointLab) menggantikan legacy earn-coins.
        const memberId = user?.memberId ?? null;
        const description = taskCompleted
          ? `Gami-Study: tugas selesai — ${current.taskTitle}`
          : `Gami-Study: sesi fokus — ${current.taskTitle}`;
        try {
          if (memberId && accessToken) {
            await earnPoints(memberId, accessToken, {
              points: earnedCoins,
              source: "GAMIFICATION",
              referenceType: "STUDY_SESSION",
              referenceId: current.id,
              description,
              idempotencyKey: `gammi-study-${current.id}`,
            });
            rewardStatus = "credited";
          } else {
            rewardStatus = "pending";
          }
        } catch {
          rewardStatus = "pending";
        }
      }

      if (rewardStatus === "credited" && earnedCoins > 0) onRefreshUser?.();
      if (rewardStatus === "pending") {
        setSubmissionNote([capNote, "Sesi tersimpan di perangkat, tetapi koin belum terkonfirmasi oleh server."].filter(Boolean).join(" "));
      } else if (!remoteSessionSaved) {
        const syncNote = earnedCoins > 0
          ? "Koin berhasil dikirim. Riwayat sesi tersimpan di perangkat karena server riwayat sedang tidak tersedia."
          : "Riwayat sesi tersimpan di perangkat karena server sedang tidak tersedia.";
        setSubmissionNote([capNote, syncNote].filter(Boolean).join(" "));
      } else {
        setSubmissionNote(capNote);
      }
    } else {
      setSubmissionNote(capNote);
    }

    commitSession({
      ...current,
      status: "completed",
      outcome,
      rewardCoins: earnedCoins,
      bonusCoins: awardedBonusCoins,
      rewardStatus,
      endedAt: current.endedAt ?? now,
      updatedAt: now,
    });
    setIsSubmitting(false);
    submissionLockRef.current = false;
  };

  const startNewSession = () => {
    commitSession(null);
    setSessionNotice("");
    setSubmissionNote("");
    setTaskError("");
    const stillAvailableTask = tasks.find((task) => task.id === selectedTaskId && task.status !== "completed");
    if (!stillAvailableTask) setSelectedTaskId(tasks.find((task) => task.status !== "completed")?.id ?? "");
  };

  const estimatedFullReward = Math.min(availableStudyCoins, durationMinutes * COMPLETED_COINS_PER_MINUTE + COMPLETION_BONUS_COINS);
  const estimatedProgressReward = Math.min(availableStudyCoins, durationMinutes * IN_PROGRESS_COINS_PER_MINUTE);
  const sessionCompleteReward = session
    ? Math.min(availableStudyCoins, Math.floor((session.focusedSeconds / 60) * COMPLETED_COINS_PER_MINUTE) + COMPLETION_BONUS_COINS)
    : 0;
  const sessionProgressReward = session
    ? Math.min(availableStudyCoins, Math.floor((session.focusedSeconds / 60) * IN_PROGRESS_COINS_PER_MINUTE))
    : 0;

  return (
    <main className="relative mx-auto min-h-full w-full max-w-5xl overflow-hidden px-4 pb-32 pt-6 font-sans sm:px-6 sm:pt-8">
      <div className="pointer-events-none absolute -right-20 top-0 h-64 w-64 rounded-full bg-orange-200/40 blur-3xl" />
      <div className="relative z-10 mb-6 flex items-start justify-between gap-4">
        <div>
          <p className="text-xs font-extrabold uppercase tracking-[0.18em] text-[#FF5500]">Task-linked pomodoro</p>
          <h1 className="mt-1 text-3xl font-black tracking-tight text-slate-900">Gami-Study</h1>
          <p className="mt-1 max-w-xl text-sm text-slate-500">Hubungkan sesi fokus dengan tugas, lalu kumpulkan koin dari waktu belajarmu.</p>
        </div>
        <div className="flex shrink-0 items-center gap-2 rounded-2xl border border-orange-100 bg-white px-3 py-2 shadow-sm">
          <Coins className="h-4 w-4 text-[#FF5500]" />
          <span className="text-sm font-extrabold text-slate-800">{user.points.toLocaleString()}</span>
          <span className="hidden text-xs font-semibold text-slate-400 sm:inline">koin</span>
        </div>
      </div>

      <AIStudyCoach
        taskTitle={session?.taskTitle ?? selectedTask?.title}
        durationMinutes={session?.durationMinutes ?? durationMinutes}
        conversationKey={`${userId ?? "guest"}:${session?.taskId ?? selectedTaskId ?? "none"}`}
      />

      {!isSessionLive && session?.status !== "evaluation" && session?.status !== "completed" && isStudyLocked && (
        <section className="relative z-10 mx-auto max-w-xl rounded-3xl border border-amber-200 bg-white p-6 text-center shadow-sm sm:p-8">
          <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-amber-50 text-amber-600"><Coins className="h-7 w-7" /></span>
          <p className="mt-4 text-xs font-extrabold uppercase tracking-[0.16em] text-amber-700">Limit reward tercapai</p>
          <h2 className="mt-1 text-2xl font-black text-slate-900">Gami-Study dijeda sementara</h2>
          <p className="mt-2 text-sm leading-relaxed text-slate-500">Kamu sudah mencapai batas {STUDY_REWARD_CAP} koin Gami-Study. Akses akan terbuka lagi setelah cooldown 3 hari.</p>
          {cooldownUntilMs !== null && cooldownUntilMs > clockNow && (
            <div className="mt-5 rounded-2xl bg-amber-50 px-4 py-3">
              <p className="text-sm font-extrabold text-amber-800">Sisa waktu: {formatRemainingTime(cooldownUntilMs - clockNow)}</p>
              <p className="mt-1 text-[11px] font-semibold text-amber-700">Bisa digunakan lagi {formatDate(new Date(cooldownUntilMs).toISOString())}</p>
            </div>
          )}
          <p className="mt-4 text-xs font-semibold text-slate-500">Limit koin akan diatur ulang saat cooldown selesai.</p>
        </section>
      )}

      {!isSessionLive && session?.status !== "evaluation" && session?.status !== "completed" && !isStudyLocked && (
        <section className="relative z-10 grid gap-5 lg:grid-cols-[minmax(0,1.35fr)_minmax(280px,0.8fr)]">
          <div className="space-y-5">
            <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
              <div className="mb-5 flex items-start gap-3">
                <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-orange-50 text-[#FF5500]"><ListChecks className="h-5 w-5" /></span>
                <div>
                  <h2 className="text-lg font-black text-slate-900">Pilih tugas belajar</h2>
                  <p className="mt-0.5 text-xs leading-relaxed text-slate-500">Pilih satu tugas yang ingin kamu kerjakan. Tugas wajib dipilih sebelum sesi dimulai.</p>
                </div>
              </div>

              {tasks.length > 0 ? (
                <div className="space-y-2">
                  {tasks.map((task) => {
                    const isSelected = selectedTaskId === task.id;
                    const isCompleted = task.status === "completed";
                    return (
                      <button
                        key={task.id}
                        type="button"
                        disabled={isCompleted}
                        onClick={() => { setSelectedTaskId(task.id); setTaskError(""); }}
                        aria-pressed={isSelected}
                        className={`flex w-full items-center gap-3 rounded-2xl border p-3.5 text-left transition ${isCompleted ? "cursor-not-allowed border-slate-100 bg-slate-50 opacity-60" : isSelected ? "border-orange-300 bg-orange-50/70 ring-2 ring-orange-100" : "border-slate-200 bg-white hover:border-orange-200 hover:bg-orange-50/30"}`}
                      >
                        <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${isCompleted ? "bg-emerald-50 text-emerald-600" : isSelected ? "bg-[#FF5500] text-white" : "bg-slate-100 text-slate-500"}`}>
                          {isCompleted ? <Check className="h-4 w-4" /> : <BookOpen className="h-4 w-4" />}
                        </span>
                        <span className="min-w-0 flex-1">
                          <span className="block truncate text-sm font-extrabold text-slate-800">{task.title}</span>
                          <span className="mt-0.5 block text-[11px] font-semibold text-slate-500">{statusLabel(task.status)}</span>
                        </span>
                        {isSelected && !isCompleted && <CheckCircle2 className="h-5 w-5 shrink-0 text-[#FF5500]" />}
                      </button>
                    );
                  })}
                </div>
              ) : (
                <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 px-4 py-5 text-center">
                  <BookOpen className="mx-auto h-6 w-6 text-slate-400" />
                  <p className="mt-2 text-sm font-bold text-slate-700">Belum ada tugas</p>
                  <p className="mt-1 text-xs text-slate-500">Buat quick task di bawah untuk mengatur sesi pertamamu.</p>
                </div>
              )}

              <div className="mt-4 rounded-2xl border border-slate-100 bg-slate-50 p-3.5">
                <label htmlFor="quick-task-title" className="mb-2 block text-xs font-extrabold text-slate-700">Buat quick task</label>
                <div className="flex gap-2">
                  <input
                    id="quick-task-title"
                    type="text"
                    maxLength={80}
                    value={quickTaskTitle}
                    onChange={(event) => { setQuickTaskTitle(event.target.value); setTaskError(""); }}
                    onKeyDown={(event) => { if (event.key === "Enter") { event.preventDefault(); addQuickTask(); } }}
                    placeholder="Contoh: Baca bab 3 Biologi"
                    className="h-11 min-w-0 flex-1 rounded-xl border border-slate-200 bg-white px-3 text-sm font-medium text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-orange-400 focus:ring-2 focus:ring-orange-100"
                  />
                  <button type="button" onClick={addQuickTask} aria-label="Tambah quick task" className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-slate-900 text-white transition hover:bg-slate-700 focus:outline-none focus:ring-2 focus:ring-slate-400">
                    <Plus className="h-5 w-5" />
                  </button>
                </div>
              </div>

              {taskError && <p role="alert" className="mt-3 text-xs font-semibold text-red-600">{taskError}</p>}
            </section>

            <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
              <div className="mb-4 flex items-start gap-3">
                <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-600"><Timer className="h-5 w-5" /></span>
                <div>
                  <h2 className="text-lg font-black text-slate-900">Atur durasi fokus</h2>
                  <p className="mt-0.5 text-xs text-slate-500">Pilih durasi Pomodoro untuk tugas ini.</p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                {DURATIONS.map((duration) => (
                  <button
                    key={duration}
                    type="button"
                    onClick={() => setDurationMinutes(duration)}
                    aria-pressed={durationMinutes === duration}
                    className={`rounded-2xl border px-3 py-3 text-center transition ${durationMinutes === duration ? "border-[#FF5500] bg-orange-50 text-[#FF5500] ring-2 ring-orange-100" : "border-slate-200 bg-white text-slate-600 hover:border-orange-200"}`}
                  >
                    <span className="block text-lg font-black">{duration}</span>
                    <span className="text-[10px] font-bold uppercase tracking-wider">menit</span>
                  </button>
                ))}
              </div>
              <div className="mt-4 grid grid-cols-2 gap-2 text-[11px]">
                <div className="rounded-xl bg-orange-50 px-3 py-2.5 text-orange-800"><span className="block font-extrabold">Selesai</span><span>{estimatedFullReward} koin termasuk bonus</span></div>
                <div className="rounded-xl bg-slate-50 px-3 py-2.5 text-slate-600"><span className="block font-extrabold">Belum selesai</span><span>{estimatedProgressReward} koin proporsional</span></div>
              </div>
              <p className="mt-3 text-[10px] leading-relaxed text-slate-400">Perkiraan berdasarkan {COMPLETED_COINS_PER_MINUTE} koin per menit + bonus {COMPLETION_BONUS_COINS} saat tugas selesai. Tugas berjalan mendapat {IN_PROGRESS_COINS_PER_MINUTE} koin per menit fokus.</p>
            </section>

              <div className="rounded-2xl border border-orange-100 bg-orange-50/70 px-4 py-3 text-xs font-semibold text-slate-600">
                <div className="flex items-center justify-between gap-3">
                  <span className="flex items-center gap-2 font-extrabold text-slate-800"><Coins className="h-4 w-4 text-[#FF5500]" /> Limit reward 3 hari</span>
                  <span>{rewardBudget.earnedCoins} / {STUDY_REWARD_CAP} koin</span>
                </div>
                <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-white">
                  <div className="h-full rounded-full bg-[#FF5500] transition-[width]" style={{ width: `${Math.min(100, (rewardBudget.earnedCoins / STUDY_REWARD_CAP) * 100)}%` }} />
                </div>
              </div>

              <button
              type="button"
              onClick={startSession}
              disabled={!selectedTask || isStudyLocked || !isRewardBudgetReady}
              className="flex h-14 w-full items-center justify-center gap-2 rounded-2xl bg-[#FF5500] px-5 text-base font-extrabold text-white shadow-lg shadow-orange-200 transition hover:bg-orange-600 focus:outline-none focus:ring-2 focus:ring-orange-400 focus:ring-offset-2 disabled:cursor-not-allowed disabled:bg-slate-300 disabled:shadow-none"
            >
              <Play className="h-5 w-5 fill-current" /> Mulai Belajar
            </button>
          </div>

          <aside className="space-y-5">
            <section className="rounded-3xl border border-orange-100 bg-gradient-to-br from-orange-50 to-white p-5 sm:p-6">
              <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white text-[#FF5500] shadow-sm"><ShieldCheck className="h-5 w-5" /></span>
              <h2 className="mt-4 text-base font-black text-slate-900">Sesi yang tetap fokus</h2>
              <ul className="mt-3 space-y-3 text-xs leading-relaxed text-slate-600">
                <li className="flex gap-2"><CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-500" /> Gerakan pointer, sentuhan, keyboard, scroll, dan interaksi lain di aplikasi mereset batas diam 1 menit 20 detik.</li>
                <li className="flex gap-2"><CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-500" /> Sesi dijeda otomatis hanya jika tidak ada aktivitas selama 1 menit 20 detik.</li>
                <li className="flex gap-2"><CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-500" /> Progres sesi disimpan di perangkat dan dipulihkan dalam keadaan dijeda.</li>
              </ul>
              <p className="mt-4 rounded-xl border border-orange-100 bg-white/80 p-3 text-[10px] leading-relaxed text-slate-500">Berpindah ke tab lain tidak langsung menjeda sesi. Waktu tetap dihitung, lalu timer diselaraskan saat kamu kembali.</p>
            </section>
          </aside>
        </section>
      )}

      {isSessionLive && session && (
        <section className="relative z-10 mx-auto max-w-xl">
          <div className="mb-4 flex items-center justify-between gap-3">
            <span className={`inline-flex items-center gap-2 rounded-full px-3 py-2 text-[11px] font-extrabold ${session.status === "running" ? "bg-emerald-50 text-emerald-700" : "bg-slate-100 text-slate-600"}`}>
              <span className={`h-2 w-2 rounded-full ${session.status === "running" ? "animate-pulse bg-emerald-500" : "bg-slate-400"}`} />
              {session.status === "running" ? "Fokus berjalan" : "Sesi dijeda"}
            </span>
            <button type="button" onClick={() => setShowCancelConfirm(true)} className="rounded-xl px-3 py-2 text-xs font-bold text-slate-500 transition hover:bg-red-50 hover:text-red-600">Akhiri sesi</button>
          </div>

          {sessionNotice && (
            <div role="status" className="mb-4 flex items-start gap-2 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-xs font-semibold leading-relaxed text-amber-900">
              <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
              <span className="flex-1">{sessionNotice}</span>
              <button type="button" onClick={() => setSessionNotice("")} aria-label="Tutup pemberitahuan" className="rounded p-0.5 hover:bg-amber-100"><X className="h-4 w-4" /></button>
            </div>
          )}

          <div className="overflow-hidden rounded-[32px] border border-slate-200 bg-white shadow-[0_20px_60px_rgba(15,23,42,0.08)]">
            <div className="border-b border-slate-100 p-5 sm:p-7">
              <p className="text-[10px] font-extrabold uppercase tracking-[0.16em] text-[#FF5500]">Tugas aktif</p>
              <h2 className="mt-1 break-words text-xl font-black leading-snug text-slate-900">{session.taskTitle}</h2>
              <p className="mt-1 flex items-center gap-1.5 text-xs font-semibold text-slate-500"><Clock3 className="h-3.5 w-3.5" /> Pomodoro {session.durationMinutes} menit</p>
            </div>
            <div className="p-6 text-center sm:p-8">
              <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-orange-50 text-[#FF5500]"><Timer className="h-7 w-7" /></div>
              <p className="font-mono text-6xl font-black tracking-tighter text-slate-900 sm:text-7xl" aria-live="off">{formatTime(session.remainingSeconds)}</p>
              <p className="mt-2 text-[10px] font-extrabold uppercase tracking-[0.2em] text-slate-400">{session.status === "paused" ? "Dijeda" : "Waktu tersisa"}</p>
              <div className="mt-6 h-2 overflow-hidden rounded-full bg-slate-100" role="progressbar" aria-label="Progres sesi fokus" aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.round(progressPercent)}>
                <div className="h-full rounded-full bg-gradient-to-r from-[#FF5500] to-amber-400 transition-[width] duration-500" style={{ width: `${progressPercent}%` }} />
              </div>
              <p className="mt-2 text-right text-[10px] font-semibold text-slate-400">{Math.floor(session.focusedSeconds / 60)} menit fokus</p>
              <div className="mt-7 flex gap-3">
                {session.status === "running" ? (
                  <button type="button" onClick={pauseSession} className="flex h-12 flex-1 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white text-sm font-extrabold text-slate-700 transition hover:bg-slate-50"><Pause className="h-4 w-4" /> Jeda</button>
                ) : (
                  <button type="button" onClick={resumeSession} className="flex h-12 flex-1 items-center justify-center gap-2 rounded-xl bg-[#FF5500] text-sm font-extrabold text-white transition hover:bg-orange-600"><Play className="h-4 w-4 fill-current" /> Lanjutkan</button>
                )}
              </div>
            </div>
          </div>
          <p className="mt-4 text-center text-[11px] leading-relaxed text-slate-400">Sesi otomatis dijeda bila tidak ada aktivitas selama 1 menit 20 detik.</p>
        </section>
      )}

      {session?.status === "completed" && (
        <section className="relative z-10 mx-auto max-w-xl rounded-3xl border border-emerald-100 bg-white p-6 text-center shadow-sm sm:p-8">
          <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600"><CheckCircle2 className="h-7 w-7" /></span>
          <p className="mt-4 text-xs font-extrabold uppercase tracking-[0.16em] text-emerald-600">Sesi selesai</p>
          <h2 className="mt-1 text-xl font-black text-slate-900">{session.taskTitle}</h2>
          <div className="mx-auto mt-5 inline-flex items-center gap-2 rounded-2xl bg-orange-50 px-4 py-3 text-[#FF5500]"><Coins className="h-5 w-5" /><span className="text-xl font-black">+{(session.rewardCoins ?? 0).toLocaleString()}</span><span className="text-xs font-bold">koin</span></div>
          {session.bonusCoins ? <p className="mt-2 text-xs font-bold text-emerald-600">Termasuk bonus tugas selesai +{session.bonusCoins} koin</p> : <p className="mt-2 text-xs font-semibold text-slate-500">Tugas disimpan untuk dilanjutkan nanti.</p>}
          {session.rewardCoins === 0 && <p className="mt-2 text-xs font-semibold text-amber-700">Batas koin periode ini sudah tercapai; tidak ada koin tambahan untuk sesi ini.</p>}
          {cooldownUntilMs !== null && cooldownUntilMs > clockNow && rewardBudget.earnedCoins >= STUDY_REWARD_CAP && (
            <p className="mt-3 rounded-xl bg-amber-50 p-3 text-xs font-semibold leading-relaxed text-amber-800">Batas {STUDY_REWARD_CAP} koin tercapai. Gami-Study bisa digunakan lagi {formatDate(new Date(cooldownUntilMs).toISOString())}.</p>
          )}
          {session.rewardStatus === "pending" && <p role="status" className="mt-4 rounded-xl bg-amber-50 p-3 text-xs font-semibold leading-relaxed text-amber-800">Koin belum terkonfirmasi oleh server. Riwayat sesi dan reward tersimpan lokal.</p>}
          {session.rewardStatus === "local" && <p className="mt-4 rounded-xl bg-slate-50 p-3 text-xs font-semibold text-slate-600">Reward tercatat di perangkat ini.</p>}
          {submissionNote && session.rewardStatus !== "pending" && <p className="mt-3 text-xs leading-relaxed text-slate-500">{submissionNote}</p>}
          <button type="button" onClick={startNewSession} className="mt-6 flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-slate-900 text-sm font-extrabold text-white transition hover:bg-slate-700"><RefreshCw className="h-4 w-4" /> Atur sesi baru</button>
        </section>
      )}

      {!isSessionLive && session?.status !== "evaluation" && session?.status !== "completed" && history.length > 0 && (
        <section className="relative z-10 mt-6 rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
          <div className="mb-4 flex items-center gap-3"><span className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-100 text-slate-600"><History className="h-5 w-5" /></span><div><h2 className="text-base font-black text-slate-900">Riwayat belajar</h2><p className="text-xs text-slate-500">Sesi Gami-Study terakhir</p></div></div>
          <div className="divide-y divide-slate-100">
            {history.slice(0, 5).map((item) => (
              <div key={item.id} className="flex items-center gap-3 py-3 first:pt-0 last:pb-0">
                <span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${item.outcome === "completed" ? "bg-emerald-50 text-emerald-600" : "bg-orange-50 text-[#FF5500]"}`}><BookOpen className="h-4 w-4" /></span>
                <div className="min-w-0 flex-1"><p className="truncate text-xs font-extrabold text-slate-800">{item.taskTitle}</p><p className="mt-0.5 text-[10px] text-slate-500">{formatDate(item.createdAt)} · {item.durationMinutes} menit</p></div>
                <span className="shrink-0 text-xs font-extrabold text-[#FF5500]">+{item.coins} koin</span>
              </div>
            ))}
          </div>
        </section>
      )}

      <AnimatePresence>
        {session?.status === "evaluation" && (
          <Modal onClose={() => undefined}>
            <div className="text-center">
              <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600"><Sparkles className="h-7 w-7" /></span>
              <p className="mt-4 text-xs font-extrabold uppercase tracking-[0.16em] text-[#FF5500]">Pomodoro selesai</p>
              <h2 className="mt-2 text-2xl font-black leading-tight text-slate-900">Apakah tugas <span className="text-[#FF5500]">{session.taskTitle}</span> sudah selesai?</h2>
              <p className="mt-2 text-sm leading-relaxed text-slate-500">Pilih status tugas untuk menyimpan progres dan klaim koin.</p>
              {submissionNote && <p role="alert" className="mt-3 rounded-xl bg-amber-50 p-3 text-xs font-semibold text-amber-800">{submissionNote}</p>}
              <div className="mt-6 grid gap-3 sm:grid-cols-2">
                <button type="button" disabled={isSubmitting} onClick={() => finishSession(true)} className="flex min-h-24 flex-col items-center justify-center rounded-2xl bg-[#FF5500] px-4 py-3 text-white transition hover:bg-orange-600 disabled:opacity-60"><CheckCircle2 className="mb-1 h-5 w-5" /><span className="text-sm font-extrabold">Selesai</span><span className="mt-0.5 text-[10px] font-semibold text-orange-100">Hingga +{sessionCompleteReward} koin termasuk bonus</span></button>
                <button type="button" disabled={isSubmitting} onClick={() => finishSession(false)} className="flex min-h-24 flex-col items-center justify-center rounded-2xl border border-slate-200 bg-white px-4 py-3 text-slate-700 transition hover:border-orange-200 hover:bg-orange-50 disabled:opacity-60"><Clock3 className="mb-1 h-5 w-5 text-[#FF5500]" /><span className="text-sm font-extrabold">Belum selesai</span><span className="mt-0.5 text-[10px] font-semibold text-slate-500">Simpan progres + hingga {sessionProgressReward} koin</span></button>
              </div>
              {isSubmitting && <p className="mt-4 text-xs font-semibold text-slate-500">Menyimpan sesi dan reward…</p>}
            </div>
          </Modal>
        )}

        {showCancelConfirm && (
          <Modal onClose={() => setShowCancelConfirm(false)}>
            <div className="text-center">
              <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-red-50 text-red-600"><AlertTriangle className="h-6 w-6" /></span>
              <h2 className="mt-4 text-xl font-black text-slate-900">Akhiri sesi sekarang?</h2>
              <p className="mt-2 text-sm leading-relaxed text-slate-500">Waktu fokus yang sudah tercatat tidak akan mendapat koin pada sesi ini.</p>
              <div className="mt-5 flex gap-2">
                <button type="button" onClick={() => setShowCancelConfirm(false)} className="h-11 flex-1 rounded-xl border border-slate-200 text-sm font-extrabold text-slate-700 hover:bg-slate-50">Lanjut belajar</button>
                <button type="button" onClick={cancelSession} className="h-11 flex-1 rounded-xl bg-red-600 text-sm font-extrabold text-white hover:bg-red-700">Akhiri sesi</button>
              </div>
            </div>
          </Modal>
        )}
      </AnimatePresence>
    </main>
  );
}

function Modal({ children, onClose }: { children: React.ReactNode; onClose: () => void }) {
  return (
    <motion.div
      className="fixed inset-0 z-[100] flex items-center justify-center overflow-y-auto bg-slate-950/55 p-4 backdrop-blur-sm"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onMouseDown={(event) => { if (event.target === event.currentTarget) onClose(); }}
      role="presentation"
    >
      <motion.div
        role="dialog"
        aria-modal="true"
        initial={{ opacity: 0, y: 12, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 8, scale: 0.98 }}
        className="relative my-auto w-full max-w-md rounded-3xl border border-slate-200 bg-white p-6 shadow-2xl sm:p-7"
      >
        {children}
      </motion.div>
    </motion.div>
  );
}
