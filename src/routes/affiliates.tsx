import { createFileRoute, Link } from "@tanstack/react-router";
import { Link2, UserPlus, Banknote, Handshake } from "lucide-react";
import { PublicLayout } from "@/components/SiteNav";
import { SectionHead } from "@/components/Sections";
import { useAuth } from "@/lib/auth";
import { BOT_PRICE_ZAR, COMMISSION_ZAR, MIN_PAYOUT_ZAR } from "@/lib/affiliate";

export const Route = createFileRoute("/affiliates")({
  head: () => ({
    meta: [
      { title: "Affiliate Program — EA VORTEX" },
      { name: "description", content: `Refer people to the EA VORTEX bot and earn R${COMMISSION_ZAR} on every R${BOT_PRICE_ZAR} sale.` },
      { property: "og:title", content: "Affiliate Program — EA VORTEX" },
      { property: "og:description", content: `Earn R${COMMISSION_ZAR} for every person you refer who buys the bot.` },
    ],
  }),
  component: AffiliatesPage,
});

const STEPS = [
  { I: Handshake, t: "Join free", d: "Create an account and join the affiliate program in one tap." },
  { I: Link2, t: "Share your link", d: "Get a personal referral link. Share it on WhatsApp, social media or anywhere you like." },
  { I: UserPlus, t: "They sign up", d: "When someone joins through your link and buys the bot, it is recorded against you." },
  { I: Banknote, t: "You get paid", d: `You earn R${COMMISSION_ZAR} per sale, paid by EFT once your balance reaches R${MIN_PAYOUT_ZAR}.` },
] as const;

function AffiliatesPage() {
  const { user } = useAuth();
  return (
    <PublicLayout>
      <section className="mx-auto max-w-7xl px-4 py-20 sm:px-6">
        <SectionHead
          eyebrow="Affiliate program"
          title={<>Earn <span className="text-primary">R{COMMISSION_ZAR}</span> for every referral</>}
          sub={`Refer people to the EA VORTEX bot. When they buy it for R${BOT_PRICE_ZAR}, you keep R${COMMISSION_ZAR}.`}
        />
        <div className="mt-8 flex justify-center">
          {user ? (
            <Link to="/dashboard/affiliate" className="pw-btn pw-btn-solid px-8">Open affiliate portal</Link>
          ) : (
            <Link to="/auth" search={{ mode: "signup" }} className="pw-btn pw-btn-solid px-8">Join as an affiliate</Link>
          )}
        </div>

        <div className="mt-14 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {STEPS.map(({ I, t, d }, i) => (
            <div key={t} className="pw-card-quiet p-5">
              <div className="flex items-center gap-3">
                <I className="h-6 w-6 text-primary" />
                <span className="pw-label text-muted-foreground">Step {i + 1}</span>
              </div>
              <h3 className="mt-3 font-display text-base font-bold uppercase">{t}</h3>
              <p className="mt-1 text-sm text-muted-foreground">{d}</p>
            </div>
          ))}
        </div>

        <div className="pw-card mx-auto mt-14 max-w-3xl p-6">
          <h2 className="pw-title text-xl">The details</h2>
          <ul className="mt-4 list-disc space-y-2 pl-5 text-sm text-muted-foreground">
            <li>R{COMMISSION_ZAR} commission on every R{BOT_PRICE_ZAR} bot sale you refer.</li>
            <li>A referral counts once EA VORTEX confirms the R{BOT_PRICE_ZAR} payment.</li>
            <li>Payouts are made by EFT once your balance reaches R{MIN_PAYOUT_ZAR}.</li>
            <li>Track every referral, earning and payout in your affiliate portal.</li>
            <li>Referring yourself, or accounts you control, does not earn commission.</li>
          </ul>
        </div>
      </section>
    </PublicLayout>
  );
}
