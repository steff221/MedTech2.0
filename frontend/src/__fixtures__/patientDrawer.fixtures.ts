// Тест-фикстури: примероци податоци за PatientDetailDrawer.
import type {
  MedicalRecordResponse,
  PatientResponse,
  PrescriptionResponse,
  PrescriptionRoute,
  PrescriptionStatus,
} from "@/types/api";

// ---------------------------------------------------------------------------
// Development-only fixtures for the PatientDetailDrawer.
// Consumed only when NEXT_PUBLIC_USE_MOCKS=true — never imported in production.
// ---------------------------------------------------------------------------

export const MOCK_PATIENT_PROFILES: Record<number, PatientResponse> = {
  1001: { id: 1001, userId: 1001, email: "marija.petrovska@mail.mk", firstName: "Марија", lastName: "Петровска", phoneNumber: "+389 70 123 456", dateOfBirth: "1985-03-12", gender: "F", bloodType: "A_POS", allergies: "Пеницилин", chronicConditions: "Хипертензија", insuranceProvider: "Македонско здравство", insuranceNumber: "MK-1001-2024", emergencyContact: "Петар Петровски", emergencyPhone: "+389 70 999 001", address: "ул. Партизанска 14", city: "Скопје", postalCode: "1000", country: "Македонија" },
  1002: { id: 1002, userId: 1002, email: "aleksandar.stojanovski@mail.mk", firstName: "Александар", lastName: "Стојановски", phoneNumber: "+389 71 234 567", dateOfBirth: "1972-07-28", gender: "M", bloodType: "O_POS", allergies: null, chronicConditions: "Дијабет тип 2, Дислипидемија", insuranceProvider: "Македонско здравство", insuranceNumber: "MK-1002-2024", emergencyContact: "Ана Стојановска", emergencyPhone: "+389 71 888 002", address: "ул. Борис Трајковски 7", city: "Скопје", postalCode: "1000", country: "Македонија" },
  1003: { id: 1003, userId: 1003, email: "elena.nikolovska@mail.mk", firstName: "Елена", lastName: "Николовска", phoneNumber: "+389 72 345 678", dateOfBirth: "1990-11-05", gender: "F", bloodType: "B_POS", allergies: "Аспирин, Ибупрофен", chronicConditions: null, insuranceProvider: "Македонско здравство", insuranceNumber: "MK-1003-2024", emergencyContact: "Марко Николовски", emergencyPhone: "+389 72 777 003", address: "ул. Загреб 21", city: "Битола", postalCode: "7000", country: "Македонија" },
  1004: { id: 1004, userId: 1004, email: "borce.dimovski@mail.mk", firstName: "Борче", lastName: "Димовски", phoneNumber: "+389 75 456 789", dateOfBirth: "1968-01-19", gender: "M", bloodType: "AB_NEG", allergies: null, chronicConditions: "Дијабет тип 2, Хипертензија, Гојазност", insuranceProvider: "Македонско здравство", insuranceNumber: "MK-1004-2024", emergencyContact: "Весна Димовска", emergencyPhone: "+389 75 666 004", address: "ул. Митрополит Теодосиј Гологанов 33", city: "Скопје", postalCode: "1000", country: "Македонија" },
  1005: { id: 1005, userId: 1005, email: "sanja.velkoska@mail.mk", firstName: "Сања", lastName: "Велкоска", phoneNumber: "+389 76 567 890", dateOfBirth: "1995-06-22", gender: "F", bloodType: "A_NEG", allergies: null, chronicConditions: null, insuranceProvider: "Македонско здравство", insuranceNumber: "MK-1005-2024", emergencyContact: null, emergencyPhone: null, address: "ул. Димитар Влахов 5", city: "Охрид", postalCode: "6000", country: "Македонија" },
  1006: { id: 1006, userId: 1006, email: "goran.trajkovski@mail.mk", firstName: "Горан", lastName: "Трајковски", phoneNumber: "+389 77 678 901", dateOfBirth: "1980-09-14", gender: "M", bloodType: "O_NEG", allergies: "Сулфонамиди", chronicConditions: "Хронична бубрежна болест стадиум 2", insuranceProvider: "Македонско здравство", insuranceNumber: "MK-1006-2024", emergencyContact: "Снежана Трајковска", emergencyPhone: "+389 77 555 006", address: "ул. Васко Карангелевски 9", city: "Скопје", postalCode: "1000", country: "Македонија" },
  1007: { id: 1007, userId: 1007, email: "ana.kocevska@mail.mk", firstName: "Ана", lastName: "Коцевска", phoneNumber: "+389 78 789 012", dateOfBirth: "1988-04-30", gender: "F", bloodType: "B_NEG", allergies: null, chronicConditions: "Хипотиреоза", insuranceProvider: "Македонско здравство", insuranceNumber: "MK-1007-2024", emergencyContact: "Ристе Коцевски", emergencyPhone: "+389 78 444 007", address: "ул. Смиљаничка 17", city: "Скопје", postalCode: "1000", country: "Македонија" },
  1008: { id: 1008, userId: 1008, email: "metodi.stefanovski@mail.mk", firstName: "Методи", lastName: "Стефановски", phoneNumber: "+389 79 890 123", dateOfBirth: "1963-12-08", gender: "M", bloodType: "A_POS", allergies: "Контрастни средства", chronicConditions: "ХОББ, Артериска хипертензија", insuranceProvider: "Македонско здравство", insuranceNumber: "MK-1008-2024", emergencyContact: "Лилјана Стефановска", emergencyPhone: "+389 79 333 008", address: "ул. Мајка Тереза 44", city: "Скопје", postalCode: "1000", country: "Македонија" },
};

