import Select, { SelectChangeEvent } from "@mui/material/Select";
import React, { memo, useCallback, useState } from "react";
import MenuItem from "@mui/material/MenuItem";
import InputLabel from "@mui/material/InputLabel";
import FormControl from "@mui/material/FormControl";
import Dialog from "@mui/material/Dialog";
import DialogTitle from "@mui/material/DialogTitle";
import DialogContent from "@mui/material/DialogContent";
import DialogActions from "@mui/material/DialogActions";
import TextField from "@mui/material/TextField";
import { Employee } from "../types/employee";
import Stack from "@mui/material/Stack";
import Button from "@mui/material/Button";
import Typography from "@mui/material/Typography";
import { createEmployeeApi } from "../api/employees";

type NewEmp = Omit<Employee, "id">;

const defaultNewEmp: NewEmp = {
  firstName: "",
  lastName: "",
  industryNumber: "",
  idNumber: "",
  email: "",
  phone: "",
  occupationId: "",
  occupationName: "",
  gangUnitId: "",
  gangUnitName: "",
  employmentType: "permanent",
  status: "active",
  isEnrolled: false,
  age: null,
  dateOfBirth: "",
  hireDate: "",
};

export const AddEmployeeDialog = memo(function AddEmployeeDialog({
  open,
  onClose,
  onSaved,
  setGlobalLoading,
  notify,
}: {
  open: boolean;
  onClose: () => void;
  onSaved: (emp: Employee) => void;
  setGlobalLoading: (v: boolean) => void;
  notify: (message: string, severity: "success" | "error" | "info") => void;
}) {
  // Localize dialog state so typing does NOT re-render the grid
  const [newEmp, setNewEmp] = useState<NewEmp>(defaultNewEmp);

  type InputEvt = React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>;
  type AnyEvt = InputEvt | SelectChangeEvent<string>;

  const handleField = (key: keyof NewEmp) => (e: AnyEvt) =>
    setNewEmp((s) => ({ ...s, [key]: e.target.value }));

  const handleSave = useCallback(async () => {
    if (
      !newEmp.firstName?.trim() ||
      !newEmp.lastName?.trim() ||
      !newEmp.industryNumber?.trim()
    ) {
      notify("IRN, First and Last name are required", "error");
      return;
    }
    setGlobalLoading(true);
    try {
      const created = await createEmployeeApi(newEmp);
      onSaved({ ...created, id: created.id ?? `new_${Date.now()}` });
      notify("Employee added", "success");
      setNewEmp(defaultNewEmp);
      onClose();
    } catch (err: any) {
      console.error(err);
      notify(err?.message || "Create failed", "error");
    } finally {
      setGlobalLoading(false);
    }
  }, [newEmp, notify, onClose, onSaved, setGlobalLoading]);

  function parseDobFromSouthAfricaId(id: string): string | null {
    const digits = id.replace(/\D/g, "");
    if (digits.length < 6) return null;

    const yy = Number(digits.slice(0, 2));
    const mm = Number(digits.slice(2, 4));
    const dd = Number(digits.slice(4, 6));

    if (mm < 1 || mm > 12) return null;
    if (dd < 1 || dd > 31) return null; 

    const now = new Date();
    const currentYY = now.getFullYear() % 100;

    const yearFull = (yy <= currentYY ? 2000 : 1900) + yy;

    const d = new Date(yearFull, mm - 1, dd);
    if (
      d.getFullYear() !== yearFull ||
      d.getMonth() !== mm - 1 ||
      d.getDate() !== dd
    )
      return null;

    // Return YYYY-MM-DD
    const monthStr = String(mm).padStart(2, "0");
    const dayStr = String(dd).padStart(2, "0");
    return `${yearFull}-${monthStr}-${dayStr}`;
  }

  function calcAgeFromDob(dobIso: string): number | null {
    const [y, m, d] = dobIso.split("-").map(Number);
    if (!y || !m || !d) return null;
    const today = new Date();
    let age = today.getFullYear() - y;
    const mDiff = today.getMonth() + 1 - m;
    const dDiff = today.getDate() - d;
    if (mDiff < 0 || (mDiff === 0 && dDiff < 0)) age--;
    return age;
  }

  const handleIdNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setNewEmp((s) => {
      const next = { ...s, idNumber: value };
      const dob = parseDobFromSouthAfricaId(value);
      if (dob) {
        next.dateOfBirth = dob;
        next.age = calcAgeFromDob(dob); 
      }
      return next;
    });
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth keepMounted>
      <DialogTitle>Add Employee</DialogTitle>
      <DialogContent>
        <Stack spacing={2} sx={{ mt: 1 }}>
          {/* Identity */}
          <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
            <TextField
              label="IRN"
              required
              value={newEmp.industryNumber}
              onChange={handleField("industryNumber")}
            />
            <TextField
              label="National ID / Passport"
              value={newEmp.idNumber}
              required
              onChange={handleIdNumberChange}
            />
          </Stack>
          <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
            <TextField
              label="First name"
              required
              value={newEmp.firstName}
              onChange={handleField("firstName")}
            />
            <TextField
              label="Last name"
              required
              value={newEmp.lastName}
              onChange={handleField("lastName")}
            />
          </Stack>

          {/* Contact */}
          <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
            <TextField
              label="Phone"
              value={newEmp.phone}
              onChange={handleField("phone")}
            />
            <TextField
              label="Email"
              type="email"
              value={newEmp.email}
              onChange={handleField("email")}
            />
          </Stack>

          {/* Org placement */}
          <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
            <TextField
              label="Occupation (name)"
              value={newEmp.occupationName}
              onChange={handleField("occupationName")}
            />
            <TextField
              label="Occupation ID"
              value={newEmp.occupationId}
              onChange={handleField("occupationId")}
            />
          </Stack>
          <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
            <TextField
              label="Gang / Unit (name)"
              value={newEmp.gangUnitName}
              onChange={handleField("gangUnitName")}
            />
            <TextField
              label="Gang / Unit ID"
              value={newEmp.gangUnitId}
              onChange={handleField("gangUnitId")}
            />
          </Stack>

          {/* HR */}
          <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
            <FormControl fullWidth>
              <InputLabel id="employment-type-label">
                Employment Type
              </InputLabel>
              <Select
                labelId="employment-type-label"
                label="Employment Type"
                value={newEmp.employmentType ?? "permanent"}
                onChange={handleField("employmentType")}
              >
                <MenuItem value="permanent">Permanent</MenuItem>
                <MenuItem value="contract">Contract</MenuItem>
                <MenuItem value="temporary">Temporary</MenuItem>
                <MenuItem value="casual">Casual</MenuItem>
              </Select>
            </FormControl>
            <FormControl fullWidth>
              <InputLabel id="status-label">Status</InputLabel>
              <Select
                labelId="status-label"
                label="Status"
                value={newEmp.status ?? "active"}
                onChange={handleField("status")}
              >
                <MenuItem value="active">Active</MenuItem>
                <MenuItem value="inactive">Inactive</MenuItem>
                <MenuItem value="terminated">Terminated</MenuItem>
              </Select>
            </FormControl>
          </Stack>

          {/* Dates & Age */}
          <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
            <TextField
              label="Age"
              type="number"
              value={newEmp.age ?? ""}
              onChange={(e) => {
                const v = e.target.value;
                setNewEmp((s) => ({ ...s, age: v === "" ? null : Number(v) }));
              }}
            />
            <TextField
              label="Date of Birth"
              type="date"
              InputLabelProps={{ shrink: true }}
              value={newEmp.dateOfBirth ?? ""}
              onChange={handleField("dateOfBirth")}
            />
            <TextField
              label="Hire Date"
              type="date"
              InputLabelProps={{ shrink: true }}
              value={newEmp.hireDate ?? ""}
              onChange={handleField("hireDate")}
            />
          </Stack>

          <Typography variant="body2" color="text.secondary">
            On save, this employee will be created and added to the Data.
          </Typography>
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button variant="contained" onClick={handleSave}>
          Save
        </Button>
      </DialogActions>
    </Dialog>
  );
});
