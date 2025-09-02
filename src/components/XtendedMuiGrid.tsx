import * as React from 'react';
import {Toolbar, ToolbarButton, DataGrid } from "@mui/x-data-grid";
import type { GridColDef } from "@mui/x-data-grid";
import { Box, Menu, MenuItem, Select, TextField, IconButton } from "@mui/material";
import ClearIcon from "@mui/icons-material/Clear";
import AddIcon from "@mui/icons-material/Add";
import FormControl from "@mui/material/FormControl";
import InputLabel from "@mui/material/InputLabel";
import Tooltip from "@mui/material/Tooltip";
import Popper from "@mui/material/Popper";
import Paper from "@mui/material/Paper";
import ClickAwayListener from "@mui/material/ClickAwayListener";
import FilterListIcon from "@mui/icons-material/FilterList";
import Stack from "@mui/material/Stack";
import Chip from "@mui/material/Chip";
import FileDownloadIcon from "@mui/icons-material/FileDownload";



const FETCH_MODE = {
  GET: "get",
  POST: "post",
} as const;

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
  sort?: { field: string; sort: "asc" | "desc" }[];
  limit?: number;
  offset?: number;
  [key: string]: any; // index signature
};

export type FilterPayloadDef = FilterPayload | URLSearchParams;

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

