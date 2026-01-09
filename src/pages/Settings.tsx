import { useState } from "react";
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

type Section = "hours" | "clocking" | "rates";

export default function Settings() {
  const [activeSection, setActiveSection] = useState<Section>("hours");

  return (
    <Layout currentPage="Settings">
      <Box sx={{ p: 4, maxWidth: 1000 }}>
        {/* ===============================
            HEADER
        =============================== */}
        <Typography variant="h4" fontWeight={600} sx={{ mb: 1 }}>
          System Settings
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
          Configure attendance, clocking rules and pay rates
        </Typography>

        {/* ===============================
            TOP BUTTONS
        =============================== */}
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

        {/* ===============================
            WORKING HOURS
        =============================== */}
        {activeSection === "hours" && (
          <Paper variant="outlined" sx={{ p: 3 }}>
            <Typography variant="h6" fontWeight={600}>
              Working Hours
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
              Default company working schedule
            </Typography>

            <Stack direction="row" spacing={2}>
              <TextField label="Start Time" type="time" fullWidth />
              <TextField label="End Time" type="time" fullWidth />
              <TextField label="Daily Minutes" type="number" fullWidth />
            </Stack>

            <Stack direction="row" justifyContent="flex-end" sx={{ mt: 3 }}>
              <Button variant="contained">Save Working Hours</Button>
            </Stack>
          </Paper>
        )}

        {/* ===============================
            CLOCK-IN RULES
        =============================== */}
        {activeSection === "clocking" && (
          <Paper variant="outlined" sx={{ p: 3 }}>
            <Typography variant="h6" fontWeight={600}>
              Clock-in & Attendance Rules
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
              How the system handles attendance behaviour
            </Typography>

            <Stack direction="row" spacing={2}>
              <TextField label="Grace Period (minutes)" type="number" />
              <TextField label="Auto Clock-out Time" type="time"   fullWidth/>
            </Stack>

            <FormControlLabel
              sx={{ mt: 2 }}
              control={<Switch defaultChecked />}
              label="Auto-resolve missing clock-ins"
            />

            <FormControlLabel
              control={<Switch defaultChecked />}
              label="Require reason for manual edits"
            />

            <Stack direction="row" justifyContent="flex-end" sx={{ mt: 3 }}>
              <Button variant="contained">Save Clock-in Rules</Button>
            </Stack>
          </Paper>
        )}

        {/* ===============================
            PAY RATES BY OCCUPATION
        =============================== */}
        {activeSection === "rates" && (
          <Paper variant="outlined" sx={{ p: 3 }}>
            <Typography variant="h6" fontWeight={600}>
              Pay Rates
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
              Rates are defined per occupation
            </Typography>

            <Stack direction="row" spacing={2} sx={{ mb: 2 }}>
              <TextField
                select
                label="Occupation"
                fullWidth
                defaultValue=""
              >
                <MenuItem value="general_worker">
                  General Worker
                </MenuItem>
                <MenuItem value="security_guard">
                  Security Guard
                </MenuItem>
                <MenuItem value="supervisor">
                  Supervisor
                </MenuItem>
                <MenuItem value="manager">
                  Manager
                </MenuItem>
              </TextField>
            </Stack>

            <Stack direction="row" spacing={2}>
              <TextField
                label="Hourly Rate (ZAR)"
                type="number"
                fullWidth
              />
              <TextField
                label="Overtime Multiplier"
                type="number"
                fullWidth
              />
              <TextField
                label="Weekend Multiplier"
                type="number"
                fullWidth
              />
            </Stack>

            <FormControlLabel
              sx={{ mt: 2 }}
              control={<Switch defaultChecked />}
              label="Deduct pay for absence"
            />

            <Stack direction="row" justifyContent="flex-end" sx={{ mt: 3 }}>
              <Button variant="contained">Save Pay Rates</Button>
            </Stack>
          </Paper>
        )}
      </Box>
    </Layout>
  );
}
