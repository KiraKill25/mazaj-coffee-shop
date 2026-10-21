import { useSyncExternalStore } from "react";
import burger from "@/assets/burger.jpg";
import fries from "@/assets/fries.jpg";
import wrap from "@/assets/wrap.jpg";
import soda from "@/assets/soda.jpg";

export type Lang = "en" | "fr" | "ar";
export type Category = { id: string; name: Record<Lang, string> };
export type SaleLine = { id: string; name: Record<Lang, string>; price: number; qty: number };
export type Sale = { num: number; at: number; type: "dineIn" | "takeaway"; method: "cash" | "card"; total: number; lines: SaleLine[] };

export type Expense = { id: string; at: number; category: string; label: string; amount: number; note?: string };

export type Item = {
  id: string;
  name: Record<Lang, string>;
  price: number;
  category: string;
  image: string; // "seed:<key>" or data URL
  outOfStock: boolean;
};

export type PosState = {
  items: Item[];
  categories: Category[];
  sales: Sale[];
  expenses: Expense[];
  expenseCategories: Category[];
  nextOrder: number;
  pin: string;
  currency: string;
  lang: Lang;
};

const SEED_IMAGES: Record<string, string> = { burger, fries, wrap, soda };
export const resolveImage = (img: string) =>
  img.startsWith("seed:") ? SEED_IMAGES[img.slice(5)] ?? "" : img;

const seed = (): PosState => ({
  items: [
    { id: "1", name: { en: "Cheeseburger", fr: "Cheeseburger", ar: "تشيز برغر" }, price: 6.5, category: "burgers", image: "seed:burger", outOfStock: false },
    { id: "2", name: { en: "Double Burger", fr: "Double Burger", ar: "برغر مزدوج" }, price: 8.9, category: "burgers", image: "seed:burger", outOfStock: false },
    { id: "3", name: { en: "Chicken Wrap", fr: "Wrap Poulet", ar: "راب دجاج" }, price: 6, category: "wraps", image: "seed:wrap", outOfStock: false },
    { id: "4", name: { en: "Fries", fr: "Frites", ar: "بطاطس مقلية" }, price: 2.5, category: "sides", image: "seed:fries", outOfStock: false },
    { id: "5", name: { en: "Large Fries", fr: "Grandes Frites", ar: "بطاطس كبيرة" }, price: 3.5, category: "sides", image: "seed:fries", outOfStock: false },
    { id: "6", name: { en: "Cola", fr: "Cola", ar: "كولا" }, price: 2, category: "drinks", image: "seed:soda", outOfStock: false },
  ],
  categories: [
    { id: "burgers", name: { en: "Burgers", fr: "Burgers", ar: "برغر" } },
    { id: "wraps", name: { en: "Wraps", fr: "Wraps", ar: "راب" } },
    { id: "sides", name: { en: "Sides", fr: "Accompagnements", ar: "مقبلات" } },
    { id: "drinks", name: { en: "Drinks", fr: "Boissons", ar: "مشروبات" } },
    { id: "desserts", name: { en: "Desserts", fr: "Desserts", ar: "حلويات" } },
  ],
  sales: [],
  expenses: [],
  expenseCategories: [
    { id: "purchases", name: { en: "Purchases & supplies", fr: "Achats & fournitures", ar: "مشتريات ولوازم" } },
    { id: "salaries", name: { en: "Salaries", fr: "Salaires", ar: "رواتب" } },
    { id: "rent", name: { en: "Rent", fr: "Loyer", ar: "إيجار" } },
    { id: "utilities", name: { en: "Utilities (water, power, gas)", fr: "Charges (eau, électricité, gaz)", ar: "فواتير (ماء، كهرباء، غاز)" } },
    { id: "other", name: { en: "Other", fr: "Autres", ar: "أخرى" } },
  ],
  nextOrder: 1,
  pin: "1234",
  currency: "€",
  lang: "fr",
});

