import React, { createContext, useContext, useState, useCallback, useRef } from 'react';
import { Dataset, DataColumn } from '@/utils/dataImporter';

// History entry for undo/redo
interface HistoryEntry {
  dataset: Dataset;
  description: string;
  timestamp: number;
}

interface DataContextType {
  // Current dataset
  dataset: Dataset | null;
  setDataset: (dataset: Dataset | null) => void;

  // History for undo/redo
  canUndo: boolean;
  canRedo: boolean;
  undo: () => void;
  redo: () => void;
  historyLength: number;
  currentHistoryIndex: number;

  // Data operations with history tracking
  updateDataset: (newDataset: Dataset, description: string) => void;

  // Column operations
  removeColumn: (columnName: string) => void;
  renameColumn: (oldName: string, newName: string) => void;
  changeColumnType: (columnName: string, newType: DataColumn['type']) => void;
  reorderColumns: (newOrder: string[]) => void;

  // Row operations
  removeRow: (rowIndex: number) => void;
  removeRows: (rowIndices: number[]) => void;
  removeDuplicates: (columnNames?: string[]) => void;
  filterRows: (predicate: (row: Record<string, unknown>) => boolean, description: string) => void;

  // Data cleaning
  findAndReplace: (columnName: string, find: string, replace: string, matchCase: boolean) => void;
  trimWhitespace: (columnNames?: string[]) => void;
  fillNulls: (columnName: string, fillValue: string | number | boolean) => void;
  removeNullRows: (columnName: string) => void;

  // Reset
  resetToOriginal: () => void;
}

const DataContext = createContext<DataContextType | undefined>(undefined);

