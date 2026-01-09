import React, { useState } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
  MenuItem,
  Stack,
} from "@mui/material";
import { createUserWithEmailAndPassword } from "firebase/auth";
import { ref, set } from "firebase/database";
import { auth, db } from "../api/firebase";
import Autocomplete from "@mui/material/Autocomplete";

export function AddUserDialog({
  open,
  onClose,
  notify,
  setGlobalLoading,
}: {
  open: boolean;
  onClose: () => void;
  notify: (msg: string, severity: "success" | "error" | "info") => void;
  setGlobalLoading: (v: boolean) => void;
}) {
  const [name, setName] = useState("");
  const [industryNumber, setIndustryNumber] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState("employee");

  const save = async () => {
    setGlobalLoading(true);
    try {
      const cred = await createUserWithEmailAndPassword(auth, email, password);
      const uid = cred.user.uid;

      await set(ref(db, `users/${uid}`), {
        name,
        industryNumber,
        email,
        role,
        createdAt: Date.now(),
      });

      await set(ref(db, `presence/${uid}`), {
        online: false,
        lastSeen: Date.now(),
      });

      notify("User created", "success");
      onClose();
      setName("");
      setIndustryNumber("");
      setEmail("");
      setPassword("");
      setRole("employee");
    } catch (e: any) {
      notify(e.message || "Failed to create user", "error");
    } finally {
      setGlobalLoading(false);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm">
      <DialogTitle>Add User</DialogTitle>
      <DialogContent>
        <Stack spacing={2} sx={{ mt: 1 }}>
          <TextField
            label="Full name"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
          <TextField
            label="Industry Number"
            value={industryNumber}
            onChange={(e) => setIndustryNumber(e.target.value)}
          />
          <TextField
            label="Email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
          <TextField
            label="Temporary Password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />

          <Autocomplete
            freeSolo
            options={["employee", "supervisor", "admin"]}
            value={role}
            onChange={(_, newValue) => {
              if (newValue) setRole(newValue);
            }}
            onInputChange={(_, newInputValue) => {
              setRole(newInputValue);
            }}
            renderInput={(params) => <TextField {...params} label="Role" />}
          />
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button variant="contained" onClick={save}>
          Create
        </Button>
      </DialogActions>
    </Dialog>
  );
}
