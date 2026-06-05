export type Panel = "profile" | "bookings" | "settings" | null;

export type UserProfile = {
  id: number;
  nome: string;
  email: string;
  citta: string;
  avatar: string | null;
  documentStatus: string;
  paymentMethod: string;
  paymentBrand: string;
  createdAt: string;
  notifications: boolean;
};

export type Vehicle = {
  id: number;
  type: string;
  lat: number;
  lng: number;
  batteryLevel: number;
  status: string;
  distance?: number;
};

export type Booking = {
  id: number;
  userId: number;
  vehicleId: number;
  status: string;
  destination: string | null;
  distance: number | null;
  cost: number | null;
  durationSeconds: number | null;
  paid: boolean;
  createdAt: string;
  endedAt: string | null;
  vehicle: Vehicle;
};

export type SupportMessage = {
  id: number;
  message: string;
  isStaff: boolean;
  vehicleId: number | null;
  createdAt: string;
};

export type Pos = { lat: number; lng: number };
