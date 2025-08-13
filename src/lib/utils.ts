export type ClassValue = string | number | boolean | undefined | null | Record<string, any> | ClassValue[];

export function cn(...inputs: ClassValue[]): string {
  return inputs
    .flat()
    .filter((x): x is string | Record<string, any> => x != null && x !== false)
    .map((x) => {
      if (typeof x === 'string') return x;
      if (typeof x === 'object') {
        return Object.entries(x)
          .filter(([, value]) => Boolean(value))
          .map(([key]) => key)
          .join(' ');
      }
      return String(x);
    })
    .join(' ')
    .replace(/\s+/g, ' ')
    .trim();
}