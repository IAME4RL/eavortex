import { supabase } from "@/integrations/supabase/client";

// The generated Supabase Database type predates the affiliate tables and functions.
// Keep this boundary typed locally until `supabase gen types` is run again.
const db = supabase as any;

export const BOT_PRICE_ZAR = 600;
export const COMMISSION_ZAR = 200;
export const MIN_PAYOUT_ZAR = 400;

const REF_KEY = "ea_vortex_ref";

export function formatZar(cents: number | null | undefined): string {
  const rands = (cents ?? 0) / 100;
  return `R${rands.toLocaleString("en-ZA", { minimumFractionDigits: 0, maximumFractionDigits: 2 })}`;
}

export function referralLink(code: string): string {
  const origin = typeof window !== "undefined" ? window.location.origin : "";
  return `${origin}/?ref=${encodeURIComponent(code)}`;
}

/** Remember ?ref=CODE from the landing URL so it survives sign-up and email confirmation. */
export function captureReferral(): void {
  try {
    const ref = new URLSearchParams(window.location.search).get("ref");
    if (ref && /^[A-Za-z0-9]{4,16}$/.test(ref)) localStorage.setItem(REF_KEY, ref.toUpperCase());
  } catch {
    /* storage unavailable: referral tracking is best-effort */
  }
}

/** After a user is signed in, link them to the stored referral code once. Never throws. */
export async function claimStoredReferral(): Promise<void> {
  let code: string | null = null;
  try {
    code = localStorage.getItem(REF_KEY);
  } catch {
    return;
  }
  if (!code) return;
  try {
    const { data, error } = await db.rpc("claim_referral", { p_code: code });
    if (error) return; // keep the code and retry on the next sign-in
    if (typeof data === "string") localStorage.removeItem(REF_KEY);
  } catch {
    /* best-effort */
  }
}

function throwIfError(error: { message: string } | null) {
  if (error) throw new Error(error.message);
}

export type AffiliateRecord = {
  id: string;
  user_id: string;
  code: string;
  full_name: string;
  bank_name: string;
  account_holder: string;
  account_number: string;
  status: "active" | "suspended";
  created_at: string;
};

export type AffiliateSummary = {
  signed_up: number;
  paid: number;
  rejected: number;
  pending_cents: number;
  earned_cents: number;
  paid_out_cents: number;
  balance_cents: number;
  min_payout_cents: number;
};

export type ReferralRow = {
  id: string;
  referred_label: string;
  status: "signed_up" | "paid" | "rejected";
  commission_cents: number;
  created_at: string;
  paid_at: string | null;
};

export type PayoutRow = { id: string; amount_cents: number; reference: string; created_at: string };

export async function getMyAffiliate(userId: string): Promise<AffiliateRecord | null> {
  const { data, error } = await db.from("affiliates").select("*").eq("user_id", userId).maybeSingle();
  throwIfError(error);
  return data ?? null;
}

export async function joinAffiliate(fullName: string): Promise<AffiliateRecord> {
  const { data, error } = await db.rpc("join_affiliate", { p_full_name: fullName });
  throwIfError(error);
  return data as AffiliateRecord;
}

export async function getMySummary(): Promise<AffiliateSummary | null> {
  const { data, error } = await db.rpc("my_affiliate_summary");
  throwIfError(error);
  return (data as AffiliateSummary | null) ?? null;
}

export async function listMyReferrals(affiliateId: string): Promise<ReferralRow[]> {
  const { data, error } = await db.from("affiliate_referrals")
    .select("id,referred_label,status,commission_cents,created_at,paid_at")
    .eq("affiliate_id", affiliateId).order("created_at", { ascending: false });
  throwIfError(error);
  return data ?? [];
}

export async function listMyPayouts(affiliateId: string): Promise<PayoutRow[]> {
  const { data, error } = await db.from("affiliate_payouts")
    .select("id,amount_cents,reference,created_at")
    .eq("affiliate_id", affiliateId).order("created_at", { ascending: false });
  throwIfError(error);
  return data ?? [];
}

export async function updatePayoutDetails(input: {
  fullName: string; bankName: string; accountHolder: string; accountNumber: string;
}) {
  const { error } = await db.rpc("update_affiliate_payout", {
    p_full_name: input.fullName, p_bank_name: input.bankName,
    p_account_holder: input.accountHolder, p_account_number: input.accountNumber,
  });
  throwIfError(error);
}

// ---------- Admin ----------

export type AdminAffiliate = {
  id: string; code: string; full_name: string; email: string; status: "active" | "suspended";
  bank_name: string; account_holder: string; account_number: string;
  referrals_total: number; referrals_paid: number;
  earned_cents: number; paid_out_cents: number; balance_cents: number; created_at: string;
};

export type AdminReferral = {
  id: string; affiliate_name: string; affiliate_code: string; referred_email: string;
  status: "signed_up" | "paid" | "rejected"; commission_cents: number;
  created_at: string; paid_at: string | null;
};

export async function adminListAffiliates(): Promise<AdminAffiliate[]> {
  const { data, error } = await db.rpc("admin_affiliate_overview");
  throwIfError(error);
  return data ?? [];
}

export async function adminListReferrals(): Promise<AdminReferral[]> {
  const { data, error } = await db.rpc("admin_affiliate_referrals");
  throwIfError(error);
  return data ?? [];
}

export async function adminSetReferralStatus(id: string, status: "signed_up" | "paid" | "rejected") {
  const { error } = await db.rpc("admin_set_referral_status", { p_referral_id: id, p_status: status });
  throwIfError(error);
}

export async function adminRecordPayout(affiliateId: string, amountCents: number, reference: string) {
  const { error } = await db.rpc("admin_record_payout", {
    p_affiliate_id: affiliateId, p_amount_cents: amountCents, p_reference: reference,
  });
  throwIfError(error);
}

export async function adminSetAffiliateStatus(affiliateId: string, status: "active" | "suspended") {
  const { error } = await db.rpc("admin_set_affiliate_status", { p_affiliate_id: affiliateId, p_status: status });
  throwIfError(error);
}
