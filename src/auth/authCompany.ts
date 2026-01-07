import { get, ref } from "firebase/database";
import { auth, db } from "../api/firebase";

export async function getCompanyId(): Promise<string> {
  if (!auth.currentUser) throw new Error("Not authenticated");

  const snap = await get(ref(db, `userCompanies/${auth.currentUser.uid}`));
  if (!snap.exists()) throw new Error("User not linked to a company");

  return snap.val().companyId;
}