const KEY = "pos-state-v1";
let state: PosState | null = null;
const listeners = new Set<() => void>();

function load(): PosState {
  if (state) return state;
  try {
    const raw = localStorage.getItem(KEY);
    state = raw ? { ...seed(), ...JSON.parse(raw) } : seed();
  } catch {
    state = seed();
  }
  return state!;
}

export function setPos(update: (s: PosState) => PosState) {
  state = update(load());
  try {
    localStorage.setItem(KEY, JSON.stringify(state));
  } catch {
    alert("Storage full — use smaller photos.");
  }
  listeners.forEach((l) => l());
}

const serverSnap = seed();
export function usePos(): PosState {
  return useSyncExternalStore(
    (l) => {
      listeners.add(l);
      return () => listeners.delete(l);
    },
    () => load(),
    () => serverSnap,
  );
}

export const fmtOrder = (n: number) => `#${String(n).padStart(3, "0")}`;
export const money = (n: number, c: string) => `${n.toFixed(2)} ${c}`;

export const T = {
  en: { register: "Register", manage: "Menu management", dineIn: "Dine-in", takeaway: "Takeaway", order: "Order", empty: "Tap a dish to add it", total: "Total", cash: "Cash", card: "Card", clear: "Clear", outOfStock: "Out of stock", received: "Amount received", change: "Change owed", exact: "Exact", confirm: "Confirm & print", cancel: "Cancel", cardMsg: "Process the payment on the card terminal, then confirm.", enterPin: "Enter manager PIN", wrongPin: "Wrong PIN", unlock: "Unlock", addItem: "Add item", name: "Name", price: "Price", category: "Category", photo: "Photo", save: "Save", delete: "Delete", inStock: "In stock", settings: "Settings", currency: "Currency", newPin: "New PIN", resetCounter: "Reset order numbers", back: "Back to register", thanks: "Thank you!", paid: "Paid", lock: "Lock", nextOrder: "Next order", burgers: "Burgers", wraps: "Wraps", sides: "Sides", drinks: "Drinks", desserts: "Desserts", all: "All", short: "Not enough" },
  fr: { register: "Caisse", manage: "Gestion du menu", dineIn: "Sur place", takeaway: "À emporter", order: "Commande", empty: "Touchez un plat pour l'ajouter", total: "Total", cash: "Espèces", card: "Carte", clear: "Vider", outOfStock: "Épuisé", received: "Montant reçu", change: "Monnaie à rendre", exact: "Exact", confirm: "Valider & imprimer", cancel: "Annuler", cardMsg: "Encaissez sur le terminal de carte, puis validez.", enterPin: "Code PIN gérant", wrongPin: "Code incorrect", unlock: "Déverrouiller", addItem: "Ajouter un plat", name: "Nom", price: "Prix", category: "Catégorie", photo: "Photo", save: "Enregistrer", delete: "Supprimer", inStock: "Disponible", settings: "Réglages", currency: "Devise", newPin: "Nouveau PIN", resetCounter: "Réinitialiser les numéros", back: "Retour à la caisse", thanks: "Merci !", paid: "Payé", lock: "Verrouiller", nextOrder: "Prochaine commande", burgers: "Burgers", wraps: "Wraps", sides: "Accompagnements", drinks: "Boissons", desserts: "Desserts", all: "Tout", short: "Insuffisant" },
  ar: { register: "الصندوق", manage: "إدارة القائمة", dineIn: "في المطعم", takeaway: "سفري", order: "طلب", empty: "اضغط على طبق لإضافته", total: "المجموع", cash: "نقداً", card: "بطاقة", clear: "مسح", outOfStock: "نفد", received: "المبلغ المستلم", change: "الباقي", exact: "المبلغ بالضبط", confirm: "تأكيد وطباعة", cancel: "إلغاء", cardMsg: "أتمم الدفع على جهاز البطاقة ثم أكّد.", enterPin: "أدخل رمز المدير", wrongPin: "رمز خاطئ", unlock: "فتح", addItem: "إضافة طبق", name: "الاسم", price: "السعر", category: "الفئة", photo: "صورة", save: "حفظ", delete: "حذف", inStock: "متوفر", settings: "الإعدادات", currency: "العملة", newPin: "رمز جديد", resetCounter: "إعادة ترقيم الطلبات", back: "العودة للصندوق", thanks: "شكراً لكم!", paid: "مدفوع", lock: "قفل", nextOrder: "الطلب التالي", burgers: "برغر", wraps: "راب", sides: "مقبلات", drinks: "مشروبات", desserts: "حلويات", all: "الكل", short: "غير كافٍ" },
} as const;
const EXTRA = {
  en: { inventory: "Inventory", reports: "Sales reports", categories: "Categories", addCategory: "Add category", today: "Today", week: "This week", month: "This month", orders: "Orders", revenue: "Revenue", avgTicket: "Average ticket", history: "Sales history", topItems: "Best sellers", noSales: "No sales in this period", uncategorized: "Uncategorized", edit: "Edit", qty: "Qty" },
  fr: { inventory: "Inventaire", reports: "Rapports de ventes", categories: "Catégories", addCategory: "Ajouter une catégorie", today: "Aujourd'hui", week: "Cette semaine", month: "Ce mois", orders: "Commandes", revenue: "Chiffre d'affaires", avgTicket: "Panier moyen", history: "Historique des ventes", topItems: "Meilleures ventes", noSales: "Aucune vente sur cette période", uncategorized: "Sans catégorie", edit: "Modifier", qty: "Qté" },
  ar: { inventory: "المخزون", reports: "تقارير المبيعات", categories: "الفئات", addCategory: "إضافة فئة", today: "اليوم", week: "هذا الأسبوع", month: "هذا الشهر", orders: "الطلبات", revenue: "الإيرادات", avgTicket: "متوسط الطلب", history: "سجل المبيعات", topItems: "الأكثر مبيعاً", noSales: "لا توجد مبيعات في هذه الفترة", uncategorized: "بدون فئة", edit: "تعديل", qty: "الكمية" },
} as const;
export const TX = { en: { ...T.en, ...EXTRA.en }, fr: { ...T.fr, ...EXTRA.fr }, ar: { ...T.ar, ...EXTRA.ar } };

