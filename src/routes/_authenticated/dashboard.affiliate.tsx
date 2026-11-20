import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { Copy, Share2, Wallet, Users, Save, Handshake } from "lucide-react";
import { toast } from "sonner";
import { PageHeader, EmptyState, Stat } from "@/components/dash";
import { useAuth } from "@/lib/auth";
import {
  COMMISSION_ZAR, MIN_PAYOUT_ZAR, BOT_PRICE_ZAR,
  formatZar, referralLink, getMyAffiliate, joinAffiliate, getMySummary,
  listMyReferrals, listMyPayouts, updatePayoutDetails,
} from "@/lib/affiliate";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/dashboard/affiliate")({ component: Page });

const REF_STATUS: Record<"signed_up" | "paid" | "rejected", { label: string; cls: string }> = {
  signed_up: { label: "Awaiting payment", cls: "border-neutral/40 text-neutral" },
  paid: { label: "Commission earned", cls: "border-bull/40 text-bull" },
  rejected: { label: "Not eligible", cls: "border-border text-muted-foreground" },
};

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-ZA", { day: "numeric", month: "short", year: "numeric" });
}

function Page() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const uid = user?.id;

  const affiliate = useQuery({
    queryKey: ["affiliate", uid], enabled: !!uid,
    queryFn: () => getMyAffiliate(uid!),
  });
  const aff = affiliate.data;

  const summary = useQuery({ queryKey: ["affiliate-summary", aff?.id], enabled: !!aff, queryFn: getMySummary });
  const referrals = useQuery({ queryKey: ["affiliate-referrals", aff?.id], enabled: !!aff, queryFn: () => listMyReferrals(aff!.id) });
  const payouts = useQuery({ queryKey: ["affiliate-payouts", aff?.id], enabled: !!aff, queryFn: () => listMyPayouts(aff!.id) });

  const [joinName, setJoinName] = useState("");
  const join = useMutation({
    mutationFn: () => joinAffiliate(joinName.trim()),
    onSuccess: () => {
      toast.success("You're in. Your referral link is ready.");
      qc.invalidateQueries({ queryKey: ["affiliate", uid] });
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : "Could not join"),
  });

  const [fullName, setFullName] = useState("");
  const [bankName, setBankName] = useState("");
  const [holder, setHolder] = useState("");
  const [account, setAccount] = useState("");
  useEffect(() => {
    if (aff) {
      setFullName(aff.full_name); setBankName(aff.bank_name);
      setHolder(aff.account_holder); setAccount(aff.account_number);
    }
  }, [aff]);

  const save = useMutation({
    mutationFn: () => updatePayoutDetails({ fullName, bankName, accountHolder: holder, accountNumber: account }),
    onSuccess: () => {
      toast.success("Payout details saved");
      qc.invalidateQueries({ queryKey: ["affiliate", uid] });
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : "Could not save"),
  });

  if (affiliate.isLoading) return <p className="text-xs text-muted-foreground">Loading…</p>;

  if (!aff) {
    return (
      <div className="space-y-6 pb-12">
        <PageHeader eyebrow="Affiliate" title="Earn with EA VORTEX"
          sub={`Refer people to the bot and earn R${COMMISSION_ZAR} of every R${BOT_PRICE_ZAR} sale.`} />
        <div className="pw-card max-w-xl space-y-4 p-5">
          <p className="text-sm text-muted-foreground">
            Join for free to get your personal referral link. When someone signs up through your link and buys the bot,
            you earn R{COMMISSION_ZAR}. Payouts start from R{MIN_PAYOUT_ZAR}.
          </p>
          <div>
            <label htmlFor="join-name" className="pw-label block text-muted-foreground">Your name</label>
            <input id="join-name" className="pw-field mt-1 w-full" value={joinName} maxLength={80}
              onChange={(e) => setJoinName(e.target.value)} placeholder="Full name" />
          </div>
          <button onClick={() => join.mutate()} disabled={join.isPending || joinName.trim().length < 2}
            className="pw-btn pw-btn-solid w-full justify-center">
            <Handshake className="h-4 w-4" />{join.isPending ? "Joining…" : "Become an affiliate"}
          </button>
        </div>
      </div>
    );
  }

  const link = referralLink(aff.code);
  const s = summary.data;
  const canPayout = (s?.balance_cents ?? 0) >= MIN_PAYOUT_ZAR * 100;

  async function copyLink() {
    try {
      await navigator.clipboard.writeText(link);
      toast.success("Link copied");
    } catch {
      toast.error("Could not copy. Press and hold the link to copy it.");
    }
  }
  const whatsapp = `https://wa.me/?text=${encodeURIComponent(`Try EA VORTEX: ${link}`)}`;

  return (
    <div className="space-y-6 pb-12">
      <PageHeader eyebrow="Affiliate" title="Affiliate Portal"
        sub={`Earn R${COMMISSION_ZAR} on every R${BOT_PRICE_ZAR} bot sale you refer.`} />

      {aff.status === "suspended" && (
        <div className="pw-card-quiet border-primary/50 p-4 text-sm text-primary">
          Your affiliate account is suspended. Contact support to find out why.
        </div>
      )}

      <div className="pw-card space-y-3 p-5">
        <p className="pw-label text-primary">Your referral link</p>
        <p className="break-all rounded-md border border-primary/30 bg-black/40 p-3 font-mono text-xs">{link}</p>
        <p className="text-xs text-muted-foreground">Your code: <span className="font-mono text-foreground">{aff.code}</span></p>
        <div className="flex flex-wrap gap-2">
          <button onClick={copyLink} className="pw-btn pw-btn-solid"><Copy className="h-4 w-4" />Copy link</button>
          <a href={whatsapp} target="_blank" rel="noopener noreferrer" className="pw-btn"><Share2 className="h-4 w-4" />Share on WhatsApp</a>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <Stat label="Pending" value={formatZar(s?.pending_cents)} hint={`${s?.signed_up ?? 0} awaiting payment`} />
        <Stat label="Earned" value={formatZar(s?.earned_cents)} hint={`${s?.paid ?? 0} paid referrals`} />
        <Stat label="Paid out" value={formatZar(s?.paid_out_cents)} />
        <Stat label="Balance owed" value={formatZar(s?.balance_cents)}
          hint={canPayout ? "Eligible for payout" : `Payouts start at R${MIN_PAYOUT_ZAR}`} />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="pw-card p-5">
          <h2 className="pw-title text-lg">Your referrals</h2>
          {referrals.data?.length ? (
            <ul className="mt-4 space-y-2">
              {referrals.data.map((r) => {
                const st = REF_STATUS[r.status] ?? REF_STATUS["signed_up"];
                return (
                  <li key={r.id} className="pw-card-quiet flex items-center justify-between gap-3 p-3">
                    <div className="min-w-0">
                      <p className="truncate font-mono text-sm">{r.referred_label}</p>
                      <p className="text-xs text-muted-foreground">Signed up {fmtDate(r.created_at)}</p>
                    </div>
                    <span className={cn("shrink-0 rounded-full border bg-black/40 px-2.5 py-0.5 font-mono text-[10px] uppercase", st.cls)}>
                      {st.label}
                    </span>
                  </li>
                );
              })}
            </ul>
          ) : (
            <div className="mt-4">
              <EmptyState icon={Users} title="No referrals yet">
                Share your link. People who sign up through it show up here.
              </EmptyState>
            </div>
          )}
          <p className="mt-4 text-xs text-muted-foreground">
            A referral turns into R{COMMISSION_ZAR} once the R{BOT_PRICE_ZAR} payment is confirmed by EA VORTEX.
          </p>
        </div>

        <div className="pw-card space-y-4 p-5">
          <h2 className="pw-title text-lg">Payout details</h2>
          <p className="text-xs text-muted-foreground">
            Used for EFT payouts once your balance reaches R{MIN_PAYOUT_ZAR}. Only you and EA VORTEX admins can see this.
          </p>
          {[
            ["Full name", fullName, setFullName],
            ["Bank name", bankName, setBankName],
            ["Account holder", holder, setHolder],
            ["Account number", account, setAccount],
          ].map(([label, value, setter]) => (
            <div key={label as string}>
              <label className="pw-label block text-muted-foreground">{label as string}</label>
              <input className="pw-field mt-1 w-full" value={value as string} maxLength={80}
                onChange={(e) => (setter as (v: string) => void)(e.target.value)} />
            </div>
          ))}
          <button onClick={() => save.mutate()} disabled={save.isPending} className="pw-btn pw-btn-solid w-full justify-center">
            <Save className="h-4 w-4" />{save.isPending ? "Saving…" : "Save details"}
          </button>
        </div>
      </div>

      <div className="pw-card p-5">
        <h2 className="pw-title text-lg">Payout history</h2>
        {payouts.data?.length ? (
          <ul className="mt-4 space-y-2">
            {payouts.data.map((p) => (
              <li key={p.id} className="pw-card-quiet flex items-center justify-between gap-3 p-3">
                <div className="min-w-0">
                  <p className="font-mono text-sm">{formatZar(p.amount_cents)}</p>
                  <p className="truncate text-xs text-muted-foreground">{p.reference || "EFT payout"}</p>
                </div>
                <p className="shrink-0 text-xs text-muted-foreground">{fmtDate(p.created_at)}</p>
              </li>
            ))}
          </ul>
        ) : (
          <div className="mt-4">
            <EmptyState icon={Wallet} title="No payouts yet">
              Payouts are sent by EFT once your balance owed reaches R{MIN_PAYOUT_ZAR}.
            </EmptyState>
          </div>
        )}
      </div>
    </div>
  );
}
