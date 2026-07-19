import type { PatientType, RiskTier } from "@chw/content";
import type { ReferralStatus } from "@chw/rules-engine";
import * as SQLite from "expo-sqlite";

export type PatientSex = "FEMALE" | "MALE" | "UNKNOWN";
export type AgeUnit = "DAYS" | "MONTHS" | "YEARS";
export type MaternalStatus = "PREGNANT" | "POSTPARTUM";
export type CaseStatus = "IN_PROGRESS" | "COMPLETED";

export type LocalCase = {
  id: string;
  chwId: string;
  patientType: PatientType;
  patientName: string | null;
  patientSex: PatientSex | null;
  ageValue: number | null;
  ageUnit: AgeUnit | null;
  community: string | null;
  phone: string | null;
  caregiverName: string | null;
  caregiverPhone: string | null;
  maternalStatus: MaternalStatus | null;
  gestationalWeeks: number | null;
  notes: string | null;
  consentAt: string | null;
  status: CaseStatus;
  createdAt: string;
  updatedAt: string;
  syncedAt: string | null;
  riskTier: RiskTier | null;
};

export type LocalResponse = {
  id: string;
  caseId: string;
  itemKey: string;
  answer: number;
};

export type LocalReferral = {
  id: string;
  caseId: string;
  status: ReferralStatus;
  facility: string | null;
  updatedAt: string;
};

export type LocalTimeline = {
  id: string;
  caseId: string;
  kind: string;
  message: string;
  createdAt: string;
};

export type LocalSmsLog = {
  id: string;
  caseId: string;
  to: string;
  message: string;
  status: string;
  createdAt: string;
};

let dbPromise: Promise<SQLite.SQLiteDatabase> | null = null;

export function getDb() {
  if (!dbPromise) {
    dbPromise = openAndMigrate();
  }
  return dbPromise;
}

async function columnExists(
  db: SQLite.SQLiteDatabase,
  table: string,
  column: string
) {
  const cols = await db.getAllAsync<{ name: string }>(
    `PRAGMA table_info(${table})`
  );
  return cols.some((c) => c.name === column);
}

async function getColumnMeta(
  db: SQLite.SQLiteDatabase,
  table: string,
  column: string
) {
  const cols = await db.getAllAsync<{
    name: string;
    notnull: number;
  }>(`PRAGMA table_info(${table})`);
  return cols.find((c) => c.name === column) ?? null;
}

async function ensureColumn(
  db: SQLite.SQLiteDatabase,
  table: string,
  column: string,
  definition: string
) {
  if (!(await columnExists(db, table, column))) {
    await db.execAsync(
      `ALTER TABLE ${table} ADD COLUMN ${column} ${definition}`
    );
  }
}

/** SQLite cannot ALTER COLUMN nullability — rebuild cases if riskTier is still NOT NULL. */
async function ensureRiskTierNullable(db: SQLite.SQLiteDatabase) {
  const risk = await getColumnMeta(db, "cases", "riskTier");
  if (!risk || risk.notnull === 0) return;

  await db.withTransactionAsync(async () => {
    await db.execAsync(`
      CREATE TABLE cases_migrated (
        id TEXT PRIMARY KEY NOT NULL,
        chwId TEXT NOT NULL,
        patientType TEXT NOT NULL,
        patientName TEXT,
        patientSex TEXT,
        ageValue INTEGER,
        ageUnit TEXT,
        community TEXT,
        phone TEXT,
        caregiverName TEXT,
        caregiverPhone TEXT,
        maternalStatus TEXT,
        gestationalWeeks INTEGER,
        notes TEXT,
        consentAt TEXT,
        status TEXT NOT NULL DEFAULT 'IN_PROGRESS',
        createdAt TEXT NOT NULL,
        updatedAt TEXT NOT NULL,
        syncedAt TEXT,
        riskTier TEXT
      );
    `);
    await db.execAsync(`
      INSERT INTO cases_migrated (
        id, chwId, patientType, patientName, patientSex, ageValue, ageUnit,
        community, phone, caregiverName, caregiverPhone, maternalStatus,
        gestationalWeeks, notes, consentAt, status, createdAt, updatedAt, syncedAt, riskTier
      )
      SELECT
        id, chwId, patientType, patientName,
        patientSex, ageValue, ageUnit, community, phone, caregiverName, caregiverPhone,
        maternalStatus, gestationalWeeks, notes, consentAt,
        COALESCE(NULLIF(status, ''), CASE WHEN riskTier IS NOT NULL THEN 'COMPLETED' ELSE 'IN_PROGRESS' END),
        createdAt, updatedAt, syncedAt, riskTier
      FROM cases;
    `);
    await db.execAsync(`DROP TABLE cases;`);
    await db.execAsync(`ALTER TABLE cases_migrated RENAME TO cases;`);
  });
}

