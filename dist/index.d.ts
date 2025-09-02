import * as react_jsx_runtime from 'react/jsx-runtime';
import { GridColDef } from '@mui/x-data-grid';

declare const FETCH_MODE: {
    readonly GET: "get";
    readonly POST: "post";
};
type FilterItem = {
    field: string;
    operator: string;
    value: string | number;
};
type FilterPayload = {
    filter?: {
        items: FilterItem[];
        logicOperator?: "and" | "or";
    };
    sort?: {
        field: string;
        sort: "asc" | "desc";
    }[];
    limit?: number;
    offset?: number;
    [key: string]: any;
};
type FilterPayloadDef = FilterPayload | URLSearchParams;
type CustomDataGridDef = {
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
declare function XtendedMuiDataGrid(props: CustomDataGridDef): react_jsx_runtime.JSX.Element;

export { XtendedMuiDataGrid as default };
