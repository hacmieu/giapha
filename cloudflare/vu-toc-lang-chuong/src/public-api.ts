import { HttpError, json } from "./http";

interface BranchRow {
  id: string;
  number: number;
  name: string;
}

interface PersonRow {
  id: string;
  legacy_id: string;
  person_code: string | null;
  name: string;
  gender: "male" | "female";
  branch_id: string | null;
  generation: number | null;
  lineage_role: string;
  tree_scope: "main" | "external";
  is_dinh: number;
  birth_order: number | null;
  birth_date: string;
  death_date: string;
  death_date_lunar: string;
  is_deceased: number;
  notes: string;
  photo_key: string | null;
  version: number;
  updated_at: string;
}

interface ParentRow {
  id: string;
  child_id: string;
  parent_id: string;
  relation_type: "father" | "mother";
}

interface SpouseRow {
  id: string;
  person_a_id: string;
  person_b_id: string;
  wife_person_id: string | null;
  wife_order: number | null;
  status: string;
}

function rows<T>(result: D1Result<unknown>): T[] {
  return result.results as T[];
}

function batchResult(
  results: D1Result<unknown>[],
  index: number,
): D1Result<unknown> {
  const result = results[index];
  if (!result) {
    throw new HttpError(500, "incomplete_query", "D1 không trả đủ kết quả.");
  }
  return result;
}

export async function getPublicTree(env: Env): Promise<Response> {
  const batch = await env.DB.batch([
    env.DB.prepare(
      `SELECT id, number, name
       FROM branches
       WHERE family_id = ?
       ORDER BY number`,
    ).bind(env.FAMILY_ID),
    env.DB.prepare(
      `SELECT id, legacy_id, person_code, name, gender, branch_id, generation,
              lineage_role, tree_scope, is_dinh, birth_order, birth_date,
              death_date, death_date_lunar, is_deceased, notes, photo_key,
              version, updated_at
       FROM people
       WHERE family_id = ?
         AND tree_scope = 'main'
         AND visibility = 'public'
         AND deleted_at IS NULL
       ORDER BY generation, birth_order, name`,
    ).bind(env.FAMILY_ID),
    env.DB.prepare(
      `SELECT relation.id, relation.child_id, relation.parent_id, relation.relation_type
       FROM parent_relations relation
       JOIN people child ON child.id = relation.child_id
       JOIN people parent ON parent.id = relation.parent_id
       WHERE relation.family_id = ?
         AND child.tree_scope = 'main'
         AND parent.tree_scope = 'main'
         AND child.visibility = 'public'
         AND parent.visibility = 'public'
         AND child.deleted_at IS NULL
         AND parent.deleted_at IS NULL`,
    ).bind(env.FAMILY_ID),
    env.DB.prepare(
      `SELECT relation.id, relation.person_a_id, relation.person_b_id,
              relation.wife_person_id, relation.wife_order, relation.status
       FROM spouse_relations relation
       JOIN people person_a ON person_a.id = relation.person_a_id
       JOIN people person_b ON person_b.id = relation.person_b_id
       WHERE relation.family_id = ?
         AND person_a.tree_scope = 'main'
         AND person_b.tree_scope = 'main'
         AND person_a.visibility = 'public'
         AND person_b.visibility = 'public'
         AND person_a.deleted_at IS NULL
         AND person_b.deleted_at IS NULL`,
    ).bind(env.FAMILY_ID),
  ]);
  const branchesResult = batchResult(batch, 0);
  const peopleResult = batchResult(batch, 1);
  const parentsResult = batchResult(batch, 2);
  const spousesResult = batchResult(batch, 3);

  const branches = rows<BranchRow>(branchesResult);
  const people = rows<PersonRow>(peopleResult);
  const parents = rows<ParentRow>(parentsResult);
  const spouses = rows<SpouseRow>(spousesResult);
  const parentByChild = new Map<string, { fatherId?: string; motherId?: string }>();
  for (const relation of parents) {
    const entry = parentByChild.get(relation.child_id) ?? {};
    if (relation.relation_type === "father") {
      entry.fatherId = relation.parent_id;
    } else {
      entry.motherId = relation.parent_id;
    }
    parentByChild.set(relation.child_id, entry);
  }
  const spousesByPerson = new Map<
    string,
    Array<{
      personId: string;
      wifePersonId: string | null;
      wifeOrder: number | null;
      status: string;
    }>
  >();
  for (const relation of spouses) {
    const forA = spousesByPerson.get(relation.person_a_id) ?? [];
    forA.push({
      personId: relation.person_b_id,
      wifePersonId: relation.wife_person_id,
      wifeOrder: relation.wife_order,
      status: relation.status,
    });
    spousesByPerson.set(relation.person_a_id, forA);

    const forB = spousesByPerson.get(relation.person_b_id) ?? [];
    forB.push({
      personId: relation.person_a_id,
      wifePersonId: relation.wife_person_id,
      wifeOrder: relation.wife_order,
      status: relation.status,
    });
    spousesByPerson.set(relation.person_b_id, forB);
  }

  const nodes = people.map((person) => ({
    id: person.id,
    legacyId: person.legacy_id,
    personCode: person.person_code,
    name: person.name,
    gender: person.gender,
    branchId: person.branch_id,
    generation: person.generation,
    lineageRole: person.lineage_role,
    isDinh: Boolean(person.is_dinh),
    birthOrder: person.birth_order,
    isDeceased: Boolean(person.is_deceased),
    photoUrl: person.photo_key
      ? `/api/public/media/${encodeURIComponent(person.photo_key)}`
      : null,
    ...parentByChild.get(person.id),
    spouses: spousesByPerson.get(person.id) ?? [],
  }));

  return json(
    {
      family: {
        id: env.FAMILY_ID,
        name: "Vũ Tộc Làng Chuông",
        village: "Làng Chuông",
      },
      branches,
      nodes,
      parentRelations: parents.map((relation) => ({
        id: relation.id,
        childId: relation.child_id,
        parentId: relation.parent_id,
        relationType: relation.relation_type,
      })),
      spouseRelations: spouses.map((relation) => ({
        id: relation.id,
        personAId: relation.person_a_id,
        personBId: relation.person_b_id,
        wifePersonId: relation.wife_person_id,
        wifeOrder: relation.wife_order,
        status: relation.status,
      })),
      metadata: {
        totalPeople: nodes.length,
        totalBranches: branches.length,
        generatedAt: new Date().toISOString(),
      },
    },
    {
      headers: {
        "cache-control": "public, max-age=60, stale-while-revalidate=300",
      },
    },
  );
}

