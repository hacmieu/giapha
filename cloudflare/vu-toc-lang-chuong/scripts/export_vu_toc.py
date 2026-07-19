#!/usr/bin/env python3
"""Export Vũ Tộc from the legacy SQLite database into canonical JSON and D1 SQL."""

from __future__ import annotations

import argparse
import hashlib
import json
import sqlite3
import sys
import uuid
from collections import Counter, defaultdict
from datetime import datetime, timezone
from pathlib import Path
from typing import Any, Iterable


PROJECT_DIR = Path(__file__).resolve().parents[1]
REPO_DIR = Path(__file__).resolve().parents[3]
DEFAULT_DATABASE = REPO_DIR / "db.sqlite3"
DEFAULT_OUTPUT = PROJECT_DIR / "exports"
NAMESPACE = uuid.uuid5(uuid.NAMESPACE_URL, "https://vu-toc-lang-chuong.example")
FAMILY_ID = str(uuid.uuid5(NAMESPACE, "family/vu-toc-lang-chuong"))


def stable_id(kind: str, source_id: Any) -> str:
    return str(uuid.uuid5(NAMESPACE, f"{kind}/{source_id}"))


def now_iso() -> str:
    return datetime.now(timezone.utc).replace(microsecond=0).isoformat()


def sql_value(value: Any) -> str:
    if value is None:
        return "NULL"
    if isinstance(value, bool):
        return "1" if value else "0"
    if isinstance(value, (int, float)):
        return str(value)
    return "'" + str(value).replace("'", "''") + "'"


def insert_sql(table: str, columns: list[str], rows: Iterable[Iterable[Any]]) -> list[str]:
    statements: list[str] = []
    column_sql = ", ".join(columns)
    for row in rows:
        statements.append(
            f"INSERT INTO {table} ({column_sql}) VALUES "
            f"({', '.join(sql_value(value) for value in row)});"
        )
    return statements


def load_rows(connection: sqlite3.Connection, query: str) -> list[dict[str, Any]]:
    return [dict(row) for row in connection.execute(query).fetchall()]


def is_nguyen_external_note(member: dict[str, Any]) -> bool:
    """Họ Nguyễn/Nguyên (không phải dâu-rể nhập tộc) = ngoại tộc ghi chú tạm.

    Chủ dữ liệu: tách khỏi cây chính, gắn lại sau khi quan hệ rõ.
    Dâu/rể họ Nguyễn (spouse_in) vẫn giữ trên thẻ Vợ/Chồng của Đinh.
    """
    if member["member_type"] == "spouse_in":
        return False
    name = (member.get("name") or "").strip()
    return name.startswith("Nguyễn") or name.startswith("Nguyên")


def looks_like_spouse_label(member: dict[str, Any]) -> bool:
    """Bản ghi tên kiểu 'Vợ …' nhưng bị gán member_type=blood trong nguồn."""
    name = (member.get("name") or "").strip()
    return name.startswith("Vợ ") or name.startswith("Chồng ")


def lineage_role(member: dict[str, Any]) -> str:
    # Vai trò suy từ member_type/giới tính, KHÔNG phụ thuộc việc có gán chi hay chưa:
    # Thủy Tổ và dâu ở đời gốc không được gán chi nhưng vẫn thuộc dòng chính.
    if is_nguyen_external_note(member):
        return "external"
    if looks_like_spouse_label(member) or member["member_type"] == "spouse_in":
        return "spouse"
    if member["member_type"] in {"adopted_in", "adopted_child"}:
        return "dinh_adopted" if member["gender"] == "male" else "daughter"
    # Nam đã tính Đinh (kể cả Thủy Tổ bị ghi nhầm member_type) luôn là Đinh.
    if member["gender"] == "male" and member["is_dinh"]:
        return "dinh"
    if member["member_type"] == "child_out":
        return "daughter_descendant"
    if member["gender"] == "female":
        return "daughter_contributor" if member["is_dinh"] else "daughter"
    return "dinh"


