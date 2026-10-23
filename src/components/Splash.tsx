import { useEffect, useState } from "react";
import logoAsset from "@/assets/mazaj-logo.jpg.asset.json";
import { usePos } from "@/lib/pos";

// Shown once each time the app is opened (not on every page change).
let shown = false;
const WELCOME = { en: "Welcome to MAZAJ", fr: "Bienvenue chez MAZAJ", ar: "أهلاً بكم في مزاج" };

export function Splash() {
  const pos = usePos();
  const [state, setState] = useState<"hidden" | "in" | "out">("hidden");
  useEffect(() => {
    if (shown) return;
    shown = true;
    setState("in");
    setTimeout(() => setState((v) => (v === "in" ? "out" : v)), 2600);
    setTimeout(() => setState("hidden"), 3200);
  }, []);
  if (state === "hidden") return null;
  return (
    <div onClick={() => setState("hidden")} className={`fixed inset-0 z-[100] grid place-items-center bg-background transition-opacity duration-500 ${state === "out" ? "opacity-0" : "opacity-100"}`}>
      <div className="text-center">
        <div className="relative mx-auto w-48">
          <div className="splash-steam absolute -top-8 left-1/2 h-10 w-2 -translate-x-1/2 rounded-full bg-primary/30" />
          <img src={logoAsset.url} alt="MAZAJ Coffee Shop" className="splash-logo h-48 w-48 rounded-[2rem] object-cover shadow-2xl" />
        </div>
        <h1 className="splash-text mt-8 font-display text-3xl font-black">{WELCOME[pos.lang]}</h1>
        <p className="splash-text mt-2 font-bold tracking-[0.3em] text-muted-foreground" style={{ animationDelay: "0.9s" }}>COFFEE SHOP</p>
      </div>
    </div>
  );
}
