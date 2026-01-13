import * as React from "react";
import { useEffect, useMemo, useState } from "react";
import Grid from "@mui/material/Grid";
import Box from "@mui/material/Box";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import Copyright from "../internals/components/Copyright";
import dayjs, { type Dayjs } from "dayjs";

import ChartUserByCountry from "./ChartUserByCountry";
import CustomizedDataGrid from "./CustomizedDataGrid";
import HighlightedCard from "./HighlightedCard";
import PageViewsBarChart from "./PageViewsBarChart";
import SessionsChart from "./SessionsChart";
import StatCard, { StatCardProps } from "./StatCard";

import { ref, onValue } from "firebase/database";
import { db } from "../api/firebase";
import { getCompanyId } from "../auth/authCompany";

/* ============================= */
/* Helpers */
/* ============================= */

function toLocalDay(date?: Dayjs | null): Dayjs {
  // Force midday to avoid UTC → local date shifting
  return date ? dayjs(date).hour(12) : dayjs();
}

function getIntervalLabel(selectedDate?: Dayjs | null) {
  const today = toLocalDay().startOf("day");
  const d = toLocalDay(selectedDate).startOf("day");

  const diff = today.diff(d, "day");

  if (diff === 0) return "Today";
  if (diff === 1) return "Yesterday";
  if (diff <= 30) return `Last ${diff} days`;

  return d.format("dddd, MMM D, YYYY");
}

function trendFrom(data: number[]) {
  if (data.length < 2) return "neutral";
  const diff = data[data.length - 1] - data[data.length - 2];
  if (diff > 0) return "up";
  if (diff < 0) return "down";
  return "neutral";
}

/* ============================= */
/* MAIN GRID */
/* ============================= */

export default function MainGrid({
  selectedDate,
}: {
  selectedDate?: Dayjs | null;
}) {
  const [companyId, setCompanyId] = useState<string | null>(null);
  const [employees, setEmployees] = useState<any>({});
  const [attendance, setAttendance] = useState<any>({});

  /* Load company */
  useEffect(() => {
    getCompanyId().then(setCompanyId);
  }, []);

  /* Load Firebase */
  useEffect(() => {
    if (!companyId) return;

    const unsubEmployees = onValue(
      ref(db, `companies/${companyId}/employees`),
      (s) => setEmployees(s.val() || {})
    );

    const unsubAttendance = onValue(
      ref(db, `companies/${companyId}/attendance`),
      (s) => setAttendance(s.val() || {})
    );

    return () => {
      unsubEmployees();
      unsubAttendance();
    };
  }, [companyId]);

  /* ============================= */
  /* TODAY */
  /* ============================= */

  const totalEmployees = Object.keys(employees).length;

  const todayKey = dayjs(selectedDate ?? new Date()).format("YYYY-MM-DD");

  const todayAttendance = attendance[todayKey] || {};

  const presentToday = Object.values(todayAttendance).filter(
    (r: any) => r.clockIn
  ).length;

  const clockedInToday = Object.values(todayAttendance).filter(
    (r: any) => r.clockIn 
  ).length;

  const absentToday = Math.max(0, totalEmployees - presentToday);

  /* ============================= */
  /* 30 Day History */
  /* ============================= */

 const history = useMemo(() => {
  const end = selectedDate ?? dayjs();

  const labels: string[] = [];
  const clockedIn: number[] = [];
  const absent: number[] = [];

  for (let i = 29; i >= 0; i--) {
    const d = end.subtract(i, "day");
    const key = `${d.year()}-${String(d.month() + 1).padStart(2, "0")}-${String(
      d.date()
    ).padStart(2, "0")}`;

    const dayData = attendance[key] || {};
    const present = Object.values(dayData).filter((r: any) => r.clockIn).length;

    labels.push(d.format("DD MMM"));   // eg 15 Jan
    clockedIn.push(present);
    absent.push(Math.max(0, totalEmployees - present));
  }

  return { labels, clockedIn, absent };
}, [attendance, totalEmployees, selectedDate]);

  /* ============================= */
  /* Stat Cards */
  /* ============================= */

  const data: StatCardProps[] = [
    {
      title: "Total Employees",
      value: totalEmployees.toString(),
      interval: getIntervalLabel(selectedDate),
      trend: "neutral",
      data: history.clockedIn.map(() => totalEmployees),
      labels: history.labels,
    },
    {
      title: "Employees Clocked In",
      value: clockedInToday.toString(),
      interval: getIntervalLabel(selectedDate),
      trend: trendFrom(history.clockedIn),
      data: history.clockedIn,
      labels: history.labels,
    },
    {
      title: "Employee Absenteeism",
      value: absentToday.toString(),
      interval: getIntervalLabel(selectedDate),
      trend: trendFrom(history.absent),
      data: history.absent,
      labels: history.labels,
    },
  ];

  /* ============================= */
  /* UI */
  /* ============================= */

  return (
    <Box sx={{ width: "100%", maxWidth: { sm: "100%", md: "1700px" } }}>
      <Typography component="h2" variant="h6" sx={{ mb: 2 }}>
        Overview
      </Typography>

      <Grid container spacing={2} columns={12} sx={{ mb: 2 }}>
        {data.map((card, index) => (
          <Grid key={index} size={{ xs: 12, sm: 6, lg: 3 }}>
            <StatCard {...card} />
          </Grid>
        ))}

        <Grid size={{ xs: 12, sm: 6, lg: 3 }}>
          <HighlightedCard />
        </Grid>

        <Grid size={{ xs: 12, md: 6 }}>
          <SessionsChart />
        </Grid>

        <Grid size={{ xs: 12, md: 6 }}>
          <PageViewsBarChart />
        </Grid>
      </Grid>

      <Typography component="h2" variant="h6" sx={{ mb: 2 }}>
        Details
      </Typography>

      <Grid container spacing={2} columns={12}>
        <Grid size={{ xs: 12, lg: 9 }}>
          <CustomizedDataGrid />
        </Grid>

        <Grid size={{ xs: 12, lg: 3 }}>
          <Stack gap={2} direction={{ xs: "column", sm: "row", lg: "column" }}>
            <ChartUserByCountry />
          </Stack>
        </Grid>
      </Grid>

      <Copyright sx={{ my: 4 }} />
    </Box>
  );
}
