import { useEffect, useState } from "react";
import Dialog from "@mui/material/Dialog";
import DialogTitle from "@mui/material/DialogTitle";
import DialogContent from "@mui/material/DialogContent";
import DialogActions from "@mui/material/DialogActions";
import Button from "@mui/material/Button";
import Checkbox from "@mui/material/Checkbox";
import FormGroup from "@mui/material/FormGroup";
import FormControlLabel from "@mui/material/FormControlLabel";
import { UserPermissions } from "../../types/types";

export function PermissionsDialog({
  open,
  user,
  onClose,
  onSave,
}: {
  open: boolean;
  user: any;
  onClose: () => void;
  onSave: (permissions: UserPermissions) => void;
}) {
  const [permissions, setPermissions] = useState<UserPermissions>({
    requestLeave: false,
    clockInOut: false,
    enrollmentFinger: false,
  });

  useEffect(() => {
    if (user?.permissions) {
      setPermissions(user.permissions);
    }
  }, [user]);

  const toggle = (key: keyof UserPermissions) => {
    setPermissions((p) => ({ ...p, [key]: !p[key] }));
  };

  return (
    <Dialog open={open} onClose={onClose} fullWidth>
      <DialogTitle>
        Permissions — {user?.name}
      </DialogTitle>

      <DialogContent>
        <FormGroup>
          <FormControlLabel
            control={
              <Checkbox
                checked={permissions.requestLeave}
                onChange={() => toggle("requestLeave")}
              />
            }
            label="Request Leave"
          />

          <FormControlLabel
            control={
              <Checkbox
                checked={permissions.clockInOut}
                onChange={() => toggle("clockInOut")}
              />
            }
            label="Clock In / Out"
          />

          <FormControlLabel
            control={
              <Checkbox
                checked={permissions.enrollmentFinger}
                onChange={() => toggle("enrollmentFinger")}
              />
            }
            label="Fingerprint Enrollment"
          />
        </FormGroup>
      </DialogContent>

      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button
          variant="contained"
          onClick={() => onSave(permissions)}
        >
          Save
        </Button>
      </DialogActions>
    </Dialog>
  );
}
