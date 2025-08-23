"use client";
import { useCallback, useState } from "react";

type SetValue<T> = T | ((val: T) => T);

function useLocalStorage<T>(
  key: string,
  initialValue: T,
): [T, (value: SetValue<T>) => void] {
  // State to store our value
  // Pass initial state function to useState so logic is only executed once
  const [storedValue, setStoredValue] = useState<T>(() => {
    try {
      // Get from local storage by key
      if (typeof window !== "undefined") {
        const item = window.localStorage.getItem(key);
        // Parse stored json or if none return initialValue
        return item ? JSON.parse(item) : initialValue;
      }
      return initialValue;
    } catch (error) {
      // If error also return initialValue
      console.log(error);
      return initialValue;
    }
  });

  // Function to update both state and localStorage
  const setValue = useCallback((value: SetValue<T>) => {
    try {
      // Allow value to be a function so we have same API as useState
      const valueToStore = typeof value === "function" ? (value as (val: T) => T)(storedValue) : value;
      
      // Save to state
      setStoredValue(valueToStore);
      
      // Save to localStorage
      if (typeof window !== "undefined") {
        window.localStorage.setItem(key, JSON.stringify(valueToStore));
      }
    } catch (error) {
      console.log(error);
    }
  }, [key, storedValue]);

  return [storedValue, setValue];
}

export default useLocalStorage;
