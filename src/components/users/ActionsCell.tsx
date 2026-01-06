import { useState } from "react";
import IconButton from "@mui/material/IconButton";
import Menu from "@mui/material/Menu";
import MenuItem from "@mui/material/MenuItem";
import MoreVertIcon from "@mui/icons-material/MoreVert";

export function ActionsCell({
  row,
  onPermissions,
}: {
  row: any;
  onPermissions: (user: any) => void;
}) {
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);

  return (
    <>
      <IconButton onClick={(e) => setAnchorEl(e.currentTarget)}>
        <MoreVertIcon />
      </IconButton>

      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={() => setAnchorEl(null)}
      >
        <MenuItem
          onClick={() => {
            setAnchorEl(null);
            onPermissions(row);
          }}
        >
          Permissions
        </MenuItem>

        {/* <MenuItem disabled>Other Action</MenuItem>
        <MenuItem disabled>Remove User</MenuItem> */}
      </Menu>
    </>
  );
}
