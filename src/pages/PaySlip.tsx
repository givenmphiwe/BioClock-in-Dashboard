import { useEffect, useMemo, useState } from "react";
import Layout from "../components/Layout";
import {
  Box,
  Typography,
  Paper,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  Button,
  TextField,
} from "@mui/material";
import { ref, onValue } from "firebase/database";
import { db } from "../api/firebase";
import { getCompanyId } from "../auth/authCompany";
import dayjs, { Dayjs } from "dayjs";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";

type Props = {
  selectedDate: Dayjs | null;
  onDateChange?: (d: Dayjs | null) => void;
};

const toHours = (ms: number) => ms / 1000 / 60 / 60;

export default function PayslipPage({ selectedDate, onDateChange }: Props) {
  const [companyId, setCompanyId] = useState<string | null>(null);
  const [company, setCompany] = useState<any>({});
  const [employees, setEmployees] = useState<any>({});
  const [attendance, setAttendance] = useState<any>({});
  const [payRates, setPayRates] = useState<any>({});
  const [workingHours, setWorkingHours] = useState<any>({});
  const [currency, setCurrency] = useState("ZAR");

  const [selectedEmployee, setSelectedEmployee] = useState<any>(null);
  const [search, setSearch] = useState("");

  /* LOAD */
  useEffect(() => {
    getCompanyId().then(setCompanyId);
  }, []);

  useEffect(() => {
    if (!companyId) return;

    const subs = [
      onValue(ref(db, `companies/${companyId}/employees`), (s) =>
        setEmployees(s.val() || {})
      ),
      onValue(ref(db, `companies/${companyId}/attendance`), (s) =>
        setAttendance(s.val() || {})
      ),
      onValue(ref(db, `companies/${companyId}/info/settings/payRates`), (s) =>
        setPayRates(s.val() || {})
      ),
      onValue(
        ref(db, `companies/${companyId}/info/settings/workingHours`),
        (s) => setWorkingHours(s.val() || {})
      ),
      onValue(ref(db, `companies/${companyId}/info/details`), (s) =>
        setCompany(s.val() || {})
      ),
    ];

    return () => subs.forEach((u) => u());
  }, [companyId]);

  const formatMoney = (v: number) =>
    new Intl.NumberFormat("en-ZA", {
      style: "currency",
      currency,
    }).format(v);

  /* PAYROLL */
  const payroll = useMemo(() => {
    const rows: any[] = [];

    Object.entries(employees).forEach(([empId, emp]: any) => {
      let totalHours = 0;
      let overtime = 0;

      Object.entries(attendance).forEach(([date, day]: any) => {
        const recordDate = dayjs(date);
        if (!selectedDate || !recordDate.isSame(selectedDate, "month")) return;

        const rec = day[empId];
        if (!rec?.clockIn || !rec?.clockOut) return;

        const worked = toHours(rec.clockOut - rec.clockIn);
        totalHours += worked;

        if (worked > 8) overtime += worked - 8;
      });

      const normalHours = totalHours - overtime;
      const rate =
        payRates[emp.occupationName?.toLowerCase()?.replace(/ /g, "_")]
          ?.hourly || 0;

      const normalPay = normalHours * rate;
      const otPay = overtime * rate * 1.5;
      const total = normalPay + otPay;

      rows.push({
        id: empId,
        name: emp.firstName + " " + emp.lastName,
        occupation: emp.occupationName,
        normalPay,
        otPay,
        total,
      });
    });

    return rows;
  }, [employees, attendance, payRates, workingHours, selectedDate]);

  const filtered = payroll.filter((e) =>
    e.name.toLowerCase().includes(search.toLowerCase())
  );

  /* PDF */
  const downloadPayslip = async () => {
    const element = document.getElementById("payslip-preview");
    if (!element) return;

    const canvas = await html2canvas(element, { scale: 2 });
    const imgData = canvas.toDataURL("image/png");

    const pdf = new jsPDF("p", "mm", "a4");
    pdf.addImage(imgData, "PNG", 10, 10, 190, 0);

    pdf.save(`${selectedEmployee.name}_Payslip.pdf`);
  };

  const calc = (total: number) => {
    const tax = total * 0.18;
    const uif = total * 0.01;
    return {
      tax,
      uif,
      total: tax + uif,
      net: total - (tax + uif),
    };
  };

  return (
    <Layout currentPage="Payslip" selectedDate={selectedDate} onDateChange={onDateChange}>
      <Box sx={{ p: 4 }}>
        <Typography variant="h4">Payslip System</Typography>

        <TextField
          label="Search Employee"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          sx={{ my: 2 }}
        />

        {/* TABLE */}
        <Paper>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Employee</TableCell>
                <TableCell>Occupation</TableCell>
                <TableCell>Total</TableCell>
              </TableRow>
            </TableHead>

            <TableBody>
              {filtered.map((emp) => (
                <TableRow
                  key={emp.id}
                  hover
                  onClick={() => setSelectedEmployee(emp)}
                  style={{ cursor: "pointer" }}
                >
                  <TableCell>{emp.name}</TableCell>
                  <TableCell>{emp.occupation}</TableCell>
                  <TableCell>{formatMoney(emp.total)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Paper>

        {/* PAYSLIP */}
       
{selectedEmployee && (
  <Paper sx={{ mt: 4, p: 2 }}>
    <div
      id="payslip-preview"
      style={{
        width: "794px",
        background: "#fff",
        padding: 20,
        fontFamily: "Arial",
        color: "#1a1a1a",
      }}
    >
      {/* HEADER */}
      <div style={{ display: "flex", justifyContent: "space-between" }}>
        <div>
          <h2 style={{ margin: 0 }}>{company.name}</h2>
          <p>{company.address}</p>
          <p>{company.phone}</p>
          <p>{company.email}</p>
          <p>{company.website}</p>
          <p>Reg: {company.reg} | VAT: {company.vat}</p>
        </div>

        <div style={{ textAlign: "right" }}>
          <div style={{
            background: "#0b2e4f",
            color: "#fff",
            padding: "10px 20px",
            fontWeight: "bold"
          }}>
            PAYSLIP
          </div>

          <p>Payslip No: {selectedEmployee.id}</p>
          <p>Period: {selectedDate?.format("DD MMM YYYY")} - {selectedDate?.endOf("month").format("DD MMM YYYY")}</p>
          <p>Pay Date: {dayjs().format("DD MMM YYYY")}</p>
          <p>Currency: {currency}</p>
        </div>
      </div>

      {/* EMPLOYEE + COMPANY */}
      <div style={{ display: "flex", marginTop: 20, gap: 10 }}>
        <div style={{ flex: 1, border: "1px solid #ddd" }}>
          <div style={{ background: "#0b2e4f", color: "#fff", padding: 8 }}>
            EMPLOYEE DETAILS
          </div>
          <div style={{ padding: 10 }}>
            <p>Name: {selectedEmployee.name}</p>
            <p>Position: {selectedEmployee.occupation}</p>
            <p>Employee ID: {selectedEmployee.id}</p>
          </div>
        </div>

        <div style={{ flex: 1, border: "1px solid #ddd" }}>
          <div style={{ background: "#0b2e4f", color: "#fff", padding: 8 }}>
            COMPANY DETAILS
          </div>
          <div style={{ padding: 10 }}>
            <p>{company.name}</p>
            <p>{company.address}</p>
            <p>{company.phone}</p>
            <p>{company.email}</p>
          </div>
        </div>
      </div>

      {/* TABLES */}
      <div style={{ display: "flex", marginTop: 20, gap: 10 }}>
        
        {/* EARNINGS TABLE */}
        <div style={{ flex: 1, border: "1px solid #ddd" }}>
          <div style={{ background: "#0b2e4f", color: "#fff", padding: 8 }}>
            EARNINGS
          </div>

          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ background: "#f4f4f4" }}>
                <th>Description</th>
                <th>Amount</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>Normal Pay</td>
                <td>{formatMoney(selectedEmployee.normalPay)}</td>
              </tr>
              <tr>
                <td>Overtime</td>
                <td>{formatMoney(selectedEmployee.otPay)}</td>
              </tr>
              <tr>
                <td><b>Total</b></td>
                <td><b>{formatMoney(selectedEmployee.total)}</b></td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* DEDUCTIONS TABLE */}
        <div style={{ flex: 1, border: "1px solid #ddd" }}>
          <div style={{ background: "#0b2e4f", color: "#fff", padding: 8 }}>
            DEDUCTIONS
          </div>

          {(() => {
            const d = calc(selectedEmployee.total);
            return (
              <table style={{ width: "100%" }}>
                <tbody>
                  <tr>
                    <td>PAYE</td>
                    <td>{formatMoney(d.tax)}</td>
                  </tr>
                  <tr>
                    <td>UIF</td>
                    <td>{formatMoney(d.uif)}</td>
                  </tr>
                  <tr>
                    <td><b>Total</b></td>
                    <td><b>{formatMoney(d.total)}</b></td>
                  </tr>
                </tbody>
              </table>
            );
          })()}
        </div>
      </div>

      {/* NET PAY */}
      {(() => {
        const d = calc(selectedEmployee.total);
        return (
          <div style={{
            display: "flex",
            marginTop: 20,
            gap: 10
          }}>
            <div style={{
              flex: 1,
              background: "#0b2e4f",
              color: "#fff",
              padding: 20,
              fontSize: 22,
              fontWeight: "bold"
            }}>
              NET PAY<br />
              {formatMoney(d.net)}
            </div>

            <div style={{ flex: 2, border: "1px solid #ddd", padding: 10 }}>
              Total Earnings: {formatMoney(selectedEmployee.total)} <br />
              Total Deductions: {formatMoney(d.total)}
            </div>
          </div>
        );
      })()}

      {/* EXTRA SECTIONS */}
      <div style={{ display: "flex", marginTop: 20, gap: 10 }}>
        <div style={{ flex: 1, border: "1px solid #ddd", padding: 10 }}>
          <b>YEAR TO DATE</b>
          <p>YTD Earnings: {formatMoney(selectedEmployee.total * 3)}</p>
          <p>YTD Net: {formatMoney(selectedEmployee.total * 2)}</p>
        </div>

        <div style={{ flex: 1, border: "1px solid #ddd", padding: 10 }}>
          <b>LEAVE</b>
          <p>Annual: 12 days</p>
          <p>Sick: 6 days</p>
        </div>

        <div style={{ flex: 1, border: "1px solid #ddd", padding: 10 }}>
          <b>BANK</b>
          <p>Account: 123456789</p>
          <p>Bank: FNB</p>
        </div>
      </div>

      {/* FOOTER */}
      <div style={{
        marginTop: 30,
        textAlign: "center",
        fontSize: 12,
        color: "#666"
      }}>
        This is a computer generated document.
      </div>
    </div>

    <Button sx={{ mt: 2 }} variant="contained" onClick={downloadPayslip}>
      Download Payslip
    </Button>
  </Paper>
)}
      </Box>
    </Layout>
  );
}