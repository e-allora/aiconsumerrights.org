"use server";

import { revalidatePath } from "next/cache";
import { headers } from "next/headers";

import { isAdmin } from "@/lib/admin-auth";
import { approveSubmission, deleteSubmission } from "@/lib/forum/submissions";

// Middleware already asks for the password; each action checks again, so
// nothing depends on middleware alone.
function requireAdmin() {
  if (!isAdmin(headers().get("authorization"))) throw new Error("Not allowed");
}

export async function approve(form: FormData) {
  requireAdmin();
  await approveSubmission(String(form.get("id")));
  revalidatePath("/admin");
}

/** Reject a pending suggestion, or remove an approved one: deletes it and its votes. */
export async function remove(form: FormData) {
  requireAdmin();
  await deleteSubmission(String(form.get("id")));
  revalidatePath("/admin");
}
