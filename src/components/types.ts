import type { GridColDef } from "@mui/x-data-grid";


export const FETCH_MODE = {
  GET: "get",
  POST: "post",
} as const;

export type FilterItem = {
  field: string;
  operator: string;
  value: string | number;
};

export type FilterPayload = {
  filter?: {
    items: FilterItem[];
    logicOperator?: "and" | "or";
  };
  sort?: { field: string; sort: "asc" | "desc" }[];
  limit?: number;
  offset?: number;
  [key: string]: any; // index signature
};

export type FilterPayloadDef = FilterPayload | URLSearchParams;

export type CustomDataGridDef = {
  columns: GridColDef[];
  defaultFilter: Array<Record<string, any>>;
  handleFilterChange: (payload: FilterPayloadDef) => void;
  gridData: Record<string, any>;
  handleExport?: (payload: FilterPayloadDef, fileType: "csv" | "excel") => void;
  csvExportUrl?: string;
  excelExportUrl?: string;
  exportFileName?: string;
  fetchMode?: (typeof FETCH_MODE)[keyof typeof FETCH_MODE];
};
