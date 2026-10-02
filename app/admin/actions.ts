"use server";

import { revalidatePath } from "next/cache";
import { headers } from "next/headers";

import { isAdmin } from "@/lib/admin-auth";
import { precheck } from "@/lib/forum/precheck";
import { approveSubmission, deleteSubmission, recheckSubmission } from "@/lib/forum/submissions";

// The proxy already asks for the password; each action checks again, so
// nothing depends on the proxy alone.
async function requireAdmin() {
  if (!isAdmin((await headers()).get("authorization"))) throw new Error("Not allowed");
}

export async function approve(form: FormData) {
  await requireAdmin();
  await approveSubmission(String(form.get("id")));
  revalidatePath("/admin");
}

/** Reject a pending suggestion, or remove an approved one: deletes it and its votes. */
export async function remove(form: FormData) {
  await requireAdmin();
  await deleteSubmission(String(form.get("id")));
  revalidatePath("/admin");
}

/** Runs the AI pre-check again on a suggestion marked "not checked". */
export async function recheck(form: FormData) {
  await requireAdmin();
  await recheckSubmission(String(form.get("id")), precheck);
  revalidatePath("/admin");
}
