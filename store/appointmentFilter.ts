import { create } from "zustand";

export type AppointmentStatusFilter =
  | "SCHEDULED"
  | "CANCELLED"
  | "COMPLETED"
  | "ALL";

interface AppointmentFilterStore {
  statusFilter: AppointmentStatusFilter;
  setStatusFilter: (filter: AppointmentStatusFilter) => void;
}

export const useAppointmentFilter = create<AppointmentFilterStore>((set) => ({
  statusFilter: "SCHEDULED",
  setStatusFilter: (statusFilter) => set({ statusFilter }),
}));

