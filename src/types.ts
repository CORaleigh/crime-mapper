export interface Description {
  group: string;
  descriptions: { description: string; count: number }[];
}

export const updateLocalStorage = (key: string, value: string) => {
    const setting = localStorage.getItem('crimeMapper.saveSearch');
    if (!setting || setting === "true") {
        localStorage.setItem(key, value);
    }
}