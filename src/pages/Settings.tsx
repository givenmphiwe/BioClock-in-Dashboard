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
import { getCompanyId } from "../auth/authCompany";

type Section = "hours" | "clocking" | "rates";

export default function Settings() {
  const [companyId, setCompanyId] = useState<string | null>(null);
  const [activeSection, setActiveSection] = useState<Section>("hours");

  /* ===============================
     STATE
  =============================== */

  const [shiftType, setShiftType] = useState<"day" | "night">("day");

  const [startTime, setStartTime] = useState<string>("07:00");
  const [endTime, setEndTime] = useState<string>("16:00");
  const [dailyMinutes, setDailyMinutes] = useState<number>(480);

  const [graceMinutes, setGraceMinutes] = useState<number>(10);
  const [autoClockOut, setAutoClockOut] = useState<string>("16:30");
  const [autoResolve, setAutoResolve] = useState<boolean>(true);
  const [requireReason, setRequireReason] = useState<boolean>(true);
  const [payRates, setPayRates] = useState<any>({});

  const [occupation, setOccupation] = useState<string>("");
  const [hourly, setHourly] = useState<number>(28);
  const [overtime, setOvertime] = useState<number>(1.5);
  const [weekend, setWeekend] = useState<number>(2);
  const [deductAbsent, setDeductAbsent] = useState<boolean>(true);

  /* ===============================
     LOAD SETTINGS
  =============================== */

  useEffect(() => {
    if (!companyId) return;
    const load = async () => {
      const snap = await get(ref(db, `companies/${companyId}/info/settings`));
      const s = snap.val();
      if (!s) return;

      const shift = s.workingHours?.[shiftType];

      if (shift) {
        setStartTime(shift.start);
        setEndTime(shift.end);
        setDailyMinutes(shift.dailyMinutes);
      }

      if (s.clockingRules) {
        setGraceMinutes(s.clockingRules.graceMinutes);
        setAutoClockOut(s.clockingRules.autoClockOut);
        setAutoResolve(s.clockingRules.autoResolveMissing);
        setRequireReason(s.clockingRules.requireEditReason);
      }
    };

    load();
  }, [companyId, shiftType]);

  useEffect(() => {
    getCompanyId().then(setCompanyId).catch(console.error);
  }, []);

  /* ===============================
     SAVE FUNCTIONS
  =============================== */

  const saveWorkingHours = async () => {
    try {
      console.log("Saving working hours:", {
        shiftType,
        startTime,
        endTime,
        dailyMinutes,
      });
      await update(
        ref(
          db,
          `companies/${companyId}/info/settings/workingHours/${shiftType}`
        ),
        {
          start: startTime,
          end: endTime,
          dailyMinutes,
        }
      );

      alert(`${shiftType.toUpperCase()} shift saved`);
    } catch (error) {
      console.error("Error saving working hours:", error);
      alert("Error saving working hours. Check console for details.");
    }
  };

  const saveClockingRules = async () => {
    await update(
      ref(db, `companies/${companyId}/info/settings/clockingRules`),
      {
        graceMinutes,
        autoClockOut,
        autoResolveMissing: autoResolve,
        requireEditReason: requireReason,
      }
    );
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

  useEffect(() => {
    if (!companyId) return;
    const loadRates = async () => {
      const snap = await get(
        ref(db, `companies/${companyId}/info/settings/payRates`)
      );

      if (snap.exists()) {
        setPayRates(snap.val());
      }
    };

    loadRates();
  }, [companyId]);

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
              <TextField
                select
                label="Shift Type"
                value={shiftType}
                onChange={(e) => setShiftType(e.target.value as any)}
              >
                <MenuItem value="day">Day Shift</MenuItem>
                <MenuItem value="night">Night Shift</MenuItem>
              </TextField>

              <TextField
                label="Start Time"
                type="time"
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
              />

              <TextField
                label="End Time"
                type="time"
                value={endTime}
                onChange={(e) => setEndTime(e.target.value)}
              />

              <TextField
                label="Daily Minutes"
                type="number"
                value={dailyMinutes}
                onChange={(e) => setDailyMinutes(Number(e.target.value))}
              />

              <Button variant="contained" onClick={saveWorkingHours}>
                Save {shiftType.toUpperCase()} Shift
              </Button>
            </Stack>
          </Paper>
        )}

        {activeSection === "clocking" && (
          <Paper sx={{ p: 3 }}>
            <Stack spacing={2}>
              <TextField
                label="Grace Minutes"
                type="number"
                value={graceMinutes}
                onChange={(e) => setGraceMinutes(Number(e.target.value))}
              />
              <TextField
                label="Auto Clock-out"
                type="time"
                value={autoClockOut}
                onChange={(e) => setAutoClockOut(e.target.value)}
              />
              <FormControlLabel
                control={
                  <Switch
                    checked={autoResolve}
                    onChange={(e) => setAutoResolve(e.target.checked)}
                  />
                }
                label="Auto resolve missing"
              />
              <FormControlLabel
                control={
                  <Switch
                    checked={requireReason}
                    onChange={(e) => setRequireReason(e.target.checked)}
                  />
                }
                label="Require edit reason"
              />
              <Button variant="contained" onClick={saveClockingRules}>
                Save
              </Button>
            </Stack>
          </Paper>
        )}

        {activeSection === "rates" && (
          <Paper sx={{ p: 3 }}>
            <Stack direction={{ xs: "column", md: "row" }} spacing={3}>
              {/* ================= LEFT: STORED RATES ================= */}
              <Box sx={{ flex: 1 }}>
                <Typography fontWeight={600} mb={1}>
                  Saved Pay Rates
                </Typography>

                <Paper variant="outlined">
                  <Box sx={{ p: 1 }}>
                    <Stack spacing={1}>
                      {Object.entries(payRates || {}).map(
                        ([key, rate]: any) => (
                          <Box
                            key={key}
                            sx={{
                              p: 1.5,
                              borderRadius: 1,

                              cursor: "pointer",
                              "&:hover": { background: "#8a8a8aff" },
                            }}
                            onClick={() => {
                              setOccupation(key);
                              setHourly(rate.hourly);
                              setOvertime(rate.overtime);
                              setWeekend(rate.weekend);
                              setDeductAbsent(rate.deductAbsent);
                            }}
                          >
                            <Typography fontWeight={600}>
                              {key.replace("_", " ").toUpperCase()}
                            </Typography>
                            <Typography variant="body2">
                              Hourly: R{rate.hourly} • OT: {rate.overtime}× •
                              Weekend: {rate.weekend}×
                            </Typography>
                          </Box>
                        )
                      )}
                    </Stack>
                  </Box>
                </Paper>
              </Box>

              {/* ================= RIGHT: EDIT FORM ================= */}
              <Box sx={{ flex: 1 }}>
                <Typography fontWeight={600} mb={1}>
                  Edit Pay Rate
                </Typography>

                <Stack spacing={2}>
                  <TextField
                    label="Occupation Name"
                    placeholder="e.g. Cleaner, Driver, Supervisor"
                    value={occupation}
                    
                    onChange={(e) =>
                      setOccupation(
                        e.target.value.toLowerCase().replace(/\s+/g, "_")
                      )
                    }
                  />

                  <TextField
                    label="Hourly Rate (R)"
                    type="number"
                    value={hourly}
                    onChange={(e) => setHourly(Number(e.target.value))}
                  />

                  <TextField
                    label="Overtime Multiplier"
                    type="number"
                    value={overtime}
                    onChange={(e) => setOvertime(Number(e.target.value))}
                  />

                  <TextField
                    label="Weekend Multiplier"
                    type="number"
                    value={weekend}
                    onChange={(e) => setWeekend(Number(e.target.value))}
                  />

                  <FormControlLabel
                    control={
                      <Switch
                        checked={deductAbsent}
                        onChange={(e) => setDeductAbsent(e.target.checked)}
                      />
                    }
                    label="Deduct for absence"
                  />

                  <Button variant="contained" onClick={savePayRates}>
                    Save Rate
                  </Button>
                </Stack>
              </Box>
            </Stack>
          </Paper>
        )}
      </Box>
    </Layout>
  );
}
