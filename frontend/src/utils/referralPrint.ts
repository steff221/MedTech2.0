// Печатење на упат — официјални ФЗОМ обрасци.
import { esc } from "@/utils/html";
import type { DoctorResponse, PatientResponse, ReferralResponse } from "@/types/api";

/**
 * Why printing returns a result instead of throwing.
 *
 * The referral row is saved before the document is produced, so a failure here
 * leaves a numbered referral in the system with no paper. The caller has to be
 * able to tell the doctor exactly that and offer a retry — a swallowed error
 * would leave them holding a saved referral, no document and no message.
 */
export type PrintResult =
  | { ok: true }
  | { ok: false; reason: "popup-blocked" | "write-failed" };

interface PrintContext {
  referral: ReferralResponse;
  doctor:   DoctorResponse | undefined;
  patient:  PatientResponse | undefined;
  /**
   * The issuing doctor's specialty in Macedonian. Specializations are stored
   * in English ("Internal Medicine") and translated through `t.specialties` at
   * render time; this module has no access to the translation map, so the
   * caller resolves it. Printing the raw column would put English on an
   * official Macedonian form.
   */
  doctorSpecialtyMk?: string;
}


/** dd.MM.yyyy, or a ruled blank the doctor can complete by hand. */
const d = (iso: string | null | undefined): string => {
  if (!iso) return "";
  const [y, m, day] = iso.slice(0, 10).split("-");
  return `${day}.${m}.${y}`;
};

/**
 * A labelled box. `value` may legitimately be empty — a ФЗОМ form has boxes we
 * do not hold data for (Новороденче, Странски осигуреник), and printing them
 * as ruled blanks is correct. What must never happen is the box disappearing,
 * because then the sheet stops matching the official form.
 */
const box = (label: string, value: string, span = 1) => `
  <div class="box" style="grid-column: span ${span}">
    <div class="box-label">${esc(label)}</div>
    <div class="box-value">${esc(value) || "&nbsp;"}</div>
  </div>`;

const STYLES = `
  @page { size: A4; margin: 12mm; }
  * { box-sizing: border-box; }
  body { font-family: "Times New Roman", Georgia, serif; font-size: 11pt; color: #000; margin: 0; }
  .sheet { width: 100%; }
  .form-code { text-align: right; font-size: 9pt; letter-spacing: .04em; }
  .rule { border-top: 1.5px solid #000; margin: 6px 0 10px; }
  .top { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; align-items: end; margin-bottom: 8px; }
  .no { font-size: 13pt; font-weight: bold; letter-spacing: .06em; }
  .party { display: grid; grid-template-columns: 1fr 1fr; gap: 14px; margin-bottom: 10px; }
  .party h3 { font-size: 9pt; letter-spacing: .12em; margin: 0 0 4px; text-transform: uppercase; }
  .section-title { font-size: 9pt; letter-spacing: .12em; text-transform: uppercase;
                   background: #eee; padding: 3px 6px; margin: 10px 0 6px; border: 1px solid #000; }
  .grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 6px 14px; }
  .box { min-height: 34px; }
  .box-label { font-size: 8pt; color: #333; }
  .box-value { border-bottom: 1px solid #000; min-height: 18px; padding: 1px 2px; font-size: 11pt; }
  .choices { display: grid; grid-template-columns: repeat(3, 1fr); gap: 8px; margin: 4px 0 8px; }
  .choice { display: flex; align-items: center; gap: 6px; font-size: 10pt; }
  .tick { width: 14px; height: 14px; border: 1.2px solid #000; display: inline-block;
          text-align: center; line-height: 12px; font-weight: bold; flex: none; }
  .free { border: 1px solid #000; min-height: 70px; padding: 4px 6px; white-space: pre-wrap; }
  .foot { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 14px; margin-top: 22px; align-items: end; }
  .sig { text-align: center; }
  .sig-line { border-bottom: 1px solid #000; height: 30px; }
  .sig-cap { font-size: 8pt; margin-top: 3px; }
  .stamp { border: 1px solid #000; height: 62px; display: flex; align-items: center;
           justify-content: center; font-size: 9pt; letter-spacing: .1em; }
  .cat { width: 100%; border-collapse: collapse; margin-top: 8px; font-size: 9pt; }
  .cat th, .cat td { border: 1px solid #000; padding: 3px 4px; text-align: left; }
  .cat th { background: #eee; font-weight: normal; }
  .cat td { height: 20px; }
  .void { position: fixed; inset: 0; display: flex; align-items: center; justify-content: center;
          font-size: 60pt; color: rgba(0,0,0,.18); font-weight: bold; letter-spacing: .1em;
          transform: rotate(-20deg); pointer-events: none; }
`;

