import qs from "query-string";

type QueryValue = string | number | boolean | null | undefined | string[] | number[] | boolean[];
type QueryObject = Record<string, QueryValue>;

export function parseQuery(search: string): QueryObject {
  const parsed = qs.parse(search, { arrayFormat: "bracket" });
  return parsed as QueryObject;
}

export function stringifyQuery(query: QueryObject): string {
  return qs.stringify(query, { skipNull: true, skipEmptyString: true, arrayFormat: "bracket" });
}

export function withUpdatedParams(pathname: string, currentSearch: string, updates: QueryObject): string {
  const current = parseQuery(currentSearch);
  const next: QueryObject = { ...current };

  Object.entries(updates).forEach(([key, value]) => {
    if (value === undefined || value === null || (Array.isArray(value) && value.length === 0)) {
      delete next[key];
    } else {
      next[key] = value as QueryValue;
    }
  });

  const search = stringifyQuery(next);
  return search ? `${pathname}?${search}` : pathname;
}

export function toggleArrayParam(
  pathname: string,
  currentSearch: string,
  key: string,
  value: string
): string {
  const current = parseQuery(currentSearch);
  const arr = new Set<string>(Array.isArray(current[key]) ? (current[key] as string[]) : current[key] ? [String(current[key])] : []);
  if (arr.has(value)) {
    arr.delete(value);
  } else {
    arr.add(value);
  }
  const nextValues = Array.from(arr);
  const updates: QueryObject = { [key]: nextValues.length ? nextValues : undefined };
  return withUpdatedParams(pathname, currentSearch, updates);
}

export function setParam(
  pathname: string,
  currentSearch: string,
  key: string,
  value: string | number | null | undefined
): string {
  return withUpdatedParams(pathname, currentSearch, { [key]: value === null || value === undefined ? undefined : String(value) });
}

export function removeParams(pathname: string, currentSearch: string, keys: string[]): string {
  const current = parseQuery(currentSearch);
  keys.forEach((k) => delete current[k]);
  const search = stringifyQuery(current);
  return search ? `${pathname}?${search}` : pathname;
}

export function getArrayParam(search: string, key: string): string[] {
  const q = parseQuery(search);
  const v = q[key];
  if (Array.isArray(v)) return v.map(String);
  if (v === undefined) return [];
  return [String(v)];
}

export function getStringParam(search: string, key: string): string | undefined {
  const q = parseQuery(search);
  const v = q[key];
  if (v === undefined) return undefined;
  return Array.isArray(v) ? (v[0] ? String(v[0]) : undefined) : String(v);
}
