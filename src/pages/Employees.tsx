import React, {
  memo,
  useCallback,
  useMemo,
  useRef,
  useState,
  useEffect,
} from "react";
import Layout from "../components/Layout";
import Paper from "@mui/material/Paper";
import Button from "@mui/material/Button";
import Stack from "@mui/material/Stack";
import Snackbar from "@mui/material/Snackbar";
import Alert from "@mui/material/Alert";
import Typography from "@mui/material/Typography";
import CircularProgress from "@mui/material/CircularProgress";
import { DataGrid, GridColDef } from "@mui/x-data-grid";
import * as XLSX from "xlsx";
import { Employee } from "../types/employee";
import { AddEmployeeDialog } from "../modal/AddEmployeeDialog";
import {
  fetchEmployees,
  bulkCreateEmployeesFirebase,
  updateEmployeeField,
} from "../api/employees.firebase";

// --- Columns (stable, outside component) ---
const columns: GridColDef[] = [
  { field: "id", headerName: "ID", width: 80 },
  { field: "industryNumber", headerName: "IRN", width: 120 },
  { field: "firstName", headerName: "First name", width: 160, editable: true },
  { field: "lastName", headerName: "Last name", width: 160, editable: true },
  {
    field: "occupationName",
    headerName: "Occupation",
    width: 160,
    editable: true,
  },
  {
    field: "gangUnitName",
    headerName: "Gang / Unit",
    width: 180,
    editable: true,
  },
  { field: "phone", headerName: "Phone", width: 150, editable: true },
  { field: "email", headerName: "Email", width: 200, editable: true },
  { field: "employmentType", headerName: "Type", width: 120, editable: true },
  { field: "status", headerName: "Status", width: 120, editable: true },
  { field: "isEnrolled", headerName: "Enrolled", width: 110, type: "boolean" },
  {
    field: "age",
    headerName: "Age",
    type: "number",
    width: 100,
    editable: true,
  },
  { field: "dateOfBirth", headerName: "DOB", width: 130, editable: true },
  { field: "hireDate", headerName: "Hire Date", width: 130, editable: true },
  {
    field: "fullName",
    headerName: "Full name",
    sortable: false,
    width: 200,
    valueGetter: (value, row) => `${row.firstName || ""} ${row.lastName || ""}`,
  },
];

const EXPORT_COLUMNS = [
  "industryNumber",
  "firstName",
  "lastName",
  "occupationName",
  "gangUnitName",
  "phone",
  "email",
  "employmentType",
  "status",
  "isEnrolled",
  "age",
  "dateOfBirth",
  "hireDate",
];

const seedRows: Employee[] = [
  {
    id: 1,
    industryNumber: "IRN001",
    firstName: "Jon",
    lastName: "Snow",
    occupationName: "Developer",
    gangUnitName: "Alpha",
    phone: "+27 11 000 0000",
    email: "jon@example.com",
    employmentType: "permanent",
    status: "active",
    isEnrolled: true,
    age: 35,
    dateOfBirth: "1990-01-01",
    hireDate: "2020-06-01",
  },
];

const EmployeesGrid = memo(function EmployeesGrid({
  rows,
  loading,
  onEditCommit,
}: {
  rows: Employee[];
  loading: boolean;
  onEditCommit: (params: any) => void;
}) {
  const paginationModel = useMemo(() => ({ page: 0, pageSize: 10 }), []);

  const processRowUpdate = useCallback((newRow: any) => newRow, []);

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
        rows={rows as any}
        columns={columns}
        initialState={{ pagination: { paginationModel } }}
        pageSizeOptions={[10, 25]}
        checkboxSelection
        disableRowSelectionOnClick
        sx={{ border: 0 }}
        processRowUpdate={processRowUpdate}
        onCellEditStop={onEditCommit}
      />
    </Paper>
  );
});

