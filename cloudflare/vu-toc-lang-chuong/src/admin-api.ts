import type { Actor } from "./auth";
import {
  HttpError,
  booleanValue,
  json,
  optionalInteger,
  optionalString,
  parseJsonObject,
  requiredString,
} from "./http";

const LINEAGE_ROLES = new Set([
  "dinh",
  "dinh_adopted",
  "daughter",
  "daughter_contributor",
  "spouse",
  "daughter_descendant",
  "external",
]);
const MEMBER_TYPES = new Set([
  "blood",
  "spouse_in",
  "child_out",
  "adopted_in",
  "adopted_child",
]);
const VISIBILITIES = new Set(["public", "restricted", "private"]);

interface PersonRecord {
  id: string;
  branch_id: string | null;
  legacy_id: string;
  person_code: string | null;
  name: string;
  gender: "male" | "female";
  generation: number | null;
  lineage_role: string;
  tree_scope: "main" | "external";
  member_type: string;
  is_dinh: number;
  birth_order: number | null;
  birth_date: string;
  death_date: string;
  death_date_lunar: string;
  is_deceased: number;
  notes: string;
  visibility: string;
  version: number;
}

function oneOf(
  body: Record<string, unknown>,
  key: string,
  values: Set<string>,
  fallback?: string,
): string {
  const value = body[key] ?? fallback;
  if (typeof value !== "string" || !values.has(value)) {
    throw new HttpError(400, "invalid_field", `${key} không hợp lệ.`);
  }
  return value;
}

function auditStatement(
  env: Env,
  actor: Actor,
  action: string,
  entityType: string,
  entityId: string,
  requestId: string,
  before: unknown,
  after: unknown,
): D1PreparedStatement {
  return env.DB.prepare(
    `INSERT INTO audit_events (
       id, family_id, actor_email, action, entity_type, entity_id,
       before_json, after_json, request_id, created_at
     ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
  ).bind(
    crypto.randomUUID(),
    env.FAMILY_ID,
    actor.email,
    action,
    entityType,
    entityId,
    before === null ? null : JSON.stringify(before),
    after === null ? null : JSON.stringify(after),
    requestId,
    new Date().toISOString(),
  );
}

async function assertBranch(env: Env, branchId: string | null): Promise<void> {
  if (!branchId) {
    return;
  }
  const branch = await env.DB.prepare(
    "SELECT 1 FROM branches WHERE family_id = ? AND id = ?",
  )
    .bind(env.FAMILY_ID, branchId)
    .first();
  if (!branch) {
    throw new HttpError(400, "invalid_branch", "Chi không thuộc Vũ Tộc Làng Chuông.");
  }
}

async function assertPerson(env: Env, personId: string): Promise<void> {
  const person = await env.DB.prepare(
    `SELECT 1 FROM people
     WHERE family_id = ? AND id = ? AND deleted_at IS NULL`,
  )
    .bind(env.FAMILY_ID, personId)
    .first();
  if (!person) {
    throw new HttpError(400, "invalid_person", "Người không thuộc Vũ Tộc Làng Chuông.");
  }
}

export async function createPerson(
  request: Request,
  env: Env,
  actor: Actor,
  requestId: string,
): Promise<Response> {
  const body = await parseJsonObject(request);
  const branchId = optionalString(body, "branchId", 64);
  await assertBranch(env, branchId);

  const id = crypto.randomUUID();
  const now = new Date().toISOString();
  const gender = oneOf(body, "gender", new Set(["male", "female"]));
  const memberType = oneOf(body, "memberType", MEMBER_TYPES, "blood");
  const requestedRole = oneOf(
    body,
    "lineageRole",
    LINEAGE_ROLES,
    branchId ? (gender === "male" ? "dinh" : "daughter") : "external",
  );
  const lineageRole = branchId ? requestedRole : "external";
  const treeScope = branchId ? "main" : "external";
  const record = {
    id,
    familyId: env.FAMILY_ID,
    branchId,
    legacyId: optionalString(body, "legacyId", 50) ?? `cloudflare:${id}`,
    personCode: optionalString(body, "personCode", 32),
    name: requiredString(body, "name", 200),
    gender,
    generation: optionalInteger(body, "generation", 0),
    lineageRole,
    treeScope,
    memberType,
    isDinh: booleanValue(body, "isDinh", lineageRole.startsWith("dinh")),
    birthOrder: optionalInteger(body, "birthOrder", 1),
    birthDate: optionalString(body, "birthDate", 50) ?? "",
    deathDate: optionalString(body, "deathDate", 50) ?? "",
    deathDateLunar: optionalString(body, "deathDateLunar", 50) ?? "",
    isDeceased: booleanValue(body, "isDeceased", false),
    notes: optionalString(body, "notes", 20_000) ?? "",
    visibility: oneOf(body, "visibility", VISIBILITIES, "public"),
    version: 1,
    createdAt: now,
    updatedAt: now,
  };

  await env.DB.batch([
    env.DB.prepare(
      `INSERT INTO people (
         id, family_id, branch_id, legacy_id, person_code, name, gender,
         generation, lineage_role, tree_scope, member_type, is_dinh,
         birth_order, birth_date, death_date, death_date_lunar, is_deceased,
         notes, visibility, version, created_at, updated_at
       ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    ).bind(
      record.id,
      record.familyId,
      record.branchId,
      record.legacyId,
      record.personCode,
      record.name,
      record.gender,
      record.generation,
      record.lineageRole,
      record.treeScope,
      record.memberType,
      record.isDinh,
      record.birthOrder,
      record.birthDate,
      record.deathDate,
      record.deathDateLunar,
      record.isDeceased,
      record.notes,
      record.visibility,
      record.version,
      record.createdAt,
      record.updatedAt,
    ),
    auditStatement(env, actor, "create", "person", id, requestId, null, record),
  ]);
  return json({ person: record }, { status: 201 });
}

