import type enUS from "@/dictionaries/en-US.json";

export type Dictionary = typeof enUS;

export type DictionarySection<K extends keyof Dictionary> = Dictionary[K];
