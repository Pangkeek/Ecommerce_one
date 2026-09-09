import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
export function cn(...inputs: ClassValue[]) { return twMerge(clsx(inputs)); }
export const baht = (amount: number, locale="th-TH") => new Intl.NumberFormat(locale,{style:"currency",currency:"THB",maximumFractionDigits:0}).format(amount);