export const DataProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [dataset, setDatasetState] = useState<Dataset | null>(null);
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [currentIndex, setCurrentIndex] = useState(-1);
  const originalDataset = useRef<Dataset | null>(null);

  // Max history entries
  const MAX_HISTORY = 50;

  // Set dataset and initialize history
  const setDataset = useCallback((newDataset: Dataset | null) => {
    setDatasetState(newDataset);
    if (newDataset) {
      originalDataset.current = JSON.parse(JSON.stringify(newDataset));
      const entry: HistoryEntry = {
        dataset: JSON.parse(JSON.stringify(newDataset)),
        description: 'Initial import',
        timestamp: Date.now(),
      };
      setHistory([entry]);
      setCurrentIndex(0);
    } else {
      originalDataset.current = null;
      setHistory([]);
      setCurrentIndex(-1);
    }
  }, []);

  // Update dataset with history tracking
  const updateDataset = useCallback((newDataset: Dataset, description: string) => {
    setDatasetState(newDataset);

    // Remove any future history if we're not at the end
    const newHistory = history.slice(0, currentIndex + 1);

    // Add new entry
    const entry: HistoryEntry = {
      dataset: JSON.parse(JSON.stringify(newDataset)),
      description,
      timestamp: Date.now(),
    };
    newHistory.push(entry);

    // Limit history size
    if (newHistory.length > MAX_HISTORY) {
      newHistory.shift();
    }

    setHistory(newHistory);
    setCurrentIndex(newHistory.length - 1);
  }, [history, currentIndex]);

  // Undo
  const undo = useCallback(() => {
    if (currentIndex > 0) {
      const newIndex = currentIndex - 1;
      setCurrentIndex(newIndex);
      setDatasetState(JSON.parse(JSON.stringify(history[newIndex].dataset)));
    }
  }, [currentIndex, history]);

  // Redo
  const redo = useCallback(() => {
    if (currentIndex < history.length - 1) {
      const newIndex = currentIndex + 1;
      setCurrentIndex(newIndex);
      setDatasetState(JSON.parse(JSON.stringify(history[newIndex].dataset)));
    }
  }, [currentIndex, history]);

  // Reset to original
  const resetToOriginal = useCallback(() => {
    if (originalDataset.current) {
      const original = JSON.parse(JSON.stringify(originalDataset.current));
      updateDataset(original, 'Reset to original');
    }
  }, [updateDataset]);

  // Column operations
  const removeColumn = useCallback((columnName: string) => {
    if (!dataset) return;

    const newColumns = dataset.columns.filter(c => c.name !== columnName);
    const newData = dataset.data.map(row => {
      const newRow = { ...row };
      delete newRow[columnName];
      return newRow;
    });

    updateDataset(
      { ...dataset, columns: newColumns, data: newData },
      `Removed column "${columnName}"`
    );
  }, [dataset, updateDataset]);

  const renameColumn = useCallback((oldName: string, newName: string) => {
    if (!dataset || oldName === newName) return;

    const newColumns = dataset.columns.map(c =>
      c.name === oldName ? { ...c, name: newName } : c
    );
    const newData = dataset.data.map(row => {
      const newRow: Record<string, unknown> = {};
      for (const [key, value] of Object.entries(row)) {
        newRow[key === oldName ? newName : key] = value;
      }
      return newRow;
    });

    updateDataset(
      { ...dataset, columns: newColumns, data: newData },
      `Renamed column "${oldName}" to "${newName}"`
    );
  }, [dataset, updateDataset]);

  const changeColumnType = useCallback((columnName: string, newType: DataColumn['type']) => {
    if (!dataset) return;

    const newColumns = dataset.columns.map(c =>
      c.name === columnName ? { ...c, type: newType } : c
    );

    // Convert values to new type
    const newData = dataset.data.map(row => {
      const value = row[columnName];
      let convertedValue: unknown = value;

      if (value !== null && value !== undefined) {
        switch (newType) {
          case 'number':
            const num = Number(value);
            convertedValue = isNaN(num) ? null : num;
            break;
          case 'string':
            convertedValue = String(value);
            break;
          case 'boolean':
            convertedValue = value === 'true' || value === true || value === 1;
            break;
          case 'date':
            convertedValue = String(value);
            break;
        }
      }

      return { ...row, [columnName]: convertedValue };
    });

    updateDataset(
      { ...dataset, columns: newColumns, data: newData },
      `Changed column "${columnName}" type to ${newType}`
    );
  }, [dataset, updateDataset]);

  const reorderColumns = useCallback((newOrder: string[]) => {
    if (!dataset) return;

    const columnMap = new Map(dataset.columns.map(c => [c.name, c]));
    const newColumns = newOrder.map(name => columnMap.get(name)!).filter(Boolean);

    updateDataset(
      { ...dataset, columns: newColumns },
      'Reordered columns'
    );
  }, [dataset, updateDataset]);

  // Row operations
  const removeRow = useCallback((rowIndex: number) => {
    if (!dataset) return;

    const newData = dataset.data.filter((_, i) => i !== rowIndex);

    updateDataset(
      { ...dataset, rows: newData.length, data: newData },
      `Removed row ${rowIndex + 1}`
    );
  }, [dataset, updateDataset]);

  const removeRows = useCallback((rowIndices: number[]) => {
    if (!dataset) return;

    const indexSet = new Set(rowIndices);
    const newData = dataset.data.filter((_, i) => !indexSet.has(i));

    updateDataset(
      { ...dataset, rows: newData.length, data: newData },
      `Removed ${rowIndices.length} rows`
    );
  }, [dataset, updateDataset]);

  const removeDuplicates = useCallback((columnNames?: string[]) => {
    if (!dataset) return;

    const cols = columnNames || dataset.columns.map(c => c.name);
    const seen = new Set<string>();
    const newData = dataset.data.filter(row => {
      const key = cols.map(c => JSON.stringify(row[c])).join('|');
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });

    const removed = dataset.data.length - newData.length;

    updateDataset(
      { ...dataset, rows: newData.length, data: newData },
      `Removed ${removed} duplicate rows`
    );
  }, [dataset, updateDataset]);

  const filterRows = useCallback((predicate: (row: Record<string, unknown>) => boolean, description: string) => {
    if (!dataset) return;

    const newData = dataset.data.filter(predicate);

    updateDataset(
      { ...dataset, rows: newData.length, data: newData },
      description
    );
  }, [dataset, updateDataset]);

  // Data cleaning
  const findAndReplace = useCallback((columnName: string, find: string, replace: string, matchCase: boolean) => {
    if (!dataset) return;

    let count = 0;
    const newData = dataset.data.map(row => {
      const value = row[columnName];
      if (typeof value === 'string') {
        const searchValue = matchCase ? find : find.toLowerCase();
        const currentValue = matchCase ? value : value.toLowerCase();
        if (currentValue.includes(searchValue)) {
          count++;
          const regex = new RegExp(find.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), matchCase ? 'g' : 'gi');
          return { ...row, [columnName]: value.replace(regex, replace) };
        }
      }
      return row;
    });

    updateDataset(
      { ...dataset, data: newData },
      `Replaced ${count} occurrences in "${columnName}"`
    );
  }, [dataset, updateDataset]);

  const trimWhitespace = useCallback((columnNames?: string[]) => {
    if (!dataset) return;

    const cols = columnNames || dataset.columns.filter(c => c.type === 'string').map(c => c.name);

    const newData = dataset.data.map(row => {
      const newRow = { ...row };
      for (const col of cols) {
        if (typeof newRow[col] === 'string') {
          newRow[col] = (newRow[col] as string).trim();
        }
      }
      return newRow;
    });

    updateDataset(
      { ...dataset, data: newData },
      `Trimmed whitespace in ${cols.length} columns`
    );
  }, [dataset, updateDataset]);

  const fillNulls = useCallback((columnName: string, fillValue: string | number | boolean) => {
    if (!dataset) return;

    let count = 0;
    const newData = dataset.data.map(row => {
      if (row[columnName] === null || row[columnName] === undefined) {
        count++;
        return { ...row, [columnName]: fillValue };
      }
      return row;
    });

    updateDataset(
      { ...dataset, data: newData },
      `Filled ${count} null values in "${columnName}"`
    );
  }, [dataset, updateDataset]);

  const removeNullRows = useCallback((columnName: string) => {
    if (!dataset) return;

    const newData = dataset.data.filter(row =>
      row[columnName] !== null && row[columnName] !== undefined && row[columnName] !== ''
    );

    const removed = dataset.data.length - newData.length;

    updateDataset(
      { ...dataset, rows: newData.length, data: newData },
      `Removed ${removed} rows with null values in "${columnName}"`
    );
  }, [dataset, updateDataset]);

  const value: DataContextType = {
    dataset,
    setDataset,
    canUndo: currentIndex > 0,
    canRedo: currentIndex < history.length - 1,
    undo,
    redo,
    historyLength: history.length,
    currentHistoryIndex: currentIndex,
    updateDataset,
    removeColumn,
    renameColumn,
    changeColumnType,
    reorderColumns,
    removeRow,
    removeRows,
    removeDuplicates,
    filterRows,
    findAndReplace,
    trimWhitespace,
    fillNulls,
    removeNullRows,
    resetToOriginal,
  };

  return <DataContext.Provider value={value}>{children}</DataContext.Provider>;
};

export const useData = () => {
  const context = useContext(DataContext);
  if (context === undefined) {
    throw new Error('useData must be used within a DataProvider');
  }
  return context;
};
