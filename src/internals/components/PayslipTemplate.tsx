import React from "react";

export default function PayslipTemplate({ emp, company, currency }: any) {
  return (
    <div id="payslip" style={{ padding: 20, fontFamily: "Arial" }}>
      <h2>{company?.name || "Company Name"}</h2>
      <h3>Payslip</h3>

      <hr />

      <p><b>Employee:</b> {emp.name}</p>
      <p><b>Occupation:</b> {emp.occupation}</p>

      <hr />

      <h4>Earnings</h4>
      <p>Normal Pay: {emp.normalPay.toFixed(2)} {currency}</p>
      <p>Overtime Pay: {emp.otPay.toFixed(2)} {currency}</p>

      <h4>Total Earnings: {emp.total.toFixed(2)} {currency}</h4>

      <hr />

      <h4>Deductions (example)</h4>
      <p>Tax: 0.00</p>

      <hr />

      <h2>Net Pay: {emp.total.toFixed(2)} {currency}</h2>

      <p style={{ marginTop: 40 }}>
        This is a system generated payslip.
      </p>
    </div>
  );
}