/** Start of the period (local time) containing `now`. Weeks start on Monday. */
export function periodStart(period: "day" | "week" | "month", now = new Date()): number {
  const d = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  if (period === "week") d.setDate(d.getDate() - ((d.getDay() + 6) % 7));
  if (period === "month") d.setDate(1);
  return d.getTime();
}

export function summarize(sales: Sale[], from: number) {
  const s = sales.filter((x) => x.at >= from);
  const revenue = s.reduce((a, x) => a + x.total, 0);
  const cash = s.filter((x) => x.method === "cash").reduce((a, x) => a + x.total, 0);
  const top = new Map<string, { name: Record<Lang, string>; qty: number; amount: number }>();
  for (const x of s) for (const l of x.lines) {
    const e = top.get(l.id) ?? { name: l.name, qty: 0, amount: 0 };
    e.qty += l.qty; e.amount += l.qty * l.price; top.set(l.id, e);
  }
  return { sales: s, count: s.length, revenue, cash, card: revenue - cash, avg: s.length ? revenue / s.length : 0, top: [...top.values()].sort((a, b) => b.qty - a.qty) };
}

/** Expenses since `from`, total and per-category breakdown (largest first). */
export function summarizeExpenses(expenses: Expense[], from: number) {
  const e = expenses.filter((x) => x.at >= from);
  const byCat = new Map<string, number>();
  for (const x of e) byCat.set(x.category, (byCat.get(x.category) ?? 0) + x.amount);
  return { expenses: e, total: e.reduce((a, x) => a + x.amount, 0), byCat: [...byCat.entries()].sort((a, b) => b[1] - a[1]) };
}

export type TKey = keyof typeof T.en;
