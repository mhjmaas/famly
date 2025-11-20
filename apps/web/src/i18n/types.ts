import type enUS from "@/dictionaries/en-US.json";
import type nlNL from "@/dictionaries/nl-NL.json";

export type Dictionary = typeof enUS | typeof nlNL;

export type DictionarySection<K extends keyof Dictionary> = Dictionary[K];
