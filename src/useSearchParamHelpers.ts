import { useSearchParams } from "react-router-dom";

export function useSearchParamHelpers() {
  const [searchParams, setSearchParams] = useSearchParams();

  const updateSearchParam = (key: string, value: string) => {
    setSearchParams(() => {
      const newParams = new URLSearchParams(window.location.search);
      newParams.set(key, value);  
      return newParams;
    });
  };

  const deleteSearchParam = (key: string) => {
    setSearchParams(() => {
      const newParams = new URLSearchParams(window.location.search);
      newParams.delete(key);  
      return newParams;
    });
  };

  const getSearchParam = (key: string) => searchParams.get(key);

  return { updateSearchParam, deleteSearchParam, getSearchParam };
}