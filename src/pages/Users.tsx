import React, { memo, useCallback, useEffect, useMemo, useState } from "react";
import Layout from "../components/Layout";
import Paper from "@mui/material/Paper";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import Button from "@mui/material/Button";
import Snackbar from "@mui/material/Snackbar";
import Alert from "@mui/material/Alert";
import CircularProgress from "@mui/material/CircularProgress";
import { DataGrid, GridColDef } from "@mui/x-data-grid";
import { ref, onValue } from "firebase/database";
import { db } from "../api/firebase";
import { Presence, UserProfile } from "../types/types";
import { AddUserDialog } from "../modal/AddUserDialog";

type PresenceMap = Record<string, Presence>;

const columns: GridColDef[] = [
  { field: "name", headerName: "Name", width: 200 },
  { field: "industryNumber", headerName: "IRN", width: 140 },
  { field: "role", headerName: "Role", width: 140 },
  {
    field: "online",
    headerName: "Status",
    width: 120,
    valueGetter: (_, row) => (row.online ? "Online" : "Offline"),
  },
];

const UsersGrid = memo(function UsersGrid({
  rows,
  loading,
}: {
  rows: any[];
  loading: boolean;
}) {
  const paginationModel = useMemo(() => ({ page: 0, pageSize: 10 }), []);

  return (
    <Paper sx={{ height: 600, width: "100%", position: "relative" }}>
      {loading && (
        <Stack
          alignItems="center"
          justifyContent="center"
          sx={{
            position: "absolute",
            inset: 0,
            zIndex: 2,
            bgcolor: "rgba(255,255,255,0.6)",
          }}
        >
          <CircularProgress />
        </Stack>
      )}

      <DataGrid
        rows={rows}
        columns={columns}
        getRowId={(r) => r.uid}
        initialState={{ pagination: { paginationModel } }}
        pageSizeOptions={[10, 25]}
        disableRowSelectionOnClick
        sx={{ border: 0 }}
      />
    </Paper>
  );
});

export default function Users() {
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [presence, setPresence] = useState<PresenceMap>({});
  const [loading, setLoading] = useState(false);
  const [addOpen, setAddOpen] = useState(false);

  const [snack, setSnack] = useState<{
    open: boolean;
    message: string;
    severity: "success" | "error" | "info";
  }>({ open: false, message: "", severity: "success" });

  const notify = useCallback(
    (message: string, severity: "success" | "error" | "info") =>
      setSnack({ open: true, message, severity }),
    []
  );

  useEffect(() => {
    const usersRef = ref(db, "users");

    return onValue(usersRef, (snap) => {
      const data = snap.val() || {};
      setUsers(
        Object.keys(data).map((uid) => ({
          uid,
          ...data[uid],
        }))
      );
    });
  }, []);

  useEffect(() => {
    const presenceRef = ref(db, "presence");

    return onValue(presenceRef, (snap) => {
      setPresence(snap.val() || {});
    });
  }, []);

  const rows = useMemo(
    () =>
      users.map((u) => ({
        ...u,
        online: presence[u.uid]?.online ?? false,
      })),
    [users, presence]
  );

  return (
    <Layout currentPage="Users">
      <div style={{ padding: 32 }}>
        <Stack
          direction="row"
          alignItems="center"
          justifyContent="space-between"
          sx={{ mb: 2 }}
        >
          <Typography variant="h4">Users</Typography>
          <Button variant="contained" onClick={() => setAddOpen(true)}>
            Add User
          </Button>
        </Stack>

        <UsersGrid rows={rows} loading={loading} />

        <AddUserDialog
          open={addOpen}
          onClose={() => setAddOpen(false)}
          notify={notify}
          setGlobalLoading={setLoading}
        />

        <Snackbar
          open={snack.open}
          autoHideDuration={4000}
          onClose={() => setSnack((s) => ({ ...s, open: false }))}
          anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
        >
          <Alert
            severity={snack.severity}
            variant="filled"
            onClose={() => setSnack((s) => ({ ...s, open: false }))}
          >
            {snack.message}
          </Alert>
        </Snackbar>
      </div>
    </Layout>
  );
}