/** The three numbered choices in the СУ „УПАТ ЗА" block. */
const SU_CHOICES = [
  "Специјалист / супспецијалист",
  "Дијагностичка лабораторија",
  "Дијагностичка процедура",
];

/** Образец СУ — специјалистички/супспецијалистички/интерспецијалистички преглед. */
function renderSU({ referral, doctor, patient, doctorSpecialtyMk }: PrintContext): string {
  const patientName = referral.patientName ?? "";
  // ЕЗБО and ЕМБГ share one box on the form, separated by a slash.
  const ids = [patient?.ezbo, patient?.embg].filter(Boolean).join(" / ");
  const cancelled = referral.status === "CANCELLED";

  return `
  <div class="sheet">
    <div class="form-code">ФЗОРСМ — Образец ${esc(referral.fzomFormCode ?? "СУ")}</div>
    <div class="rule"></div>

    <div class="top">
      <div class="no">УПАТ БР. ${esc(referral.referralNumber)}</div>
      ${box("ТЕРМИН (датум и час)", d(referral.scheduledDate))}
    </div>

    <div class="party">
      <div>
        <h3>Упатува</h3>
        <div class="grid" style="grid-template-columns: 1fr">
          ${box("Здравствена установа", doctor?.hospitalName ?? "")}
          ${box("Место, Општина", doctor?.hospitalCity ?? "")}
          ${box("Специјалност", doctorSpecialtyMk ?? doctor?.specialization ?? "")}
          ${box("Број на лекарски дневник", referral.medicalJournalNo ?? "")}
        </div>
      </div>
      <div>
        <h3>До</h3>
        <div class="grid" style="grid-template-columns: 1fr">
          ${box("Здравствена установа", referral.referredTo)}
          ${box("Специјалност", referral.referredSpecialty ?? "")}
          ${box("Лекар / апарат / амбуланта", "")}
          ${box("Факсимил", "")}
        </div>
      </div>
    </div>

    <div class="section-title">Податоци за пациентот</div>
    <div class="grid">
      ${box("Име и Презиме", patientName)}
      ${box("ЕЗБО / ЕМБГ", ids)}
      ${box("Телефон", patient?.phoneNumber ?? "")}
      ${box("Е-пошта", patient?.email ?? "")}
      ${box("Датум на раѓање", d(patient?.dateOfBirth))}
      ${box("Регистарски број (новороденче)", "")}
      ${box("Град и држава на осигурување", patient?.city ?? "")}
      ${box("EHIC / Бр. на осиг. / Бр. на пасош", patient?.insuranceNumber ?? "")}
    </div>

    <div class="section-title">Упат за специјалистички / супспецијалистички / интерспецијалистички преглед</div>
    <div class="choices">
      ${SU_CHOICES.map((label, i) => `
        <div class="choice">
          <span class="tick">${referral.formSubtype === i + 1 ? "X" : "&nbsp;"}</span>
          <span>${i + 1} ${esc(label)}</span>
        </div>`).join("")}
    </div>

    <div class="grid">
      ${box("Дијагноза — шифра по МКБ-10", referral.mkb10Code ?? "")}
      ${box("Опис на МКБ-10", referral.description ?? "")}
    </div>

    <div class="section-title">Молам, се бара</div>
    <div class="free">${esc(referral.serviceDetail ?? referral.description ?? "")}</div>

    <div class="foot">
      ${box("Датум на издавање на упатот", d(referral.createdAt?.slice(0, 10)))}
      <div class="sig">
        <div class="sig-line"></div>
        <div class="sig-cap">
          ${esc(doctor ? `д-р ${doctor.firstName} ${doctor.lastName}` : "Име и презиме на лекар")}
          ${doctor?.facsimileNumber ? ` · Факсимил ${esc(doctor.facsimileNumber)}` : ""}
        </div>
      </div>
      <div class="stamp">М.П.</div>
    </div>

    ${cancelled ? `<div class="void">ПОНИШТЕНО</div>` : ""}
  </div>`;
}


/**
 * Патient identity block. Every ФЗОМ referral repeats the same boxes, worded
 * slightly differently per form — the labels are passed in so each form can
 * match its own sheet without duplicating the values.
 */
