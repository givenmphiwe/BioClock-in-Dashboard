import Dialog from "@mui/material/Dialog";
import DialogTitle from "@mui/material/DialogTitle";
import DialogContent from "@mui/material/DialogContent";
import DialogActions from "@mui/material/DialogActions";
import Button from "@mui/material/Button";

export function RemoveUserDialog({
  open,
  user,
  onClose,
  onConfirm,
}: {
  open: boolean;
  user: any;
  onClose: () => void;
  onConfirm: (user: any) => void;
}) {
  return (
    <Dialog open={open} onClose={onClose}>
      <DialogTitle>Remove User</DialogTitle>

      <DialogContent>
        Are you sure you want to remove <b>{user?.name}</b>?
        <br />
        This action cannot be undone.
      </DialogContent>

      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button
          color="error"
          variant="contained"
          onClick={() => onConfirm(user)}
        >
          Remove
        </Button>
      </DialogActions>
      
    </Dialog>
  );
}
