// A stable empty array used in `query.data ?? EMPTY_LIST` to keep useMemo
// dependency references stable across renders while data is loading.
export const EMPTY_LIST = Object.freeze([]);
