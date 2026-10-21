import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { ArrowLeft, Package , Wallet } from "lucide-react";
import { TX, fmtOrder, money, periodStart, summarize, usePos } from "@/lib/pos";
import { LangBar, useDir } from "@/components/LangBar";
import { PinGate } from "@/components/PinGate";

export const Route = createFileRoute("/reports")({
  head: () => ({
    meta: [
      { title: "Sales Reports — MAZAJ Coffee Shop" },

      { name: "description", content: "Daily, weekly and monthly sales reports with full order history." },
      { property: "og:title", content: "Sales Reports — Fast Food POS" },
      { property: "og:description", content: "Daily, weekly and monthly sales reports and order history." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: () => { useDir(); return <PinGate>{() => <Reports />}</PinGate>; },
});

type Period = "day" | "week" | "month";

function Reports() {
  const pos = usePos();
  const t = TX[pos.lang];
  const [period, setPeriod] = useState<Period>("day");
  const r = summarize(pos.sales ?? [], periodStart(period));
  const locale = pos.lang === "ar" ? "ar" : pos.lang === "fr" ? "fr-FR" : "en-GB";
  const labels: Record<Period, string> = { day: t.today, week: t.week, month: t.month };

  const stat = (label: string, value: string) => (
    <div className="rounded-2xl border border-border bg-card p-4">
      <div className="text-sm font-bold text-muted-foreground">{label}</div>
      <div className="mt-1 font-display text-2xl font-black">{value}</div>
    </div>
  );

  return (
    <div className="min-h-dvh bg-background">
      <header className="sticky top-0 z-10 grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3 border-b border-border bg-card px-4 py-3 sm:flex sm:justify-between">
        <div className="flex min-w-0 items-center gap-3">
          <Link to="/" aria-label={t.back} className="grid h-12 w-12 shrink-0 place-items-center rounded-xl bg-muted"><ArrowLeft className="rtl:rotate-180" /></Link>
          <h1 className="truncate font-display text-xl font-extrabold">{t.reports}</h1>
        </div>
        <div className="flex items-center gap-2">
          <LangBar />
          <Link to="/inventory" aria-label={t.inventory} className="grid h-12 w-12 place-items-center rounded-xl bg-muted"><Package /></Link>
          <Link to="/expenses" aria-label="Expenses" title="Expenses" className="grid h-12 w-12 place-items-center rounded-xl bg-muted text-muted-foreground"><Wallet /></Link>
        </div>
      </header>

      <div className="mx-auto max-w-6xl space-y-6 p-4">
        <div className="flex gap-2 rounded-2xl bg-muted p-1 sm:w-fit">
          {(["day", "week", "month"] as const).map((p) => (
            <button key={p} onClick={() => setPeriod(p)} className={`h-12 flex-1 rounded-xl px-5 font-bold sm:flex-none ${period === p ? "bg-foreground text-background" : "text-muted-foreground"}`}>{labels[p]}</button>
          ))}
        </div>

        <div className="grid grid-cols-2 gap-3 lg:grid-cols-5">
          {stat(t.revenue, money(r.revenue, pos.currency))}
          {stat(t.orders, String(r.count))}
          {stat(t.avgTicket, money(r.avg, pos.currency))}
          {stat(t.cash, money(r.cash, pos.currency))}
          {stat(t.card, money(r.card, pos.currency))}
        </div>

        {r.count === 0 ? (
          <p className="rounded-2xl border border-border bg-card p-8 text-center text-muted-foreground">{t.noSales}</p>
        ) : (
          <div className="grid gap-6 lg:grid-cols-[320px_1fr]">
            <section className="space-y-2 rounded-2xl border border-border bg-card p-4">
              <h2 className="font-display text-lg font-extrabold">{t.topItems}</h2>
              {r.top.slice(0, 10).map((x, i) => (
                <div key={i} className="flex justify-between gap-2 border-b border-border py-2 last:border-0">
                  <span className="truncate font-semibold">{x.qty} × {x.name[pos.lang]}</span>
                  <span className="shrink-0 font-bold">{money(x.amount, pos.currency)}</span>
                </div>
              ))}
            </section>
            <section className="space-y-2 rounded-2xl border border-border bg-card p-4">
              <h2 className="font-display text-lg font-extrabold">{t.history}</h2>
              {[...r.sales].reverse().map((s) => (
                <details key={s.at} className="rounded-xl bg-muted px-3 py-2">
                  <summary className="flex cursor-pointer flex-wrap items-center gap-x-3 gap-y-1">
                    <span className="font-extrabold">{fmtOrder(s.num)}</span>
                    <span className="text-sm text-muted-foreground">{new Date(s.at).toLocaleString(locale, { dateStyle: "short", timeStyle: "short" })}</span>
                    <span className="text-sm font-semibold">{t[s.type]} · {t[s.method]}</span>
                    <span className="ms-auto font-bold">{money(s.total, pos.currency)}</span>
                  </summary>
                  <div className="mt-2 space-y-1 text-sm">
                    {s.lines.map((l) => <div key={l.id} className="flex justify-between"><span>{l.qty} × {l.name[pos.lang]}</span><span>{money(l.qty * l.price, pos.currency)}</span></div>)}
                  </div>
                </details>
              ))}
            </section>
          </div>
        )}
      </div>
    </div>
  );
}
