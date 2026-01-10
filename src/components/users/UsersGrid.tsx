import Paper from "@mui/material/Paper";
import Stack from "@mui/material/Stack";
import CircularProgress from "@mui/material/CircularProgress";
import { DataGrid, GridColDef } from "@mui/x-data-grid";
import { ActionsCell } from "./ActionsCell";

export function UsersGrid({
  rows,
  loading,
}: {
  rows: any[];
  loading: boolean;
  onPermissions: (user: any) => void;
  onAssignEmployees: (user: any) => void;
}) {
  const columns: GridColDef[] = [
    { field: "name", headerName: "Name", width: 200 },
    { field: "industryNumber", headerName: "IRN", width: 140 },
    { field: "role", headerName: "Role", width: 140 },
    {
      field: "online",
      headerName: "Status",
      width: 120,
      valueGetter: (_, row) => (row.online ? "Online" : "Offline"),
    },
    {
      field: "actions",
      headerName: "",
      width: 80,
      sortable: false,
       renderCell: (params) => (
        <ActionsCell
          row={params.row}
          onPermissions={params.row.onPermissions}
          onRemove={params.row.onRemove}
          onAssignEmployees={params.row.onAssignEmployees}
        />
      )
    },
  ];

  return (
    <Paper sx={{ height: 600, width: "100%", position: "relative" }}>
      {loading && (
        <Stack
          alignItems="center"
          justifyContent="center"
          sx={{
            position: "absolute",
            inset: 0,
            zIndex: 2,
            bgcolor: "rgba(255,255,255,0.6)",
          }}
        >
          <CircularProgress />
        </Stack>
      )}

      <DataGrid
        rows={rows}
        columns={columns}
        getRowId={(r) => r.uid}
        pageSizeOptions={[10, 25]}
        disableRowSelectionOnClick
        sx={{ border: 0 }}
      />
    </Paper>
  );
}