export async function updatePerson(
  request: Request,
  env: Env,
  actor: Actor,
  requestId: string,
  personId: string,
): Promise<Response> {
  const body = await parseJsonObject(request);
  const current = await env.DB.prepare(
    `SELECT id, branch_id, legacy_id, person_code, name, gender, generation,
            lineage_role, tree_scope, member_type, is_dinh, birth_order,
            birth_date, death_date, death_date_lunar, is_deceased, notes,
            visibility, version
     FROM people
     WHERE family_id = ? AND id = ? AND deleted_at IS NULL`,
  )
    .bind(env.FAMILY_ID, personId)
    .first<PersonRecord>();
  if (!current) {
    throw new HttpError(404, "person_not_found", "Không tìm thấy thành viên.");
  }

  const expectedVersion = optionalInteger(body, "version", 1);
  if (expectedVersion === null || expectedVersion !== current.version) {
    throw new HttpError(
      409,
      "version_conflict",
      "Hồ sơ đã thay đổi; hãy tải lại trước khi lưu.",
    );
  }

  const branchId =
    body.branchId === undefined
      ? current.branch_id
      : optionalString(body, "branchId", 64);
  await assertBranch(env, branchId);
  const gender =
    body.gender === undefined
      ? current.gender
      : oneOf(body, "gender", new Set(["male", "female"]));
  const requestedRole =
    body.lineageRole === undefined
      ? current.lineage_role
      : oneOf(body, "lineageRole", LINEAGE_ROLES);
  const next = {
    branchId,
    personCode:
      body.personCode === undefined
        ? current.person_code
        : optionalString(body, "personCode", 32),
    name:
      body.name === undefined ? current.name : requiredString(body, "name", 200),
    gender,
    generation:
      body.generation === undefined
        ? current.generation
        : optionalInteger(body, "generation", 0),
    lineageRole: branchId ? requestedRole : "external",
    treeScope: branchId ? "main" : "external",
    memberType:
      body.memberType === undefined
        ? current.member_type
        : oneOf(body, "memberType", MEMBER_TYPES),
    isDinh: booleanValue(body, "isDinh", Boolean(current.is_dinh)),
    birthOrder:
      body.birthOrder === undefined
        ? current.birth_order
        : optionalInteger(body, "birthOrder", 1),
    birthDate:
      body.birthDate === undefined
        ? current.birth_date
        : (optionalString(body, "birthDate", 50) ?? ""),
    deathDate:
      body.deathDate === undefined
        ? current.death_date
        : (optionalString(body, "deathDate", 50) ?? ""),
    deathDateLunar:
      body.deathDateLunar === undefined
        ? current.death_date_lunar
        : (optionalString(body, "deathDateLunar", 50) ?? ""),
    isDeceased: booleanValue(body, "isDeceased", Boolean(current.is_deceased)),
    notes:
      body.notes === undefined
        ? current.notes
        : (optionalString(body, "notes", 20_000) ?? ""),
    visibility:
      body.visibility === undefined
        ? current.visibility
        : oneOf(body, "visibility", VISIBILITIES),
    version: current.version + 1,
    updatedAt: new Date().toISOString(),
  };

  const statements = await env.DB.batch([
    env.DB.prepare(
      `UPDATE people
       SET branch_id = ?, person_code = ?, name = ?, gender = ?, generation = ?,
           lineage_role = ?, tree_scope = ?, member_type = ?, is_dinh = ?,
           birth_order = ?, birth_date = ?, death_date = ?, death_date_lunar = ?,
           is_deceased = ?, notes = ?, visibility = ?, version = ?, updated_at = ?
       WHERE family_id = ? AND id = ? AND version = ? AND deleted_at IS NULL`,
    ).bind(
      next.branchId,
      next.personCode,
      next.name,
      next.gender,
      next.generation,
      next.lineageRole,
      next.treeScope,
      next.memberType,
      next.isDinh,
      next.birthOrder,
      next.birthDate,
      next.deathDate,
      next.deathDateLunar,
      next.isDeceased,
      next.notes,
      next.visibility,
      next.version,
      next.updatedAt,
      env.FAMILY_ID,
      personId,
      current.version,
    ),
    auditStatement(env, actor, "update", "person", personId, requestId, current, next),
  ]);
  const updateResult = statements[0];
  if (!updateResult || updateResult.meta.changes !== 1) {
    throw new HttpError(409, "version_conflict", "Hồ sơ đã thay đổi.");
  }
  return json({ person: { id: personId, ...next } });
}

