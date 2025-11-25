import React, { useState, useMemo, useCallback } from 'react';
import { useTheme } from 'next-themes';
import { useNavigate } from 'react-router-dom';
import { useData } from '@/contexts/DataContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { toast } from 'sonner';
import {
  Sun,
  Moon,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  Undo2,
  Redo2,
  Trash2,
  Edit3,
  Search,
  Filter,
  MoreVertical,
  ArrowUpDown,
  Copy,
  Scissors,
  RotateCcw,
  Table2,
  BarChart3,
  Hash,
  Type,
  Calendar,
  ToggleLeft,
  AlertCircle,
  CheckCircle2,
  XCircle,
  Download,
  Upload,
  FileDown,
  Save
} from 'lucide-react';
import VizoraLogo from '@/components/VizoraLogo';
import * as XLSX from 'xlsx';

type ColumnType = 'string' | 'number' | 'date' | 'boolean';

const DataAnalysisPage: React.FC = () => {
  const { theme, setTheme } = useTheme();
  const navigate = useNavigate();
  const {
    dataset,
    canUndo,
    canRedo,
    undo,
    redo,
    removeColumn,
    renameColumn,
    changeColumnType,
    removeRow,
    removeRows,
    removeDuplicates,
    findAndReplace,
    trimWhitespace,
    fillNulls,
    removeNullRows,
    resetToOriginal,
  } = useData();

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(50);

  // Selection state
  const [selectedRows, setSelectedRows] = useState<Set<number>>(new Set());
  const [selectedColumn, setSelectedColumn] = useState<string | null>(null);

  // Search/Filter state
  const [searchQuery, setSearchQuery] = useState('');
  const [filterColumn, setFilterColumn] = useState<string>('');
  const [filterValue, setFilterValue] = useState('');

  // Dialog states
  const [renameDialogOpen, setRenameDialogOpen] = useState(false);
  const [renameColumnName, setRenameColumnName] = useState('');
  const [newColumnName, setNewColumnName] = useState('');

  const [findReplaceDialogOpen, setFindReplaceDialogOpen] = useState(false);
  const [findValue, setFindValue] = useState('');
  const [replaceValue, setReplaceValue] = useState('');
  const [findReplaceColumn, setFindReplaceColumn] = useState('');
  const [matchCase, setMatchCase] = useState(false);

  const [fillNullDialogOpen, setFillNullDialogOpen] = useState(false);
  const [fillNullColumn, setFillNullColumn] = useState('');
  const [fillNullValue, setFillNullValue] = useState('');

  const [changeTypeDialogOpen, setChangeTypeDialogOpen] = useState(false);
  const [changeTypeColumn, setChangeTypeColumn] = useState('');
  const [newType, setNewType] = useState<ColumnType>('string');

  // Filtered and paginated data
  const filteredData = useMemo(() => {
    if (!dataset) return [];

    let data = dataset.data;

    // Apply search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      data = data.filter(row =>
        Object.values(row).some(value =>
          String(value ?? '').toLowerCase().includes(query)
        )
      );
    }

    // Apply column filter
    if (filterColumn && filterValue) {
      data = data.filter(row =>
        String(row[filterColumn] ?? '').toLowerCase().includes(filterValue.toLowerCase())
      );
    }

    return data;
  }, [dataset, searchQuery, filterColumn, filterValue]);

  const totalPages = Math.ceil(filteredData.length / rowsPerPage);
  const paginatedData = useMemo(() => {
    const start = (currentPage - 1) * rowsPerPage;
    return filteredData.slice(start, start + rowsPerPage);
  }, [filteredData, currentPage, rowsPerPage]);

  // Get actual row indices for selection
  const getActualRowIndex = useCallback((displayIndex: number) => {
    const start = (currentPage - 1) * rowsPerPage;
    return start + displayIndex;
  }, [currentPage, rowsPerPage]);

  // Selection handlers
  const toggleRowSelection = (index: number) => {
    const actualIndex = getActualRowIndex(index);
    const newSelection = new Set(selectedRows);
    if (newSelection.has(actualIndex)) {
      newSelection.delete(actualIndex);
    } else {
      newSelection.add(actualIndex);
    }
    setSelectedRows(newSelection);
  };

  const toggleAllRows = () => {
    if (selectedRows.size === filteredData.length) {
      setSelectedRows(new Set());
    } else {
      setSelectedRows(new Set(filteredData.map((_, i) => i)));
    }
  };

  // Check if a column has no data (all null/empty values)
  const isColumnEmpty = useCallback((columnName: string): boolean => {
    if (!dataset) return true;
    return dataset.data.every(row => {
      const value = row[columnName];
      return value === null || value === undefined || value === '';
    });
  }, [dataset]);

  // Column type icon
  const getTypeIcon = (type: string, isEmpty: boolean = false) => {
    const colorClass = isEmpty ? 'text-slate-300 dark:text-slate-600' : '';
    switch (type) {
      case 'string':
        return <Type size={12} className={isEmpty ? colorClass : 'text-emerald-500'} />;
      case 'number':
        return <Hash size={12} className={isEmpty ? colorClass : 'text-blue-500'} />;
      case 'date':
        return <Calendar size={12} className={isEmpty ? colorClass : 'text-orange-500'} />;
      case 'boolean':
        return <ToggleLeft size={12} className={isEmpty ? colorClass : 'text-purple-500'} />;
      default:
        return <Type size={12} className={isEmpty ? colorClass : 'text-gray-500'} />;
    }
  };

  // Format cell value for display
  const formatCellValue = (value: unknown): string => {
    if (value === null || value === undefined) return '';
    if (typeof value === 'number') {
      // Format large numbers with commas
      return value.toLocaleString();
    }
    return String(value);
  };

  // Action handlers
  const handleDeleteSelectedRows = () => {
    if (selectedRows.size === 0) {
      toast.error('No rows selected');
      return;
    }
    removeRows(Array.from(selectedRows));
    setSelectedRows(new Set());
    toast.success(`Deleted ${selectedRows.size} rows`);
  };

  const handleRemoveDuplicates = () => {
    removeDuplicates();
    toast.success('Removed duplicate rows');
  };

  const handleTrimWhitespace = () => {
    trimWhitespace();
    toast.success('Trimmed whitespace from all text columns');
  };

  const handleRenameColumn = () => {
    if (!newColumnName.trim()) {
      toast.error('Please enter a new column name');
      return;
    }
    renameColumn(renameColumnName, newColumnName.trim());
    setRenameDialogOpen(false);
    setRenameColumnName('');
    setNewColumnName('');
    toast.success(`Renamed column to "${newColumnName.trim()}"`);
  };

  const handleFindReplace = () => {
    if (!findReplaceColumn || !findValue) {
      toast.error('Please select a column and enter a search value');
      return;
    }
    findAndReplace(findReplaceColumn, findValue, replaceValue, matchCase);
    setFindReplaceDialogOpen(false);
    setFindValue('');
    setReplaceValue('');
    toast.success('Find and replace completed');
  };

  const handleFillNulls = () => {
    if (!fillNullColumn || !fillNullValue) {
      toast.error('Please select a column and enter a fill value');
      return;
    }
    fillNulls(fillNullColumn, fillNullValue);
    setFillNullDialogOpen(false);
    setFillNullColumn('');
    setFillNullValue('');
    toast.success('Filled null values');
  };

  const handleChangeType = () => {
    if (!changeTypeColumn) {
      toast.error('Please select a column');
      return;
    }
    changeColumnType(changeTypeColumn, newType);
    setChangeTypeDialogOpen(false);
    toast.success(`Changed column type to ${newType}`);
  };

  const handleRemoveNulls = (columnName: string) => {
    removeNullRows(columnName);
    toast.success(`Removed rows with null values in "${columnName}"`);
  };

  const handleRemoveColumn = (columnName: string) => {
    removeColumn(columnName);
    toast.success(`Removed column "${columnName}"`);
  };

  // Export to CSV
  const handleExportCSV = useCallback(() => {
    if (!dataset) return;

    // Create CSV content
    const headers = dataset.columns.map(c => c.name).join(',');
    const rows = dataset.data.map(row =>
      dataset.columns.map(col => {
        const value = row[col.name];
        if (value === null || value === undefined) return '';
        // Escape commas and quotes in string values
        const strValue = String(value);
        if (strValue.includes(',') || strValue.includes('"') || strValue.includes('\n')) {
          return `"${strValue.replace(/"/g, '""')}"`;
        }
        return strValue;
      }).join(',')
    ).join('\n');

    const csvContent = `${headers}\n${rows}`;
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${dataset.name}_modified.csv`;
    link.click();
    URL.revokeObjectURL(url);
    toast.success('Exported as CSV');
  }, [dataset]);

  // Export to Excel
  const handleExportExcel = useCallback(() => {
    if (!dataset) return;

    // Create worksheet data
    const wsData = [
      dataset.columns.map(c => c.name),
      ...dataset.data.map(row =>
        dataset.columns.map(col => row[col.name] ?? '')
      )
    ];

    const ws = XLSX.utils.aoa_to_sheet(wsData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Data');
    XLSX.writeFile(wb, `${dataset.name}_modified.xlsx`);
    toast.success('Exported as Excel');
  }, [dataset]);

  // No data state
  if (!dataset) {
    return (
      <div className="flex flex-col h-screen bg-gradient-to-br from-slate-50 via-slate-100 to-slate-200 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950">
        <header className="h-16 flex items-center justify-between px-6 bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border-b border-slate-200/50 dark:border-slate-800/50 shadow-sm">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate('/visualization')}
              className="text-slate-600 dark:text-slate-400"
            >
              <ChevronLeft size={18} className="mr-1" />
              Visualization
            </Button>
            <VizoraLogo />
          </div>
        </header>
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <AlertCircle size={48} className="mx-auto text-slate-400 mb-4" />
            <h2 className="text-xl font-semibold text-slate-700 dark:text-slate-200 mb-2">
              No Data Loaded
            </h2>
            <p className="text-slate-500 dark:text-slate-400 mb-4">
              Import data from the Visualization page first
            </p>
            <Button onClick={() => navigate('/visualization')}>
              Go to Visualization
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen bg-gradient-to-br from-slate-50 via-slate-100 to-slate-200 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950 text-gray-900 dark:text-gray-100">
      {/* Header */}
      <header className="h-16 flex items-center justify-between px-6 bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border-b border-slate-200/50 dark:border-slate-800/50 shadow-sm z-50">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate('/visualization')}
            className="text-slate-600 dark:text-slate-400"
          >
            <ChevronLeft size={18} className="mr-1" />
            Visualization
          </Button>
          <div className="h-6 w-px bg-slate-200 dark:bg-slate-700" />
          <VizoraLogo />
        </div>

        <div className="flex items-center gap-2 px-4 py-1.5 bg-gradient-to-r from-amber-500/10 to-orange-500/10 dark:from-amber-500/20 dark:to-orange-500/20 rounded-full border border-amber-200/50 dark:border-amber-800/50">
          <Table2 size={16} className="text-amber-600 dark:text-amber-400" />
          <span className="text-sm font-medium text-amber-700 dark:text-amber-300">Data Analysis</span>
        </div>

        <div className="flex items-center gap-2">
          {/* Undo/Redo */}
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                onClick={undo}
                disabled={!canUndo}
                className="text-slate-600 dark:text-slate-400"
              >
                <Undo2 size={18} />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Undo</TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                onClick={redo}
                disabled={!canRedo}
                className="text-slate-600 dark:text-slate-400"
              >
                <Redo2 size={18} />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Redo</TooltipContent>
          </Tooltip>

          <div className="h-6 w-px bg-slate-200 dark:bg-slate-700 mx-1" />

          {/* Export/Save buttons */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="outline"
                size="sm"
                className="gap-2 text-emerald-600 border-emerald-300 hover:bg-emerald-50 dark:text-emerald-400 dark:border-emerald-700 dark:hover:bg-emerald-900/30"
              >
                <Save size={16} />
                Save File
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={handleExportCSV}>
                <FileDown size={14} className="mr-2" />
                Export as CSV
              </DropdownMenuItem>
              <DropdownMenuItem onClick={handleExportExcel}>
                <FileDown size={14} className="mr-2" />
                Export as Excel (.xlsx)
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          <div className="h-6 w-px bg-slate-200 dark:bg-slate-700 mx-1" />

          <Button
            variant="ghost"
            size="icon"
            onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
            className="text-slate-600 dark:text-slate-400"
          >
            {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
          </Button>
        </div>
      </header>

      {/* Toolbar */}
      <div className="px-6 py-3 bg-white/60 dark:bg-slate-900/60 border-b border-slate-200/50 dark:border-slate-800/50 flex items-center gap-3 flex-wrap">
        {/* Search */}
        <div className="relative">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <Input
            placeholder="Search all columns..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 w-64 h-9"
          />
        </div>

        {/* Column Filter */}
        <Select value={filterColumn || "all"} onValueChange={(v) => setFilterColumn(v === "all" ? "" : v)}>
          <SelectTrigger className="w-40 h-9">
            <SelectValue placeholder="Filter column" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All columns</SelectItem>
            {dataset.columns.map(col => (
              <SelectItem key={col.name} value={col.name}>{col.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        {filterColumn && (
          <Input
            placeholder="Filter value..."
            value={filterValue}
            onChange={(e) => setFilterValue(e.target.value)}
            className="w-40 h-9"
          />
        )}

        <div className="flex-1" />

        {/* Actions */}
        <Button
          variant="outline"
          size="sm"
          onClick={() => {
            setFindReplaceColumn(dataset.columns[0]?.name || '');
            setFindReplaceDialogOpen(true);
          }}
        >
          <Search size={14} className="mr-1" />
          Find & Replace
        </Button>

        <Button variant="outline" size="sm" onClick={handleTrimWhitespace}>
          <Scissors size={14} className="mr-1" />
          Trim Whitespace
        </Button>

        <Button variant="outline" size="sm" onClick={handleRemoveDuplicates}>
          <Copy size={14} className="mr-1" />
          Remove Duplicates
        </Button>

        <Button
          variant="outline"
          size="sm"
          onClick={() => {
            setFillNullColumn(dataset.columns[0]?.name || '');
            setFillNullDialogOpen(true);
          }}
        >
          <CheckCircle2 size={14} className="mr-1" />
          Fill Nulls
        </Button>

        <Button
          variant="outline"
          size="sm"
          onClick={resetToOriginal}
          className="text-amber-600 hover:text-amber-700"
        >
          <RotateCcw size={14} className="mr-1" />
          Reset
        </Button>

        {selectedRows.size > 0 && (
          <Button
            variant="destructive"
            size="sm"
            onClick={handleDeleteSelectedRows}
          >
            <Trash2 size={14} className="mr-1" />
            Delete {selectedRows.size} rows
          </Button>
        )}
      </div>

      {/* Data info bar */}
      <div className="px-6 py-2 bg-slate-50/50 dark:bg-slate-800/50 border-b border-slate-200/50 dark:border-slate-800/50 flex items-center gap-4 text-sm">
        <Badge variant="secondary" className="gap-1">
          <Table2 size={12} />
          {dataset.name}
        </Badge>
        <span className="text-slate-500">
          {filteredData.length.toLocaleString()} rows
          {filteredData.length !== dataset.rows && ` (filtered from ${dataset.rows.toLocaleString()})`}
        </span>
        <span className="text-slate-500">
          {dataset.columns.length} columns
        </span>
      </div>

      {/* Data Table */}
      <div className="flex-1 overflow-auto">
        <table className="w-full border-collapse">
          <thead className="sticky top-0 bg-slate-100 dark:bg-slate-800 z-10">
            <tr>
              <th className="w-12 px-3 py-3 border-b border-slate-200 dark:border-slate-700">
                <Checkbox
                  checked={selectedRows.size === filteredData.length && filteredData.length > 0}
                  onCheckedChange={toggleAllRows}
                />
              </th>
              <th className="w-16 px-3 py-3 border-b border-slate-200 dark:border-slate-700 text-left text-xs font-semibold text-slate-500 uppercase">
                #
              </th>
              {dataset.columns.map(col => {
                const isEmpty = isColumnEmpty(col.name);
                return (
                <th
                  key={col.name}
                  className={`px-3 py-3 border-b border-slate-200 dark:border-slate-700 text-left min-w-[150px] ${isEmpty ? 'bg-slate-50 dark:bg-slate-800/30' : ''}`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      {getTypeIcon(col.type, isEmpty)}
                      <span className={`text-xs font-semibold truncate max-w-[120px] ${isEmpty ? 'text-slate-400 dark:text-slate-500 italic' : 'text-slate-700 dark:text-slate-200'}`}>
                        {col.name}
                        {isEmpty && <span className="ml-1 text-[10px] font-normal">(empty)</span>}
                      </span>
                    </div>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-6 w-6">
                          <MoreVertical size={14} />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => {
                          setRenameColumnName(col.name);
                          setNewColumnName(col.name);
                          setRenameDialogOpen(true);
                        }}>
                          <Edit3 size={14} className="mr-2" />
                          Rename
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => {
                          setChangeTypeColumn(col.name);
                          setNewType(col.type);
                          setChangeTypeDialogOpen(true);
                        }}>
                          <ArrowUpDown size={14} className="mr-2" />
                          Change Type
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem onClick={() => handleRemoveNulls(col.name)}>
                          <XCircle size={14} className="mr-2" />
                          Remove Null Rows
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          onClick={() => handleRemoveColumn(col.name)}
                          className="text-red-600"
                        >
                          <Trash2 size={14} className="mr-2" />
                          Delete Column
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </th>
              );
              })}
            </tr>
          </thead>
          <tbody>
            {paginatedData.map((row, displayIndex) => {
              const actualIndex = getActualRowIndex(displayIndex);
              const isSelected = selectedRows.has(actualIndex);

              return (
                <tr
                  key={actualIndex}
                  className={`
                    hover:bg-slate-50 dark:hover:bg-slate-800/50
                    ${isSelected ? 'bg-blue-50 dark:bg-blue-900/20' : ''}
                  `}
                >
                  <td className="px-3 py-2 border-b border-slate-100 dark:border-slate-800">
                    <Checkbox
                      checked={isSelected}
                      onCheckedChange={() => toggleRowSelection(displayIndex)}
                    />
                  </td>
                  <td className="px-3 py-2 border-b border-slate-100 dark:border-slate-800 text-xs text-slate-400">
                    {actualIndex + 1}
                  </td>
                  {dataset.columns.map(col => (
                    <td
                      key={col.name}
                      className="px-3 py-2 border-b border-slate-100 dark:border-slate-800 text-sm"
                    >
                      {row[col.name] === null || row[col.name] === undefined ? (
                        <span className="text-slate-300 dark:text-slate-600 italic">null</span>
                      ) : (
                        <span className="text-slate-700 dark:text-slate-300 truncate block max-w-[200px]">
                          {formatCellValue(row[col.name])}
                        </span>
                      )}
                    </td>
                  ))}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      <div className="px-6 py-3 bg-white/60 dark:bg-slate-900/60 border-t border-slate-200/50 dark:border-slate-800/50 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-sm text-slate-500">Rows per page:</span>
          <Select value={String(rowsPerPage)} onValueChange={(v) => { setRowsPerPage(Number(v)); setCurrentPage(1); }}>
            <SelectTrigger className="w-20 h-8">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="25">25</SelectItem>
              <SelectItem value="50">50</SelectItem>
              <SelectItem value="100">100</SelectItem>
              <SelectItem value="250">250</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-sm text-slate-500">
            Page {currentPage} of {totalPages || 1}
          </span>
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setCurrentPage(1)}
              disabled={currentPage === 1}
              className="h-8 w-8"
            >
              <ChevronsLeft size={16} />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="h-8 w-8"
            >
              <ChevronLeft size={16} />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className="h-8 w-8"
            >
              <ChevronRight size={16} />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setCurrentPage(totalPages)}
              disabled={currentPage === totalPages}
              className="h-8 w-8"
            >
              <ChevronsRight size={16} />
            </Button>
          </div>
        </div>
      </div>

      {/* Rename Column Dialog */}
      <Dialog open={renameDialogOpen} onOpenChange={setRenameDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Rename Column</DialogTitle>
            <DialogDescription>Enter a new name for the column "{renameColumnName}"</DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <Label>New Column Name</Label>
            <Input
              value={newColumnName}
              onChange={(e) => setNewColumnName(e.target.value)}
              placeholder="Enter new name..."
              className="mt-2"
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRenameDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleRenameColumn}>Rename</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Find & Replace Dialog */}
      <Dialog open={findReplaceDialogOpen} onOpenChange={setFindReplaceDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Find & Replace</DialogTitle>
            <DialogDescription>Search and replace values in a column</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <Label>Column</Label>
              <Select value={findReplaceColumn} onValueChange={setFindReplaceColumn}>
                <SelectTrigger className="mt-2">
                  <SelectValue placeholder="Select column" />
                </SelectTrigger>
                <SelectContent>
                  {dataset.columns.filter(c => c.type === 'string').map(col => (
                    <SelectItem key={col.name} value={col.name}>{col.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Find</Label>
              <Input
                value={findValue}
                onChange={(e) => setFindValue(e.target.value)}
                placeholder="Text to find..."
                className="mt-2"
              />
            </div>
            <div>
              <Label>Replace with</Label>
              <Input
                value={replaceValue}
                onChange={(e) => setReplaceValue(e.target.value)}
                placeholder="Replacement text..."
                className="mt-2"
              />
            </div>
            <div className="flex items-center gap-2">
              <Checkbox
                id="matchCase"
                checked={matchCase}
                onCheckedChange={(checked) => setMatchCase(checked === true)}
              />
              <Label htmlFor="matchCase">Match case</Label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setFindReplaceDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleFindReplace}>Replace All</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Fill Nulls Dialog */}
      <Dialog open={fillNullDialogOpen} onOpenChange={setFillNullDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Fill Null Values</DialogTitle>
            <DialogDescription>Replace null/empty values with a specified value</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <Label>Column</Label>
              <Select value={fillNullColumn} onValueChange={setFillNullColumn}>
                <SelectTrigger className="mt-2">
                  <SelectValue placeholder="Select column" />
                </SelectTrigger>
                <SelectContent>
                  {dataset.columns.map(col => (
                    <SelectItem key={col.name} value={col.name}>{col.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Fill Value</Label>
              <Input
                value={fillNullValue}
                onChange={(e) => setFillNullValue(e.target.value)}
                placeholder="Value to use..."
                className="mt-2"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setFillNullDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleFillNulls}>Fill Nulls</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Change Type Dialog */}
      <Dialog open={changeTypeDialogOpen} onOpenChange={setChangeTypeDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Change Column Type</DialogTitle>
            <DialogDescription>Change the data type of column "{changeTypeColumn}"</DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <Label>New Type</Label>
            <Select value={newType} onValueChange={(v) => setNewType(v as ColumnType)}>
              <SelectTrigger className="mt-2">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="string">String (Text)</SelectItem>
                <SelectItem value="number">Number</SelectItem>
                <SelectItem value="date">Date</SelectItem>
                <SelectItem value="boolean">Boolean (True/False)</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setChangeTypeDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleChangeType}>Change Type</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default DataAnalysisPage;
