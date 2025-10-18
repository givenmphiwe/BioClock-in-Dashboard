export type EmploymentType = "permanent" | "contract" | "temporary" |
    "casual";
export type EmployeeStatus = "active" | "inactive" | "terminated";
export type Employee = {
    id?: number | string;
    // Core identity
    firstName: string;
    lastName: string;
    industryNumber: string; // IRN / employee unique number
    idNumber?: string; // National ID / passport
    // Contact
    email?: string;
    phone?: string;
    // Org placement
    occupationId?: string; // UUID/ID to send to API
    occupationName?: string; // for display
    gangUnitId?: string;
    gangUnitName?: string;
    // HR
    employmentType?: EmploymentType;
    status?: EmployeeStatus;
    isEnrolled?: boolean; // biometric enrolled
    // Demographic
    age: number | null;
    dateOfBirth?: string;
    hireDate?: string; // ISO yyyy-mm-dd
};