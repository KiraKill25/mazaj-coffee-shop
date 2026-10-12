import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { ArrowLeft, Lock, Trash2 } from "lucide-react";
import { CATEGORIES, T, resolveImage, setPos, usePos, type Category, type Item, type Lang } from "@/lib/pos";
import { LangBar, useDir } from "@/components/LangBar";

export const Route = createFileRoute("/manage")({
  head: () => ({
    meta: [
      { title: "Menu Management — Fast Food POS" },
      { name: "description", content: "Manager area to add dishes with photos, update prices and mark items out of stock." },
      { property: "og:title", content: "Menu Management — Fast Food POS" },
      { property: "og:description", content: "Add dishes, update prices and manage stock." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Manage,
});

function compress(file: File): Promise<string> {
  return new Promise((res, rej) => {
    const img = new Image();
    img.onload = () => {
      const s = 480 / Math.max(img.width, img.height);
      const c = document.createElement("canvas");
      c.width = img.width * Math.min(1, s);
      c.height = img.height * Math.min(1, s);
      c.getContext("2d")!.drawImage(img, 0, 0, c.width, c.height);
      res(c.toDataURL("image/jpeg", 0.75));
    };
    img.onerror = rej;
    img.src = URL.createObjectURL(file);
  });
}

const input = "h-12 w-full rounded-xl border border-input bg-background px-3 font-semibold";

function Manage() {
  useDir();
  const pos = usePos();
  const t = T[pos.lang];
  const [unlocked, setUnlocked] = useState(false);
  const [pin, setPin] = useState("");
  const [err, setErr] = useState(false);
  const [draft, setDraft] = useState({ en: "", fr: "", ar: "", price: "", category: "burgers" as Category, image: "" });
  const [newPin, setNewPin] = useState("");

  const update = (id: string, patch: Partial<Item>) =>
    setPos((s) => ({ ...s, items: s.items.map((i) => (i.id === id ? { ...i, ...patch } : i)) }));

  if (!unlocked) {
    return (
      <div className="grid min-h-dvh place-items-center bg-background p-4">
        <div className="w-full max-w-xs space-y-4 rounded-3xl bg-card p-6 text-center shadow-lg">
          <Lock className="mx-auto text-primary" size={36} />
          <h1 className="font-display text-xl font-extrabold">{t.enterPin}</h1>
          <input type="password" inputMode="numeric" value={pin} onChange={(e) => { setPin(e.target.value); setErr(false); }} className="h-14 w-full rounded-xl border border-input bg-background text-center text-3xl tracking-[0.5em]" />
          <div className="grid grid-cols-3 gap-2">
            {["1","2","3","4","5","6","7","8","9","C","0","⌫"].map((k) => (
              <button key={k} onClick={() => setPin((p) => k === "C" ? "" : k === "⌫" ? p.slice(0, -1) : p + k)} className="h-14 rounded-xl bg-muted text-xl font-bold">{k}</button>
            ))}
          </div>
          {err && <p className="font-bold text-destructive">{t.wrongPin}</p>}
          <button onClick={() => (pin === pos.pin ? setUnlocked(true) : setErr(true))} className="h-14 w-full rounded-xl bg-primary font-extrabold text-primary-foreground">{t.unlock}</button>
          <Link to="/" className="block text-sm font-bold text-muted-foreground">{t.back}</Link>
        </div>
      </div>
    );
  }

  const addItem = () => {
    const price = parseFloat(draft.price.replace(",", "."));
    if (!draft.fr.trim() || !(price >= 0)) return;
    const name: Record<Lang, string> = { fr: draft.fr.trim(), en: draft.en.trim() || draft.fr.trim(), ar: draft.ar.trim() || draft.fr.trim() };
    setPos((s) => ({ ...s, items: [...s.items, { id: crypto.randomUUID(), name, price, category: draft.category, image: draft.image, outOfStock: false }] }));
    setDraft({ en: "", fr: "", ar: "", price: "", category: draft.category, image: "" });
  };

  return (
    <div className="min-h-dvh bg-background">
      <header className="sticky top-0 z-10 grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3 border-b border-border bg-card px-4 py-3 sm:flex sm:justify-between">
        <div className="flex min-w-0 items-center gap-3">
          <Link to="/" aria-label={t.back} className="grid h-12 w-12 shrink-0 place-items-center rounded-xl bg-muted"><ArrowLeft className="rtl:rotate-180" /></Link>
          <h1 className="truncate font-display text-xl font-extrabold">{t.manage}</h1>
        </div>
        <LangBar />
      </header>

      <div className="mx-auto grid max-w-6xl gap-6 p-4 lg:grid-cols-[1fr_340px]">
        <section className="space-y-3">
          {pos.items.map((i) => (
            <div key={i.id} className="flex flex-wrap items-center gap-3 rounded-2xl border border-border bg-card p-3">
              <label className="h-16 w-16 shrink-0 cursor-pointer overflow-hidden rounded-xl bg-muted">
                {i.image && <img src={resolveImage(i.image)} alt="" className="h-full w-full object-cover" />}
                <input type="file" accept="image/*" className="hidden" onChange={async (e) => { const f = e.target.files?.[0]; if (f) update(i.id, { image: await compress(f) }); }} />
              </label>
              <div className="min-w-0 flex-1">
                <div className="truncate font-bold">{i.name[pos.lang]}</div>
                <div className="text-sm text-muted-foreground">{t[i.category]}</div>
              </div>
              <input type="number" step="0.1" defaultValue={i.price} onBlur={(e) => { const v = parseFloat(e.target.value); if (v >= 0) update(i.id, { price: v }); }} className="h-12 w-24 rounded-xl border border-input bg-background px-2 text-center font-bold" />
              <button onClick={() => update(i.id, { outOfStock: !i.outOfStock })} className={`h-12 rounded-xl px-3 text-sm font-bold ${i.outOfStock ? "bg-destructive text-destructive-foreground" : "bg-success/15 text-success"}`}>{i.outOfStock ? t.outOfStock : t.inStock}</button>
              <button onClick={() => confirm(`${t.delete}?`) && setPos((s) => ({ ...s, items: s.items.filter((x) => x.id !== i.id) }))} aria-label={t.delete} className="grid h-12 w-12 place-items-center rounded-xl bg-muted text-destructive"><Trash2 /></button>
            </div>
          ))}
        </section>

        <aside className="space-y-6">
          <div className="space-y-3 rounded-2xl border border-border bg-card p-4">
            <h2 className="font-display text-lg font-extrabold">{t.addItem}</h2>
            <input placeholder={`${t.name} (FR)`} value={draft.fr} onChange={(e) => setDraft({ ...draft, fr: e.target.value })} className={input} />
            <input placeholder={`${t.name} (EN)`} value={draft.en} onChange={(e) => setDraft({ ...draft, en: e.target.value })} className={input} />
            <input placeholder={`${t.name} (AR)`} dir="rtl" value={draft.ar} onChange={(e) => setDraft({ ...draft, ar: e.target.value })} className={input} />
            <input placeholder={t.price} inputMode="decimal" value={draft.price} onChange={(e) => setDraft({ ...draft, price: e.target.value })} className={input} />
            <select value={draft.category} onChange={(e) => setDraft({ ...draft, category: e.target.value as Category })} className={input}>
              {CATEGORIES.map((c) => <option key={c} value={c}>{t[c]}</option>)}
            </select>
            <label className="flex h-12 cursor-pointer items-center gap-3 rounded-xl bg-muted px-3 font-semibold">
              {draft.image ? <img src={draft.image} alt="" className="h-9 w-9 rounded-lg object-cover" /> : "📷"} {t.photo}
              <input type="file" accept="image/*" className="hidden" onChange={async (e) => { const f = e.target.files?.[0]; if (f) setDraft({ ...draft, image: await compress(f) }); }} />
            </label>
            <button onClick={addItem} className="h-12 w-full rounded-xl bg-primary font-extrabold text-primary-foreground">{t.save}</button>
          </div>

          <div className="space-y-3 rounded-2xl border border-border bg-card p-4">
            <h2 className="font-display text-lg font-extrabold">{t.settings}</h2>
            <label className="block text-sm font-bold text-muted-foreground">{t.currency}</label>
            <input value={pos.currency} onChange={(e) => setPos((s) => ({ ...s, currency: e.target.value.slice(0, 5) }))} className={input} />
            <label className="block text-sm font-bold text-muted-foreground">{t.newPin}</label>
            <div className="flex gap-2">
              <input inputMode="numeric" value={newPin} onChange={(e) => setNewPin(e.target.value.replace(/\D/g, "").slice(0, 8))} className={input} />
              <button onClick={() => { if (newPin.length >= 4) { setPos((s) => ({ ...s, pin: newPin })); setNewPin(""); } }} className="h-12 shrink-0 rounded-xl bg-accent px-4 font-bold text-accent-foreground">{t.save}</button>
            </div>
            <button onClick={() => confirm(`${t.resetCounter}?`) && setPos((s) => ({ ...s, nextOrder: 1 }))} className="h-12 w-full rounded-xl bg-muted font-bold">{t.resetCounter} (#001)</button>
            <button onClick={() => setUnlocked(false)} className="h-12 w-full rounded-xl bg-muted font-bold">{t.lock}</button>
          </div>
        </aside>
      </div>
    </div>
  );
}
