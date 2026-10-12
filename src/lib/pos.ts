import { useSyncExternalStore } from "react";
import burger from "@/assets/burger.jpg";
import fries from "@/assets/fries.jpg";
import wrap from "@/assets/wrap.jpg";
import soda from "@/assets/soda.jpg";

export type Lang = "en" | "fr" | "ar";
export type Category = "burgers" | "wraps" | "sides" | "drinks" | "desserts";
export const CATEGORIES: Category[] = ["burgers", "wraps", "sides", "drinks", "desserts"];

export type Item = {
  id: string;
  name: Record<Lang, string>;
  price: number;
  category: Category;
  image: string; // "seed:<key>" or data URL
  outOfStock: boolean;
};

export type PosState = {
  items: Item[];
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
export type TKey = keyof typeof T.en;
