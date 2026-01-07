import Layout from "../components/Layout";
import {
  Box,
  Typography,
  Stack,
  Button,
  Paper,
  TextField,
  Divider,
  Switch,
  FormControlLabel,
} from "@mui/material";

export default function Settings() {
  return (
    <Layout currentPage="Settings">
      <Box sx={{ p: 4, maxWidth: 1100 }}>
        {/* Header */}
        <Stack spacing={1} sx={{ mb: 4 }}>
          <Typography variant="h4" fontWeight={600}>
            System Settings
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Configure company rules, attendance behaviour, payroll and leave policies
          </Typography>
        </Stack>

        <Stack spacing={4}>
          {/* ===============================
              WORKING HOURS
          =============================== */}
          <Paper variant="outlined" sx={{ p: 3 }}>
            <Typography variant="h6" fontWeight={600} gutterBottom>
              Working Hours & Attendance
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
              Defines default working hours and attendance behaviour
            </Typography>

            <Stack direction="row" spacing={2} sx={{ mb: 3 }}>
              <TextField label="Start Time" type="time" fullWidth />
              <TextField label="End Time" type="time" fullWidth />
              <TextField label="Daily Minutes" type="number" fullWidth />
            </Stack>

            <Stack direction="row" spacing={2}>
              <TextField label="Grace Period (minutes)" type="number" />
              <TextField label="Auto Clock-out Time" type="time" />
            </Stack>

            <Divider sx={{ my: 3 }} />

            <FormControlLabel
              control={<Switch defaultChecked />}
              label="Enable automatic attendance resolution"
            />
          </Paper>

          {/* ===============================
              AUTO RESOLUTION
          =============================== */}
          <Paper variant="outlined" sx={{ p: 3 }}>
            <Typography variant="h6" fontWeight={600} gutterBottom>
              Auto-Resolution Rules
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
              How the system should resolve missing or incomplete attendance
            </Typography>

            <Stack direction="row" spacing={2}>
              <TextField
                label="No Clock-in Action"
                helperText="absent | normal_hours | unpaid"
                fullWidth
              />
              <TextField
                label="Missed Clock-out Action"
                helperText="auto_close"
                fullWidth
              />
            </Stack>
          </Paper>

          {/* ===============================
              PAY RATES
          =============================== */}
          <Paper variant="outlined" sx={{ p: 3 }}>
            <Typography variant="h6" fontWeight={600} gutterBottom>
              Pay Rates
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
              Used when generating payslips
            </Typography>

            <Stack direction="row" spacing={2}>
              <TextField label="Hourly Rate (ZAR)" type="number" fullWidth />
              <TextField label="Overtime Multiplier" type="number" fullWidth />
              <TextField label="Weekend Multiplier" type="number" fullWidth />
            </Stack>
          </Paper>

          {/* ===============================
              LEAVE POLICY
          =============================== */}
          <Paper variant="outlined" sx={{ p: 3 }}>
            <Typography variant="h6" fontWeight={600} gutterBottom>
              Leave Accrual Policy
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
              Company-wide leave configuration
            </Typography>

            <Stack direction="row" spacing={2}>
              <TextField label="Annual Leave (days / year)" type="number" />
              <TextField label="Accrual per Month" type="number" />
              <TextField label="Max Carry Over (days)" type="number" />
            </Stack>

            <Divider sx={{ my: 3 }} />

            <FormControlLabel
              control={<Switch defaultChecked />}
              label="Allow leave carry-over"
            />
          </Paper>

          {/* ===============================
              PAYROLL RULES
          =============================== */}
          <Paper variant="outlined" sx={{ p: 3 }}>
            <Typography variant="h6" fontWeight={600} gutterBottom>
              Payroll Rules
            </Typography>

            <Stack direction="row" spacing={3}>
              <TextField
                label="Round Minutes To"
                helperText="e.g. 15"
                type="number"
              />
              <FormControlLabel
                control={<Switch defaultChecked />}
                label="Deduct pay for absence"
              />
            </Stack>
          </Paper>

          {/* ===============================
              SYSTEM CONTROLS
          =============================== */}
          <Paper variant="outlined" sx={{ p: 3 }}>
            <Typography variant="h6" fontWeight={600} gutterBottom>
              System Controls
            </Typography>

            <Stack spacing={1.5}>
              <FormControlLabel
                control={<Switch defaultChecked />}
                label="Require reason for manual edits"
              />
              <FormControlLabel
                control={<Switch defaultChecked />}
                label="Lock attendance after payroll run"
              />
              <FormControlLabel
                control={<Switch defaultChecked />}
                label="Allow admin overrides"
              />
            </Stack>
          </Paper>

          {/* ===============================
              SAVE
          =============================== */}
          <Stack direction="row" justifyContent="flex-end">
            <Button variant="contained" size="large">
              Save Settings
            </Button>
          </Stack>
        </Stack>
      </Box>
    </Layout>
  );
}