def compute_main_ids(member_by_source_id: dict[int, dict[str, Any]]) -> set[int]:
    """Dòng chính = người có chi + toàn bộ tổ tiên trực hệ của họ (cha/mẹ).

    Trước đây luật "không có chi ⇒ external" đã đẩy nhầm Thủy Tổ (TỎ PHỤ/TỔ MẪU)
    và các bà dâu ở đời gốc ra ngoài, khiến 8 chi không nối được về một gốc.

    Họ Nguyễn/Nguyên (không phải spouse_in) bị loại tạm khỏi main — ngoại tộc ghi chú.
    """
    has_chi = {sid for sid, row in member_by_source_id.items() if row["chi_id"] is not None}
    main_ids: set[int] = set(has_chi)

    def add_ancestors(source_id: int) -> None:
        row = member_by_source_id.get(source_id)
        if not row:
            return
        for parent_id in (row["father_id"], row["mother_id"]):
            if parent_id in member_by_source_id and parent_id not in main_ids:
                main_ids.add(parent_id)
                add_ancestors(parent_id)

    for source_id in has_chi:
        add_ancestors(source_id)

    # Tách tạm ngoại tộc họ Nguyễn khỏi cây chính (gắn lại sau).
    return {
        sid
        for sid in main_ids
        if not is_nguyen_external_note(member_by_source_id[sid])
    }


def detect_parent_cycles(person_ids: set[str], parent_relations: list[dict[str, Any]]) -> list[list[str]]:
    children: dict[str, list[str]] = defaultdict(list)
    for relation in parent_relations:
        children[relation["parentId"]].append(relation["childId"])

    state: dict[str, int] = {}
    stack: list[str] = []
    cycles: list[list[str]] = []

    def visit(person_id: str) -> None:
        current = state.get(person_id, 0)
        if current == 1:
            try:
                start = stack.index(person_id)
            except ValueError:
                start = 0
            cycles.append(stack[start:] + [person_id])
            return
        if current == 2:
            return

        state[person_id] = 1
        stack.append(person_id)
        for child_id in children.get(person_id, []):
            visit(child_id)
        stack.pop()
        state[person_id] = 2

    for person_id in person_ids:
        if state.get(person_id, 0) == 0:
            visit(person_id)
    return cycles


