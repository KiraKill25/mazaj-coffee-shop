import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import logoAsset from "@/assets/mazaj-logo.jpg.asset.json";
import { Minus, Plus, Package, BarChart3, Trash2, Banknote, CreditCard , Wallet } from "lucide-react";
import { T, TX, fmtOrder, money, resolveImage, setPos, usePos, type Item, type Lang } from "@/lib/pos";
import { LangBar, useDir } from "@/components/LangBar";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Register — MAZAJ Coffee Shop" },
      { name: "description", content: "MAZAJ Coffee Shop register: touch-friendly menu with photos, cash & card checkout and receipt printing." },
      { property: "og:title", content: "Register — MAZAJ Coffee Shop" },
      { property: "og:description", content: "MAZAJ Coffee Shop register with photo menu and receipt printing." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Register,
});

type Line = { item: Item; qty: number };
type OrderType = "dineIn" | "takeaway";
type Done = { num: number; type: OrderType; lines: Line[]; total: number; method: "cash" | "card"; received?: number | undefined; date: string; lang: Lang };

function Register() {
  useDir();
  const pos = usePos();
  const t = TX[pos.lang];
  const [cat, setCat] = useState<string>("all");
  const [cart, setCart] = useState<Line[]>([]);
  const [type, setType] = useState<OrderType>("dineIn");
  const [pay, setPay] = useState<null | "cash" | "card">(null);
  const [received, setReceived] = useState("");
  const [printed, setPrinted] = useState<Done | null>(null);

  const total = useMemo(() => cart.reduce((s, l) => s + l.item.price * l.qty, 0), [cart]);
  const items = pos.items.filter((i) => cat === "all" || i.category === cat);
  const usedCats = pos.categories.filter((c) => pos.items.some((i) => i.category === c.id));

  const add = (item: Item) => {
    if (item.outOfStock) return;
    setCart((c) => {
      const f = c.find((l) => l.item.id === item.id);
      return f ? c.map((l) => (l === f ? { ...l, qty: l.qty + 1 } : l)) : [...c, { item, qty: 1 }];
    });
  };
  const bump = (id: string, d: number) =>
    setCart((c) => c.map((l) => (l.item.id === id ? { ...l, qty: l.qty + d } : l)).filter((l) => l.qty > 0));

  const rec = parseFloat(received.replace(",", ".")) || 0;
  const presets = Array.from(new Set([Math.ceil(total), Math.ceil(total / 5) * 5, Math.ceil(total / 10) * 10, 20, 50, 100, 200]))
    .filter((v) => v >= total && v > 0).sort((a, b) => a - b).slice(0, 6);

  const confirm = () => {
    const done: Done = { num: pos.nextOrder, type, lines: cart, total, method: pay!, received: pay === "cash" ? rec : undefined, date: new Date().toLocaleString("fr-FR"), lang: pos.lang };
    setPos((s) => ({ ...s, nextOrder: s.nextOrder + 1, sales: [...(s.sales ?? []), { num: s.nextOrder, at: Date.now(), type, method: pay!, total, lines: cart.map((l) => ({ id: l.item.id, name: l.item.name, price: l.item.price, qty: l.qty })) }] }));
    setPrinted(done);
    setCart([]);
    setPay(null);
    setReceived("");
  };

  useEffect(() => {
    if (!printed) return;
    const id = setTimeout(() => window.print(), 150);
    return () => clearTimeout(id);
  }, [printed]);

  return (
    <div className="flex h-dvh flex-col bg-background text-foreground">
      <header className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3 border-b border-border bg-card px-4 py-3 sm:flex sm:justify-between">
        <div className="flex min-w-0 items-center gap-3">
          <img src={logoAsset.url} alt="MAZAJ Coffee Shop" className="h-11 w-11 shrink-0 rounded-xl border border-border object-cover" />
          <h1 className="truncate font-display text-xl font-extrabold">MAZAJ <span className="font-bold text-muted-foreground">· {t.register}</span></h1>
          <span className="hidden rounded-lg bg-accent px-3 py-1 text-sm font-bold text-accent-foreground sm:inline">{t.nextOrder} {fmtOrder(pos.nextOrder)}</span>
        </div>
        <div className="flex items-center gap-2">
          <LangBar />
          <Link to="/reports" aria-label={t.reports} title={t.reports} className="grid h-12 w-12 place-items-center rounded-xl bg-muted text-muted-foreground"><BarChart3 /></Link>
          <Link to="/inventory" aria-label={t.inventory} title={t.inventory} className="grid h-12 w-12 place-items-center rounded-xl bg-muted text-muted-foreground"><Package /></Link>
          <Link to="/expenses" aria-label="Expenses" title="Expenses" className="grid h-12 w-12 place-items-center rounded-xl bg-muted text-muted-foreground"><Wallet /></Link>
        </div>
      </header>

      <div className="flex min-h-0 flex-1 flex-col md:flex-row">
        <main className="flex min-h-0 flex-1 flex-col">
          <div className="flex gap-2 overflow-x-auto px-4 py-3">
            {[{ id: "all", label: t.all }, ...usedCats.map((c) => ({ id: c.id, label: c.name[pos.lang] }))].map((c) => (
              <button key={c.id} onClick={() => setCat(c.id)} className={`h-12 shrink-0 rounded-full px-5 font-bold ${cat === c.id ? "bg-foreground text-background" : "bg-card text-foreground border border-border"}`}>{c.label}</button>
            ))}
          </div>
          <div className="grid flex-1 auto-rows-max grid-cols-2 gap-3 overflow-y-auto px-4 pb-4 lg:grid-cols-3 xl:grid-cols-4">
            {items.map((i) => (
              <button key={i.id} onClick={() => add(i)} disabled={i.outOfStock} className="group relative overflow-hidden rounded-2xl border border-border bg-card text-start shadow-sm transition active:scale-95 disabled:opacity-50">
                <div className="aspect-[4/3] bg-muted">{i.image && <img src={resolveImage(i.image)} alt={i.name[pos.lang]} className="h-full w-full object-cover" />}</div>
                <div className="flex items-end justify-between gap-2 p-3">
                  <span className="font-bold leading-tight">{i.name[pos.lang]}</span>
                  <span className="shrink-0 rounded-lg bg-primary/10 px-2 py-1 text-sm font-extrabold text-primary">{money(i.price, pos.currency)}</span>
                </div>
                {i.outOfStock && <span className="absolute start-2 top-2 rounded-md bg-destructive px-2 py-1 text-xs font-bold text-destructive-foreground">{t.outOfStock}</span>}
              </button>
            ))}
          </div>
        </main>

        <aside className="flex max-h-[45dvh] w-full flex-col border-t border-border bg-card md:max-h-none md:w-96 md:border-s md:border-t-0">
          <div className="flex items-center justify-between gap-2 p-4">
            <div className="font-display text-lg font-extrabold">{t.order} {fmtOrder(pos.nextOrder)}</div>
            <div className="flex rounded-xl bg-muted p-1">
              {(["dineIn", "takeaway"] as const).map((o) => (
                <button key={o} onClick={() => setType(o)} className={`h-10 rounded-lg px-3 text-sm font-bold ${type === o ? "bg-accent text-accent-foreground" : "text-muted-foreground"}`}>{t[o]}</button>
              ))}
            </div>
          </div>
          <div className="flex-1 overflow-y-auto px-4">
            {cart.length === 0 && <p className="py-8 text-center text-muted-foreground">{t.empty}</p>}
            {cart.map((l) => (
              <div key={l.item.id} className="flex items-center gap-2 border-b border-border py-2">
                <div className="min-w-0 flex-1">
                  <div className="truncate font-bold">{l.item.name[pos.lang]}</div>
                  <div className="text-sm text-muted-foreground">{money(l.item.price * l.qty, pos.currency)}</div>
                </div>
                <button onClick={() => bump(l.item.id, -1)} className="grid h-11 w-11 place-items-center rounded-xl bg-muted"><Minus size={18} /></button>
                <span className="w-6 text-center font-extrabold">{l.qty}</span>
                <button onClick={() => bump(l.item.id, 1)} className="grid h-11 w-11 place-items-center rounded-xl bg-muted"><Plus size={18} /></button>
              </div>
            ))}
          </div>
          <div className="space-y-3 border-t border-border p-4">
            <div className="flex items-center justify-between font-display text-2xl font-black"><span>{t.total}</span><span>{money(total, pos.currency)}</span></div>
            <div className="grid grid-cols-[auto_1fr_1fr] gap-2">
              <button onClick={() => setCart([])} disabled={!cart.length} aria-label={t.clear} className="grid h-14 w-14 place-items-center rounded-xl bg-muted disabled:opacity-40"><Trash2 /></button>
              <button onClick={() => setPay("cash")} disabled={!cart.length} className="flex h-14 items-center justify-center gap-2 rounded-xl bg-success text-lg font-extrabold text-success-foreground disabled:opacity-40"><Banknote />{t.cash}</button>
              <button onClick={() => setPay("card")} disabled={!cart.length} className="flex h-14 items-center justify-center gap-2 rounded-xl bg-primary text-lg font-extrabold text-primary-foreground disabled:opacity-40"><CreditCard />{t.card}</button>
            </div>
          </div>
        </aside>
      </div>

      {pay && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-foreground/50 p-4">
          <div className="w-full max-w-md space-y-4 rounded-3xl bg-card p-6 shadow-xl">
            <div className="flex justify-between font-display text-2xl font-black"><span>{t.total}</span><span>{money(total, pos.currency)}</span></div>
            {pay === "cash" ? (
              <>
                <label className="block text-sm font-bold text-muted-foreground">{t.received}</label>
                <input inputMode="decimal" autoFocus value={received} onChange={(e) => setReceived(e.target.value)} className="h-14 w-full rounded-xl border border-input bg-background px-4 text-2xl font-bold" />
                <div className="grid grid-cols-3 gap-2">
                  <button onClick={() => setReceived(total.toFixed(2))} className="h-12 rounded-xl bg-accent font-bold text-accent-foreground">{t.exact}</button>
                  {presets.map((p) => <button key={p} onClick={() => setReceived(String(p))} className="h-12 rounded-xl bg-muted font-bold">{p} {pos.currency}</button>)}
                </div>
                <div className={`flex justify-between rounded-xl p-4 text-xl font-black ${rec >= total ? "bg-success/15 text-success" : "bg-destructive/10 text-destructive"}`}>
                  <span>{t.change}</span><span>{rec >= total ? money(rec - total, pos.currency) : t.short}</span>
                </div>
              </>
            ) : <p className="text-lg">{t.cardMsg}</p>}
            <div className="grid grid-cols-2 gap-2">
              <button onClick={() => setPay(null)} className="h-14 rounded-xl bg-muted font-bold">{t.cancel}</button>
              <button onClick={confirm} disabled={pay === "cash" && rec < total} className="h-14 rounded-xl bg-primary font-extrabold text-primary-foreground disabled:opacity-40">{t.confirm}</button>
            </div>
          </div>
        </div>
      )}

      {printed && <PrintArea done={printed} currency={pos.currency} />}
    </div>
  );
}