export async function getPublicPerson(env: Env, personId: string): Promise<Response> {
  const person = await env.DB.prepare(
    `SELECT id, legacy_id, person_code, name, gender, branch_id, generation,
            lineage_role, tree_scope, is_dinh, birth_order, birth_date,
            death_date, death_date_lunar, is_deceased, notes, photo_key,
            version, updated_at
     FROM people
     WHERE family_id = ?
       AND id = ?
       AND visibility = 'public'
       AND deleted_at IS NULL`,
  )
    .bind(env.FAMILY_ID, personId)
    .first<PersonRow>();
  if (!person) {
    throw new HttpError(404, "person_not_found", "Không tìm thấy thành viên.");
  }

  const batch = await env.DB.batch([
    env.DB.prepare(
      `SELECT relation.relation_type, related.id, related.name, related.tree_scope,
              related.lineage_role
       FROM parent_relations relation
       JOIN people related ON related.id = relation.parent_id
       WHERE relation.family_id = ?
         AND relation.child_id = ?
         AND related.visibility = 'public'
         AND related.deleted_at IS NULL`,
    ).bind(env.FAMILY_ID, personId),
    env.DB.prepare(
      `SELECT relation.relation_type, related.id, related.name, related.tree_scope,
              related.lineage_role, related.birth_order
       FROM parent_relations relation
       JOIN people related ON related.id = relation.child_id
       WHERE relation.family_id = ?
         AND relation.parent_id = ?
         AND related.visibility = 'public'
         AND related.deleted_at IS NULL
       ORDER BY related.birth_order, related.name`,
    ).bind(env.FAMILY_ID, personId),
    env.DB.prepare(
      `SELECT relation.id AS relation_id, relation.wife_person_id,
              relation.wife_order, relation.status,
              related.id, related.name, related.tree_scope, related.lineage_role
       FROM spouse_relations relation
       JOIN people related ON related.id = CASE
         WHEN relation.person_a_id = ? THEN relation.person_b_id
         ELSE relation.person_a_id
       END
       WHERE relation.family_id = ?
         AND (relation.person_a_id = ? OR relation.person_b_id = ?)
         AND related.visibility = 'public'
         AND related.deleted_at IS NULL
       ORDER BY relation.wife_order, related.name`,
    ).bind(personId, env.FAMILY_ID, personId, personId),
  ]);
  const parentsResult = batchResult(batch, 0);
  const childrenResult = batchResult(batch, 1);
  const spousesResult = batchResult(batch, 2);

  return json({
    person: {
      id: person.id,
      legacyId: person.legacy_id,
      personCode: person.person_code,
      name: person.name,
      gender: person.gender,
      branchId: person.branch_id,
      generation: person.generation,
      lineageRole: person.lineage_role,
      treeScope: person.tree_scope,
      isDinh: Boolean(person.is_dinh),
      birthOrder: person.birth_order,
      birthDate: person.birth_date,
      deathDate: person.death_date,
      deathDateLunar: person.death_date_lunar,
      isDeceased: Boolean(person.is_deceased),
      notes: person.notes,
      photoUrl: person.photo_key
        ? `/api/public/media/${encodeURIComponent(person.photo_key)}`
        : null,
      version: person.version,
      updatedAt: person.updated_at,
    },
    parents: parentsResult.results,
    children: childrenResult.results,
    spouses: spousesResult.results,
  });
}