def build_export(connection: sqlite3.Connection) -> tuple[dict[str, Any], dict[str, Any]]:
    generated_at = now_iso()
    families = load_rows(
        connection,
        "SELECT id, name, village, address, chi_count, created_at, updated_at FROM core_family",
    )
    if len(families) != 1:
        raise ValueError(f"Expected exactly one Vũ family, found {len(families)}")
    source_family = families[0]

    branch_rows = load_rows(
        connection,
        """
        SELECT id, family_id, number, name, description
        FROM core_chi
        WHERE family_id = 1
        ORDER BY number
        """,
    )
    member_rows = load_rows(
        connection,
        """
        SELECT id, legacy_id, person_code, name, gender, chi_id, generation,
               is_dinh, member_type, birth_order, birth_date, death_date,
               death_date_lunar, is_deceased, notes, photo, is_public,
               created_at, updated_at, father_id, mother_id
        FROM core_familymember
        ORDER BY id
        """,
    )
    member_by_source_id = {row["id"]: row for row in member_rows}
    person_id_by_source_id = {
        source_id: stable_id("person", source_id) for source_id in member_by_source_id
    }
    branch_id_by_source_id = {
        row["id"]: stable_id("branch", row["id"]) for row in branch_rows
    }

    branches = [
        {
            "id": branch_id_by_source_id[row["id"]],
            "familyId": FAMILY_ID,
            "legacyId": str(row["id"]),
            "number": row["number"],
            "name": row["name"] or f"Chi {row['number']}",
            "description": row["description"] or "",
            "createdAt": generated_at,
            "updatedAt": generated_at,
        }
        for row in branch_rows
    ]

    main_ids = compute_main_ids(member_by_source_id)

    people: list[dict[str, Any]] = []
    for row in member_rows:
        scope = "main" if row["id"] in main_ids else "external"
        people.append(
            {
                "id": person_id_by_source_id[row["id"]],
                "familyId": FAMILY_ID,
                "branchId": branch_id_by_source_id.get(row["chi_id"]),
                "legacyId": row["legacy_id"] or f"django:{row['id']}",
                "personCode": row["person_code"],
                "name": row["name"],
                "gender": row["gender"],
                "generation": row["generation"],
                "lineageRole": lineage_role(row),
                "treeScope": scope,
                "memberType": row["member_type"],
                "isDinh": bool(row["is_dinh"]),
                "birthOrder": row["birth_order"],
                "birthDate": row["birth_date"] or "",
                "deathDate": row["death_date"] or "",
                "deathDateLunar": row["death_date_lunar"] or "",
                "isDeceased": bool(row["is_deceased"] or row["death_date"]),
                "notes": row["notes"] or "",
                "photoKey": f"members/{Path(row['photo']).name}" if row["photo"] else None,
                "visibility": "public",
                "version": 1,
                "sourceCreatedAt": row["created_at"],
                "sourceUpdatedAt": row["updated_at"],
                "createdAt": generated_at,
                "updatedAt": generated_at,
            }
        )

    parent_relations: list[dict[str, Any]] = []
    orphan_parents: list[dict[str, Any]] = []
    for row in member_rows:
        for relation_type, parent_source_id in (
            ("father", row["father_id"]),
            ("mother", row["mother_id"]),
        ):
            if parent_source_id is None:
                continue
            if parent_source_id not in person_id_by_source_id:
                orphan_parents.append(
                    {
                        "childLegacyId": row["legacy_id"] or str(row["id"]),
                        "relationType": relation_type,
                        "parentSourceId": parent_source_id,
                    }
                )
                continue
            parent_relations.append(
                {
                    "id": stable_id(
                        "parent-relation", f"{row['id']}/{relation_type}/{parent_source_id}"
                    ),
                    "familyId": FAMILY_ID,
                    "childId": person_id_by_source_id[row["id"]],
                    "parentId": person_id_by_source_id[parent_source_id],
                    "relationType": relation_type,
                    "createdAt": generated_at,
                    "updatedAt": generated_at,
                }
            )

    detailed_spouses = {
        tuple(sorted((row["husband_id"], row["wife_id"]))): row
        for row in load_rows(
            connection,
            """
            SELECT husband_id, wife_id, wife_order, status, marriage_date, notes,
                   created_at, updated_at
            FROM core_spouserelation
            """,
        )
    }
    source_spouse_pairs: set[tuple[int, int]] = set()
    orphan_spouses: list[dict[str, int]] = []
    for row in load_rows(
        connection,
        """
        SELECT from_familymember_id, to_familymember_id
        FROM core_familymember_spouses
        """,
    ):
        source_a = row["from_familymember_id"]
        source_b = row["to_familymember_id"]
        if source_a not in person_id_by_source_id or source_b not in person_id_by_source_id:
            orphan_spouses.append({"sourceA": source_a, "sourceB": source_b})
            continue
        source_spouse_pairs.add(tuple(sorted((source_a, source_b))))
    source_spouse_pairs.update(detailed_spouses)

    spouse_relations: list[dict[str, Any]] = []
    spouse_degree: Counter[int] = Counter()
    for source_a, source_b in sorted(source_spouse_pairs):
        person_a, person_b = sorted(
            (person_id_by_source_id[source_a], person_id_by_source_id[source_b])
        )
        detail = detailed_spouses.get((source_a, source_b), {})
        wife_source_id = detail.get("wife_id")
        if wife_source_id is None:
            female_source_ids = [
                source_id
                for source_id in (source_a, source_b)
                if member_by_source_id[source_id]["gender"] == "female"
            ]
            wife_source_id = female_source_ids[0] if len(female_source_ids) == 1 else None
        spouse_degree[source_a] += 1
        spouse_degree[source_b] += 1
        spouse_relations.append(
            {
                "id": stable_id("spouse-relation", f"{source_a}/{source_b}"),
                "familyId": FAMILY_ID,
                "personAId": person_a,
                "personBId": person_b,
                "wifePersonId": person_id_by_source_id.get(wife_source_id),
                "wifeOrder": detail.get("wife_order"),
                "status": detail.get("status") or "unknown",
                "marriageDate": detail.get("marriage_date") or "",
                "notes": detail.get("notes") or "",
                "createdAt": detail.get("created_at") or generated_at,
                "updatedAt": detail.get("updated_at") or generated_at,
            }
        )

    social_relations: list[dict[str, Any]] = []
    for row in load_rows(
        connection,
        """
        SELECT id, from_member_id, to_member_id, to_person_name, to_person_gender,
               link_type, label, seniority_note, notes, created_at, updated_at
        FROM core_sociallink
        ORDER BY id
        """,
    ):
        if row["from_member_id"] not in person_id_by_source_id:
            continue
        social_relations.append(
            {
                "id": stable_id("social-relation", row["id"]),
                "familyId": FAMILY_ID,
                "fromPersonId": person_id_by_source_id[row["from_member_id"]],
                "toPersonId": person_id_by_source_id.get(row["to_member_id"]),
                "toPersonName": row["to_person_name"] or None,
                "toPersonGender": row["to_person_gender"] or None,
                "relationType": row["link_type"],
                "label": row["label"] or "",
                "seniorityNote": row["seniority_note"] or "",
                "notes": row["notes"] or "",
                "visibility": "public",
                "createdAt": row["created_at"] or generated_at,
                "updatedAt": row["updated_at"] or generated_at,
            }
        )

    draft_submissions: list[dict[str, Any]] = []
    for row in load_rows(
        connection,
        """
        SELECT id, submitter_name, submitter_phone, submitter_relation, notes,
               status, review_notes, reviewed_at, created_at, updated_at
        FROM core_draftsubmission
        ORDER BY id
        """,
    ):
        draft_submissions.append(
            {
                "id": stable_id("draft-submission", row["id"]),
                "familyId": FAMILY_ID,
                "sourceId": row["id"],
                "submitterName": row["submitter_name"],
                "submitterPhone": row["submitter_phone"] or "",
                "submitterRelation": row["submitter_relation"] or "",
                "notes": row["notes"] or "",
                "status": row["status"],
                "reviewNotes": row["review_notes"] or "",
                "reviewedAt": row["reviewed_at"],
                "createdAt": row["created_at"] or generated_at,
                "updatedAt": row["updated_at"] or generated_at,
            }
        )

    draft_people: list[dict[str, Any]] = []
    for row in load_rows(
        connection,
        """
        SELECT id, submission_id, temp_id, name, gender, birth_date, death_date,
               death_date_lunar, is_deceased, notes, photo, relation_to_submitter,
               father_temp_id, mother_temp_id, birth_order, chi_number, generation,
               action, linked_member_id, is_dinh, member_type, created_at, updated_at
        FROM core_draftperson
        ORDER BY submission_id, temp_id
        """,
    ):
        payload = {
            "name": row["name"],
            "gender": row["gender"],
            "birthDate": row["birth_date"] or "",
            "deathDate": row["death_date"] or "",
            "deathDateLunar": row["death_date_lunar"] or "",
            "isDeceased": bool(row["is_deceased"] or row["death_date"]),
            "notes": row["notes"] or "",
            "photoKey": f"drafts/{Path(row['photo']).name}" if row["photo"] else None,
            "relationToSubmitter": row["relation_to_submitter"],
            "fatherTempId": row["father_temp_id"],
            "motherTempId": row["mother_temp_id"],
            "birthOrder": row["birth_order"],
            "branchNumber": row["chi_number"],
            "generation": row["generation"],
            "action": row["action"],
            "linkedPersonId": person_id_by_source_id.get(row["linked_member_id"]),
            "isDinh": bool(row["is_dinh"]),
            "memberType": row["member_type"],
        }
        draft_people.append(
            {
                "id": stable_id("draft-person", row["id"]),
                "submissionId": stable_id("draft-submission", row["submission_id"]),
                "tempId": row["temp_id"],
                "payload": payload,
                "createdAt": row["created_at"] or generated_at,
                "updatedAt": row["updated_at"] or generated_at,
            }
        )

    draft_spouse_relations: list[dict[str, Any]] = []
    for row in load_rows(
        connection,
        """
        SELECT id, submission_id, person1_temp_id, person2_temp_id, wife_order,
               status, created_at, updated_at
        FROM core_draftspouserelation
        ORDER BY submission_id, id
        """,
    ):
        person_a, person_b = sorted((row["person1_temp_id"], row["person2_temp_id"]))
        draft_spouse_relations.append(
            {
                "id": stable_id("draft-spouse-relation", row["id"]),
                "submissionId": stable_id("draft-submission", row["submission_id"]),
                "personATempId": person_a,
                "personBTempId": person_b,
                "wifeOrder": row["wife_order"],
                "status": row["status"],
                "createdAt": row["created_at"] or generated_at,
                "updatedAt": row["updated_at"] or generated_at,
            }
        )

    canonical = {
        "schemaVersion": "1.0.0",
        "generatedAt": generated_at,
        "source": {
            "type": "django-sqlite-one-time-migration",
            "familyLegacyId": str(source_family["id"]),
            "originalVillage": source_family["village"],
        },
        "family": {
            "id": FAMILY_ID,
            "slug": "vu-toc-lang-chuong",
            "name": "Vũ Tộc Làng Chuông",
            "village": "Làng Chuông",
            "address": source_family["address"] or "",
            "visibility": "public",
            "createdAt": source_family["created_at"] or generated_at,
            "updatedAt": generated_at,
        },
        "branches": branches,
        "people": people,
        "parentRelations": parent_relations,
        "spouseRelations": spouse_relations,
        "socialRelations": social_relations,
        "draftSubmissions": draft_submissions,
        "draftPeople": draft_people,
        "draftSpouseRelations": draft_spouse_relations,
    }

    person_ids = {person["id"] for person in people}
    cycles = detect_parent_cycles(person_ids, parent_relations)
    role_counts = Counter(person["lineageRole"] for person in people)
    scope_counts = Counter(person["treeScope"] for person in people)
    branch_counts = Counter(person["branchId"] for person in people if person["branchId"])
    source_id_by_person_id = {
        person_id: source_id for source_id, person_id in person_id_by_source_id.items()
    }
    multi_spouse_relations_missing_order = sum(
        relation["wifeOrder"] is None
        and (
            spouse_degree[source_id_by_person_id[relation["personAId"]]] > 1
            or spouse_degree[source_id_by_person_id[relation["personBId"]]] > 1
        )
        for relation in spouse_relations
    )
    duplicate_legacy_ids = [
        legacy_id
        for legacy_id, count in Counter(
            person["legacyId"] for person in people
        ).items()
        if count > 1
    ]
    errors: list[str] = []
    if len(people) != 397:
        errors.append(f"Expected 397 people, found {len(people)}")
    if scope_counts["external"] != 91:
        errors.append(f"Expected 91 external people, found {scope_counts['external']}")
    if len(branches) != 8:
        errors.append(f"Expected 8 branches, found {len(branches)}")
    if orphan_parents:
        errors.append(f"Found {len(orphan_parents)} orphan parent relations")
    if orphan_spouses:
        errors.append(f"Found {len(orphan_spouses)} orphan spouse relations")
    if cycles:
        errors.append(f"Found {len(cycles)} parent cycles")
    if duplicate_legacy_ids:
        errors.append(f"Found {len(duplicate_legacy_ids)} duplicate legacy IDs")

    validation = {
        "generatedAt": generated_at,
        "status": "pass" if not errors else "fail",
        "errors": errors,
        "counts": {
            "families": 1,
            "branches": len(branches),
            "people": len(people),
            "mainTreePeople": scope_counts["main"],
            "externalPeople": scope_counts["external"],
            "parentRelations": len(parent_relations),
            "fatherRelations": sum(
                relation["relationType"] == "father" for relation in parent_relations
            ),
            "motherRelations": sum(
                relation["relationType"] == "mother" for relation in parent_relations
            ),
            "spouseRelations": len(spouse_relations),
            "peopleWithMultipleSpouses": sum(degree > 1 for degree in spouse_degree.values()),
            "multiSpouseRelationsMissingWifeOrder": multi_spouse_relations_missing_order,
            "socialRelations": len(social_relations),
            "draftSubmissions": len(draft_submissions),
            "draftPeople": len(draft_people),
            "draftSpouseRelations": len(draft_spouse_relations),
            "roles": dict(sorted(role_counts.items())),
            "peoplePerBranch": dict(
                sorted(
                    (
                        next(
                            branch["number"]
                            for branch in branches
                            if branch["id"] == branch_id
                        ),
                        count,
                    )
                    for branch_id, count in branch_counts.items()
                )
            ),
        },
        "integrity": {
            "orphanParents": len(orphan_parents),
            "orphanSpouses": len(orphan_spouses),
            "parentCycles": len(cycles),
            "duplicateLegacyIds": len(duplicate_legacy_ids),
        },
    }
    return canonical, validation


