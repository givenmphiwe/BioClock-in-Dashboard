import { useEffect, useState, useCallback } from "react";
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

import { ref, onValue, update } from "firebase/database";
import { db } from "../api/firebase";
import { getCompanyId } from "../auth/authCompany";

/* ================= TYPES ================= */

type LeaveStatus = "pending" | "approved" | "declined";

type LeaveRequest = {
  id: string;
  employeeId: string;
  employee: string;
  from: string;
  to: string;
  reason: string;
  status: LeaveStatus;
  declineReason?: string;
};

type LeaveBalance = {
  [employeeId: string]: number;
};

/* ================= HELPERS ================= */

const calculateDays = (from: string, to: string) => {
  const start = new Date(from);
  const end = new Date(to);
  return (end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24) + 1;
};

/* ================= PAGE ================= */

export default function LeaveRequestPage() {
  const [companyId, setCompanyId] = useState<string | null>(null);
  const [leaves, setLeaves] = useState<LeaveRequest[]>([]);
  const [balances, setBalances] = useState<LeaveBalance>({});
  const [view, setView] = useState<LeaveStatus>("pending");

  const [declineOpen, setDeclineOpen] = useState(false);
  const [selectedLeave, setSelectedLeave] = useState<LeaveRequest | null>(null);
  const [declineReason, setDeclineReason] = useState("");

  /* ================= COMPANY CONTEXT ================= */

  const notify = useCallback((msg: string) => {
    console.error(msg);
  }, []);

  useEffect(() => {
    getCompanyId()
      .then(setCompanyId)
      .catch(() => notify("User not linked to a company"));
  }, [notify]);

  /* ================= FIREBASE LOAD ================= */

  useEffect(() => {
    if (!companyId) return;

    const companyRef = ref(db, `companies/${companyId}`);

    return onValue(companyRef, (snap) => {
      const data = snap.val();
      if (!data) return;

      const employees = data.employees || {};
      const leaveRequests = data.leaveRequests || {};
      const leaveBalances = data.leaveBalances || {};

      const mappedLeaves: LeaveRequest[] = [];

      Object.entries(leaveRequests).forEach(([employeeId, requests]: any) => {
        Object.entries(requests).forEach(([leaveId, leave]: any) => {
          mappedLeaves.push({
            id: leaveId,
            employeeId,
            employee: `${employees[employeeId]?.firstName ?? ""} ${
              employees[employeeId]?.lastName ?? ""
            }`,
            from: leave.from.replaceAll("/", "-"),
            to: leave.to.replaceAll("/", "-"),
            reason: leave.reason || "",
            status: leave.status,
            declineReason: leave.declineReason || "",
          });
        });
      });

      setLeaves(mappedLeaves);
      setBalances(leaveBalances);
    });
  }, [companyId]);

  /* ================= FILTER ================= */

  const rows = leaves.filter((l) => l.status === view);

  /* ================= ACTIONS ================= */

  const approveLeave = async (leave: LeaveRequest) => {
    if (!companyId) return;

    const days = calculateDays(leave.from, leave.to);
    const balance = balances[leave.employeeId] ?? 0;

    if (balance < days) {
      alert("Insufficient leave balance");
      return;
    }

    await update(ref(db), {
      [`companies/${companyId}/leaveRequests/${leave.employeeId}/${leave.id}/status`]:
        "approved",
      [`companies/${companyId}/leaveBalances/${leave.employeeId}`]:
        balance - days,
    });
  };

  const openDecline = (leave: LeaveRequest) => {
    setSelectedLeave(leave);
    setDeclineReason("");
    setDeclineOpen(true);
  };

  const confirmDecline = async () => {
    if (!selectedLeave || !companyId) return;

    await update(ref(db), {
      [`companies/${companyId}/leaveRequests/${selectedLeave.employeeId}/${selectedLeave.id}/status`]:
        "declined",
      [`companies/${companyId}/leaveRequests/${selectedLeave.employeeId}/${selectedLeave.id}/declineReason`]:
        declineReason,
    });

    setDeclineOpen(false);
    setSelectedLeave(null);
  };

  /* ================= UI ================= */

  return (
    <Layout currentPage="Leave Request">
      <Box sx={{ p: 4 }}>
        <Typography variant="h4" sx={{ mb: 3 }}>
          Leave Management
        </Typography>

        {/* FILTERS */}
        <Stack direction="row" spacing={1} sx={{ mb: 3 }}>
          {(["pending", "approved", "declined"] as LeaveStatus[]).map(
            (status) => (
              <Button
                key={status}
                variant={view === status ? "contained" : "outlined"}
                onClick={() => setView(status)}
              >
                {status.charAt(0).toUpperCase() + status.slice(1)}
              </Button>
            )
          )}
        </Stack>

        {/* TABLE */}
        <Paper>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>
                  <b>Employee</b>
                </TableCell>
                <TableCell>
                  <b>From</b>
                </TableCell>
                <TableCell>
                  <b>To</b>
                </TableCell>
                <TableCell>
                  <b>Days</b>
                </TableCell>
                <TableCell>
                  <b>Balance Left</b>
                </TableCell>
                <TableCell>
                  <b>Status</b>
                </TableCell>
                {view === "pending" && (
                  <TableCell align="right">
                    <b>Actions</b>
                  </TableCell>
                )}
              </TableRow>
            </TableHead>

            <TableBody>
              {rows.map((leave) => {
                const days = calculateDays(leave.from, leave.to);
                const balance = balances[leave.employeeId] ?? 0;

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
                    <Stack spacing={0.5}>
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

                      {/* PENDING → employee reason */}
                      {leave.status === "pending" && leave.reason && (
                        <Typography
                          variant="caption"
                          color="text.secondary"
                          sx={{ fontStyle: "italic" }}
                        >
                          Requested: {leave.reason}
                        </Typography>
                      )}

                      {/* DECLINED → manager reason */}
                      {leave.status === "declined" && leave.declineReason && (
                        <Typography
                          variant="caption"
                          color="text.secondary"
                          sx={{ fontStyle: "italic" }}
                        >
                          Declined: {leave.declineReason}
                        </Typography>
                      )}
                    </Stack>

                    {leave.status === "pending" && (
                      <TableCell align="right">
                        <Stack
                          direction="row"
                          spacing={1}
                          justifyContent="flex-end"
                        >
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
                      </TableCell>
                    )}
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </Paper>

        {/* DECLINE DIALOG */}
        <Dialog
          open={declineOpen}
          onClose={() => setDeclineOpen(false)}
          fullWidth
        >
          <DialogTitle>Decline Leave</DialogTitle>
          <DialogContent>
            <Typography sx={{ mb: 1 }}>
              Decline leave for <b>{selectedLeave?.employee}</b>
            </Typography>
            <TextField
              label="Reason (optional)"
              fullWidth
              value={declineReason}
              onChange={(e) => setDeclineReason(e.target.value)}
            />
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setDeclineOpen(false)}>Cancel</Button>
            <Button variant="contained" color="error" onClick={confirmDecline}>
              Decline
            </Button>
          </DialogActions>
        </Dialog>
      </Box>
    </Layout>
  );
}
