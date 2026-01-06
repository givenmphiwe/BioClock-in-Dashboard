import { useState } from "react";
import Layout from "../components/Layout";
import {
  Box,
  Stack,
  Typography,
  Paper,
  Button,
  Chip,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
} from "@mui/material";

/* ------------------ TYPES ------------------ */

type LeaveStatus = "pending" | "approved" | "declined";

type LeaveRequest = {
  id: string;
  employee: string;
  from: string;
  to: string;
  reason: string;
  status: LeaveStatus;
  declineReason?: string;
};

type LeaveBalance = {
  [employee: string]: number;
};

/* ------------------ DUMMY DATA ------------------ */

const initialLeaves: LeaveRequest[] = [
  {
    id: "1",
    employee: "John Mokoena",
    from: "2026-01-10",
    to: "2026-01-12",
    reason: "Family responsibility",
    status: "pending",
  },
  {
    id: "2",
    employee: "Thabo Dlamini",
    from: "2026-01-15",
    to: "2026-01-16",
    reason: "Medical",
    status: "pending",
  },
  {
    id: "3",
    employee: "Sipho Khumalo",
    from: "2026-01-05",
    to: "2026-01-08",
    reason: "Personal",
    status: "approved",
  },
];

const initialBalances: LeaveBalance = {
  "John Mokoena": 15,
  "Thabo Dlamini": 12,
  "Sipho Khumalo": 10,
};

/* ------------------ HELPERS ------------------ */

const calculateDays = (from: string, to: string) => {
  const start = new Date(from);
  const end = new Date(to);
  const diff =
    (end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24);
  return diff + 1; // inclusive
};

/* ------------------ PAGE ------------------ */

export default function LeaveRequest() {
  const [leaves, setLeaves] = useState<LeaveRequest[]>(initialLeaves);
  const [balances, setBalances] = useState<LeaveBalance>(initialBalances);

  const [view, setView] = useState<
    "current" | "pending" | "approved" | "declined"
  >("pending");

  const [declineOpen, setDeclineOpen] = useState(false);
  const [selectedLeave, setSelectedLeave] = useState<LeaveRequest | null>(null);
  const [declineReason, setDeclineReason] = useState("");

  /* ------------------ FILTERS ------------------ */

  const rows =
    view === "pending"
      ? leaves.filter((l) => l.status === "pending")
      : view === "approved"
      ? leaves.filter((l) => l.status === "approved")
      : leaves.filter((l) => l.status === "declined");

  /* ------------------ ACTIONS ------------------ */

  const approveLeave = (leave: LeaveRequest) => {
    const days = calculateDays(leave.from, leave.to);
    const balance = balances[leave.employee] ?? 0;

    if (balance < days) {
      alert("Insufficient leave balance");
      return;
    }

    setLeaves((prev) =>
      prev.map((l) =>
        l.id === leave.id ? { ...l, status: "approved" } : l
      )
    );

    setBalances((prev) => ({
      ...prev,
      [leave.employee]: prev[leave.employee] - days,
    }));
  };

  const openDecline = (leave: LeaveRequest) => {
    setSelectedLeave(leave);
    setDeclineReason("");
    setDeclineOpen(true);
  };

  const confirmDecline = () => {
    if (!selectedLeave) return;

    setLeaves((prev) =>
      prev.map((l) =>
        l.id === selectedLeave.id
          ? { ...l, status: "declined", declineReason }
          : l
      )
    );

    setDeclineOpen(false);
    setSelectedLeave(null);
  };


  return (
    <Layout currentPage="Leave Request">
      <Box sx={{ p: 4 }}>
        <Typography variant="h4" sx={{ mb: 3 }}>
          Leave Management
        </Typography>

        {/* ================== FILTER BUTTONS ================== */}
        <Stack direction="row" spacing={1} sx={{ mb: 3 }}>
          <Button
            variant={view === "pending" ? "contained" : "outlined"}
            onClick={() => setView("pending")}
          >
            Pending
          </Button>
          <Button
            variant={view === "approved" ? "contained" : "outlined"}
            onClick={() => setView("approved")}
          >
            Approved
          </Button>
          <Button
            variant={view === "declined" ? "contained" : "outlined"}
            onClick={() => setView("declined")}
          >
            Declined
          </Button>
        </Stack>

        {/* ================== TABLE ================== */}
        <Paper>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell><b>Employee</b></TableCell>
                <TableCell><b>From</b></TableCell>
                <TableCell><b>To</b></TableCell>
                <TableCell><b>Days</b></TableCell>
                <TableCell><b>Balance Left</b></TableCell>
                <TableCell><b>Status</b></TableCell>
                <TableCell align="right"><b>Actions</b></TableCell>
              </TableRow>
            </TableHead>

            <TableBody>
              {rows.map((leave) => {
                const days = calculateDays(leave.from, leave.to);
                const balance = balances[leave.employee] ?? 0;

                return (
                  <TableRow key={leave.id}>
                    <TableCell>{leave.employee}</TableCell>
                    <TableCell>{leave.from}</TableCell>
                    <TableCell>{leave.to}</TableCell>
                    <TableCell>{days}</TableCell>
                    <TableCell>
                      <Chip
                        size="small"
                        label={`${balance} days`}
                        color={balance <= 3 ? "error" : "default"}
                      />
                    </TableCell>
                    <TableCell>
                      <Chip
                        size="small"
                        label={leave.status}
                        color={
                          leave.status === "approved"
                            ? "success"
                            : leave.status === "pending"
                            ? "warning"
                            : "error"
                        }
                      />
                    </TableCell>
                    <TableCell align="right">
                      {leave.status === "pending" && (
                        <Stack direction="row" spacing={1} justifyContent="flex-end">
                          <Button
                            size="small"
                            variant="contained"
                            onClick={() => approveLeave(leave)}
                          >
                            Approve
                          </Button>
                          <Button
                            size="small"
                            variant="outlined"
                            color="error"
                            onClick={() => openDecline(leave)}
                          >
                            Decline
                          </Button>
                        </Stack>
                      )}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </Paper>

        {/* ================== DECLINE DIALOG ================== */}
        <Dialog open={declineOpen} onClose={() => setDeclineOpen(false)} fullWidth>
          <DialogTitle>Decline Leave</DialogTitle>
          <DialogContent>
            <Typography sx={{ mb: 1 }}>
              Decline leave for <b>{selectedLeave?.employee}</b>
            </Typography>
            <TextField
              label="Reason (optional)"
              fullWidth
              multiline
              minRows={3}
              value={declineReason}
              onChange={(e) => setDeclineReason(e.target.value)}
            />
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setDeclineOpen(false)}>Cancel</Button>
            <Button
              variant="contained"
              color="error"
              onClick={confirmDecline}
            >
              Decline
            </Button>
          </DialogActions>
        </Dialog>
      </Box>
    </Layout>
  );
}