def build_seed_sql(canonical: dict[str, Any]) -> str:
    family = canonical["family"]
    statements = ["PRAGMA foreign_keys = ON;"]
    statements += insert_sql(
        "families",
        [
            "id",
            "slug",
            "name",
            "village",
            "address",
            "visibility",
            "created_at",
            "updated_at",
        ],
        [
            (
                family["id"],
                family["slug"],
                family["name"],
                family["village"],
                family["address"],
                family["visibility"],
                family["createdAt"],
                family["updatedAt"],
            )
        ],
    )
    statements += insert_sql(
        "branches",
        [
            "id",
            "family_id",
            "legacy_id",
            "number",
            "name",
            "description",
            "created_at",
            "updated_at",
        ],
        (
            (
                row["id"],
                row["familyId"],
                row["legacyId"],
                row["number"],
                row["name"],
                row["description"],
                row["createdAt"],
                row["updatedAt"],
            )
            for row in canonical["branches"]
        ),
    )
    statements += insert_sql(
        "people",
        [
            "id",
            "family_id",
            "branch_id",
            "legacy_id",
            "person_code",
            "name",
            "gender",
            "generation",
            "lineage_role",
            "tree_scope",
            "member_type",
            "is_dinh",
            "birth_order",
            "birth_date",
            "death_date",
            "death_date_lunar",
            "is_deceased",
            "notes",
            "photo_key",
            "visibility",
            "version",
            "source_created_at",
            "source_updated_at",
            "created_at",
            "updated_at",
        ],
        (
            (
                row["id"],
                row["familyId"],
                row["branchId"],
                row["legacyId"],
                row["personCode"],
                row["name"],
                row["gender"],
                row["generation"],
                row["lineageRole"],
                row["treeScope"],
                row["memberType"],
                row["isDinh"],
                row["birthOrder"],
                row["birthDate"],
                row["deathDate"],
                row["deathDateLunar"],
                row["isDeceased"],
                row["notes"],
                row["photoKey"],
                row["visibility"],
                row["version"],
                row["sourceCreatedAt"],
                row["sourceUpdatedAt"],
                row["createdAt"],
                row["updatedAt"],
            )
            for row in canonical["people"]
        ),
    )
    statements += insert_sql(
        "parent_relations",
        [
            "id",
            "family_id",
            "child_id",
            "parent_id",
            "relation_type",
            "created_at",
            "updated_at",
        ],
        (
            (
                row["id"],
                row["familyId"],
                row["childId"],
                row["parentId"],
                row["relationType"],
                row["createdAt"],
                row["updatedAt"],
            )
            for row in canonical["parentRelations"]
        ),
    )
    statements += insert_sql(
        "spouse_relations",
        [
            "id",
            "family_id",
            "person_a_id",
            "person_b_id",
            "wife_person_id",
            "wife_order",
            "status",
            "marriage_date",
            "notes",
            "created_at",
            "updated_at",
        ],
        (
            (
                row["id"],
                row["familyId"],
                row["personAId"],
                row["personBId"],
                row["wifePersonId"],
                row["wifeOrder"],
                row["status"],
                row["marriageDate"],
                row["notes"],
                row["createdAt"],
                row["updatedAt"],
            )
            for row in canonical["spouseRelations"]
        ),
    )
    statements += insert_sql(
        "social_relations",
        [
            "id",
            "family_id",
            "from_person_id",
            "to_person_id",
            "to_person_name",
            "to_person_gender",
            "relation_type",
            "label",
            "seniority_note",
            "notes",
            "visibility",
            "created_at",
            "updated_at",
        ],
        (
            (
                row["id"],
                row["familyId"],
                row["fromPersonId"],
                row["toPersonId"],
                row["toPersonName"],
                row["toPersonGender"],
                row["relationType"],
                row["label"],
                row["seniorityNote"],
                row["notes"],
                row["visibility"],
                row["createdAt"],
                row["updatedAt"],
            )
            for row in canonical["socialRelations"]
        ),
    )
    statements += insert_sql(
        "draft_submissions",
        [
            "id",
            "family_id",
            "submitter_name",
            "submitter_phone",
            "submitter_relation",
            "notes",
            "status",
            "review_notes",
            "reviewed_at",
            "created_at",
            "updated_at",
        ],
        (
            (
                row["id"],
                row["familyId"],
                row["submitterName"],
                row["submitterPhone"],
                row["submitterRelation"],
                row["notes"],
                row["status"],
                row["reviewNotes"],
                row["reviewedAt"],
                row["createdAt"],
                row["updatedAt"],
            )
            for row in canonical["draftSubmissions"]
        ),
    )
    statements += insert_sql(
        "draft_people",
        [
            "id",
            "submission_id",
            "temp_id",
            "payload_json",
            "created_at",
            "updated_at",
        ],
        (
            (
                row["id"],
                row["submissionId"],
                row["tempId"],
                json.dumps(row["payload"], ensure_ascii=False, separators=(",", ":")),
                row["createdAt"],
                row["updatedAt"],
            )
            for row in canonical["draftPeople"]
        ),
    )
    statements += insert_sql(
        "draft_spouse_relations",
        [
            "id",
            "submission_id",
            "person_a_temp_id",
            "person_b_temp_id",
            "wife_order",
            "status",
            "created_at",
            "updated_at",
        ],
        (
            (
                row["id"],
                row["submissionId"],
                row["personATempId"],
                row["personBTempId"],
                row["wifeOrder"],
                row["status"],
                row["createdAt"],
                row["updatedAt"],
            )
            for row in canonical["draftSpouseRelations"]
        ),
    )
    return "\n".join(statements) + "\n"


