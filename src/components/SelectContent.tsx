import * as React from "react";
import MuiAvatar from "@mui/material/Avatar";
import MuiListItemAvatar from "@mui/material/ListItemAvatar";
import MenuItem from "@mui/material/MenuItem";
import ListItemText from "@mui/material/ListItemText";
import ListItemIcon from "@mui/material/ListItemIcon";
import ListSubheader from "@mui/material/ListSubheader";
import Select, { SelectChangeEvent, selectClasses } from "@mui/material/Select";
import Divider from "@mui/material/Divider";
import { styled } from "@mui/material/styles";
import AddRoundedIcon from "@mui/icons-material/AddRounded";
import DevicesRoundedIcon from "@mui/icons-material/DevicesRounded";

import { ref, onValue } from "firebase/database";
import { db } from "../api/firebase";
import { getCompanyId } from "../auth/authCompany";

/* ================= STYLED ================= */

const Avatar = styled(MuiAvatar)(({ theme }) => ({
  width: 28,
  height: 28,
  backgroundColor: (theme.vars || theme).palette.background.paper,
  color: (theme.vars || theme).palette.text.secondary,
  border: `1px solid ${(theme.vars || theme).palette.divider}`,
}));

const ListItemAvatar = styled(MuiListItemAvatar)({
  minWidth: 0,
  marginRight: 12,
});

/* ================= COMPONENT ================= */

export default function SelectContent() {
  const [company, setCompany] = React.useState("company");
  const [companyInfo, setCompanyInfo] = React.useState<{
    name: string;
    country: string;
    currency: string;
    createdAt: number;
  } | null>(null);

  const handleChange = (event: SelectChangeEvent) => {
    setCompany(event.target.value);
  };

  /* ================= LOAD COMPANY INFO ================= */

  React.useEffect(() => {
    let unsubscribe: (() => void) | undefined;

    getCompanyId().then((companyId) => {
      const infoRef = ref(db, `companies/${companyId}/info`);

      unsubscribe = onValue(infoRef, (snap) => {
        if (snap.exists()) {
          setCompanyInfo(snap.val());
        }
      });
    });

    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, []);

  /* ================= UI ================= */

  return (
    <Select
      labelId="company-select"
      id="company-select"
      value={company}
      onChange={handleChange}
      displayEmpty
      inputProps={{ "aria-label": "Select company" }}
      fullWidth
      sx={{
        maxHeight: 56,
        width: 240,
        "&.MuiList-root": {
          p: "8px",
        },
        [`& .${selectClasses.select}`]: {
          display: "flex",
          alignItems: "center",
          gap: "6px",
          pl: 1,
        },
      }}
    >
      <ListSubheader sx={{ pt: 0 }}>Company</ListSubheader>
      {companyInfo && (
        <MenuItem value="company">
          <ListItemAvatar>
            <Avatar>
              <DevicesRoundedIcon sx={{ fontSize: "1rem" }} />
            </Avatar>
          </ListItemAvatar>

          <ListItemText
            primary={companyInfo.name}
          />
        </MenuItem>
      )}
    </Select>
  );
}
