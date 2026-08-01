-- V106 — Per-form boxes on the referral.
--
-- The ФЗОМ forms separate what our schema kept in one free-text `referred_to`.
-- Every form has a box for the receiving Здравствена установа, and then one
-- more box whose meaning depends on the form:
--
--   СУ   Специјалност            + a numbered "УПАТ ЗА" choice (1/2/3)
--   ЛУ   Вид на здравствена услуга
--   РДУ  Назив на апарат / „За снимање на:"
--   БУ   Специјалност + Работна единица-Одделение   (ward_unit, added in V105)
--
-- `referred_to` is kept as the receiving institution so existing rows stay
-- meaningful and the list column keeps working; the rest move to their own
-- columns so the printed form can put each value in the right box.

ALTER TABLE referrals
    ADD COLUMN IF NOT EXISTS referred_specialty VARCHAR(200),
    ADD COLUMN IF NOT EXISTS service_detail     TEXT,
    ADD COLUMN IF NOT EXISTS form_subtype       SMALLINT;

COMMENT ON COLUMN referrals.referred_to IS 'Здравствена установа to which the patient is referred';
COMMENT ON COLUMN referrals.referred_specialty IS 'Специјалност — СУ and БУ';
COMMENT ON COLUMN referrals.service_detail IS 'Вид на услуга (ЛУ) / назив на апарат (РДУ)';
COMMENT ON COLUMN referrals.form_subtype IS
    'Образец СУ „УПАТ ЗА": 1=специјалист/супспецијалист, 2=дијагностичка лабораторија, 3=дијагностичка процедура';

-- The СУ subtype is one of exactly three printed choices; anything else would
-- render an unticked form.
ALTER TABLE referrals
    ADD CONSTRAINT chk_referrals_form_subtype
    CHECK (form_subtype IS NULL OR form_subtype BETWEEN 1 AND 3);
