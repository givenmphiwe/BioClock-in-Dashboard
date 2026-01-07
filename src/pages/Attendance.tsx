import Layout from "../components/Layout";
import {
  Box,
  Stack,
  Typography,
  Paper,
  Chip,
} from "@mui/material";
import { DataGrid, GridColDef } from "@mui/x-data-grid";

/* ----------------------------------
   Summary cards (top stats)
---------------------------------- */
const stats = [
  { label: "On Time", value: 265, color: "success" },
  { label: "Late Clock-in", value: 62, color: "warning" },
  { label: "Early Clock-out", value: 224, color: "warning" },
  { label: "Absent", value: 42, color: "error" },
  { label: "No Clock-in", value: 36, color: "error" },
  { label: "No Clock-out", value: 0, color: "default" },
];

/* ----------------------------------
   Table columns
---------------------------------- */
const columns: GridColDef[] = [
  {
    field: "employee",
    headerName: "Employee",
    width: 220,
    renderCell: (params) => (
      <Stack>
        <Typography fontWeight={600}>{params.value}</Typography>
        <Typography variant="caption" color="text.secondary">
          {params.row.employeeId}
        </Typography>
      </Stack>
    ),
  },
  {
    field: "clock",
    headerName: "Clock In / Out",
    width: 220,
    renderCell: (params) => (
      <Stack>
        <Typography color="success.main">{params.row.clockIn}</Typography>
        <Typography color="error.main">{params.row.clockOut}</Typography>
      </Stack>
    ),
  },
  {
    field: "hours",
    headerName: "Worked",
    width: 120,
  },
  {
    field: "overtime",
    headerName: "Overtime",
    width: 120,
  },
  {
    field: "location",
    headerName: "Location",
    width: 200,
  },
  {
    field: "note",
    headerName: "Note",
    flex: 1,
  },
];

const rows = [
  {
    id: 1,
    employee: "Bagus Fikri",
    employeeId: "39486846",
    clockIn: "10:02 AM",
    clockOut: "07:00 PM",
    hours: "8h 58m",
    overtime: "2h 12m",
    location: "Jl. Jendral Sudirman",
    note: "Discussed mutual value proposition",
  },
  {
    id: 2,
    employee: "Hidzein",
    employeeId: "35434543",
    clockIn: "09:30 AM",
    clockOut: "07:12 PM",
    hours: "8h 18m",
    overtime: "-",
    location: "Jl. Ahmad Yani",
    note: "Tynisha already lined up",
  },
];

export default function Attendance() {
  return (
    <Layout currentPage="Attendance">
      <Box p={3}>
        {/* Header */}
        <Stack
          direction="row"
          justifyContent="space-between"
          alignItems="center"
          mb={3}
        >
          <Typography variant="h4" fontWeight={600}>
            Attendance
          </Typography>
        </Stack>

        {/* Stats */}
        <Stack direction="row" spacing={2} mb={3} flexWrap="wrap">
          {stats.map((s) => (
            <Paper
              key={s.label}
              sx={{
                px: 2.5,
                py: 2,
                minWidth: 160,
                borderRadius: 2,
              }}
            >
              <Typography variant="caption" color="text.secondary">
                {s.label}
              </Typography>
              <Typography variant="h5" fontWeight={700}>
                {s.value}
              </Typography>
              <Chip
                size="small"
                label="vs yesterday"
                color={s.color as any}
                sx={{ mt: 1 }}
              />
            </Paper>
          ))}
        </Stack>

        {/* Table */}
        <Paper sx={{ height: 600, borderRadius: 2 }}>
          <DataGrid
            rows={rows}
            columns={columns}
            disableRowSelectionOnClick
            pageSizeOptions={[10, 25]}
            sx={{
              border: "none",
              "& .MuiDataGrid-columnHeaders": {
                backgroundColor: "#fafafa",
                fontWeight: 600,
              },
            }}
          />
        </Paper>
      </Box>
    </Layout>
  );
}
