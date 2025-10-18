import { Employee } from "../types/employee";
export async function createEmployeeApi(emp: Omit<Employee, "id">):
    Promise<Employee> {
    const res = await fetch("/api/employees", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(emp),
    });
    if (!res.ok) throw new Error(`Create failed: ${res.status}`);
    return res.json();
}
export async function bulkCreateEmployeesApi(
    emps: Omit<Employee, "id">[]
): Promise<Employee[]> {
    const res = await fetch("/api/employees/bulk", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ employees: emps }),
    });
    if (!res.ok) throw new Error(`Bulk import failed: ${res.status}`);
    return res.json();
}
