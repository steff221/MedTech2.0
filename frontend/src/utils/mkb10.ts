// Static subset of ICD-10 / МКБ10 codes for the SOAP form autocomplete.
// Sourced from the WHO ICD-10 catalog; covers the conditions most likely to
// appear in the demo. Extend or replace with a fetched catalog later.

export interface Mkb10Entry {
  code: string;
  label: string;
  group: string;
}

export const MKB10_CATALOG: Mkb10Entry[] = [
  { code: "I10",   label: "Essential (primary) hypertension",      group: "Cardiovascular" },
  { code: "I11.9", label: "Hypertensive heart disease without HF", group: "Cardiovascular" },
  { code: "I25.10",label: "Atherosclerotic heart disease",         group: "Cardiovascular" },
  { code: "I48.91",label: "Atrial fibrillation, unspecified",      group: "Cardiovascular" },

  { code: "E11.9", label: "Type 2 diabetes mellitus, no complications", group: "Endocrine" },
  { code: "E78.5", label: "Hyperlipidaemia, unspecified",          group: "Endocrine" },
  { code: "E03.9", label: "Hypothyroidism, unspecified",           group: "Endocrine" },

  { code: "J06.9", label: "Acute upper respiratory infection",     group: "Respiratory" },
  { code: "J45.909",label:"Unspecified asthma, uncomplicated",     group: "Respiratory" },
  { code: "J20.9", label: "Acute bronchitis, unspecified",         group: "Respiratory" },
  { code: "J30.2", label: "Allergic rhinitis (seasonal)",          group: "Respiratory" },

  { code: "K21.9", label: "Gastro-oesophageal reflux disease (GERD)", group: "Digestive" },
  { code: "K29.7", label: "Gastritis, unspecified",                group: "Digestive" },
  { code: "K59.00",label: "Constipation, unspecified",             group: "Digestive" },

  { code: "G43.9", label: "Migraine, unspecified",                 group: "Neurological" },
  { code: "G44.209",label:"Tension-type headache, unspecified",    group: "Neurological" },

  { code: "M54.5", label: "Low back pain",                         group: "Musculoskeletal" },
  { code: "M25.50",label: "Pain in unspecified joint",             group: "Musculoskeletal" },
  { code: "M79.7", label: "Fibromyalgia",                          group: "Musculoskeletal" },

  { code: "L20.9", label: "Atopic dermatitis, unspecified",        group: "Skin" },
  { code: "L70.0", label: "Acne vulgaris",                         group: "Skin" },
  { code: "L40.0", label: "Psoriasis vulgaris",                    group: "Skin" },

  { code: "F32.9", label: "Major depressive disorder, single episode", group: "Mental health" },
  { code: "F41.1", label: "Generalized anxiety disorder",          group: "Mental health" },
  { code: "F51.0", label: "Insomnia, non-organic",                 group: "Mental health" },

  { code: "D50.9", label: "Iron-deficiency anaemia, unspecified",  group: "Blood" },

  { code: "N39.0", label: "Urinary tract infection, site NOS",     group: "Genitourinary" },

  { code: "Z00.00",label: "General adult medical exam, no findings", group: "Preventive" },
  { code: "Z23",   label: "Encounter for immunisation",            group: "Preventive" },
];

export function searchMkb10(query: string, limit = 8): Mkb10Entry[] {
  const q = query.trim().toLowerCase();
  if (!q) return MKB10_CATALOG.slice(0, limit);
  return MKB10_CATALOG.filter(
    (e) => e.code.toLowerCase().includes(q) || e.label.toLowerCase().includes(q),
  ).slice(0, limit);
}