export default function Employees() {
  const [rows, setRows] = useState<Employee[]>(seedRows);
  const [loading, setLoading] = useState(false);
  const [snack, setSnack] = useState<{
    open: boolean;
    message: string;
    severity: "success" | "error" | "info";
  }>({
    open: false,
    message: "",
    severity: "success",
  });

  // Dialog open flag ONLY (dialog has its own local form state)
  const [addOpen, setAddOpen] = useState(false);

  // Excel input ref
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const handleImportClick = () => fileInputRef.current?.click();

  const notify = useCallback(
    (message: string, severity: "success" | "error" | "info") => {
      setSnack({ open: true, message, severity });
    },
    []
  );

  const handleDownloadCSV = useCallback(() => {
    const data = rows.map((row) => {
      const obj: any = {};
      EXPORT_COLUMNS.forEach((col) => {
        obj[col] = (row as any)[col] ?? "";
      });
      return obj;
    });

    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Employees");

    XLSX.writeFile(wb, "employees.csv");
  }, [rows]);

  const handleImportFile = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;
      setLoading(true);
      try {
        const data = await file.arrayBuffer();
        const wb = XLSX.read(data);
        const sheet = wb.Sheets[wb.SheetNames[0]];
        const json = XLSX.utils.sheet_to_json<any>(sheet, { defval: "" });

        const mapped: Omit<Employee, "id">[] = json.map((r: any) => ({
          industryNumber: r.industryNumber ?? r.IRN ?? r.industry_number ?? "",
          firstName: r.firstName ?? r.FirstName ?? r.first_name ?? "",
          lastName: r.lastName ?? r.LastName ?? r.last_name ?? "",
          idNumber: r.idNumber ?? r.IDNumber ?? r.id_number ?? "",
          email: r.email ?? r.Email ?? "",
          phone: r.phone ?? r.Phone ?? r.cell ?? "",
          occupationId: r.occupationId ?? r.occupation_id ?? "",
          occupationName: r.occupationName ?? r.occupation ?? r.job ?? "",
          gangUnitId: r.gangUnitId ?? r.gang_unit_id ?? r.gangId ?? "",
          gangUnitName: r.gangUnitName ?? r.gang_unit ?? r.gang ?? "",
          employmentType: (r.employmentType ?? r.type ?? "permanent")
            .toString()
            .toLowerCase(),
          status: (r.status ?? "active").toString().toLowerCase(),
          isEnrolled: ["1", 1, true, "true", "yes", "y"].includes(r.isEnrolled),
          age:
            r.age !== undefined && r.age !== ""
              ? Number(r.age)
              : r.Age !== undefined && r.Age !== ""
              ? Number(r.Age)
              : null,
          dateOfBirth: r.dateOfBirth ?? r.dob ?? r.DateOfBirth ?? "",
          hireDate: r.hireDate ?? r.HireDate ?? r.start_date ?? "",
        }));

        const clean = mapped.filter(
          (m) => m.firstName || m.lastName || m.industryNumber
        );
        if (!clean.length) throw new Error("No rows found in the spreadsheet.");

        const created = await bulkCreateEmployeesFirebase(clean);
        setRows((prev) => {
          const toAppend = created.map((c, i) => ({
            ...c,
            id: c.id ?? `imp_${Date.now()}_${i}`,
          }));
          return [...toAppend, ...prev];
        });
        notify(`Imported ${created.length} employees`, "success");
      } catch (err: any) {
        console.error(err);
        notify(err?.message || "Import failed", "error");
      } finally {
        setLoading(false);
        if (fileInputRef.current) fileInputRef.current.value = "";
      }
    },
    [notify]
  );

  const openAddDialog = useCallback(() => setAddOpen(true), []);
  const closeAddDialog = useCallback(() => setAddOpen(false), []);

  const handleCreateEmployeeSaved = useCallback((created: Employee) => {
    setRows((prev) => [created, ...prev]);
  }, []);

  // Keep handler stable so DataGrid doesn't think props changed
  const handleCellEditCommit = useCallback(
    async (params: any) => {
      const { id, field, value } = params;

      // optimistic UI update
      setRows((prev) =>
        prev.map((r) => (r.id === id ? { ...r, [field]: value } : r))
      );

      try {
        await updateEmployeeField(String(id), field, value);
      } catch (err) {
        console.error(err);
        notify("Failed to save change to Firebase", "error");
      }
    },
    [notify]
  );

  useEffect(() => {
    setLoading(true);
    fetchEmployees()
      .then(setRows)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  return (
    <Layout currentPage="Employees">
      <div style={{ padding: 32 }}>
        <Stack
          direction="row"
          alignItems="center"
          justifyContent="space-between"
          sx={{ mb: 2 }}
        >
          <Typography variant="h4">Employees</Typography>
          <Stack direction="row" spacing={1}>
            <input
              type="file"
              accept=".xlsx,.xls,.csv"
              ref={fileInputRef}
              style={{ display: "none" }}
              onChange={handleImportFile}
            />
            <Button
              variant="outlined"
              onClick={handleImportClick}
              disabled={loading}
            >
              Import Excel
            </Button>
            <Button
              variant="outlined"
              onClick={handleDownloadCSV}
              disabled={!rows.length || loading}
            >
              Download CSV
            </Button>

            <Button
              variant="contained"
              onClick={openAddDialog}
              disabled={loading}
            >
              Add Row
            </Button>
          </Stack>
        </Stack>

        <EmployeesGrid
          rows={rows}
          loading={loading}
          onEditCommit={handleCellEditCommit}
        />

        <AddEmployeeDialog
          open={addOpen}
          onClose={closeAddDialog}
          onSaved={handleCreateEmployeeSaved}
          setGlobalLoading={setLoading}
          notify={notify}
        />

        <Snackbar
          open={snack.open}
          autoHideDuration={4000}
          onClose={() => setSnack((s) => ({ ...s, open: false }))}
          anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
        >
          <Alert
            onClose={() => setSnack((s) => ({ ...s, open: false }))}
            severity={snack.severity}
            variant="filled"
            sx={{ width: "100%" }}
          >
            {snack.message}
          </Alert>
        </Snackbar>
      </div>
    </Layout>
  );
}