function patientBlock(p: PatientResponse | undefined, name: string, opts: { withContact?: boolean } = {}) {
  return `
    <div class="section-title">Се упатува</div>
    <div class="grid">
      ${box("Презиме, име на родител/старател и име на осигуреното лице", name, 2)}
      ${box("Адреса", [p?.address, p?.city].filter(Boolean).join(", "), 2)}
      ${box("Број на здравствена легитимација", p?.insuranceNumber ?? "")}
      ${box("Единствен матичен број на осигуреникот (ЕМБГ)", p?.embg ?? "")}
      ${box("Единствен здравствен број на осигуреникот (ЕЗБО)", p?.ezbo ?? "")}
      ${box("Основ на осигурување", p?.insuranceProvider ?? "")}
      ${opts.withContact ? box("Телефон", p?.phoneNumber ?? "") + box("Е-пошта", p?.email ?? "") : ""}
    </div>`;
}

/** УПАТУВА → ДО. `toRows` differs per form, hence passed in. */
function partiesBlock(doctor: DoctorResponse | undefined, specialtyMk: string | undefined,
                      journalNo: string | undefined | null, toRows: string) {
  return `
    <div class="party">
      <div>
        <h3>Упатува</h3>
        <div class="grid" style="grid-template-columns: 1fr">
          ${box("Назив на здравствена установа", doctor?.hospitalName ?? "")}
          ${box("Работна единица — Одделение", "")}
          ${box("Место", doctor?.hospitalCity ?? "")}
          ${box("Специјалност", specialtyMk ?? doctor?.specialization ?? "")}
          ${box("Број на лекарски дневник", journalNo ?? "")}
        </div>
      </div>
      <div>
        <h3>До</h3>
        <div class="grid" style="grid-template-columns: 1fr">${toRows}</div>
      </div>
    </div>`;
}

/** Датум · потпис · М.П. — identical across all forms. */
function signatureBlock(referral: ReferralResponse, doctor: DoctorResponse | undefined) {
  return `
    <div class="foot">
      ${box("Датум на издавање на упатот", d(referral.createdAt?.slice(0, 10)))}
      <div class="sig">
        <div class="sig-line"></div>
        <div class="sig-cap">
          ${esc(doctor ? `д-р ${doctor.firstName} ${doctor.lastName}` : "Име и презиме на лекар")}
          ${doctor?.facsimileNumber ? ` · Факсимил ${esc(doctor.facsimileNumber)}` : ""}
        </div>
      </div>
      <div class="stamp">М.П.</div>
    </div>`;
}

/** Образец ЛУ-1 / ЛУ-2 — лабораториски упат. */
function renderLU(ctx: PrintContext): string {
  const { referral, doctor, patient, doctorSpecialtyMk } = ctx;
  const isLu1 = referral.fzomFormCode === "ЛУ-1";
  const to = `
    ${box("Назив на здравствена установа", referral.referredTo)}
    ${box("Место", "")}
    ${box("Лекар", "")}
    ${box("Факсимил", "")}
    ${box("Термин", d(referral.scheduledDate))}`;

  return `
  <div class="sheet">
    <div class="form-code">ФЗОМ — Образец ${esc(referral.fzomFormCode ?? "ЛУ")}</div>
    <div class="rule"></div>
    <div class="no">УПАТ БР. ${esc(referral.referralNumber)}</div>
    ${partiesBlock(doctor, doctorSpecialtyMk, referral.medicalJournalNo, to)}
    <div class="section-title">Лабораториски упат — ${isLu1 ? "1" : "2"}</div>
    ${patientBlock(patient, referral.patientName ?? "")}
    <div class="grid">
      ${box("Шифра по МКБ-10", referral.mkb10Code ?? "")}
      ${box("Број на здравствен картон", "")}
    </div>
    <div class="section-title">Вид на здравствена услуга — лабораториска анализа</div>
    <div class="free">${esc(referral.serviceDetail ?? "")}</div>
    ${isLu1 ? `
    <!-- ЛУ-1 itemises the requested analyses against the ФЗОМ package codes
         (БА2 → БА2/1 …). That catalogue is not held in this system, so the
         table prints as ruled rows for completion by hand rather than being
         silently omitted. -->
    <table class="cat">
      <thead><tr><th>Р.бр</th><th>Шифра на пакет</th><th>Шифра на услугата</th><th>Дел</th><th>Опис на лабораториската услуга</th></tr></thead>
      <tbody>${Array.from({ length: 6 }, (_, i) => `<tr><td>${i + 1}</td><td></td><td></td><td></td><td></td></tr>`).join("")}</tbody>
    </table>` : ""}
    ${signatureBlock(referral, doctor)}
    ${referral.status === "CANCELLED" ? `<div class="void">ПОНИШТЕНО</div>` : ""}
  </div>`;
}