export const MOCK_RECORDS: Record<number, MedicalRecordResponse[]> = {
  1001: [
    { id: 101, patientId: 1001, patientName: null, doctorId: 1, doctorName: "Stefan Perovski", doctorSpecialization: "Internal Medicine", hospitalId: 1, appointmentId: 2, diagnosis: "Есенцијална хипертензија", mkb10Code: "I10", clinicalNotes: "Пациентот се жали на главоболка и зашеметеност. КП: 155/95 mmHg. Препишана терапија со ACE инхибитор.", vitalSigns: null, bloodPressure: "155/95", heartRate: 88, temperature: 36.7, weight: 68, height: 165, bmi: 24.9, assessment: "Неконтролирана хипертензија", plan: "Рамиприл 5mg 1x дневно, контрола за 4 недели", confidential: false, updatedAt: "", createdAt: "2026-03-15T10:30:00" },
    { id: 102, patientId: 1001, patientName: null, doctorId: 1, doctorName: "Stefan Perovski", doctorSpecialization: "Internal Medicine", hospitalId: 1, appointmentId: null, diagnosis: "Хипертензија под контрола", mkb10Code: "I10", clinicalNotes: "КП: 130/82 mmHg. Терапијата добро се поднесува. Нема несакани ефекти. Продолжи со тековна терапија.", vitalSigns: null, bloodPressure: "130/82", heartRate: 72, temperature: 36.5, weight: 67, height: 165, bmi: 24.6, assessment: "Добра контрола на ХТА", plan: "Продолжи со Рамиприл 5mg, следна контрола за 3 месеци", confidential: false, updatedAt: "", createdAt: "2026-01-20T09:00:00" },
  ],
  1002: [
    { id: 103, patientId: 1002, patientName: null, doctorId: 1, doctorName: "Stefan Perovski", doctorSpecialization: "Internal Medicine", hospitalId: 1, appointmentId: 3, diagnosis: "Дијабет мелитус тип 2 — лоша контрола", mkb10Code: "E11", clinicalNotes: "HbA1c: 9.2%. Пациентот не се придржува до диета. Зголемена доза на Метформин. ЕКГ наручен.", vitalSigns: null, bloodPressure: "142/88", heartRate: 91, temperature: 36.9, weight: 102, height: 178, bmi: 32.2, assessment: "Дијабет со лоша гликемиска контрола, метаболен синдром", plan: "Метформин 1000mg 2x дневно, диетален режим, ЕКГ, липиден профил", confidential: false, updatedAt: "", createdAt: "2026-04-18T11:00:00" },
  ],
  1003: [
    { id: 104, patientId: 1003, patientName: null, doctorId: 1, doctorName: "Stefan Perovski", doctorSpecialization: "Internal Medicine", hospitalId: 1, appointmentId: 4, diagnosis: "Артериска хипертензија", mkb10Code: "I10", clinicalNotes: "Прв преглед. КП: 148/92 mmHg. Алергии на НСАИЛ. Започната нефармаколошка терапија.", vitalSigns: null, bloodPressure: "148/92", heartRate: 80, temperature: 36.6, weight: 72, height: 168, bmi: 25.5, assessment: "Нова дијагноза на ХТА стадиум 1", plan: "Промена на животен стил, контрола за 1 месец. При неуспех — Калциум антагонист (не НСАИЛ заради алергија)", confidential: false, updatedAt: "", createdAt: "2026-04-10T08:30:00" },
    { id: 105, patientId: 1003, patientName: null, doctorId: 1, doctorName: "Stefan Perovski", doctorSpecialization: "Internal Medicine", hospitalId: 1, appointmentId: 5, diagnosis: "Рутински преглед", mkb10Code: "Z00.0", clinicalNotes: "Годишна контрола. Пациентот без поплаки. КП нормален. Лабораториски наоди во норма.", vitalSigns: null, bloodPressure: "122/78", heartRate: 68, temperature: 36.5, weight: 71, height: 168, bmi: 25.1, assessment: "Здраво лице", plan: "Следна контрола за 12 месеци", confidential: false, updatedAt: "", createdAt: "2026-02-20T09:00:00" },
  ],
  1004: [
    { id: 106, patientId: 1004, patientName: null, doctorId: 1, doctorName: "Stefan Perovski", doctorSpecialization: "Internal Medicine", hospitalId: 1, appointmentId: 6, diagnosis: "Дијабет мелитус тип 2", mkb10Code: "E11.9", clinicalNotes: "Контрола на гликемија. Гладен шеќер: 8.4 mmol/L. HbA1c чека. Препорачано засилување на терапија.", vitalSigns: null, bloodPressure: "138/86", heartRate: 84, temperature: 36.8, weight: 118, height: 182, bmi: 35.7, assessment: "Дијабет со умерена контрола, дислипидемија", plan: "Додај Glimepirid 2mg, Atorvastatin 20mg, контрола за 6 недели", confidential: false, updatedAt: "", createdAt: "2026-03-01T14:00:00" },
  ],
  1005: [
    { id: 107, patientId: 1005, patientName: null, doctorId: 1, doctorName: "Stefan Perovski", doctorSpecialization: "Internal Medicine", hospitalId: 1, appointmentId: 8, diagnosis: "Нестабилна ангина пекторис", mkb10Code: "I20.0", clinicalNotes: "Пациентот со атипична болка во градите при напор. ЕКГ: СТ депресија во V4-V6. Упатен на кардиолог. Иницирана антиангинозна терапија.", vitalSigns: null, bloodPressure: "135/85", heartRate: 92, temperature: 36.6, weight: 61, height: 162, bmi: 23.2, assessment: "Суспектна нестабилна ангина — потребна кардиолошка евалуација", plan: "Аспирин 100mg, Нитроглицерин SL при болка, ургентно кардиолошко упатство", confidential: false, updatedAt: "", createdAt: "2026-05-05T10:00:00" },
  ],
  1006: [
    { id: 108, patientId: 1006, patientName: null, doctorId: 1, doctorName: "Stefan Perovski", doctorSpecialization: "Internal Medicine", hospitalId: 1, appointmentId: 9, diagnosis: "Хронична бубрежна болест стадиум 2", mkb10Code: "N18.2", clinicalNotes: "GFR: 68 ml/min. Протеинурија: 0.4 g/24h. Лабораториски наоди нарачани. Советување за протеинска диета.", vitalSigns: null, bloodPressure: "140/90", heartRate: 76, temperature: 36.7, weight: 83, height: 175, bmi: 27.1, assessment: "ХББ ст.2 со протеинурија, ХТА", plan: "Рамиприл 10mg (нефропротекција), диета со ниски протеини, контрола за 2 месеци", confidential: false, updatedAt: "", createdAt: "2026-04-05T09:30:00" },
  ],
  1007: [
    { id: 109, patientId: 1007, patientName: null, doctorId: 1, doctorName: "Stefan Perovski", doctorSpecialization: "Internal Medicine", hospitalId: 1, appointmentId: 10, diagnosis: "Хипотиреоза", mkb10Code: "E03.9", clinicalNotes: "TSH: 7.8 mIU/L. FT4 на долна граница. Пациентот со замор и зголемена телесна тежина. Дозата на Levothyroxin зголемена.", vitalSigns: null, bloodPressure: "118/72", heartRate: 58, temperature: 36.3, weight: 74, height: 170, bmi: 25.6, assessment: "Субклиничка хипотиреоза", plan: "Levothyroxin 75mcg наутро на гладно, контрола на TSH за 6 недели", confidential: false, updatedAt: "", createdAt: "2026-04-22T15:30:00" },
    { id: 110, patientId: 1007, patientName: null, doctorId: 1, doctorName: "Stefan Perovski", doctorSpecialization: "Internal Medicine", hospitalId: 1, appointmentId: 11, diagnosis: "Хипотиреоза — иницијална дијагноза", mkb10Code: "E03.9", clinicalNotes: "Нова пациентка. TSH: 12.4 mIU/L. Клиничка слика: замор, добивање на тежина, опстипација. Иницирана супституциска терапија.", vitalSigns: null, bloodPressure: "115/70", heartRate: 55, temperature: 36.2, weight: 76, height: 170, bmi: 26.3, assessment: "Хипотиреоза", plan: "Levothyroxin 50mcg, лабораториска контрола за 6-8 недели", confidential: false, updatedAt: "", createdAt: "2026-01-18T11:00:00" },
  ],
  1008: [
    { id: 111, patientId: 1008, patientName: null, doctorId: 1, doctorName: "Stefan Perovski", doctorSpecialization: "Internal Medicine", hospitalId: 1, appointmentId: 12, diagnosis: "ХОББ — средно тешка форма", mkb10Code: "J44.1", clinicalNotes: "Пациент пушач 35 пакет/години. FEV1/FVC: 0.62. SpO2: 94% на воздух. Диспнеа при умерен напор. Започнат LAMA инхалатор.", vitalSigns: null, bloodPressure: "145/92", heartRate: 88, temperature: 36.8, weight: 78, height: 173, bmi: 26.1, assessment: "ХОББ GOLD стадиум 2, ХТА", plan: "Tiotropium инхалатор 1x дневно, спирометриска контрола, советување за откажување пушење", confidential: false, updatedAt: "", createdAt: "2026-05-10T08:00:00" },
  ],
};

