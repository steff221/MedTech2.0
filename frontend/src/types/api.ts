// Type definitions mirroring the Spring Boot backend DTOs.
// Any drift here means runtime errors — keep in sync with backend/src/main/java/com/medtech/application/dto.

export type UserRole = "PATIENT" | "DOCTOR" | "NURSE" | "ADMIN";
export type UserStatus = "ACTIVE" | "INACTIVE" | "SUSPENDED" | "DELETED";
export type AppointmentStatus =
  | "SCHEDULED"
  | "COMPLETED"
  | "CANCELLED"
  | "NO_SHOW"
  | "RESCHEDULED";
export type AppointmentType = "CONSULTATION" | "FOLLOW_UP" | "PROCEDURE" | "CHECKUP" | "VIRTUAL";
export type Gender = "M" | "F" | "O";
export type BloodType = "A_POS" | "A_NEG" | "B_POS" | "B_NEG" | "AB_POS" | "AB_NEG" | "O_POS" | "O_NEG";
export type HospitalType = "PUBLIC" | "PRIVATE" | "CLINIC" | "SPECIALIZED";
export type HospitalStatus = "ACTIVE" | "INACTIVE";

export interface UserResponse {
  id: number;
  email: string;
  firstName: string;
  lastName: string;
  phoneNumber: string | null;
  role: UserRole;
  status: UserStatus;
  emailVerified: boolean;
  lastLogin: string | null;
}

export interface AuthResponse {
  accessToken: string;
  refreshToken: string;
  tokenType: string;
  expiresInSeconds: number;
  user: UserResponse;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  phoneNumber?: string;
  role: UserRole;
}

export interface PatientResponse {
  id: number;
  userId: number;
  email: string;
  firstName: string;
  lastName: string;
  phoneNumber: string | null;
  dateOfBirth: string;
  gender: Gender | null;
  bloodType: BloodType | null;
  allergies: string | null;
  chronicConditions: string | null;
  insuranceProvider: string | null;
  insuranceNumber: string | null;
  emergencyContact: string | null;
  emergencyPhone: string | null;
  address: string | null;
  city: string | null;
  postalCode: string | null;
  country: string | null;
}

export interface CreatePatientRequest {
  dateOfBirth: string;
  gender?: Gender;
  bloodType?: BloodType;
  allergies?: string;
  chronicConditions?: string;
  insuranceProvider?: string;
  insuranceNumber?: string;
  emergencyContact?: string;
  emergencyPhone?: string;
  address?: string;
  city?: string;
  postalCode?: string;
  country?: string;
}

export interface AppointmentResponse {
  id: number;
  patientId: number;
  patientName: string;
  doctorId: number;
  doctorName: string;
  doctorSpecialization: string | null;
  hospitalId: number | null;
  hospitalName: string | null;
  appointmentDate: string;
  appointmentTime: string;
  durationMinutes: number;
  status: AppointmentStatus;
  appointmentType: AppointmentType | null;
  reason: string | null;
  cancellationReason: string | null;
  videoCallUrl: string | null;
  createdAt: string;
}

export interface BookAppointmentRequest {
  doctorId: number;
  patientId: number;
  appointmentDate: string;
  appointmentTime: string;
  durationMinutes?: number;
  appointmentType?: AppointmentType;
  reason?: string;
  notes?: string;
}

export interface DoctorResponse {
  id: number;
  userId: number;
  email: string;
  firstName: string;
  lastName: string;
  licenseNumber: string;
  specialization: string;
  subSpecialization: string | null;
  qualification: string | null;
  experienceYears: number | null;
  officeNumber: string | null;
  consultationFee: number | null;
  availabilityHours: string | null;
  bio: string | null;
  status: UserStatus;
  hospitalId: number | null;
  hospitalName: string | null;
  hospitalCity: string | null;
}

export interface HospitalResponse {
  id: number;
  name: string;
  city: string;
  address: string;
  postalCode: string | null;
  phoneNumber: string | null;
  latitude: number | null;
  longitude: number | null;
  type: HospitalType;
  directorName: string | null;
  bedCount: number | null;
  status: HospitalStatus;
}

export interface Page<T> {
  content: T[];
  totalElements: number;
  totalPages: number;
  number: number;
  size: number;
  first: boolean;
  last: boolean;
  empty: boolean;
}

export type PrescriptionRoute = "ORAL" | "INJECTION" | "TOPICAL" | "INHALED" | "IV" | "IM" | "SC";
export type PrescriptionStatus = "ACTIVE" | "COMPLETED" | "CANCELLED" | "SUSPENDED";

export interface MedicalRecordResponse {
  id: number;
  patientId: number;
  doctorId: number;
  doctorName: string;
  doctorSpecialization: string | null;
  hospitalId: number | null;
  appointmentId: number | null;
  diagnosis: string | null;
  mkb10Code: string | null;
  clinicalNotes: string;
  vitalSigns: string | null;
  bloodPressure: string | null;
  heartRate: number | null;
  temperature: number | null;
  weight: number | null;
  height: number | null;
  bmi: number | null;
  assessment: string | null;
  plan: string | null;
  confidential: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateMedicalRecordRequest {
  patientId: number;
  appointmentId?: number;
  diagnosis?: string;
  mkb10Code?: string;
  clinicalNotes: string;
  bloodPressure?: string;
  heartRate?: number;
  temperature?: number;
  weight?: number;
  height?: number;
  bmi?: number;
  assessment?: string;
  plan?: string;
  confidential?: boolean;
}

export interface PrescriptionResponse {
  id: number;
  patientId: number;
  doctorId: number;
  doctorName: string | null;
  medicalRecordId: number | null;
  medicationName: string;
  dosage: string;
  frequency: string;
  durationDays: number | null;
  quantity: number | null;
  route: PrescriptionRoute | null;
  instructions: string | null;
  startDate: string;
  endDate: string | null;
  status: PrescriptionStatus;
  filledAtPharmacy: string | null;
  pharmacyName: string | null;
  refillsAllowed: number;
  refillsUsed: number;
  createdAt: string;
}

export interface IssuePrescriptionRequest {
  patientId: number;
  medicalRecordId?: number;
  medicationName: string;
  dosage: string;
  frequency: string;
  durationDays?: number;
  quantity?: number;
  route?: PrescriptionRoute;
  instructions?: string;
  startDate: string;
  endDate?: string;
  refillsAllowed?: number;
}

export interface StatsOverviewResponse {
  date: string;
  prescriptionsToday: number;
  referralsToday: number;
  activePatients: number;
  activeDoctors: number;
  appointmentsByHospital: Array<{ hospital: string; city: string; count: number }>;
  prescriptionsByDay: Array<{ day: string; count: number }>;
}

export interface NotificationResponse {
  id: number;
  type: string;
  title: string;
  body: string | null;
  read: boolean;
  referenceId: number | null;
  createdAt: string;
}

export interface ApiError {
  timestamp: string;
  status: number;
  code: string;
  message: string;
  path: string;
  errors?: Array<{ field: string; message: string; rejectedValue: unknown }>;
}