function PrintArea({ done, currency }: { done: Done; currency: string }) {
  const t = T[done.lang];
  const fr = T.fr;
  return (
    <div id="print-area" dir={done.lang === "ar" ? "rtl" : "ltr"}>
      <div className="receipt">
        <h2>MAZAJ COFFEE SHOP</h2>
        <p className="c">{done.date}</p>
        <p className="big c">{t.order} {fmtOrder(done.num)}</p>
        <p className="c">{t[done.type]}</p>
        <hr />
        {done.lines.map((l) => (
          <div className="row" key={l.item.id}><span>{l.qty} × {l.item.name[done.lang]}</span><span>{money(l.item.price * l.qty, currency)}</span></div>
        ))}
        <hr />
        <div className="row big"><span>{t.total}</span><span>{money(done.total, currency)}</span></div>
        <div className="row"><span>{t.paid} ({t[done.method]})</span><span>{money(done.received ?? done.total, currency)}</span></div>
        {done.method === "cash" && <div className="row"><span>{t.change}</span><span>{money((done.received ?? 0) - done.total, currency)}</span></div>}
        <hr />
        <p className="c">{t.thanks}</p>
      </div>
      <div className="receipt kitchen" dir="ltr">
        <h2>CUISINE</h2>
        <p className="big c">{fr.order} {fmtOrder(done.num)}</p>
        <p className="big c">{fr[done.type].toUpperCase()}</p>
        <p className="c">{done.date}</p>
        <hr />
        {done.lines.map((l) => <p className="big" key={l.item.id}>{l.qty} × {l.item.name.fr}</p>)}
        <hr />
      </div>
    </div>
  );
}
