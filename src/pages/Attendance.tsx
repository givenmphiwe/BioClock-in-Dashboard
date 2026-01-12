import { useEffect, useState, useCallback } from "react";
import { type Dayjs } from "dayjs";
import Layout from "../components/Layout";
import { Box, Stack, Typography, Paper, Chip } from "@mui/material";
import { DataGrid, GridColDef } from "@mui/x-data-grid";
import { ref, get } from "firebase/database";
import { getCompanyId } from "../auth/authCompany";
import { db } from "../api/firebase";

type AttendanceProps = {
  selectedDate?: Dayjs | null;
  onDateChange?: (d: Dayjs | null) => void;
};

export default function Attendance({
  selectedDate,
  onDateChange,
}: AttendanceProps) {
  const today = new Date().toISOString().split("T")[0];
  const selectedDateStr = selectedDate
    ? selectedDate.format("YYYY-MM-DD")
    : today;

  const [rows, setRows] = useState<any[]>([]);
  const [companyId, setCompanyId] = useState<string | null>(null);
  const [stats, setStats] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const [snack, setSnack] = useState({
    open: false,
    message: "",
    severity: "success" as "success" | "error" | "info",
  });

  const isFuture = selectedDate
    ? selectedDate.isAfter(new Date(), "day")
    : false;

  useEffect(() => {
    if (!companyId) return;

    if (isFuture) {
      setRows([]);
      setStats([]);
      return;
    }

    const load = async () => {
      setLoading(true);

      try {
        const empSnap = await get(ref(db, `companies/${companyId}/employees`));
        const attSnap = await get(
          ref(db, `companies/${companyId}/attendance/${selectedDateStr}`)
        );
        const rulesSnap = await get(
          ref(db, `companies/${companyId}/info/settings`)
        );

        const employees = empSnap.val() || {};
        const attendance = attSnap.val() || {};
        const rulesVal = rulesSnap.val() || {};

        const startStr = rulesVal.workingHours?.start ?? "08:00";
        const endStr = rulesVal.workingHours?.end ?? "17:00";
        const grace = rulesVal.clockingRules?.graceMinutes ?? 0;

        const [sh, sm] = startStr.split(":").map(Number);
        const [eh, em] = endStr.split(":").map(Number);

        let onTime = 0;
        let late = 0;
        let earlyOut = 0;
        let absent = 0;
        let noIn = 0;
        let noOut = 0;

        let grid: any[] = [];
        let id = 1;

        Object.keys(employees).forEach((empId) => {
          const emp = employees[empId];
          const rec = attendance[empId];

          // No record → Absent
          if (!rec) {
            absent++;
            grid.push({
              id: id++,
              employee: `${emp.firstName} ${emp.lastName}`,
              employeeId: emp.industryNumber,
              clockIn: "-",
              clockOut: "-",
              hours: "-",
              overtime: "-",
              location: "Site",
              note: "Absent",
            });
            return;
          }

          if (!rec.clockIn) noIn++;
          if (!rec.clockOut) noOut++;

          const clockInTime = rec.clockIn ? new Date(rec.clockIn) : null;
          const clockOutTime = rec.clockOut ? new Date(rec.clockOut) : null;

          let status = "";

          // Late / On time
          if (clockInTime) {
            const shiftStart = new Date(clockInTime);
            shiftStart.setHours(sh, sm + grace, 0, 0);

            if (clockInTime <= shiftStart) {
              onTime++;
              status = "On Time";
            } else {
              late++;
              status = "Late";
            }
          }

          // Early out
          if (clockOutTime) {
            const shiftEnd = new Date(clockOutTime);
            shiftEnd.setHours(eh, em, 0, 0);

            if (clockOutTime < shiftEnd) {
              earlyOut++;
              status = "Early Out";
            }
          }

          grid.push({
            id: id++,
            employee: `${emp.firstName} ${emp.lastName}`,
            employeeId: emp.industryNumber,
            clockIn: clockInTime
              ? clockInTime.toLocaleTimeString("en-ZA", {
                  hour: "2-digit",
                  minute: "2-digit",
                  hour12: false,
                })
              : "-",
            clockOut: clockOutTime
              ? clockOutTime.toLocaleTimeString("en-ZA", {
                  hour: "2-digit",
                  minute: "2-digit",
                  hour12: false,
                })
              : "-",
            hours: "-",
            overtime: "-",
            location: "Site",
            note: status,
          });
        });

        setRows(grid);
        setStats([
          { label: "On Time", value: onTime, color: "success" },
          { label: "Late Clock-in", value: late, color: "warning" },
          { label: "Early Clock-out", value: earlyOut, color: "warning" },
          { label: "Absent", value: absent, color: "error" },
          { label: "No Clock-in", value: noIn, color: "error" },
          { label: "No Clock-out", value: noOut, color: "default" },
        ]);
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [companyId, selectedDateStr]);
  const notify = useCallback(
    (message: string, severity: "success" | "error" | "info") =>
      setSnack({ open: true, message, severity }),
    []
  );
  useEffect(() => {
    getCompanyId()
      .then(setCompanyId)
      .catch((err) => {
        console.error(err);
        notify("User not linked to a company", "error");
      });
  }, [notify]);

  const columns: GridColDef[] = [
    {
      field: "employee",
      headerName: "Employee",
      width: 220,
      renderCell: (params) => (
        <Stack>
          <Typography fontWeight={600}>{params.value}</Typography>
          <Typography variant="caption">{params.row.employeeId}</Typography>
        </Stack>
      ),
    },
    {
      field: "clockIn",
      headerName: "Clock In",
      width: 130,
      renderCell: (params) => (
        <Box sx={{ display: "flex", alignItems: "center", height: "100%" }}>
          <Typography color="success.main">{params.value}</Typography>
        </Box>
      ),
    },
    {
      field: "clockOut",
      headerName: "Clock Out",
      width: 130,
      renderCell: (params) => (
        <Box sx={{ display: "flex", alignItems: "center", height: "100%" }}>
          <Typography color="error.main">{params.value}</Typography>
        </Box>
      ),
    },
    { field: "hours", headerName: "Worked", width: 120 },
    { field: "overtime", headerName: "Overtime", width: 120 },
    { field: "location", headerName: "Location", width: 150 },
    {
      field: "note",
      headerName: "Status",
      flex: 1,
      renderCell: (params) => {
        const value = params.value;

        let color: any = "default";

        if (value === "Late") color = "warning";
        if (value === "On Time") color = "success";
        if (value === "Early Out") color = "warning";
        if (value === "Absent") color = "error";

        return (
          <Chip
            label={value || "-"}
            color={color}
            size="small"
            sx={{ fontWeight: 600 }}
          />
        );
      },
    },
  ];

  return (
    <Layout
      currentPage="Attendance"
      selectedDate={selectedDate}
      onDateChange={onDateChange}
    >
      <Box p={3}>
        <Typography variant="h4" fontWeight={600}>
          Attendance
        </Typography>

        <Stack direction="row" spacing={2} my={3} flexWrap="wrap">
          {loading ? (
            <Typography color="text.secondary">
              Loading attendance...
            </Typography>
          ) : (
            stats.map((s) => (
              <Paper key={s.label} sx={{ p: 2, minWidth: 160 }}>
                <Typography variant="caption">{s.label}</Typography>
                <Typography variant="h5">{s.value}</Typography>
                <Chip label="Today" color={s.color as any} size="small" />
              </Paper>
            ))
          )}
        </Stack>

        <Paper sx={{ height: 600 }}>
          <DataGrid
            rows={rows}
            columns={columns}
            loading={loading}
            disableRowSelectionOnClick
          />
        </Paper>
      </Box>
    </Layout>
  );
}
