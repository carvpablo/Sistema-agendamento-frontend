export interface LoginFormType {
  email: string;
  password: string;
}

export interface SigninFormType extends LoginFormType {
  name: string;
}

export interface CreateServiceFormType {
  name: string;
  description?: string;
  durationMinutes: number;
  price: number;
}

export interface Availability {
  id: string;
  professionalId: string;
  startAt: string;
  endAt: string;
}

export interface CreateAvailabilityFormType {
  startAt: string;
  endAt: string;
}
