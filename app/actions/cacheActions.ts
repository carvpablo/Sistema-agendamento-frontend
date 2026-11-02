"use server";

import { updateTag } from "next/cache";

export async function invalidateServicesCache(professionalId?: string) {
  updateTag("services");
  if (professionalId) {
    updateTag(`professional-services:${professionalId}`);
  }
}

export async function invalidateAppointmentsCache(userId?: string) {
  updateTag("appointments");
  if (userId) {
    updateTag(`appointments:${userId}`);
  }
}

