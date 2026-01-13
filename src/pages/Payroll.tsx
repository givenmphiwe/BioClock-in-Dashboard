import { useEffect, useMemo, useState } from "react";
import Layout from "../components/Layout";
import {
  Box,
  Stack,
  Typography,
  Paper,
  Chip,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  TextField,
  MenuItem,
  CircularProgress,
  Button,
} from "@mui/material";
import { ref, onValue, update } from "firebase/database";
import { db } from "../api/firebase";
import { getCompanyId } from "../auth/authCompany";
import dayjs, { Dayjs } from "dayjs";

/* ------------------ HELPERS ------------------ */
type PayrollProps = {
  selectedDate: Dayjs | null;
  onDateChange?: (d: Dayjs | null) => void;
};

const toHours = (ms: number) => ms / 1000 / 60 / 60;

export default function Payroll({ selectedDate, onDateChange }: PayrollProps) {
  const [companyId, setCompanyId] = useState<string | null>(null);
  const [employees, setEmployees] = useState<any>({});
  const [attendance, setAttendance] = useState<any>({});
  const [payRates, setPayRates] = useState<any>({});
  const [workingHours, setWorkingHours] = useState<any>({});
  const [currency, setCurrency] = useState("USD");
  const [search, setSearch] = useState("");
  const [occupationFilter, setOccupationFilter] = useState("all");
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<"day" | "month">("month");

  /* ------------------ Resolve Company ------------------ */
  useEffect(() => {
    getCompanyId().then(setCompanyId);
  }, []);

  /* ------------------ Auto detect country & currency once ------------------ */
  useEffect(() => {
    if (!companyId) return;

    fetch("https://ipapi.co/json")
      .then((res) => res.json())
      .then((data) => {
        if (data?.currency) {
          update(ref(db, `companies/${companyId}/info`), {
            country: data.country,
            currency: data.currency,
          });
        }
      })
      .catch(() => {});
  }, [companyId]);

  /* ------------------ Load Firebase ------------------ */
  useEffect(() => {
    if (!companyId) return;

    const subs = [
      onValue(ref(db, `companies/${companyId}/employees`), (s) =>
        setEmployees(s.val() || {})
      ),
      onValue(ref(db, `companies/${companyId}/attendance`), (s) =>
        setAttendance(s.val() || {})
      ),
      onValue(ref(db, `companies/${companyId}/info/settings/payRates`), (s) =>
        setPayRates(s.val() || {})
      ),
      onValue(
        ref(db, `companies/${companyId}/info/settings/workingHours`),
        (s) => setWorkingHours(s.val() || {})
      ),
      onValue(ref(db, `companies/${companyId}/info/currency`), (s) =>
        setCurrency(s.val() || "USD")
      ),
    ];

    setLoading(false);
    return () => subs.forEach((u) => u());
  }, [companyId]);

  console.log(selectedDate);

  const formatMoney = (v: number) =>
    new Intl.NumberFormat(undefined, {
      style: "currency",
      currency,
      minimumFractionDigits: 2,
    }).format(v);

  /* ------------------ Build Payroll ------------------ */

  const payrollRows = useMemo(() => {
    const rows: any[] = [];

    Object.entries(employees).forEach(([empId, emp]: any) => {
      let hours = 0;

      Object.entries(attendance).forEach(([date, day]: any) => {
        const recordDate = dayjs(date);
        const rec = day[empId];
        if (!rec?.clockIn) return;

        // ---------------- DAY MODE ----------------
        if (viewMode === "day") {
          if (!selectedDate) return;
          if (!recordDate.isSame(selectedDate, "day")) return;

          let end = rec.clockOut;

          // If today and still clocked in, count until now
          if (recordDate.isSame(dayjs(), "day") && !rec.clockOut) {
            end = Date.now();
          }

          if (end) {
            hours += toHours(end - rec.clockIn);
          }
          return;
        }

        // ---------------- MONTH MODE ----------------
        if (viewMode === "month") {
          if (!selectedDate) return;
          if (!recordDate.isSame(selectedDate, "month")) return;

          let end = rec.clockOut;

          // If today and still clocked in, count until now
          if (recordDate.isSame(dayjs(), "day") && !rec.clockOut) {
            end = Date.now();
          }

          if (end) {
            hours += toHours(end - rec.clockIn);
          }
        }
      });

      const occKey = emp.occupationName?.toLowerCase().replace(/ /g, "_");
      const rate = payRates[occKey]?.hourly || 0;
      const otMult = payRates[occKey]?.overtime || 1.5;

      const start = parseInt((workingHours.start || "08:00").split(":")[0]);
      const end = parseInt((workingHours.end || "17:00").split(":")[0]);
      const daily = end - start || 8;

      const normalHours = Math.min(hours, daily);
      const overtime = Math.max(0, hours - daily);

      const normalPay = normalHours * rate;
      const otPay = overtime * rate * otMult;

      rows.push({
        id: empId,
        name: emp.firstName + " " + emp.lastName,
        occupation: emp.occupationName,
        rate,
        hours,
        overtime,
        normalPay,
        otPay,
        total: normalPay + otPay,
      });
    });

    return rows;
  }, [employees, attendance, payRates, workingHours, selectedDate]);

  /* ------------------ Filters ------------------ */

  const occupations = ["all", ...new Set(payrollRows.map((r) => r.occupation))];

  const filtered = payrollRows.filter(
    (r) =>
      r.name.toLowerCase().includes(search.toLowerCase()) &&
      (occupationFilter === "all" || r.occupation === occupationFilter)
  );

  const totals = filtered.reduce(
    (a, e) => {
      a.payroll += e.total;
      a.hours += e.hours;
      a.overtime += e.overtime;
      return a;
    },
    { payroll: 0, hours: 0, overtime: 0 }
  );

  /* ------------------ CSV Export ------------------ */

  const exportCSV = () => {
    const header = [
      "Employee",
      "Occupation",
      "Rate",
      "Hours",
      "Overtime",
      "Normal Pay",
      "Overtime Pay",
      "Total Pay",
    ];

    const rows = filtered.map((e) => [
      e.name,
      e.occupation,
      e.rate,
      e.hours.toFixed(2),
      e.overtime.toFixed(2),
      e.normalPay.toFixed(2),
      e.otPay.toFixed(2),
      e.total.toFixed(2),
    ]);

    const csv =
      header.join(",") + "\n" + rows.map((r) => r.join(",")).join("\n");

    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `Payroll_${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
  };

  if (!companyId || loading) {
    return (
      <Layout currentPage="Payroll">
        <Box sx={{ p: 4, textAlign: "center" }}>
          <CircularProgress />
        </Box>
      </Layout>
    );
  }

  return (
    <Layout
      currentPage="Payroll"
      selectedDate={selectedDate}
      onDateChange={onDateChange}
    >
      <Box sx={{ p: 4 }}>
        <Typography variant="h4" fontWeight={700}>
          Payroll & Wages
        </Typography>
        <Typography variant="body2" color="text.secondary">
          {selectedDate
            ? `Payroll for ${selectedDate.format("DD MMMM YYYY")}`
            : "Payroll for this month"}
        </Typography>

        {/* SUMMARY */}
        <Stack direction="row" spacing={2} sx={{ my: 3 }}>
          <Paper sx={{ p: 2, flex: 1 }}>
            <Typography>Total Payroll</Typography>
            <Typography variant="h6">{formatMoney(totals.payroll)}</Typography>
          </Paper>
          <Paper sx={{ p: 2, flex: 1 }}>
            <Typography>Total Hours</Typography>
            <Typography variant="h6">{totals.hours.toFixed(1)} hrs</Typography>
          </Paper>
          <Paper sx={{ p: 2, flex: 1 }}>
            <Typography>Overtime</Typography>
            <Typography variant="h6">
              {totals.overtime.toFixed(1)} hrs
            </Typography>
          </Paper>
        </Stack>

        {/* FILTERS + EXPORT */}
        <Stack
          direction="row"
          alignItems="center"
          justifyContent="space-between"
          sx={{ mb: 2 }}
        >
          {/* LEFT SIDE */}
          <Stack direction="row" spacing={2} alignItems="center">
            <TextField
              select
              label="Occupation"
              value={occupationFilter}
              onChange={(e) => setOccupationFilter(e.target.value)}
              sx={{ minWidth: 200 }}
            >
              {occupations.map((o) => (
                <MenuItem key={o} value={o}>
                  {o === "all" ? "All occupations" : o}
                </MenuItem>
              ))}
            </TextField>

            <Button variant="contained" onClick={exportCSV}>
              Export CSV
            </Button>
          </Stack>

          {/* RIGHT SIDE */}

          <Stack direction="row" spacing={2} alignItems="center">
            <Button
              variant={viewMode === "day" ? "contained" : "outlined"}
              onClick={() => setViewMode("day")}
            >
              Day
            </Button>

            <Button
              variant={viewMode === "month" ? "contained" : "outlined"}
              onClick={() => setViewMode("month")}
            >
              Month
            </Button>

            <TextField
              label="Search employee"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              sx={{ width: 260 }}
            />
          </Stack>
        </Stack>

        {/* TABLE */}
        <Paper>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Employee</TableCell>
                <TableCell>Occupation</TableCell>
                <TableCell>Rate</TableCell>
                <TableCell>Hours</TableCell>
                <TableCell>OT</TableCell>
                <TableCell>Normal</TableCell>
                <TableCell>OT Pay</TableCell>
                <TableCell>Total</TableCell>
              </TableRow>
            </TableHead>

            <TableBody>
              {filtered.map((emp) => (
                <TableRow key={emp.id}>
                  <TableCell>{emp.name}</TableCell>
                  <TableCell>{emp.occupation}</TableCell>
                  <TableCell>{formatMoney(emp.rate)}</TableCell>
                  <TableCell>{emp.hours.toFixed(1)}</TableCell>
                  <TableCell>
                    {emp.overtime > 0 && (
                      <Chip
                        color="warning"
                        label={emp.overtime.toFixed(1) + "h"}
                      />
                    )}
                  </TableCell>
                  <TableCell>{formatMoney(emp.normalPay)}</TableCell>
                  <TableCell>{formatMoney(emp.otPay)}</TableCell>
                  <TableCell>
                    <b>{formatMoney(emp.total)}</b>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Paper>
      </Box>
    </Layout>
  );
}
