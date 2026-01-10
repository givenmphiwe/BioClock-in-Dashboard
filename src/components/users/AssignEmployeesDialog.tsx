import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  List,
  ListItem,
  ListItemText,
  Checkbox,
  CircularProgress,
  Box,
  Typography,
  ListItemButton,
  TextField,
  MenuItem,
  Stack,
} from "@mui/material";
import { get, ref, update } from "firebase/database";
import { useEffect, useMemo, useState } from "react";
import { db } from "../../api/firebase";
import Snackbar from "@mui/material/Snackbar";
import Alert from "@mui/material/Alert";

interface Props {
  open: boolean;
  onClose: () => void;
  user: any;
  companyId: string | null;
}

export function AssignEmployeesDialog({
  open,
  onClose,
  user,
  companyId,
}: Props) {
  const [employees, setEmployees] = useState<any[]>([]);
  const [selected, setSelected] = useState<Record<string, boolean>>({});
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [occupation, setOccupation] = useState("");
  const [successOpen, setSuccessOpen] = useState(false);

  /* ----------------------------------
     Load employees + existing assignments
  ---------------------------------- */
  useEffect(() => {
    if (!open || !companyId || !user) return;

    setLoading(true);

    const load = async () => {
      const [empSnap, assignSnap] = await Promise.all([
        get(ref(db, `companies/${companyId}/employees`)),
        get(ref(db, `companies/${companyId}/userEmployees/${user.uid}`)),
      ]);

      const empData = empSnap.val() || {};
      const assignData = assignSnap.val() || {};

      setEmployees(
        Object.keys(empData).map((id) => ({
          id,
          ...empData[id],
        }))
      );

      setSelected(assignData);
      setLoading(false);
    };

    load();
  }, [open, companyId, user]);

  /* ----------------------------------
     Occupation list
  ---------------------------------- */
  const occupations = useMemo(() => {
    return [...new Set(employees.map((e) => e.occupationName).filter(Boolean))];
  }, [employees]);

  /* ----------------------------------
     Filtered employees
  ---------------------------------- */
  const filteredEmployees = useMemo(() => {
    return employees.filter((e) => {
      const text =
        `${e.firstName} ${e.lastName} ${e.industryNumber}`.toLowerCase();
      const matchesSearch = text.includes(search.toLowerCase());
      const matchesOcc = occupation ? e.occupationName === occupation : true;
      return matchesSearch && matchesOcc;
    });
  }, [employees, search, occupation]);

  /* ----------------------------------
     Toggle employee
  ---------------------------------- */
  const toggle = (empId: string) => {
    setSelected((s) => ({
      ...s,
      [empId]: !s[empId],
    }));
  };

  /* ----------------------------------
     Save assignments
  ---------------------------------- */
  const save = async () => {
    if (!companyId || !user) return;

    await update(
      ref(db, `companies/${companyId}/userEmployees/${user.uid}`),
      selected
    );

    setSuccessOpen(true);

    setTimeout(() => {
      onClose();
    }, 800);
  };

  const downloadCSV = () => {
    const assigned = employees.filter((e) => selected[e.id]);

    if (assigned.length === 0) return;

    const header = ["First Name", "Last Name", "Industry Number", "Occupation"];
    const rows = assigned.map((e) => [
      e.firstName,
      e.lastName,
      e.industryNumber,
      e.occupationName,
    ]);

    const csv = [header, ...rows]
      .map((r) => r.map((v) => `"${v || ""}"`).join(","))
      .join("\n");

    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);

    const a = document.createElement("a");
    a.href = url;
    a.download = `${user?.name || "user"}_assigned_employees.csv`;
    a.click();

    URL.revokeObjectURL(url);
  };

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="md">
      <DialogTitle>
        Assign Employees
        <Typography variant="body2" color="text.secondary">
          {user?.name || user?.email}
        </Typography>
      </DialogTitle>

      <DialogContent dividers>
        {/* Filters */}
        <Stack direction="row" spacing={2} sx={{ mb: 2 }}>
          <TextField
            label="Search"
            placeholder="Name or Industry Number"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            fullWidth
          />

          <TextField
            select
            label="Occupation"
            value={occupation}
            onChange={(e) => setOccupation(e.target.value)}
            sx={{ minWidth: 200 }}
          >
            <MenuItem value="">All</MenuItem>
            {occupations.map((o) => (
              <MenuItem key={o} value={o}>
                {o}
              </MenuItem>
            ))}
          </TextField>
        </Stack>

        {/* List */}
        {loading ? (
          <Box sx={{ py: 6, display: "flex", justifyContent: "center" }}>
            <CircularProgress />
          </Box>
        ) : filteredEmployees.length === 0 ? (
          <Typography color="text.secondary" align="center">
            No matching employees
          </Typography>
        ) : (
          <List sx={{ p: 0 }}>
            {filteredEmployees.map((e) => {
              const isSelected = !!selected[e.id];

              return (
                <ListItem key={e.id} disablePadding sx={{ mb: 1 }}>
                  <ListItemButton
                    onClick={() => toggle(e.id)}
                    sx={{
                      borderRadius: 2,
                      px: 2,
                      py: 1.5,

                      backgroundColor: isSelected
                        ? "action.selected"
                        : "background.paper",

                      border: "1px solid",
                      borderColor: isSelected ? "primary.main" : "divider",

                      boxShadow: isSelected
                        ? "0 4px 10px rgba(0,0,0,0.15)"
                        : "0 1px 2px rgba(0,0,0,0.05)",

                      transition: "all 0.15s ease",

                      "&:hover": {
                        backgroundColor: isSelected
                          ? "action.selected"
                          : "action.hover",
                      },
                    }}
                  >
                    <Checkbox
                      checked={isSelected}
                      sx={{
                        mr: 2,
                        color: "text.secondary",
                        "&.Mui-checked": {
                          color: "primary.main",
                        },
                      }}
                    />

                    <Box sx={{ flex: 1 }}>
                      <Typography
                        fontWeight={isSelected ? 600 : 500}
                        color="text.primary"
                      >
                        {e.firstName} {e.lastName}
                      </Typography>

                      <Typography variant="body2" color="text.secondary">
                        {e.industryNumber} • {e.occupationName}
                      </Typography>
                    </Box>

                    {isSelected && (
                      <Typography
                        sx={{
                          fontSize: 12,
                          color: "primary.main",
                          fontWeight: 600,
                        }}
                      >
                        SELECTED
                      </Typography>
                    )}
                  </ListItemButton>
                </ListItem>
              );
            })}
          </List>
        )}
      </DialogContent>

      <DialogActions sx={{ justifyContent: "space-between" }}>
        <Button
          onClick={downloadCSV}
          disabled={
            Object.keys(selected).filter((k) => selected[k]).length === 0
          }
        >
          Download CSV
        </Button>

        <Box>
          <Button onClick={onClose}>Cancel</Button>
          <Button variant="contained" onClick={save}>
            Save Assignments
          </Button>
        </Box>
      </DialogActions>

      <Snackbar
        open={successOpen}
        autoHideDuration={3000}
        onClose={() => setSuccessOpen(false)}
        anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
      >
        <Alert
          severity="success"
          variant="filled"
          onClose={() => setSuccessOpen(false)}
        >
          Employees assigned successfully
        </Alert>
      </Snackbar>
    </Dialog>
  );
}