/** Образец РДУ-1 / РДУ-2 — упат за радиодијагностика. */
function renderRDU(ctx: PrintContext): string {
  const { referral, doctor, patient, doctorSpecialtyMk } = ctx;
  const to = `
    ${box("Назив на здравствена установа", referral.referredTo)}
    ${box("Организациона единица", "")}
    ${box("Назив на апарат", referral.serviceDetail ?? "")}
    ${box("Термин", d(referral.scheduledDate))}`;

  return `
  <div class="sheet">
    <div class="form-code">ФЗОМ — Образец ${esc(referral.fzomFormCode ?? "РДУ")}</div>
    <div class="rule"></div>
    <div class="no">УПАТ БР. ${esc(referral.referralNumber)}</div>
    ${partiesBlock(doctor, doctorSpecialtyMk, referral.medicalJournalNo, to)}
    <div class="section-title">Упат за радиодијагностика — ${referral.fzomFormCode === "РДУ-2" ? "2" : "1"}</div>
    ${patientBlock(patient, referral.patientName ?? "")}
    <div class="grid">
      ${box("Шифра по МКБ-10", referral.mkb10Code ?? "")}
      ${box("Број на здравствен картон", "")}
    </div>
    <div class="section-title">За снимање на</div>
    <div class="free">${esc(referral.serviceDetail ?? referral.description ?? "")}</div>
    ${signatureBlock(referral, doctor)}
    ${referral.status === "CANCELLED" ? `<div class="void">ПОНИШТЕНО</div>` : ""}
  </div>`;
}

/** Образец БУ — болнички упат. */
function renderBU(ctx: PrintContext): string {
  const { referral, doctor, patient, doctorSpecialtyMk } = ctx;
  const to = `
    ${box("Назив на болничката здравствена установа", referral.referredTo)}
    ${box("Работна единица — Одделение", referral.wardUnit ?? "")}
    ${box("Специјалност", referral.referredSpecialty ?? "")}
    ${box("Место", "")}
    ${box("Лекар / Факсимил", "")}
    ${box("Термин", d(referral.scheduledDate))}`;

  return `
  <div class="sheet">
    <div class="form-code">ФЗОМ — Образец ${esc(referral.fzomFormCode ?? "БУ")}</div>
    <div class="rule"></div>
    <div class="no">УПАТ БР. ${esc(referral.referralNumber)}</div>
    ${partiesBlock(doctor, doctorSpecialtyMk, referral.medicalJournalNo, to)}
    <div class="section-title">Болнички упат</div>
    ${patientBlock(patient, referral.patientName ?? "", { withContact: true })}
    <div class="grid">
      ${box("Дијагноза — шифра по МКБ-10", referral.mkb10Code ?? "")}
      ${box("Опис на МКБ-10", referral.description ?? "")}
    </div>
    <div class="section-title">Упатство за натамошното лекување на осигуреното лице</div>
    <div class="free">${esc(referral.description ?? "")}</div>
    ${signatureBlock(referral, doctor)}
    ${referral.status === "CANCELLED" ? `<div class="void">ПОНИШТЕНО</div>` : ""}
  </div>`;
}

/**
 * Opens the print dialog for a referral.
 *
 * Dispatches on the resolved ФЗОМ code, so a referral always prints the sheet
 * it was actually issued on rather than a generic document.
 */
function renderForm(ctx: PrintContext): string {
  const code = ctx.referral.fzomFormCode ?? "";
  if (code.startsWith("ЛУ"))  return renderLU(ctx);
  if (code.startsWith("РДУ")) return renderRDU(ctx);
  if (code === "БУ")          return renderBU(ctx);
  return renderSU(ctx);
}

export function printReferralDocument(ctx: PrintContext): PrintResult {
  const win = window.open("", "_blank", "width=900,height=1000");
  // The overwhelmingly likely failure, and the one worth naming precisely:
  // the browser blocked the popup, so nothing was printed at all.
  if (!win) return { ok: false, reason: "popup-blocked" };

  try {
    win.document.write(`<!DOCTYPE html>
<html lang="mk"><head><meta charset="utf-8">
<title>Упат ${esc(ctx.referral.referralNumber)}</title>
<style>${STYLES}</style></head>
<body>${renderForm(ctx)}
<script>window.onload = () => { window.print(); window.close(); }<\/script>
</body></html>`);
    win.document.close();
    return { ok: true };
  } catch {
    win.close();
    return { ok: false, reason: "write-failed" };
  }
}