export default function MuiDataGrid(props: CustomDataGridDef) {
  const {
    columns,
    defaultFilter,
    handleFilterChange,
    gridData,
    handleExport,
    csvExportUrl,
    excelExportUrl,
    exportFileName,
    fetchMode = FETCH_MODE.GET,
  } = props;

  const [sortModel, setSortModel] = React.useState<{ field: string; sort: "asc" | "desc" }[]>([{ field: "dateCreated", sort: "desc" }]);
  const [pagination, setPagination] = React.useState({
    pageSize: 50,
    page: 0,
  });
  const [isLoading, setIsLoading] = React.useState<boolean>(true);
  const [filterModel, setFilterModel] = React.useState<any>({ items: defaultFilter });

  const debounceTimeout = React.useRef<any>(null);

  const handleFilterModelChange = (e: any) => {
    if (!e.detail) return;
    const newFilterModel = e.detail;
    if (JSON.stringify(newFilterModel) !== JSON.stringify(filterModel)) {
      setFilterModel(newFilterModel);
    }
  };

  const handleSortModelChange = (newSortModel: any) => {
    if (JSON.stringify(newSortModel) !== JSON.stringify(sortModel)) {
      setSortModel(newSortModel);
    }
  };

  const handlePaginationChange = (newPagination: { page: number; pageSize: number }) => {
    setPagination((prevState) => {
      return {
        ...prevState,
        page: newPagination.page,
        pageSize: newPagination.pageSize,
      };
    });
  };

  const emitOnFilterModelChange = (filterModel: any) => {
    const event = new CustomEvent("onFilterChange", {
      detail: filterModel,
    });
    window.dispatchEvent(event);
  };

  const  buildParams = (payload: FilterPayload): URLSearchParams =>{
    const params = new URLSearchParams();

    if (payload.filter) {
      params.append("filter", JSON.stringify(payload.filter));
    }

    if (payload.sort) {
      params.append("sort", JSON.stringify(payload.sort));
    }

    if (payload.limit !== undefined) {
      params.append("limit", String(payload.limit));
    }

    if (payload.offset !== undefined) {
      params.append("offset", String(payload.offset));
    }

    Object.keys(payload).forEach((key) => {
      if (!["filter", "sort", "limit", "offset"].includes(key)) {
        params.append(key, String(payload[key]));
      }
    });

    return params;
  }

  const retrievePayload = (): FilterPayloadDef => {
    let reqPayload = null;
    if (fetchMode === FETCH_MODE.GET) {
      reqPayload = buildParams({
        filter: filterModel,
        sort: sortModel,
        limit: pagination.pageSize || 10,
        offset: pagination.page || 0,
      });
    } else {
      reqPayload = {
        filter: filterModel,
        sort: sortModel,
        limit: pagination.pageSize || 10,
        offset: pagination.page || 0,
      };
    }
    return reqPayload;
  };

  React.useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);
        let reqPayload = retrievePayload();
        handleFilterChange(reqPayload);
      } catch (err) {
        console.error("Error fetching data:", err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [pagination, sortModel, filterModel]);

  React.useEffect(() => {
    window.addEventListener("onFilterChange", handleFilterModelChange);
    return () => window.removeEventListener("onFilterChange", handleFilterModelChange);
  }, []);

  const operators = ["equals", "contains", ">", "<"];

  // add a new filter row
  const addFilter = () => {
    setFilterModel((prev: any) => ({
      ...prev,
      items: [
        ...prev.items,
        { field: columns.filter((item) => !prev.items.includes(item.field))[0]?.field || defaultFilter[0].field, operator: "contains", value: "" },
      ],
    }));
  };

  // update a filter row
  const updateFilter = (index: number, key: string, value: any) => {
    const items = filterModel.items.map((item: any) => ({ ...item }));
    if (!items[index]) {
      items[index] = { field: "", operator: "contains", value: "" };
      (items[index] as any)[key] = value;
    } else {
      (items[index] as any)[key] = value;
    }

    // 🔹 Clear the previous timer
    if (debounceTimeout.current) {
      clearTimeout(debounceTimeout.current);
    }

    // 🔹 Set a new timer
    debounceTimeout.current = setTimeout(() => {
      emitOnFilterModelChange({ ...filterModel, items });
    }, 800);
  };

  const updateLinkingOperator = (e: any) => {
    if (!e.target || !e.target.value) return;
    const newOperator = e.target.value.toLowerCase();
    // 🔹 Clear the previous timer
    if (debounceTimeout.current) {
      clearTimeout(debounceTimeout.current);
    }

    // 🔹 Set a new timer
    debounceTimeout.current = setTimeout(() => {
      emitOnFilterModelChange({ ...filterModel, logicOperator: newOperator });
    }, 100);
  };

  // remove a filter row
  const removeFilter = (index: number) => {
    setFilterModel((prev: any) => {
      const items = prev.items.filter((item: any, i: number) => item && i !== index);
      return { ...prev, items };
    });
  };

  const CustomToolbar = () => {
    const [newPanelOpen, setNewPanelOpen] = React.useState(false);
    const [open, setOpen] = React.useState(false);
    const newPanelTriggerRef = React.useRef<HTMLButtonElement>(null);
    const exportTriggerRef = React.useRef<HTMLButtonElement>(null);
    const handleClose = () => {
      setNewPanelOpen(false);
    };

    const handleKeyDown = (event: React.KeyboardEvent) => {
      if (event.key === "Escape") {
        handleClose();
      }
    };

    const exportMenuClick = async (fileType:"csv"|"excel") =>{
      if (!handleExport && !excelExportUrl && !csvExportUrl) {
        console.error("No 'Export' handler specified.");
        return;
      } else if (!handleExport && excelExportUrl || csvExportUrl) {
        const exportLink = fileType === "csv" ? csvExportUrl : excelExportUrl;
        if (!exportLink) {
          console.error("Export URL is not defined");
          return;
        }
        const response = await fetch(exportLink);
        const blob = await response.blob();

        const link = document.createElement("a");
        link.href = URL.createObjectURL(blob);
        const ext = fileType === "csv" ? "csv" : "xlsx";
        link.download = `${exportFileName || "my-data"}.${ext}`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      } else if (handleExport && excelExportUrl || csvExportUrl) {
        console.error("Can not set both 'handleExport' and 'exportApiUrl' props.");
      } else if (handleExport) {
        let reqPayload = retrievePayload();
        handleExport(reqPayload, fileType);
      }
      
    }

    return (
      <Toolbar>
        <Tooltip title="Export">
          <ToolbarButton ref={exportTriggerRef} aria-describedby="new-panel" onClick={() => setOpen((prev) => !prev)}>
            <FileDownloadIcon fontSize="small" />
          </ToolbarButton>
        </Tooltip>
        <Menu
          id="export-menu"
          anchorEl={exportTriggerRef.current}
          open={open}
          onClose={() => setOpen(false)}
          anchorOrigin={{ vertical: "bottom", horizontal: "left" }}
          transformOrigin={{ vertical: "top", horizontal: "left" }}
        >
          <MenuItem onClick={() => exportMenuClick("csv")}>Download as CSV</MenuItem>
          <MenuItem onClick={() => exportMenuClick("excel")}>Download as Excel</MenuItem>
        </Menu>

        <Tooltip title="Filters">
          <ToolbarButton ref={newPanelTriggerRef} aria-describedby="new-panel" onClick={() => setNewPanelOpen((prev) => !prev)}>
            <FilterListIcon fontSize="small" />
          </ToolbarButton>
        </Tooltip>

        <Popper open={newPanelOpen} anchorEl={newPanelTriggerRef.current} placement="bottom-end" id="new-panel" onKeyDown={handleKeyDown}>
          <ClickAwayListener onClickAway={handleClose}>
            <Paper
              sx={{
                display: "flex",
                flexDirection: "column",
                gap: 2,
                p: 2,
                width: 600,
              }}
              elevation={8}
            >
              {(filterModel.items && filterModel.items?.length ? filterModel.items : defaultFilter).map((item: any, index: number) => (
                <Box key={index} sx={{ display: "flex", gap: 1, alignItems: "center" }}>
                  {/* Delete button */}
                  <IconButton size="small" color="error" disabled={index <= 0} onClick={() => removeFilter(index)}>
                    <ClearIcon fontSize="small" />
                  </IconButton>

                  {/*Linking operator */}
                  {filterModel.items?.length > 1 ? (
                    <Select
                      label="Linking Operator"
                      size="small"
                      defaultValue={"And"}
                      onChange={updateLinkingOperator}
                      sx={{ visibility: index > 0 ? "visible" : "hidden", minWidth: 80 }}
                      disabled={filterModel.items?.length <= 1}
                    >
                      {["And", "Or"].map((op, id) => (
                        <MenuItem key={id} value={op}>
                          {op}
                        </MenuItem>
                      ))}
                    </Select>
                  ) : (
                    <></>
                  )}

                  {/* Field */}
                  <FormControl sx={{ m: 1, minWidth: 150, textAlign: "left" }} size="small">
                    <InputLabel id="column-select">Column</InputLabel>
                    <Select labelId="column-select" value={item.field} label="Column" onChange={(e) => updateFilter(index, "field", e.target.value)}>
                      {columns?.length ? (
                        columns.map((column) => (
                          <MenuItem key={column.field} value={column.field}>
                            {column.headerName}
                          </MenuItem>
                        ))
                      ) : (
                        <MenuItem value="">No columns available</MenuItem>
                      )}
                    </Select>
                  </FormControl>

                  {/* Operator */}
                  <Select
                    label="operator"
                    size="small"
                    defaultValue={item.operator}
                    onChange={(e) => updateFilter(index, "operator", e.target.value)}
                  >
                    {operators.map((op) => (
                      <MenuItem key={op} value={op}>
                        {op}
                      </MenuItem>
                    ))}
                  </Select>

                  {/* Value */}
                  <TextField
                    label="Value"
                    size="small"
                    defaultValue={item.value ?? ""}
                    onChange={(e) => updateFilter(index, "value", e.target.value)}
                  />
                  <IconButton size="small" color="primary" onClick={addFilter} sx={{ width: 50, mr: 2, ml: 2 }}>
                    <AddIcon fontSize="small" />
                  </IconButton>
                </Box>
              ))}
            </Paper>
          </ClickAwayListener>
        </Popper>

        <Stack direction="row" sx={{ gap: 0.5, flex: 1, pl: 2 }}>
          {filterModel?.items.map((filter: any, id: number) => {
            if (!filter.field || !filter.value) return null;
            const column = columns[filter.field];
            const field = column?.headerName ?? filter.field;
            return <Chip key={filter.id} label={`${field}`} onDelete={() => removeFilter(id)} sx={{ mx: 0.25 }} />;
          })}
        </Stack>
      </Toolbar>
    );
  };

  return (
    <DataGrid
      rows={isLoading ? [] : gridData?.data}
      getRowId={(row) => row._id}
      columns={columns}
      rowCount={gridData.total || 0}
      pagination
      paginationModel={pagination}
      onSortModelChange={handleSortModelChange}
      onPaginationModelChange={handlePaginationChange}
      filterMode="server"
      sortingMode="server"
      paginationMode="server"
      loading={isLoading}
      slots={{ toolbar: CustomToolbar }}
      showToolbar
      disableColumnMenu={true}
      checkboxSelection
      pageSizeOptions={[10, 25, 50, 100]}
    />
  );
}