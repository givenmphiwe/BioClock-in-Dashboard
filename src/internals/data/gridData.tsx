import Avatar from "@mui/material/Avatar";
import Chip from "@mui/material/Chip";
import { GridCellParams, GridRowsProp, GridColDef } from "@mui/x-data-grid";
import { SparkLineChart } from "@mui/x-charts/SparkLineChart";
import { ref, onValue } from "firebase/database";
import dayjs from "dayjs";
import React from "react";
import { db } from "../../api/firebase";
import { getCompanyId } from "../../auth/authCompany";
import relativeTime from "dayjs/plugin/relativeTime";

dayjs.extend(relativeTime);

/* ---------------- HELPERS ---------------- */

type SparkLineData = number[];

function getDaysInMonth(month: number, year: number) {
  const date = new Date(year, month, 0);
  const monthName = date.toLocaleDateString("en-US", { month: "short" });
  const daysInMonth = date.getDate();
  const days = [];
  for (let i = 1; i <= daysInMonth; i++) days.push(`${monthName} ${i}`);
  return days;
}

function renderSparklineCell(params: GridCellParams<SparkLineData, any>) {
  const now = dayjs();
  const labels = getDaysInMonth(now.month() + 1, now.year());
  if (!params.value) return null;

  return (
    <SparkLineChart
      data={params.value}
      width={params.colDef.computedWidth || 100}
      height={32}
      plotType="bar"
      showHighlight
      showTooltip
      xAxis={{ scaleType: "band", data: labels }}
    />
  );
}

/* ---------------- STATUS ---------------- */

function renderStatus(value: any) {
  if (!value) return <Chip label="Offline" size="small" />;

  const { online, lastSeen } = value;

  if (online) {
    return <Chip label="Online" color="success" size="small" />;
  }

  if (lastSeen) {
    const time = dayjs(lastSeen).fromNow();
    return <Chip label={`seen ${time}`} size="small" />;
  }

  return <Chip label="Offline" size="small" />;
}

/* ---------------- COLUMNS ---------------- */

export const columns: GridColDef[] = [
  { field: "pageTitle", headerName: "App Users", flex: 1.5, minWidth: 200 },
  {
    field: "status",
    headerName: "Status",
    flex: 0.8,
    minWidth: 140,
    renderCell: (p) => renderStatus(p.value),
  },
  { field: "users", headerName: "Users", align: "right", flex: 1 },
  { field: "eventCount", headerName: "Event Count", align: "right", flex: 1 },
  { field: "viewsPerUser", headerName: "Views per User", align: "right", flex: 1 },
  { field: "averageTime", headerName: "Average Time", align: "right", flex: 1 },
  {
    field: "conversions",
    headerName: "Daily Conversions",
    flex: 1,
    renderCell: renderSparklineCell,
  },
];

/* ---------------- LIVE ROWS & HOOK ---------------- */

export let rows: GridRowsProp = [];

export function useGridRows() {
  const [gridRows, setGridRows] = React.useState<GridRowsProp>([]);

  React.useEffect(() => {
    let unsubscribers: any[] = [];

    const load = async () => {
      const companyId = await getCompanyId();
      if (!companyId) return;

      const today = dayjs().format("YYYY-MM-DD");

      const daysInMonth = Array.from(
        { length: dayjs().daysInMonth() },
        (_, i) => dayjs().date(i + 1).format("YYYY-MM-DD")
      );

      const usersRef = ref(db, `companies/${companyId}/users`);
      const userEmployeesRef = ref(db, `companies/${companyId}/userEmployees`);
      const presenceRef = ref(db, `companies/${companyId}/presence`);
      const attendanceRef = ref(db, `companies/${companyId}/attendance`);

      const unsubUsers = onValue(usersRef, (userSnap) => {
        const users = userSnap.val() || {};

        const unsubLinks = onValue(userEmployeesRef, (linkSnap) => {
          const links = linkSnap.val() || {};

          const unsubPresence = onValue(presenceRef, (presSnap) => {
            const presence = presSnap.val() || {};

            const unsubAttendance = onValue(attendanceRef, (attSnap) => {
              const attendance = attSnap.val() || {};
              const newRows: GridRowsProp = [];

              Object.keys(users).forEach((uid) => {
                const user = users[uid];
                const empMap = links[uid] || {};
                const empIds = Object.keys(empMap);

                const todayCount = empIds.filter(
                  (eid) => attendance[today]?.[eid]?.clockIn
                ).length;

                const conversions = daysInMonth.map(
                  (d) =>
                    empIds.filter((eid) => attendance[d]?.[eid]?.clockIn).length
                );

                newRows.push({
                  id: uid,
                  pageTitle: user.name || "Unknown",
                  status: presence[uid] || { online: false },
                  users: empIds.length,
                  eventCount: todayCount,
                  viewsPerUser: "",
                  averageTime: "",
                  conversions,
                });
              });

              setGridRows(newRows);
              rows = newRows;
            });
          });
        });
      });
    };

    load();

    return () => {
      unsubscribers.forEach((u) => u && u());
    };
  }, []);

  return gridRows;
}
