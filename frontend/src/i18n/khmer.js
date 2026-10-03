// Khmer numbers and month names, built by hand so they work in every browser.
export const KHMER_DIGITS = "០១២៣៤៥៦៧៨៩";

export const KHMER_MONTHS = [
  "មករា",
  "កុម្ភៈ",
  "មីនា",
  "មេសា",
  "ឧសភា",
  "មិថុនា",
  "កក្កដា",
  "សីហា",
  "កញ្ញា",
  "តុលា",
  "វិច្ឆិកា",
  "ធ្នូ",
];

export const toKhmerDigits = (value) =>
  String(value).replace(/[0-9]/g, (d) => KHMER_DIGITS[d]);
