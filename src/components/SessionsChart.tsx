import * as React from 'react';
import { useTheme } from '@mui/material/styles';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Chip from '@mui/material/Chip';
import Typography from '@mui/material/Typography';
import Stack from '@mui/material/Stack';
import { LineChart } from '@mui/x-charts/LineChart';
import { ref, get } from 'firebase/database';
import { db } from '../api/firebase';
import { getCompanyId } from '../auth/authCompany';

function AreaGradient({ color, id }: { color: string; id: string }) {
  return (
    <defs>
      <linearGradient id={id} x1="50%" y1="0%" x2="50%" y2="100%">
        <stop offset="0%" stopColor={color} stopOpacity={0.5} />
        <stop offset="100%" stopColor={color} stopOpacity={0} />
      </linearGradient>
    </defs>
  );
}

function getLast30Days() {
  const days = [];
  const labels = [];
  for (let i = 29; i >= 0; i--) {
    const date = new Date();
    date.setDate(date.getDate() - i);
    const dateStr = date.toISOString().split('T')[0];
    days.push(dateStr);
    labels.push(date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }));
  }
  return { days, labels };
}

export default function SessionsChart() {
  const theme = useTheme();
  const [companyId, setCompanyId] = React.useState<string | null>(null);
  const [clockedInData, setClockedInData] = React.useState<number[]>([]);
  const [lateData, setLateData] = React.useState<number[]>([]);
  const [absentData, setAbsentData] = React.useState<number[]>([]);
  const [labels, setLabels] = React.useState<string[]>([]);
  const [totalAttendance, setTotalAttendance] = React.useState(0);
  const [loading, setLoading] = React.useState(true);

  // Fetch company ID
  React.useEffect(() => {
    const fetchCompanyId = async () => {
      try {
        const cId = await getCompanyId();
        setCompanyId(cId);
      } catch (err) {
        console.error('Error fetching company ID:', err);
      }
    };
    fetchCompanyId();
  }, []);

  // Fetch attendance data for last 30 days
  React.useEffect(() => {
    if (!companyId) return;

    const fetchAttendanceData = async () => {
      try {
        setLoading(true);
        const { days, labels: dayLabels } = getLast30Days();
        const cIn: number[] = [];
        const late: number[] = [];
        const absent: number[] = [];
        let totalCount = 0;

        // Get all employees
        const empSnap = await get(ref(db, `companies/${companyId}/employees`));
        const employees = empSnap.val() || {};
        const rulesSnap = await get(ref(db, `companies/${companyId}/info/settings`));
        const rulesVal = rulesSnap.val() || {};
        const grace = rulesVal.clockingRules?.graceMinutes || 0;
        const workingHours = rulesVal.workingHours || {};

        for (const dateStr of days) {
          let clockedIn = 0;
          let lateCount = 0;
          let absentCount = 0;

          const attSnap = await get(ref(db, `companies/${companyId}/attendance/${dateStr}`));
          const attendance = attSnap.val() || {};

          Object.keys(employees).forEach((empId) => {
            const emp = employees[empId];
            const rec = attendance[empId];
            const shiftType = rec?.shift || emp.shift || 'day';
            const shift = workingHours[shiftType];

            if (!shift) return;

            const [sh, sm] = shift.start.split(':').map(Number);

            // Absent
            if (!rec || !rec.clockIn) {
              absentCount++;
            } else {
              const clockInTime = new Date(rec.clockIn);
              const shiftStart = new Date(clockInTime);
              shiftStart.setHours(sh, sm + grace, 0, 0);

              if (clockInTime <= shiftStart) {
                clockedIn++;
              } else {
                lateCount++;
              }
            }
          });

          cIn.push(clockedIn);
          late.push(lateCount);
          absent.push(absentCount);
          totalCount += clockedIn + lateCount;
        }

        setClockedInData(cIn);
        setLateData(late);
        setAbsentData(absent);
        setLabels(dayLabels);
        setTotalAttendance(totalCount);
        setLoading(false);
      } catch (err) {
        console.error('Error fetching attendance data:', err);
        setLoading(false);
      }
    };

    fetchAttendanceData();
  }, [companyId]);

  const colorPalette = [
    theme.palette.success.main,
    theme.palette.warning.main,
    theme.palette.error.main,
  ];

  if (loading || labels.length === 0) {
    return (
      <Card variant="outlined" sx={{ width: '100%' }}>
        <CardContent>
          <Typography component="h2" variant="subtitle2" gutterBottom>
            Attendance Overview
          </Typography>
          <Typography variant="caption" sx={{ color: 'text.secondary' }}>
            Loading attendance data...
          </Typography>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card variant="outlined" sx={{ width: '100%' }}>
      <CardContent>
        <Typography component="h2" variant="subtitle2" gutterBottom>
          Attendance Overview
        </Typography>
        <Stack sx={{ justifyContent: 'space-between' }}>
          <Stack
            direction="row"
            sx={{
              alignContent: { xs: 'center', sm: 'flex-start' },
              alignItems: 'center',
              gap: 1,
            }}
          >
            <Typography variant="h4" component="p">
              {totalAttendance}
            </Typography>
            <Chip size="small" color="success" label="+30 days" />
          </Stack>
          <Typography variant="caption" sx={{ color: 'text.secondary' }}>
            Attendance per day for the last 30 days
          </Typography>
        </Stack>
        <LineChart
          colors={colorPalette}
          xAxis={[
            {
              scaleType: 'point',
              data: labels,
              tickInterval: (_, i) => (i + 1) % 5 === 0,
              height: 24,
            },
          ]}
          yAxis={[{ width: 50 }]}
          series={[
            {
              id: 'clockedIn',
              label: 'Clocked In',
              showMark: false,
              curve: 'linear',
              stack: 'total',
              area: true,
              stackOrder: 'ascending',
              data: clockedInData,
            },
            {
              id: 'late',
              label: 'Late',
              showMark: false,
              curve: 'linear',
              stack: 'total',
              area: true,
              stackOrder: 'ascending',
              data: lateData,
            },
            {
              id: 'absent',
              label: 'Absent',
              showMark: false,
              curve: 'linear',
              stack: 'total',
              stackOrder: 'ascending',
              data: absentData,
              area: true,
            },
          ]}
          height={250}
          margin={{ left: 0, right: 20, top: 20, bottom: 0 }}
          grid={{ horizontal: true }}
          sx={{
            '& .MuiAreaElement-series-absent': {
              fill: "url('#absent')",
            },
            '& .MuiAreaElement-series-late': {
              fill: "url('#late')",
            },
            '& .MuiAreaElement-series-clockedIn': {
              fill: "url('#clockedIn')",
            },
          }}

        >
          <AreaGradient color={theme.palette.error.main} id="absent" />
          <AreaGradient color={theme.palette.warning.main} id="late" />
          <AreaGradient color={theme.palette.success.main} id="clockedIn" />
        </LineChart>
      </CardContent>
    </Card>
  );
}