export const MOCK_ACTIVE_MEDS: Record<number, string[]> = {
  1001: ["Рамиприл 5mg"],
  1002: ["Метформин 1000mg"],
  1003: [],
  1004: ["Метформин 1000mg", "Glimepirid 2mg", "Atorvastatin 20mg"],
  1005: ["Аспирин 100mg", "Нитроглицерин SL"],
  1006: ["Рамиприл 10mg"],
  1007: ["Levothyroxin 75mcg"],
  1008: ["Tiotropium инхалатор"],
};

export const MOCK_PRESCRIPTIONS: Record<number, PrescriptionResponse[]> = {
  1001: [
    { id: 201, patientId: 1001, doctorId: 1, doctorName: "Stefan Perovski", medicalRecordId: 101, medicationName: "Рамиприл", dosage: "5mg", frequency: "1x дневно наутро", durationDays: 90, quantity: 90, route: "ORAL" as PrescriptionRoute, instructions: "Следи КП редовно", startDate: "2026-03-15", endDate: "2026-06-15", status: "ACTIVE" as PrescriptionStatus, filledAtPharmacy: null, pharmacyName: null, refillsAllowed: 2, refillsUsed: 1, createdAt: "2026-03-15T10:30:00" },
  ],
  1002: [
    { id: 202, patientId: 1002, doctorId: 1, doctorName: "Stefan Perovski", medicalRecordId: 103, medicationName: "Метформин", dosage: "1000mg", frequency: "2x дневно со оброк", durationDays: 90, quantity: 180, route: "ORAL" as PrescriptionRoute, instructions: "Земи со оброк за да се намали иритација", startDate: "2026-04-18", endDate: "2026-07-18", status: "ACTIVE" as PrescriptionStatus, filledAtPharmacy: null, pharmacyName: null, refillsAllowed: 2, refillsUsed: 0, createdAt: "2026-04-18T11:00:00" },
  ],
  1004: [
    { id: 203, patientId: 1004, doctorId: 1, doctorName: "Stefan Perovski", medicalRecordId: 106, medicationName: "Glimepirid", dosage: "2mg", frequency: "1x пред доручек", durationDays: 90, quantity: 90, route: "ORAL" as PrescriptionRoute, instructions: null, startDate: "2026-03-01", endDate: "2026-06-01", status: "ACTIVE" as PrescriptionStatus, filledAtPharmacy: null, pharmacyName: null, refillsAllowed: 1, refillsUsed: 0, createdAt: "2026-03-01T14:00:00" },
    { id: 204, patientId: 1004, doctorId: 1, doctorName: "Stefan Perovski", medicalRecordId: 106, medicationName: "Atorvastatin", dosage: "20mg", frequency: "1x навечер", durationDays: 90, quantity: 90, route: "ORAL" as PrescriptionRoute, instructions: "Земи навечер", startDate: "2026-03-01", endDate: "2026-06-01", status: "ACTIVE" as PrescriptionStatus, filledAtPharmacy: null, pharmacyName: null, refillsAllowed: 1, refillsUsed: 0, createdAt: "2026-03-01T14:00:00" },
  ],
  1005: [
    { id: 205, patientId: 1005, doctorId: 1, doctorName: "Stefan Perovski", medicalRecordId: 107, medicationName: "Аспирин", dosage: "100mg", frequency: "1x дневно со оброк", durationDays: 365, quantity: 365, route: "ORAL" as PrescriptionRoute, instructions: "Не земај на гладно", startDate: "2026-05-05", endDate: "2027-05-05", status: "ACTIVE" as PrescriptionStatus, filledAtPharmacy: null, pharmacyName: null, refillsAllowed: 3, refillsUsed: 0, createdAt: "2026-05-05T10:00:00" },
  ],
  1006: [
    { id: 206, patientId: 1006, doctorId: 1, doctorName: "Stefan Perovski", medicalRecordId: 108, medicationName: "Рамиприл", dosage: "10mg", frequency: "1x дневно наутро", durationDays: 90, quantity: 90, route: "ORAL" as PrescriptionRoute, instructions: "Редовна контрола на KAL и KREA", startDate: "2026-04-05", endDate: "2026-07-05", status: "ACTIVE" as PrescriptionStatus, filledAtPharmacy: null, pharmacyName: null, refillsAllowed: 2, refillsUsed: 0, createdAt: "2026-04-05T09:30:00" },
  ],
  1007: [
    { id: 207, patientId: 1007, doctorId: 1, doctorName: "Stefan Perovski", medicalRecordId: 109, medicationName: "Levothyroxin", dosage: "75mcg", frequency: "1x наутро на гладно 30мин пред оброк", durationDays: 90, quantity: 90, route: "ORAL" as PrescriptionRoute, instructions: "Не земај со млеко или кафе", startDate: "2026-04-22", endDate: "2026-07-22", status: "ACTIVE" as PrescriptionStatus, filledAtPharmacy: null, pharmacyName: null, refillsAllowed: 2, refillsUsed: 0, createdAt: "2026-04-22T15:30:00" },
  ],
  1008: [
    { id: 208, patientId: 1008, doctorId: 1, doctorName: "Stefan Perovski", medicalRecordId: 111, medicationName: "Tiotropium", dosage: "18mcg", frequency: "1x дневно (инхалација)", durationDays: 90, quantity: 1, route: "INHALED" as PrescriptionRoute, instructions: "Redovno inhaliraj, ne preskocuvaj", startDate: "2026-05-10", endDate: "2026-08-10", status: "ACTIVE" as PrescriptionStatus, filledAtPharmacy: null, pharmacyName: null, refillsAllowed: 2, refillsUsed: 0, createdAt: "2026-05-10T08:00:00" },
  ],
};
