import { useCallback, useEffect, useMemo, useState } from "react";
import Layout from "../components/Layout";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import Button from "@mui/material/Button";
import Snackbar from "@mui/material/Snackbar";
import Alert from "@mui/material/Alert";
import { ref, onValue, update, remove } from "firebase/database";
import { db } from "../api/firebase";
import { getCompanyId } from "../auth/authCompany";
import { UsersGrid } from "../components/users/UsersGrid";
import { AddUserDialog } from "../modal/AddUserDialog";
import { PermissionsDialog } from "../components/users/PermissionsDialog";
import { RemoveUserDialog } from "../components/users/RemoveUserDialog";
import { UserPermissions } from "../types/types";

type PresenceMap = Record<string, { online: boolean }>;

export default function Users() {
  const [companyId, setCompanyId] = useState<string | null>(null);
  const [users, setUsers] = useState<any[]>([]);
  const [presence, setPresence] = useState<PresenceMap>({});
  const [addOpen, setAddOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [permUser, setPermUser] = useState<any | null>(null);
  const [removeUser, setRemoveUser] = useState<any | null>(null);

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

  /* ----------------------------------
     Resolve companyId once
  ---------------------------------- */
  useEffect(() => {
    getCompanyId()
      .then(setCompanyId)
      .catch((err) => {
        console.error(err);
        notify("User not linked to a company", "error");
      });
  }, [notify]);

  /* ----------------------------------
     Subscribe to company users
  ---------------------------------- */
  useEffect(() => {
    if (!companyId) return;

    return onValue(
      ref(db, `companies/${companyId}/users`),
      (snap) => {
        const data = snap.val() || {};
        setUsers(
          Object.keys(data).map((uid) => ({
            uid,
            ...data[uid],
          }))
        );
      }
    );
  }, [companyId]);

  /* ----------------------------------
     Subscribe to company presence
  ---------------------------------- */
  useEffect(() => {
    if (!companyId) return;

    return onValue(
      ref(db, `companies/${companyId}/presence`),
      (snap) => {
        setPresence(snap.val() || {});
      }
    );
  }, [companyId]);

  const rows = useMemo(
    () =>
      users.map((u) => ({
        ...u,
        online: presence[u.uid]?.online ?? false,
        onPermissions: () => setPermUser(u),
        onRemove: () => setRemoveUser(u),
      })),
    [users, presence]
  );

  /* ----------------------------------
     Save permissions
  ---------------------------------- */
  const savePermissions = async (permissions: UserPermissions) => {
    if (!permUser || !companyId) return;

    await update(
      ref(db, `companies/${companyId}/users/${permUser.uid}`),
      { permissions }
    );

    notify("Permissions updated", "success");
    setPermUser(null);
  };

  /* ----------------------------------
     Remove user
  ---------------------------------- */
  const confirmRemoveUser = async (user: any) => {
    if (!companyId) return;

    await remove(
      ref(db, `companies/${companyId}/users/${user.uid}`)
    );

    await remove(ref(db, `userCompanies/${user.uid}`));

    notify("User removed", "success");
    setRemoveUser(null);
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
          <Button
            variant="contained"
            onClick={() => setAddOpen(true)}
            disabled={!companyId}
          >
            Add User
          </Button>
        </Stack>

        <UsersGrid rows={rows} loading={loading} onPermissions={function (user: any): void {
          throw new Error("Function not implemented.");
        } } />

        <PermissionsDialog
          open={!!permUser}
          user={permUser}
          onClose={() => setPermUser(null)}
          onSave={savePermissions}
        />

        <RemoveUserDialog
          open={!!removeUser}
          user={removeUser}
          onClose={() => setRemoveUser(null)}
          onConfirm={confirmRemoveUser}
        />

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