async function openAndMigrate() {
  const db = await SQLite.openDatabaseAsync("chw_companion.db");
  await db.execAsync(`
    PRAGMA journal_mode = WAL;
    CREATE TABLE IF NOT EXISTS cases (
      id TEXT PRIMARY KEY NOT NULL,
      chwId TEXT NOT NULL,
      patientType TEXT NOT NULL,
      patientName TEXT,
      createdAt TEXT NOT NULL,
      updatedAt TEXT NOT NULL,
      syncedAt TEXT,
      riskTier TEXT
    );
    CREATE TABLE IF NOT EXISTS checklist_responses (
      id TEXT PRIMARY KEY NOT NULL,
      caseId TEXT NOT NULL,
      itemKey TEXT NOT NULL,
      answer INTEGER NOT NULL,
      UNIQUE(caseId, itemKey)
    );
    CREATE TABLE IF NOT EXISTS referrals (
      id TEXT PRIMARY KEY NOT NULL,
      caseId TEXT NOT NULL UNIQUE,
      status TEXT NOT NULL,
      facility TEXT,
      updatedAt TEXT NOT NULL
    );
    CREATE TABLE IF NOT EXISTS timeline_events (
      id TEXT PRIMARY KEY NOT NULL,
      caseId TEXT NOT NULL,
      kind TEXT NOT NULL,
      message TEXT NOT NULL,
      createdAt TEXT NOT NULL
    );
    CREATE TABLE IF NOT EXISTS sms_logs (
      id TEXT PRIMARY KEY NOT NULL,
      caseId TEXT NOT NULL,
      "to" TEXT NOT NULL,
      message TEXT NOT NULL,
      status TEXT NOT NULL,
      createdAt TEXT NOT NULL
    );
    CREATE TABLE IF NOT EXISTS meta (
      key TEXT PRIMARY KEY NOT NULL,
      value TEXT NOT NULL
    );
  `);

  await ensureColumn(db, "cases", "patientSex", "TEXT");
  await ensureColumn(db, "cases", "ageValue", "INTEGER");
  await ensureColumn(db, "cases", "ageUnit", "TEXT");
  await ensureColumn(db, "cases", "community", "TEXT");
  await ensureColumn(db, "cases", "phone", "TEXT");
  await ensureColumn(db, "cases", "caregiverName", "TEXT");
  await ensureColumn(db, "cases", "caregiverPhone", "TEXT");
  await ensureColumn(db, "cases", "maternalStatus", "TEXT");
  await ensureColumn(db, "cases", "gestationalWeeks", "INTEGER");
  await ensureColumn(db, "cases", "notes", "TEXT");
  await ensureColumn(db, "cases", "consentAt", "TEXT");
  await ensureColumn(db, "cases", "status", "TEXT NOT NULL DEFAULT 'IN_PROGRESS'");

  await ensureRiskTierNullable(db);

  await db.runAsync(
    `UPDATE cases SET status = 'COMPLETED' WHERE riskTier IS NOT NULL AND (status IS NULL OR status = '')`
  );

  return db;
}