def validation_markdown(validation: dict[str, Any]) -> str:
    counts = validation["counts"]
    integrity = validation["integrity"]
    errors = validation["errors"]
    error_lines = "\n".join(f"- {error}" for error in errors) if errors else "- Không có."
    return f"""# Báo cáo kiểm định export Vũ Tộc

**Generated:** {validation['generatedAt']}  
**Status:** {validation['status'].upper()}

## Số liệu

- Người: {counts['people']}
- Cây chính: {counts['mainTreePeople']}
- Quan hệ ngoài: {counts['externalPeople']}
- Chi: {counts['branches']}
- Quan hệ cha: {counts['fatherRelations']}
- Quan hệ mẹ: {counts['motherRelations']}
- Cặp phối ngẫu: {counts['spouseRelations']}
- Người có nhiều phối ngẫu: {counts['peopleWithMultipleSpouses']}
- Cặp thuộc trường hợp nhiều vợ nhưng thiếu thứ tự bà: {counts['multiSpouseRelationsMissingWifeOrder']}
- Draft/người trong draft: {counts['draftSubmissions']}/{counts['draftPeople']}

## Toàn vẹn

- Orphan cha/mẹ: {integrity['orphanParents']}
- Orphan phối ngẫu: {integrity['orphanSpouses']}
- Chu trình cha/mẹ: {integrity['parentCycles']}
- Trùng legacy ID: {integrity['duplicateLegacyIds']}

## Lỗi

{error_lines}
"""


