import { type Appointment } from "@/app/appointments/[id]/page";

const clientAppointmentsCache = new Map<string, Appointment[]>();

export function getClientAppointmentsCache(
  key: string,
): Appointment[] | undefined {
  return clientAppointmentsCache.get(key);
}

export function setClientAppointmentsCache(
  key: string,
  data: Appointment[],
): void {
  clientAppointmentsCache.set(key, data);
}

export function clearClientAppointmentsCache(userId?: string): void {
  if (!userId) {
    clientAppointmentsCache.clear();
    return;
  }
  for (const key of clientAppointmentsCache.keys()) {
    if (key.endsWith(`:${userId}`)) {
      clientAppointmentsCache.delete(key);
    }
  }
}

