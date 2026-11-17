// francolink.net/francais-pas-a-pas/download -- where a buyer gets the book.
//
// No account needed (decided 2026-11-17). Two ways to arrive:
//
//   ?session=<stripe checkout session>  straight from paying. The webhook may
//                                       not have recorded the order yet, so
//                                       the page waits and refreshes itself.
//   ?t=<delivery token>                 from the receipt email, any time later.
//
// The account is still offered, as what it actually is: the online version,
// where exercises mark themselves and progress is saved. It is the upgrade,
// not the gate.

import type { Metadata } from "next";
import "../workbook.css";
import { fraunces, instrument } from "../fonts";
import { AUDIO_KEY, WORKBOOK_KEY, orderBySession, paidOrderByToken, type PaidOrder } from "@/lib/workbook/files";
import { appUrl, siteUrl } from "@/lib/site/hosts";
import { TikTokPurchase } from "@/components/site/tiktok-events";

export const metadata: Metadata = {
  title: "Your workbook | Le Français Pas à Pas",
  robots: { index: false, follow: false },
};
export const dynamic = "force-dynamic";

interface PageProps {
  searchParams: Promise<{ t?: string; session?: string; try?: string }>;
}

export default async function DownloadPage({ searchParams }: PageProps) {
  const { t, session, try: tryCount } = await searchParams;

  let order: PaidOrder | null = null;
  if (t) {
    order = await paidOrderByToken(t);
  } else if (session) {
    const found = await orderBySession(session);
    if (!found.found) {
      const attempt = Number(tryCount ?? "0") || 0;
      return attempt < 8 ? <Settling session={session} attempt={attempt} /> : <Slow />;
    }
    order = found.order;
  }

  if (!order || !order.products.has(WORKBOOK_KEY)) return <Invalid />;

  const file = (format: string) =>
    `/api/workbook/file?t=${encodeURIComponent(order.claim_token)}&format=${format}`;
  const hasAudio = order.products.has(AUDIO_KEY);
  const online = order.user_id
    ? appUrl("/workbook/read")
    : appUrl(`/unlock?t=${encodeURIComponent(order.claim_token)}`);

  return (
    <Frame>
      {/* Counted once, on the arrival from Stripe -- not on every later visit
          from the receipt email. */}
      {session && !t && (
        <TikTokPurchase
          orderId={order.id}
          value={order.total_cents / 100}
          currency={order.currency}
          email={order.email}
          hasAudio={hasAudio}
        />
      )}
      <p className="eyebrow">Le Français Pas à Pas · A0 → B2</p>
      <h1 className="h1">Your workbook is ready.</h1>
      <p className="lead">
        Download it below. The same links are in your receipt email
        ({order.email}), so you can come back here any time.
      </p>

      <div className="dl-list">
        <a className="dl-item" href={file("pdf")}>
          <span className="dl-name">The PDF</span>
          <span className="dl-note">To keep and to print.</span>
          <span className="btn btn-accent">Download PDF</span>
        </a>
        <a className="dl-item" href={file("html")}>
          <span className="dl-name">The ebook</span>
          <span className="dl-note">
            One file that opens in any browser, on your phone too. The
            exercises mark themselves when you answer.
          </span>
          <span className="btn btn-primary">Download ebook</span>
        </a>
        {hasAudio && (
          <a className="dl-item" href={file("audio")}>
            <span className="dl-name">The audio pack</span>
            <span className="dl-note">
              Every dialogue and drill at natural speed and again slowly, with
              a tracklist. One zip, about 12&nbsp;MB.
            </span>
            <span className="btn btn-primary">Download audio</span>
          </a>
        )}
      </div>

      <div className="dl-online">
        <h2 className="h3">Prefer to work online?</h2>
        <p className="muted">
          The online version saves your progress and keeps your place
          {hasAudio ? ", and plays the audio next to the text it belongs to" : ""}.
          It needs a free FrancoLink account, which takes one password.
        </p>
        <a className="btn btn-ghost" href={online}>
          {order.user_id ? "Open the online version" : "Create my free account"}
        </a>
      </div>

      <p className="micro">
        Start with Partie 0: twenty phrases and three short dialogues. ·
        14-day money-back guarantee: reply to your receipt.
      </p>
    </Frame>
  );
}

function Frame({ children }: { children: React.ReactNode }) {
  return (
    <div className={`fpap ${fraunces.variable} ${instrument.variable}`}>
      <section className="sec sec-pad-lg">
        <div className="wrap max-2">{children}</div>
      </section>
    </div>
  );
}

function Settling({ session, attempt }: { session: string; attempt: number }) {
  const next = `/francais-pas-a-pas/download?session=${encodeURIComponent(session)}&try=${attempt + 1}`;
  return (
    <>
      <meta httpEquiv="refresh" content={`2;url=${next}`} />
      <Frame>
        <h1 className="h1">Payment received. Getting your workbook ready.</h1>
        <p className="lead">
          This takes a few seconds, and the page will move on by itself. Your
          receipt is on its way too, with the download links in it.
        </p>
      </Frame>
    </>
  );
}

function Slow() {
  return (
    <Frame>
      <h1 className="h1">Payment received. Your workbook is on its way.</h1>
      <p className="lead">
        This is taking longer than usual. Nothing is wrong with your payment:
        your receipt email has the download links, and they work whenever you
        get to them.
      </p>
      <p className="muted">
        Nothing after a few minutes? Check spam, or write to
        support@francolink.net and we&apos;ll send them straight away.
      </p>
    </Frame>
  );
}

function Invalid() {
  return (
    <Frame>
      <h1 className="h1">That link doesn&apos;t work.</h1>
      <p className="lead">
        Use the link in your receipt email, or reply to that email and
        we&apos;ll sort it out. If you haven&apos;t bought the workbook yet, it&apos;s{" "}
        <a href={siteUrl("/francais-pas-a-pas")}>here</a>.
      </p>
    </Frame>
  );
}
