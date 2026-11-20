import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Check, X, Undo2, Wallet } from "lucide-react";
import { toast } from "sonner";
import { Stat } from "@/components/dash";
import {
  MIN_PAYOUT_ZAR, formatZar,
  adminListAffiliates, adminListReferrals, adminSetReferralStatus,
  adminRecordPayout, adminSetAffiliateStatus,
  type AdminAffiliate,
} from "@/lib/affiliate";
import { cn } from "@/lib/utils";

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-ZA", { day: "numeric", month: "short", year: "numeric" });
}

const STATUS_CLS: Record<string, string> = {
  signed_up: "border-neutral/40 text-neutral",
  paid: "border-bull/40 text-bull",
  rejected: "border-border text-muted-foreground",
};
const STATUS_LABEL: Record<string, string> = { signed_up: "Awaiting payment", paid: "Paid", rejected: "Rejected" };

export function AffiliateAdmin() {
  const qc = useQueryClient();
  const affiliates = useQuery({ queryKey: ["admin-affiliates"], queryFn: adminListAffiliates });
  const referrals = useQuery({ queryKey: ["admin-affiliate-referrals"], queryFn: adminListReferrals });

  const refresh = () => {
    qc.invalidateQueries({ queryKey: ["admin-affiliates"] });
    qc.invalidateQueries({ queryKey: ["admin-affiliate-referrals"] });
  };

  const setStatus = useMutation({
    mutationFn: ({ id, status }: { id: string; status: "signed_up" | "paid" | "rejected" }) =>
      adminSetReferralStatus(id, status),
    onSuccess: refresh,
    onError: (e) => toast.error(e instanceof Error ? e.message : "Action failed"),
  });

  const [payFor, setPayFor] = useState<AdminAffiliate | null>(null);
  const [amount, setAmount] = useState("");
  const [reference, setReference] = useState("");
  const payout = useMutation({
    mutationFn: () => adminRecordPayout(payFor!.id, Math.round(parseFloat(amount) * 100), reference),
    onSuccess: () => {
      toast.success("Payout recorded");
      setPayFor(null); setAmount(""); setReference("");
      refresh();
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : "Could not record payout"),
  });

  const suspend = useMutation({
    mutationFn: ({ id, status }: { id: string; status: "active" | "suspended" }) => adminSetAffiliateStatus(id, status),
    onSuccess: refresh,
    onError: (e) => toast.error(e instanceof Error ? e.message : "Action failed"),
  });

  const list = affiliates.data ?? [];
  const owed = list.reduce((n, a) => n + Number(a.balance_cents), 0);
  const awaiting = (referrals.data ?? []).filter((r) => r.status === "signed_up").length;

  return (
    <div className="space-y-6">
      <div>
        <p className="pw-label text-primary">Affiliates</p>
        <h2 className="pw-title mt-1 text-xl">Affiliate program</h2>
      </div>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-3">
        <Stat label="Affiliates" value={list.length} />
        <Stat label="Awaiting payment" value={awaiting} hint="Mark paid once the R600 arrives" />
        <Stat label="Commission owed" value={formatZar(owed)} />
      </div>

      <div className="pw-card p-5">
        <h3 className="pw-title text-lg">Referrals</h3>
        {referrals.data?.length ? (
          <ul className="mt-4 space-y-3">
            {referrals.data.map((r) => (
              <li key={r.id} className="pw-card-quiet p-4">
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-bold">{r.referred_email}</p>
                    <p className="truncate text-xs text-muted-foreground">
                      Referred by {r.affiliate_name || "Unnamed"} ({r.affiliate_code}) · {fmtDate(r.created_at)}
                    </p>
                  </div>
                  <span className={cn("rounded-full border bg-black/40 px-2.5 py-0.5 font-mono text-[10px] uppercase", STATUS_CLS[r.status])}>
                    {STATUS_LABEL[r.status]}
                  </span>
                </div>
                <div className="mt-3 flex flex-wrap gap-2">
                  {r.status === "signed_up" && (
                    <>
                      <button disabled={setStatus.isPending} onClick={() => setStatus.mutate({ id: r.id, status: "paid" })}
                        className="pw-btn pw-btn-solid"><Check className="h-3.5 w-3.5" />Mark paid ({formatZar(r.commission_cents)})</button>
                      <button disabled={setStatus.isPending} onClick={() => setStatus.mutate({ id: r.id, status: "rejected" })}
                        className="pw-btn"><X className="h-3.5 w-3.5" />Reject</button>
                    </>
                  )}
                  {r.status !== "signed_up" && (
                    <button disabled={setStatus.isPending} onClick={() => setStatus.mutate({ id: r.id, status: "signed_up" })}
                      className="pw-btn"><Undo2 className="h-3.5 w-3.5" />Undo</button>
                  )}
                </div>
              </li>
            ))}
          </ul>
        ) : (
          <p className="mt-4 text-xs text-muted-foreground">No referrals yet.</p>
        )}
      </div>

      <div className="pw-card p-5">
        <h3 className="pw-title text-lg">Affiliates and payouts</h3>
        {list.length ? (
          <ul className="mt-4 space-y-3">
            {list.map((a) => {
              const eligible = Number(a.balance_cents) >= MIN_PAYOUT_ZAR * 100;
              return (
                <li key={a.id} className="pw-card-quiet space-y-2 p-4">
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-bold">{a.full_name || a.email}</p>
                      <p className="truncate text-xs text-muted-foreground">{a.email} · code {a.code}</p>
                    </div>
                    {a.status === "suspended" && (
                      <span className="rounded-full border border-primary/50 bg-black/40 px-2.5 py-0.5 font-mono text-[10px] uppercase text-primary">Suspended</span>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {a.referrals_paid} paid of {a.referrals_total} referrals · earned {formatZar(Number(a.earned_cents))} ·
                    paid out {formatZar(Number(a.paid_out_cents))} · <span className="text-foreground">owed {formatZar(Number(a.balance_cents))}</span>
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {a.bank_name || a.account_number
                      ? `${a.bank_name || "Bank not set"} · ${a.account_holder || "Holder not set"} · ${a.account_number || "No account number"}`
                      : "No payout details yet"}
                  </p>
                  <div className="flex flex-wrap gap-2 pt-1">
                    <button disabled={!eligible}
                      onClick={() => { setPayFor(a); setAmount((Number(a.balance_cents) / 100).toString()); }}
                      className="pw-btn pw-btn-solid"><Wallet className="h-3.5 w-3.5" />Record payout</button>
                    <button disabled={suspend.isPending}
                      onClick={() => suspend.mutate({ id: a.id, status: a.status === "active" ? "suspended" : "active" })}
                      className="pw-btn">{a.status === "active" ? "Suspend" : "Reactivate"}</button>
                  </div>
                  {!eligible && <p className="text-[11px] text-muted-foreground">Payouts unlock at R{MIN_PAYOUT_ZAR}.</p>}
                </li>
              );
            })}
          </ul>
        ) : (
          <p className="mt-4 text-xs text-muted-foreground">No affiliates have joined yet.</p>
        )}

        {payFor && (
          <div className="pw-card-quiet mt-4 space-y-3 border-primary/40 p-4">
            <p className="text-sm font-bold">Record payout for {payFor.full_name || payFor.email}</p>
            <p className="text-xs text-muted-foreground">
              Do this after you've sent the EFT. Minimum R{MIN_PAYOUT_ZAR}, up to {formatZar(Number(payFor.balance_cents))}.
            </p>
            <div>
              <label htmlFor="pay-amount" className="pw-label block text-muted-foreground">Amount (R)</label>
              <input id="pay-amount" type="number" min={MIN_PAYOUT_ZAR} step="1" className="pw-field mt-1 w-40"
                value={amount} onChange={(e) => setAmount(e.target.value)} />
            </div>
            <div>
              <label htmlFor="pay-ref" className="pw-label block text-muted-foreground">EFT reference</label>
              <input id="pay-ref" className="pw-field mt-1 w-full" maxLength={120}
                value={reference} onChange={(e) => setReference(e.target.value)} />
            </div>
            <div className="flex gap-2">
              <button disabled={payout.isPending || !(parseFloat(amount) >= MIN_PAYOUT_ZAR)}
                onClick={() => payout.mutate()} className="pw-btn pw-btn-solid flex-1 justify-center">
                {payout.isPending ? "Saving…" : "Save payout"}
              </button>
              <button onClick={() => setPayFor(null)} className="pw-btn flex-1 justify-center">Cancel</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
