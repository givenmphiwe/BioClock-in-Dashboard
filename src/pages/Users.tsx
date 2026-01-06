import { useCallback, useEffect, useMemo, useState } from "react";
import Layout from "../components/Layout";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import Button from "@mui/material/Button";
import Snackbar from "@mui/material/Snackbar";
import Alert from "@mui/material/Alert";
import { ref, onValue, update } from "firebase/database";
import { db } from "../api/firebase";
import { UsersGrid } from "../components/users/UsersGrid";
import { PermissionsDialog } from "../components/users/PermissionsDialog";
import { UserPermissions } from "../types/types";

type PresenceMap = Record<string, { online: boolean }>;

export default function Users() {
  const [users, setUsers] = useState<any[]>([]);
  const [presence, setPresence] = useState<PresenceMap>({});
  const [loading, setLoading] = useState(false);
  const [permUser, setPermUser] = useState<any | null>(null);

  const [snack, setSnack] = useState({
    open: false,
    message: "",
    severity: "success" as "success" | "error" | "info",
  });

  const notify = useCallback(
    (message: string, severity: "success" | "error" | "info") =>
      setSnack({ open: true, message, severity }),
    []
  );

  useEffect(() => {
    return onValue(ref(db, "users"), (snap) => {
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
    return onValue(ref(db, "presence"), (snap) => {
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

  const savePermissions = async (permissions: UserPermissions) => {
    if (!permUser) return;

    await update(ref(db, `users/${permUser.uid}`), {
      permissions,
    });

    notify("Permissions updated", "success");
    setPermUser(null);
  };

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
          <Button variant="contained">Add User</Button>
        </Stack>

        <UsersGrid
          rows={rows}
          loading={loading}
          onPermissions={(u) => setPermUser(u)}
        />

        <PermissionsDialog
          open={!!permUser}
          user={permUser}
          onClose={() => setPermUser(null)}
          onSave={savePermissions}
        />

        <Snackbar
          open={snack.open}
          autoHideDuration={4000}
          onClose={() =>
            setSnack((s) => ({ ...s, open: false }))
          }
        >
          <Alert
            severity={snack.severity}
            variant="filled"
            onClose={() =>
              setSnack((s) => ({ ...s, open: false }))
            }
          >
            {snack.message}
          </Alert>
        </Snackbar>
      </div>
    </Layout>
  );
}
