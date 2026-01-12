import { useEffect, useState } from "react";
import Layout from "../components/Layout";
import {
  Box,
  Typography,
  Stack,
  Button,
  Paper,
  TextField,
  Switch,
  FormControlLabel,
  MenuItem,
} from "@mui/material";
import { ref, get, update } from "firebase/database";
import { db } from "../api/firebase";

type Section = "hours" | "clocking" | "rates";

export default function Settings() {
  const companyId = "company_001";
  const [activeSection, setActiveSection] = useState<Section>("hours");

  /* ===============================
     STATE
  =============================== */

  const [startTime, setStartTime] = useState("07:00");
  const [endTime, setEndTime] = useState("16:00");
  const [dailyMinutes, setDailyMinutes] = useState(480);

  const [graceMinutes, setGraceMinutes] = useState(10);
  const [autoClockOut, setAutoClockOut] = useState("16:30");
  const [autoResolve, setAutoResolve] = useState(true);
  const [requireReason, setRequireReason] = useState(true);

  const [occupation, setOccupation] = useState("general_worker");
  const [hourly, setHourly] = useState(28);
  const [overtime, setOvertime] = useState(1.5);
  const [weekend, setWeekend] = useState(2);
  const [deductAbsent, setDeductAbsent] = useState(true);

  /* ===============================
     LOAD SETTINGS
  =============================== */

  useEffect(() => {
    const load = async () => {
      const snap = await get(ref(db, `companies/${companyId}/info/settings`));
      const s = snap.val();
      if (!s) return;

      if (s.workingHours) {
        setStartTime(s.workingHours.start);
        setEndTime(s.workingHours.end);
        setDailyMinutes(s.workingHours.dailyMinutes);
      }

      if (s.clockingRules) {
        setGraceMinutes(s.clockingRules.graceMinutes);
        setAutoClockOut(s.clockingRules.autoClockOut);
        setAutoResolve(s.clockingRules.autoResolveMissing);
        setRequireReason(s.clockingRules.requireEditReason);
      }
    };
    load();
  }, []);

  /* ===============================
     SAVE FUNCTIONS
  =============================== */

  const saveWorkingHours = async () => {
    await update(ref(db, `companies/${companyId}/info/settings/workingHours`), {
      start: startTime,
      end: endTime,
      dailyMinutes,
    });
    alert("Working hours saved");
  };

  const saveClockingRules = async () => {
    await update(ref(db, `companies/${companyId}/info/settings/clockingRules`), {
      graceMinutes,
      autoClockOut,
      autoResolveMissing: autoResolve,
      requireEditReason: requireReason,
    });
    alert("Clocking rules saved");
  };

  const savePayRates = async () => {
    await update(
      ref(db, `companies/${companyId}/info/settings/payRates/${occupation}`),
      {
        hourly,
        overtime,
        weekend,
        deductAbsent,
      }
    );
    alert("Pay rate saved");
  };

  /* ===============================
     UI
  =============================== */

  return (
    <Layout currentPage="Settings">
      <Box sx={{ p: 4, maxWidth: 1000 }}>
        <Typography variant="h4" fontWeight={600}>
          System Settings
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
          Company attendance, clocking & payroll rules
        </Typography>

        <Stack direction="row" spacing={2} sx={{ mb: 4 }}>
          <Button
            variant={activeSection === "hours" ? "contained" : "outlined"}
            onClick={() => setActiveSection("hours")}
          >
            Working Hours
          </Button>
          <Button
            variant={activeSection === "clocking" ? "contained" : "outlined"}
            onClick={() => setActiveSection("clocking")}
          >
            Clock-in Rules
          </Button>
          <Button
            variant={activeSection === "rates" ? "contained" : "outlined"}
            onClick={() => setActiveSection("rates")}
          >
            Pay Rates
          </Button>
        </Stack>

        {activeSection === "hours" && (
          <Paper sx={{ p: 3 }}>
            <Stack spacing={2}>
              <TextField label="Start Time" type="time" value={startTime} onChange={(e) => setStartTime(e.target.value)} />
              <TextField label="End Time" type="time" value={endTime} onChange={(e) => setEndTime(e.target.value)} />
              <TextField label="Daily Minutes" type="number" value={dailyMinutes} onChange={(e) => setDailyMinutes(Number(e.target.value))} />
              <Button variant="contained" onClick={saveWorkingHours}>Save</Button>
            </Stack>
          </Paper>
        )}

        {activeSection === "clocking" && (
          <Paper sx={{ p: 3 }}>
            <Stack spacing={2}>
              <TextField label="Grace Minutes" type="number" value={graceMinutes} onChange={(e) => setGraceMinutes(Number(e.target.value))} />
              <TextField label="Auto Clock-out" type="time" value={autoClockOut} onChange={(e) => setAutoClockOut(e.target.value)} />
              <FormControlLabel control={<Switch checked={autoResolve} onChange={(e) => setAutoResolve(e.target.checked)} />} label="Auto resolve missing" />
              <FormControlLabel control={<Switch checked={requireReason} onChange={(e) => setRequireReason(e.target.checked)} />} label="Require edit reason" />
              <Button variant="contained" onClick={saveClockingRules}>Save</Button>
            </Stack>
          </Paper>
        )}

        {activeSection === "rates" && (
          <Paper sx={{ p: 3 }}>
            <Stack spacing={2}>
              <TextField select label="Occupation" value={occupation} onChange={(e) => setOccupation(e.target.value)}>
                <MenuItem value="general_worker">General Worker</MenuItem>
                <MenuItem value="security_guard">Security Guard</MenuItem>
                <MenuItem value="supervisor">Supervisor</MenuItem>
                <MenuItem value="manager">Manager</MenuItem>
              </TextField>
              <TextField label="Hourly Rate" type="number" value={hourly} onChange={(e) => setHourly(Number(e.target.value))} />
              <TextField label="Overtime Multiplier" type="number" value={overtime} onChange={(e) => setOvertime(Number(e.target.value))} />
              <TextField label="Weekend Multiplier" type="number" value={weekend} onChange={(e) => setWeekend(Number(e.target.value))} />
              <FormControlLabel control={<Switch checked={deductAbsent} onChange={(e) => setDeductAbsent(e.target.checked)} />} label="Deduct for absence" />
              <Button variant="contained" onClick={savePayRates}>Save</Button>
            </Stack>
          </Paper>
        )}
      </Box>
    </Layout>
  );
}