export async function deletePerson(
  request: Request,
  env: Env,
  actor: Actor,
  requestId: string,
  personId: string,
): Promise<Response> {
  const body = await parseJsonObject(request);
  const version = optionalInteger(body, "version", 1);
  if (version === null) {
    throw new HttpError(400, "invalid_field", "version là bắt buộc.");
  }
  const current = await env.DB.prepare(
    `SELECT id, name, version FROM people
     WHERE family_id = ? AND id = ? AND deleted_at IS NULL`,
  )
    .bind(env.FAMILY_ID, personId)
    .first<{ id: string; name: string; version: number }>();
  if (!current) {
    throw new HttpError(404, "person_not_found", "Không tìm thấy thành viên.");
  }
  if (current.version !== version) {
    throw new HttpError(409, "version_conflict", "Hồ sơ đã thay đổi.");
  }
  const now = new Date().toISOString();
  const results = await env.DB.batch([
    env.DB.prepare(
      `UPDATE people
       SET deleted_at = ?, updated_at = ?, version = version + 1
       WHERE family_id = ? AND id = ? AND version = ? AND deleted_at IS NULL`,
    ).bind(now, now, env.FAMILY_ID, personId, version),
    auditStatement(env, actor, "delete", "person", personId, requestId, current, null),
  ]);
  const deleteResult = results[0];
  if (!deleteResult || deleteResult.meta.changes !== 1) {
    throw new HttpError(409, "version_conflict", "Hồ sơ đã thay đổi.");
  }
  return json({ deleted: true, id: personId });
}

export async function createParentRelation(
  request: Request,
  env: Env,
  actor: Actor,
  requestId: string,
): Promise<Response> {
  const body = await parseJsonObject(request);
  const childId = requiredString(body, "childId", 64);
  const parentId = requiredString(body, "parentId", 64);
  const relationType = oneOf(body, "relationType", new Set(["father", "mother"]));
  if (childId === parentId) {
    throw new HttpError(400, "self_parent", "Một người không thể là cha/mẹ của chính mình.");
  }
  await Promise.all([assertPerson(env, childId), assertPerson(env, parentId)]);
  const createsCycle = await env.DB.prepare(
    `WITH RECURSIVE descendants(id) AS (
       SELECT child_id
       FROM parent_relations
       WHERE family_id = ? AND parent_id = ?
       UNION
       SELECT relation.child_id
       FROM parent_relations relation
       JOIN descendants ON relation.parent_id = descendants.id
       WHERE relation.family_id = ?
     )
     SELECT 1 FROM descendants WHERE id = ? LIMIT 1`,
  )
    .bind(env.FAMILY_ID, childId, env.FAMILY_ID, parentId)
    .first();
  if (createsCycle) {
    throw new HttpError(400, "parent_cycle", "Quan hệ này tạo chu trình gia phả.");
  }

  const id = crypto.randomUUID();
  const now = new Date().toISOString();
  const record = { id, childId, parentId, relationType };
  await env.DB.batch([
    env.DB.prepare(
      `INSERT INTO parent_relations (
         id, family_id, child_id, parent_id, relation_type, created_at, updated_at
       ) VALUES (?, ?, ?, ?, ?, ?, ?)`,
    ).bind(id, env.FAMILY_ID, childId, parentId, relationType, now, now),
    auditStatement(
      env,
      actor,
      "create",
      "parent_relation",
      id,
      requestId,
      null,
      record,
    ),
  ]);
  return json({ relation: record }, { status: 201 });
}

