export const REVIEW_T = 0.40;
export const BLOCK_T = 0.75;

export const inr = (n: number) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(n);

export const clock = (iso: string) =>
  new Date(iso).toLocaleTimeString([], { hour12: false });