function normalizeCase(row: LocalCase): LocalCase {
  return {
    ...row,
    patientSex: row.patientSex ?? null,
    ageValue: row.ageValue ?? null,
    ageUnit: row.ageUnit ?? null,
    community: row.community ?? null,
    phone: row.phone ?? null,
    caregiverName: row.caregiverName ?? null,
    caregiverPhone: row.caregiverPhone ?? null,
    maternalStatus: row.maternalStatus ?? null,
    gestationalWeeks: row.gestationalWeeks ?? null,
    notes: row.notes ?? null,
    consentAt: row.consentAt ?? null,
    status: row.status ?? (row.riskTier ? "COMPLETED" : "IN_PROGRESS"),
    riskTier: row.riskTier ?? null,
  };
}

export async function listCases(): Promise<
  (LocalCase & { referralStatus?: ReferralStatus | null })[]
> {
  const db = await getDb();
  const rows = await db.getAllAsync<
    LocalCase & { referralStatus: ReferralStatus | null }
  >(
    `SELECT c.*, r.status as referralStatus
     FROM cases c
     LEFT JOIN referrals r ON r.caseId = c.id
     ORDER BY c.createdAt DESC`
  );
  return rows.map((r) => ({ ...normalizeCase(r), referralStatus: r.referralStatus }));
}

export async function getCase(id: string): Promise<LocalCase | null> {
  const db = await getDb();
  const row = await db.getFirstAsync<LocalCase>(
    `SELECT * FROM cases WHERE id = ?`,
    [id]
  );
  return row ? normalizeCase(row) : null;
}

export async function getResponses(caseId: string): Promise<LocalResponse[]> {
  const db = await getDb();
  return db.getAllAsync<LocalResponse>(
    `SELECT * FROM checklist_responses WHERE caseId = ?`,
    [caseId]
  );
}

export async function getReferral(
  caseId: string
): Promise<LocalReferral | null> {
  const db = await getDb();
  return (
    (await db.getFirstAsync<LocalReferral>(
      `SELECT * FROM referrals WHERE caseId = ?`,
      [caseId]
    )) ?? null
  );
}

export async function getTimeline(caseId: string): Promise<LocalTimeline[]> {
  const db = await getDb();
  return db.getAllAsync<LocalTimeline>(
    `SELECT * FROM timeline_events WHERE caseId = ? ORDER BY createdAt DESC`,
    [caseId]
  );
}

export async function countUnsynced(): Promise<number> {
  const db = await getDb();
  const row = await db.getFirstAsync<{ count: number }>(
    `SELECT COUNT(*) as count FROM cases WHERE syncedAt IS NULL`
  );
  return row?.count ?? 0;
}

export async function getLastSyncedAt(): Promise<string | null> {
  const db = await getDb();
  const row = await db.getFirstAsync<{ value: string }>(
    `SELECT value FROM meta WHERE key = 'lastSyncedAt'`
  );
  return row?.value ?? null;
}

export async function setLastSyncedAt(iso: string) {
  const db = await getDb();
  await db.runAsync(
    `INSERT INTO meta (key, value) VALUES ('lastSyncedAt', ?)
     ON CONFLICT(key) DO UPDATE SET value = excluded.value`,
    [iso]
  );
}

export async function upsertCase(c: LocalCase) {
  const db = await getDb();
  const row = normalizeCase(c);
  await db.runAsync(
    `INSERT INTO cases (
      id, chwId, patientType, patientName, patientSex, ageValue, ageUnit,
      community, phone, caregiverName, caregiverPhone, maternalStatus,
      gestationalWeeks, notes, consentAt, status, createdAt, updatedAt, syncedAt, riskTier
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    ON CONFLICT(id) DO UPDATE SET
      patientType=excluded.patientType,
      patientName=excluded.patientName,
      patientSex=excluded.patientSex,
      ageValue=excluded.ageValue,
      ageUnit=excluded.ageUnit,
      community=excluded.community,
      phone=excluded.phone,
      caregiverName=excluded.caregiverName,
      caregiverPhone=excluded.caregiverPhone,
      maternalStatus=excluded.maternalStatus,
      gestationalWeeks=excluded.gestationalWeeks,
      notes=excluded.notes,
      consentAt=excluded.consentAt,
      status=excluded.status,
      updatedAt=excluded.updatedAt,
      syncedAt=excluded.syncedAt,
      riskTier=excluded.riskTier`,
    [
      row.id,
      row.chwId,
      row.patientType,
      row.patientName,
      row.patientSex,
      row.ageValue,
      row.ageUnit,
      row.community,
      row.phone,
      row.caregiverName,
      row.caregiverPhone,
      row.maternalStatus,
      row.gestationalWeeks,
      row.notes,
      row.consentAt,
      row.status,
      row.createdAt,
      row.updatedAt,
      row.syncedAt,
      row.riskTier,
    ]
  );
}