export async function searchPublicPeople(env: Env, url: URL): Promise<Response> {
  const query = (url.searchParams.get("q") ?? "").trim();
  if (query.length < 2 || query.length > 100) {
    throw new HttpError(400, "invalid_query", "Từ khóa phải có 2–100 ký tự.");
  }
  const result = await env.DB.prepare(
    `SELECT id, name, generation, lineage_role, tree_scope, branch_id
     FROM people
     WHERE family_id = ?
       AND visibility = 'public'
       AND deleted_at IS NULL
       AND name LIKE ? ESCAPE '\\'
     ORDER BY tree_scope, generation, name
     LIMIT 50`,
  )
    .bind(
      env.FAMILY_ID,
      `%${query.replaceAll("\\", "\\\\").replaceAll("%", "\\%").replaceAll("_", "\\_")}%`,
    )
    .all();
  return json({ results: result.results });
}

export async function getPublicMedia(env: Env, encodedKey: string): Promise<Response> {
  let key: string;
  try {
    key = decodeURIComponent(encodedKey);
  } catch {
    throw new HttpError(400, "invalid_media_key", "Khóa ảnh không hợp lệ.");
  }
  if (!key.startsWith("members/") || key.includes("..")) {
    throw new HttpError(400, "invalid_media_key", "Khóa ảnh không hợp lệ.");
  }
  const allowed = await env.DB.prepare(
    `SELECT 1
     FROM people
     WHERE family_id = ?
       AND photo_key = ?
       AND visibility = 'public'
       AND deleted_at IS NULL
     LIMIT 1`,
  )
    .bind(env.FAMILY_ID, key)
    .first();
  if (!allowed) {
    throw new HttpError(404, "media_not_found", "Không tìm thấy ảnh.");
  }
  const object = await env.MEDIA.get(key);
  if (!object) {
    throw new HttpError(404, "media_not_found", "Không tìm thấy ảnh.");
  }
  const headers = new Headers();
  object.writeHttpMetadata(headers);
  headers.set("etag", object.httpEtag);
  headers.set("cache-control", "public, max-age=86400");
  headers.set("x-content-type-options", "nosniff");
  return new Response(object.body, { headers });
}
