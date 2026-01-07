import { ref, push, set, update, get } from "firebase/database";
import { db } from "../api/firebase";
import { Employee } from "../types/employee";
import { auth } from "../api/firebase";

/* ---------------------------------------------------
   Helper: get companyId for current user
--------------------------------------------------- */
async function getCompanyId(): Promise<string> {
  const user = auth.currentUser;
  if (!user) throw new Error("User not authenticated");

  const snap = await get(ref(db, `userCompanies/${user.uid}`));
  if (!snap.exists()) throw new Error("User is not linked to a company");

  return snap.val().companyId;
}

/* ---------------------------------------------------
   Create single employee
--------------------------------------------------- */
export async function createEmployee(employee: Omit<Employee, "id">) {
  const companyId = await getCompanyId();

  const newRef = push(ref(db, `companies/${companyId}/employees`));
  await set(newRef, employee);

  return { ...employee, id: newRef.key };
}

/* ---------------------------------------------------
   Bulk create (Excel import)
--------------------------------------------------- */
export async function bulkCreateEmployeesFirebase(
  employees: Omit<Employee, "id">[]
) {
  const companyId = await getCompanyId();
  const baseRef = ref(db, `companies/${companyId}/employees`);

  const created: Employee[] = [];

  for (const emp of employees) {
    const newRef = push(baseRef);
    await set(newRef, emp);
    created.push({
      ...(emp as Employee),
      id: newRef.key!,
    });
  }

  return created;
}

/* ---------------------------------------------------
   Fetch all employees
--------------------------------------------------- */
export async function fetchEmployees(): Promise<Employee[]> {
  const companyId = await getCompanyId();

  const snapshot = await get(
    ref(db, `companies/${companyId}/employees`)
  );

  if (!snapshot.exists()) return [];

  const data = snapshot.val();

  return Object.keys(data).map((id) => ({
    id,
    ...data[id],
  }));
}

/* ---------------------------------------------------
   Update single employee field
--------------------------------------------------- */
export async function updateEmployeeField(
  id: string,
  field: string,
  value: any
) {
  const companyId = await getCompanyId();

  await update(ref(db, `companies/${companyId}/employees/${id}`), {
    [field]: value,
    updatedAt: Date.now(),
  });
}
