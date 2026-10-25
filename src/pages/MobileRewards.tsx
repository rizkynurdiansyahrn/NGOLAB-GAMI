import React, { useState, useEffect, useRef } from "react";
import { ExternalLink, Gift, Wallet } from "lucide-react";
import type { AppUser, Voucher } from "../data/appData";
import { REMOTE_API_BASE_URL } from "../lib/api";
import { listRedemptions, listRewards, redeemReward } from "../lib/pointlab";
import type { RedemptionResult } from "../lib/pointlab";
import { VOUCHER_URL, buildPointLabSsoUrl } from "../lib/voucherLink";

function normalizeVoucherImage(...values: unknown[]): string {
  const candidate = values.find((value) => {
    if (typeof value === "string") return value.trim().length > 0;
    return value !== null && typeof value === "object" && "url" in value && typeof value.url === "string";
  });

  const source = typeof candidate === "string"
    ? candidate.trim()
    : candidate && typeof candidate === "object" && "url" in candidate && typeof candidate.url === "string"
      ? candidate.url.trim()
      : "";

  if (!source) return "";

  try {
    const remoteOrigin = new URL(REMOTE_API_BASE_URL);
    const url = new URL(source, REMOTE_API_BASE_URL);
    if (url.protocol !== "http:" && url.protocol !== "https:") return "";
    const isLocalHost = url.hostname === "localhost" || url.hostname === "127.0.0.1";
    if (!isLocalHost && url.protocol === "http:" && url.hostname === remoteOrigin.hostname && remoteOrigin.protocol === "https:") {
      url.protocol = "https:";
    }
    if (import.meta.env?.DEV && url.origin === remoteOrigin.origin && url.pathname.startsWith("/uploads/")) {
      return `${url.pathname}${url.search}`;
    }
    return url.href;
  } catch {
    return "";
  }
}

function VoucherImage({ src, title }: { src: string; title: string }) {
  const [failedSource, setFailedSource] = useState<string | null>(null);
  const imageFailed = !src || failedSource === src;

  return (
    <div className="relative h-40 w-full overflow-hidden bg-gradient-to-br from-orange-100 via-amber-50 to-slate-100 sm:h-44">
      {!imageFailed ? (
        <img
          src={src}
          alt={title}
          loading="lazy"
          decoding="async"
          className="h-full w-full object-cover"
          onError={() => setFailedSource(src)}
        />
      ) : (
        <div role="img" aria-label={`Foto ${title} tidak tersedia`} className="flex h-full flex-col items-center justify-center gap-2 text-orange-500">
          <Gift className="h-9 w-9" aria-hidden="true" />
          <span className="max-w-[85%] truncate text-xs font-bold text-slate-500">Foto hadiah tidak tersedia</span>
        </div>
      )}
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/45 via-transparent to-transparent" />
    </div>
  );
}

interface MobileRewardsProps {
  user: AppUser;
  accessToken: string | null;
  onRefreshUser?: () => void;
  onPointsUpdated?: (points: number) => void;
}

