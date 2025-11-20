type Mergeable = Record<string, unknown>;

const isPlainObject = (value: unknown): value is Mergeable =>
  typeof value === "object" && value !== null && !Array.isArray(value);

const mergeInto = (target: Mergeable, source?: Mergeable): Mergeable => {
  if (!source) return target;

  for (const [key, value] of Object.entries(source)) {
    const existing = target[key];

    if (isPlainObject(value) && isPlainObject(existing)) {
      target[key] = mergeInto({ ...existing }, value);
      continue;
    }

    if (isPlainObject(value)) {
      target[key] = mergeInto({}, value);
      continue;
    }

    target[key] = value;
  }

  return target;
};

export function deepMerge<T extends Mergeable>(
  ...objects: Array<Partial<T>>
): T {
  return objects.reduce<Mergeable>((acc, obj) => mergeInto(acc, obj), {}) as T;
}