export async function upsertResponse(r: LocalResponse) {
  const db = await getDb();
  await db.runAsync(
    `INSERT INTO checklist_responses (id, caseId, itemKey, answer)
     VALUES (?, ?, ?, ?)
     ON CONFLICT(caseId, itemKey) DO UPDATE SET answer=excluded.answer, id=excluded.id`,
    [r.id, r.caseId, r.itemKey, r.answer]
  );
}

export async function upsertReferral(r: LocalReferral) {
  const db = await getDb();
  await db.runAsync(
    `INSERT INTO referrals (id, caseId, status, facility, updatedAt)
     VALUES (?, ?, ?, ?, ?)
     ON CONFLICT(caseId) DO UPDATE SET
       status=excluded.status,
       facility=excluded.facility,
       updatedAt=excluded.updatedAt`,
    [r.id, r.caseId, r.status, r.facility, r.updatedAt]
  );
}

export async function addTimeline(e: LocalTimeline) {
  const db = await getDb();
  await db.runAsync(
    `INSERT INTO timeline_events (id, caseId, kind, message, createdAt)
     VALUES (?, ?, ?, ?, ?)`,
    [e.id, e.caseId, e.kind, e.message, e.createdAt]
  );
}

export async function addSmsLog(e: LocalSmsLog) {
  const db = await getDb();
  await db.runAsync(
    `INSERT INTO sms_logs (id, caseId, "to", message, status, createdAt)
     VALUES (?, ?, ?, ?, ?, ?)`,
    [e.id, e.caseId, e.to, e.message, e.status, e.createdAt]
  );
}

export async function listSmsLogs(caseId: string): Promise<LocalSmsLog[]> {
  const db = await getDb();
  return db.getAllAsync<LocalSmsLog>(
    `SELECT * FROM sms_logs WHERE caseId = ? ORDER BY createdAt DESC`,
    [caseId]
  );
}

export async function markCaseSynced(id: string, syncedAt: string) {
  const db = await getDb();
  await db.runAsync(`UPDATE cases SET syncedAt = ? WHERE id = ?`, [
    syncedAt,
    id,
  ]);
}

export async function getUnsyncedPayload() {
  const db = await getDb();
  const cases = await db.getAllAsync<LocalCase>(
    `SELECT * FROM cases WHERE syncedAt IS NULL`
  );
  const payload = [];
  for (const c of cases) {
    const responses = await getResponses(c.id);
    const referral = await getReferral(c.id);
    const timeline = await getTimeline(c.id);
    const normalized = normalizeCase(c);
    payload.push({
      ...normalized,
      responses: responses.map((r) => ({
        id: r.id,
        itemKey: r.itemKey,
        answer: Boolean(r.answer),
      })),
      referral,
      timeline,
    });
  }
  return payload;
}

export function formatAge(
  ageValue: number | null | undefined,
  ageUnit: AgeUnit | null | undefined
): string | null {
  if (ageValue == null || !ageUnit) return null;
  const unit =
    ageUnit === "DAYS"
      ? ageValue === 1
        ? "day"
        : "days"
      : ageUnit === "MONTHS"
        ? ageValue === 1
          ? "month"
          : "months"
        : ageValue === 1
          ? "year"
          : "years";
  return `${ageValue} ${unit}`;
}
