// Помошни податоци/функции за медицински процедури.
// Common medical procedures (kept in one place so the map filter, the
// doctor card, and any future doctor-profile form stay in sync).
export const PROCEDURES = [
  "ECG",
  "Echocardiogram",
  "Stress Test",
  "Holter Monitor",
  "Cardiac Catheterization",
  "Skin Biopsy",
  "Cryotherapy",
  "Mole Removal",
  "Laser Therapy",
  "Acne Treatment",
  "Annual Physical",
  "Vaccinations",
  "Health Screening",
  "Wellness Check",
  "Minor Injuries",
  "EEG",
  "EMG",
  "Lumbar Puncture",
  "Nerve Conduction Study",
  "Migraine Therapy",
  "Well-Child Visit",
  "Immunizations",
  "Developmental Screening",
  "Pediatric Allergy",
  "X-ray",
  "MRI",
  "Joint Injection",
  "Casting",
  "Physical Therapy",
  "Sports Medicine",
  "Pap Smear",
  "Mammogram",
  "Ultrasound",
  "Colposcopy",
  "Prenatal Care",
  "Cystoscopy",
  "Endourology",
  "Urologic Oncology",
  "Minimally Invasive Surgery",
  "Prostate Biopsy",
  "Lithotripsy",
] as const;

export type Procedure = (typeof PROCEDURES)[number];

/**
 * Doctors store their offered procedures as a comma-separated list in the
 * `subSpecialization` field (seeded by mock_seed.sql). Parse safely.
 */
export function parseDoctorProcedures(subSpecialization: string | null | undefined): string[] {
  if (!subSpecialization) return [];
  return subSpecialization
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
}
