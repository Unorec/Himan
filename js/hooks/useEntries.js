import { useState, useCallback } from 'react';
import { entriesApi } from '@/services/entries';

export const useEntries = () => {
  const [entries, setEntries] = useState([]);

  const addEntry = useCallback(async (entry) => {
    try {
      const newEntry = await entriesApi.create(entry);
      setEntries(prev => [...prev, newEntry]);
      return newEntry;
    } catch (error) {
      console.error('新增記錄失敗:', error);
      throw error;
    }
  }, []);

  return { entries, addEntry };
};