export default function MobileRewards({ user, accessToken, onRefreshUser, onPointsUpdated }: MobileRewardsProps) {
  const [voucherList, setVoucherList] = useState<Voucher[]>([]);
  const [activeVouchers, setActiveVouchers] = useState<RedemptionResult[]>([]);
  const [catalogLoading, setCatalogLoading] = useState(true);
  const [catalogError, setCatalogError] = useState("");
  const [voucherNotice, setVoucherNotice] = useState("");
  const [selectedVoucher, setSelectedVoucher] = useState<Voucher | null>(null);
  const [redeemError, setRedeemError] = useState("");
  const [isRedeeming, setIsRedeeming] = useState(false);
  const [reload, setReload] = useState(0);
  const idempotencyKey = useRef("");

  const pointLabVoucherUrl = buildPointLabSsoUrl(VOUCHER_URL, accessToken);

  useEffect(() => {
    const controller = new AbortController();
    setCatalogLoading(true);
    setCatalogError("");
    listRewards(controller.signal)
      .then((items) => {
        if (controller.signal.aborted) return;
        const rewards = items.map((item): Voucher => ({
          id: item.id,
          title: item.name,
          description: item.description,
          pointsCost: item.pointsCost,
          category: "Food",
          image: normalizeVoucherImage(item.image),
        }));
        setVoucherList(rewards);
      })
      .catch(() => {
        if (!controller.signal.aborted) setCatalogError("Katalog hadiah belum dapat dimuat. Silakan coba lagi nanti.");
      })
      .finally(() => { if (!controller.signal.aborted) setCatalogLoading(false); });
    return () => controller.abort();
  }, [reload]);

  useEffect(() => {
    if (!user.memberId || !accessToken) {
      setVoucherNotice("Voucher akun belum tersedia.");
      return;
    }
    const controller = new AbortController();
    setVoucherNotice("Memuat voucher akun...");
    listRedemptions(user.memberId, accessToken, controller.signal)
      .then((items) => {
        if (controller.signal.aborted) return;
        setActiveVouchers(items);
        setVoucherNotice("");
      })
      .catch(() => {
        if (!controller.signal.aborted) setVoucherNotice("Voucher akun belum dapat dimuat. Silakan coba lagi nanti.");
      });
    return () => controller.abort();
  }, [user.memberId, accessToken, reload]);

  const redeem = async () => {
    if (!selectedVoucher || !user.memberId || !accessToken || isRedeeming || user.pointsAvailable === false) return;
    setIsRedeeming(true);
    setRedeemError("");
    try {
      const result = await redeemReward(user.memberId, selectedVoucher.id, accessToken, idempotencyKey.current);
      if (!result?.redemptionId || !result?.redemptionCode) throw new Error("Hasil penukaran belum tersedia. Coba kembali untuk memeriksa penukaran yang sama.");
      setActiveVouchers((items) => [result, ...items.filter((item) => item.redemptionId !== result.redemptionId)]);
      if (typeof result.remainingPoints === "number" && Number.isFinite(result.remainingPoints)) onPointsUpdated?.(result.remainingPoints);
      onRefreshUser?.();
      setSelectedVoucher(null);
      setReload((value) => value + 1);
    } catch (error) {
      setRedeemError(error instanceof Error ? error.message : "Penukaran belum berhasil. Silakan coba lagi.");
    } finally {
      setIsRedeeming(false);
    }
  };

  let assignedAffordableId = false;
  let assignedExpensiveId = false;

  return (
    <main className="mx-auto w-full max-w-4xl p-4 pb-32 sm:p-6">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">Marketplace Hadiah</h2>
          <p className="mt-1 text-sm text-slate-500">Tukarkan Loyalty Points dengan voucher kantin yang langsung tersinkron ke PointLab.</p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          {pointLabVoucherUrl && (
            <a
              href={pointLabVoucherUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 rounded-2xl border border-orange-200 bg-orange-50 px-4 py-3 text-xs font-extrabold text-[#FF5500] transition hover:bg-orange-100"
            >
              <Gift className="h-4 w-4" />
              Buka QR di PointLab
              <ExternalLink className="h-3.5 w-3.5" />
            </a>
          )}
          <div className="flex items-center gap-3 rounded-2xl bg-[#FF5500] p-4 text-white">
            <Wallet className="h-6 w-6" />
            <div>
              <p className="text-xs">Saldo Loyalty Points</p>
              <p className="text-xl font-bold">{user.pointsAvailable === false ? "Belum tersedia" : user.points.toLocaleString() + " PT"}</p>
            </div>
          </div>
        </div>
      </div>
      {catalogLoading && <p role="status" className="rounded-2xl bg-white p-6 text-sm text-slate-500">Memuat katalog hadiah...</p>}
      {catalogError && <p role="alert" className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">{catalogError}</p>}
      {!catalogLoading && !catalogError && voucherList.length === 0 && <p className="rounded-2xl bg-white p-6 text-sm text-slate-500">Belum ada hadiah yang tersedia.</p>}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {voucherList.map((voucher) => {
          const ready = Boolean(user.memberId && accessToken && user.pointsAvailable !== false);
          const canAfford = ready && user.points >= voucher.pointsCost;
          let buttonId: string | undefined;
          if (canAfford && !assignedAffordableId) {
            buttonId = "btn_voucher_cukup";
            assignedAffordableId = true;
          } else if (ready && !canAfford && !assignedExpensiveId) {
            buttonId = "btn_voucher_mahal";
            assignedExpensiveId = true;
          }
          return <article key={voucher.id} className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
            <VoucherImage src={voucher.image} title={voucher.title} />
            <div className="p-4"><h3 className="font-bold text-slate-900">{voucher.title}</h3><p className="mt-1 text-xs text-slate-500">{voucher.description}</p><p className="mt-3 font-bold text-[#FF5500]">{voucher.pointsCost.toLocaleString()} PT</p>
              <button id={buttonId} disabled={!canAfford} onClick={() => { idempotencyKey.current = crypto.randomUUID(); setRedeemError(""); setSelectedVoucher(voucher); }} className="mt-3 rounded-xl bg-[#FF5500] px-4 py-2 text-sm font-bold text-white disabled:bg-slate-100 disabled:text-slate-400">{!ready ? "Saldo belum tersedia" : canAfford ? "Tukarkan" : "Kurang"}</button>
            </div>
          </article>;
        })}
      </div>
      <section className="mt-8"><h3 className="mb-4 text-lg font-bold text-slate-900">Voucher Saya</h3>
        {voucherNotice && <p role="status" className="rounded-2xl bg-white p-4 text-sm text-slate-500">{voucherNotice}</p>}
        {!voucherNotice && activeVouchers.length === 0 && <p className="rounded-2xl bg-white p-4 text-sm text-slate-500">Belum ada voucher yang ditukarkan.</p>}
        <div className="grid gap-4 sm:grid-cols-2">{activeVouchers.map((voucher, idx) => <article key={voucher.redemptionId} id={idx === 0 ? "div_voucher_aktif" : undefined} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm"><h4 className="font-bold">{voucher.rewardName}</h4><p className="mt-2 font-mono font-bold text-[#FF5500]">{voucher.redemptionCode}</p><p className="mt-1 text-xs text-slate-500">Status: {voucher.status}</p></article>)}</div>
      </section>
      {selectedVoucher && <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"><section role="dialog" aria-modal="true" aria-labelledby="redeem-title" className="w-full max-w-md rounded-3xl bg-white p-6"><Gift className="mb-3 h-8 w-8 text-[#FF5500]" /><h3 id="redeem-title" className="text-lg font-bold">{selectedVoucher.title}</h3><p className="mt-2 text-sm text-slate-500">Biaya: {selectedVoucher.pointsCost.toLocaleString()} PT</p>{redeemError && <p role="alert" className="mt-4 text-sm text-red-600">{redeemError}</p>}<div className="mt-5 flex gap-3"><button id="btn_konfirmasi_tukar" disabled={isRedeeming} onClick={redeem} className="flex-1 rounded-xl bg-[#FF5500] p-3 text-sm font-bold text-white disabled:opacity-50">{isRedeeming ? "Memproses..." : "Konfirmasi"}</button><button disabled={isRedeeming} onClick={() => setSelectedVoucher(null)} className="flex-1 rounded-xl bg-slate-100 p-3 text-sm font-bold">Batal</button></div></section></div>}
    </main>
  );
}
