import { useCallback } from "react";

export function useSearchParamHelpers() {
  /** Get the current value of a param */
  const getSearchParam = useCallback((key: string) => {
    const params = new URLSearchParams(window.location.search);
    return params.get(key);
  }, []);

  /** Update or add a search param without reloading */
  const updateSearchParam = useCallback((key: string, value: string) => {
    const params = new URLSearchParams(window.location.search);
    params.set(key, value);
    const newUrl =
      window.location.pathname + "?" + params.toString() + window.location.hash;
    window.history.replaceState({}, "", newUrl);
  }, []);

  /** Delete a search param without reloading */
  const deleteSearchParam = useCallback((key: string) => {
    const params = new URLSearchParams(window.location.search);
    params.delete(key);
    const newUrl =
      window.location.pathname + "?" + params.toString() + window.location.hash;
    window.history.replaceState({}, "", newUrl);
  }, []);

  return { getSearchParam, updateSearchParam, deleteSearchParam };
}