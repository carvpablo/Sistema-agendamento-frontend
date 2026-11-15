"use server";

import { updateTag } from "next/cache";

export async function invalidateServicesCache(
  professionalId?: string,
  serviceId?: string,
) {
  updateTag("services");
  if (professionalId) {
    updateTag(`professional-services:${professionalId}`);
  }
  if (serviceId) {
    updateTag(`service:${serviceId}`);
  }
}

export async function invalidateAppointmentsCache(userId?: string) {
  updateTag("appointments");
  if (userId) {
    updateTag(`appointments:${userId}`);
  }
}