export async function createSpouseRelation(
  request: Request,
  env: Env,
  actor: Actor,
  requestId: string,
): Promise<Response> {
  const body = await parseJsonObject(request);
  const firstId = requiredString(body, "personAId", 64);
  const secondId = requiredString(body, "personBId", 64);
  if (firstId === secondId) {
    throw new HttpError(400, "self_spouse", "Một người không thể là phối ngẫu của chính mình.");
  }
  await Promise.all([assertPerson(env, firstId), assertPerson(env, secondId)]);
  const [personAId, personBId] = [firstId, secondId].sort();
  if (!personAId || !personBId) {
    throw new HttpError(400, "invalid_person", "Người phối ngẫu không hợp lệ.");
  }
  const people = await env.DB.prepare(
    `SELECT id, gender FROM people
     WHERE family_id = ? AND id IN (?, ?) AND deleted_at IS NULL`,
  )
    .bind(env.FAMILY_ID, personAId, personBId)
    .all<{ id: string; gender: "male" | "female" }>();
  const requestedWifeId = optionalString(body, "wifePersonId", 64);
  if (
    requestedWifeId &&
    requestedWifeId !== personAId &&
    requestedWifeId !== personBId
  ) {
    throw new HttpError(
      400,
      "invalid_wife",
      "wifePersonId phải là một trong hai người phối ngẫu.",
    );
  }
  const femalePeople = people.results.filter((person) => person.gender === "female");
  const wifePersonId =
    requestedWifeId ?? (femalePeople.length === 1 ? femalePeople[0]?.id ?? null : null);
  const id = crypto.randomUUID();
  const now = new Date().toISOString();
  const record = {
    id,
    personAId,
    personBId,
    wifePersonId,
    wifeOrder: optionalInteger(body, "wifeOrder", 1),
    status: oneOf(
      body,
      "status",
      new Set(["married", "divorced", "widowed", "unknown"]),
      "married",
    ),
    marriageDate: optionalString(body, "marriageDate", 50) ?? "",
    notes: optionalString(body, "notes", 10_000) ?? "",
  };
  await env.DB.batch([
    env.DB.prepare(
      `INSERT INTO spouse_relations (
         id, family_id, person_a_id, person_b_id, wife_person_id, wife_order,
         status, marriage_date, notes, created_at, updated_at
       ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    ).bind(
      id,
      env.FAMILY_ID,
      personAId,
      personBId,
      record.wifePersonId,
      record.wifeOrder,
      record.status,
      record.marriageDate,
      record.notes,
      now,
      now,
    ),
    auditStatement(
      env,
      actor,
      "create",
      "spouse_relation",
      id,
      requestId,
      null,
      record,
    ),
  ]);
  return json({ relation: record }, { status: 201 });
}

export async function deleteRelation(
  env: Env,
  actor: Actor,
  requestId: string,
  relationKind: "parent" | "spouse",
  relationId: string,
): Promise<Response> {
  const table = relationKind === "parent" ? "parent_relations" : "spouse_relations";
  const entityType =
    relationKind === "parent" ? "parent_relation" : "spouse_relation";
  const current = await env.DB.prepare(
    `SELECT * FROM ${table} WHERE family_id = ? AND id = ?`,
  )
    .bind(env.FAMILY_ID, relationId)
    .first();
  if (!current) {
    throw new HttpError(404, "relation_not_found", "Không tìm thấy quan hệ.");
  }
  await env.DB.batch([
    env.DB.prepare(`DELETE FROM ${table} WHERE family_id = ? AND id = ?`).bind(
      env.FAMILY_ID,
      relationId,
    ),
    auditStatement(
      env,
      actor,
      "delete",
      entityType,
      relationId,
      requestId,
      current,
      null,
    ),
  ]);
  return json({ deleted: true, id: relationId });
}
