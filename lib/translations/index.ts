import { en } from "./en"
import { hi } from "./hi"
import { bn } from "./bn"
import { gu } from "./gu"
import { ta } from "./ta"
import { te } from "./te"
import { kn } from "./kn"
import { pa } from "./pa"
import { mr } from "./mr"

const translations = {
  en,
  hi,
  bn,
  gu,
  ta,
  te,
  kn,
  pa,
  mr,
}

export function getTranslation(language: string) {
  return translations[language as keyof typeof translations] || translations.en
}
