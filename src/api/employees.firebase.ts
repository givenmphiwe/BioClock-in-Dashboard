import { ref, push, set, update, get, child } from "firebase/database";
import { db } from "../api/firebase";
import { Employee } from "../types/employee";

/** Create single employee */
export async function createEmployee(employee: Omit<Employee, "id">) {
  const newRef = push(ref(db, "employees"));
  await set(newRef, employee);
  return { ...employee, id: newRef.key };
}

/** Bulk create (Excel import) */
export async function bulkCreateEmployeesFirebase(
  employees: Omit<Employee, "id">[]
) {
  const updates: Record<string, any> = {};
  const baseRef = ref(db, "employees");

  employees.forEach((emp) => {
    const key = push(baseRef).key!;
    updates[`employees/${key}`] = emp;
  });

  await update(ref(db), updates);

  return Object.entries(updates).map(([path, value]) => ({
    ...(value as Employee),
    id: path.split("/")[1],
  }));
}

/** Fetch all employees */
export async function fetchEmployees() {
  const snapshot = await get(child(ref(db), "employees"));
  if (!snapshot.exists()) return [];

  const data = snapshot.val();
  return Object.keys(data).map((id) => ({
    id,
    ...data[id],
  }));
}

/** Update single field */
export async function updateEmployeeField(
  id: string,
  field: string,
  value: any
) {
  await update(ref(db, `employees/${id}`), {
    [field]: value,
  });
}
