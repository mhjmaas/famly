import type enUS from "@/dictionaries/en-US";
import type nlNL from "@/dictionaries/nl-NL";

export type Dictionary = typeof enUS | typeof nlNL;

export type DictionarySection<K extends keyof Dictionary> = Dictionary[K];