def write_outputs(
    output_dir: Path, canonical: dict[str, Any], validation: dict[str, Any]
) -> None:
    output_dir.mkdir(parents=True, exist_ok=True)
    artifacts = {
        "vu-toc-canonical.json": json.dumps(
            canonical, ensure_ascii=False, indent=2
        )
        + "\n",
        "vu-toc-seed.sql": build_seed_sql(canonical),
        "vu-toc-validation.json": json.dumps(
            validation, ensure_ascii=False, indent=2
        )
        + "\n",
        "vu-toc-validation.md": validation_markdown(validation),
    }
    checksums: list[str] = []
    for filename, content in artifacts.items():
        path = output_dir / filename
        path.write_text(content, encoding="utf-8")
        digest = hashlib.sha256(content.encode("utf-8")).hexdigest()
        checksums.append(f"{digest}  {filename}")
    (output_dir / "SHA256SUMS").write_text("\n".join(checksums) + "\n", encoding="utf-8")


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--database", type=Path, default=DEFAULT_DATABASE)
    parser.add_argument("--output", type=Path, default=DEFAULT_OUTPUT)
    return parser.parse_args()


def main() -> int:
    args = parse_args()
    database = args.database.resolve()
    if not database.exists():
        print(f"Database not found: {database}", file=sys.stderr)
        return 2

    connection = sqlite3.connect(f"file:{database}?mode=ro", uri=True)
    connection.row_factory = sqlite3.Row
    try:
        canonical, validation = build_export(connection)
    finally:
        connection.close()

    write_outputs(args.output.resolve(), canonical, validation)
    print(json.dumps(validation["counts"], ensure_ascii=False, sort_keys=True))
    if validation["status"] != "pass":
        for error in validation["errors"]:
            print(f"ERROR: {error}", file=sys.stderr)
        return 1
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
