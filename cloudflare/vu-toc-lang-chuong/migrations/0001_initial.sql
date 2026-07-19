PRAGMA foreign_keys = ON;

CREATE TABLE families (
  id TEXT PRIMARY KEY,
  slug TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  village TEXT NOT NULL,
  address TEXT NOT NULL DEFAULT '',
  visibility TEXT NOT NULL DEFAULT 'public'
    CHECK (visibility IN ('public', 'restricted', 'private')),
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE TABLE branches (
  id TEXT PRIMARY KEY,
  family_id TEXT NOT NULL REFERENCES families(id) ON DELETE CASCADE,
  legacy_id TEXT,
  number INTEGER NOT NULL CHECK (number > 0),
  name TEXT NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  UNIQUE (family_id, number),
  UNIQUE (family_id, legacy_id)
);

CREATE TABLE people (
  id TEXT PRIMARY KEY,
  family_id TEXT NOT NULL REFERENCES families(id) ON DELETE CASCADE,
  branch_id TEXT REFERENCES branches(id) ON DELETE SET NULL,
  legacy_id TEXT NOT NULL,
  person_code TEXT,
  name TEXT NOT NULL,
  gender TEXT NOT NULL CHECK (gender IN ('male', 'female')),
  generation INTEGER CHECK (generation IS NULL OR generation >= 0),
  lineage_role TEXT NOT NULL CHECK (
    lineage_role IN (
      'dinh',
      'dinh_adopted',
      'daughter',
      'daughter_contributor',
      'spouse',
      'daughter_descendant',
      'external'
    )
  ),
  tree_scope TEXT NOT NULL CHECK (tree_scope IN ('main', 'external')),
  member_type TEXT NOT NULL,
  is_dinh INTEGER NOT NULL DEFAULT 0 CHECK (is_dinh IN (0, 1)),
  birth_order INTEGER CHECK (birth_order IS NULL OR birth_order > 0),
  birth_date TEXT NOT NULL DEFAULT '',
  death_date TEXT NOT NULL DEFAULT '',
  death_date_lunar TEXT NOT NULL DEFAULT '',
  is_deceased INTEGER NOT NULL DEFAULT 0 CHECK (is_deceased IN (0, 1)),
  notes TEXT NOT NULL DEFAULT '',
  photo_key TEXT,
  visibility TEXT NOT NULL DEFAULT 'public'
    CHECK (visibility IN ('public', 'restricted', 'private')),
  version INTEGER NOT NULL DEFAULT 1 CHECK (version > 0),
  source_created_at TEXT,
  source_updated_at TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  deleted_at TEXT,
  UNIQUE (family_id, legacy_id),
  UNIQUE (family_id, person_code)
);

CREATE TABLE parent_relations (
  id TEXT PRIMARY KEY,
  family_id TEXT NOT NULL REFERENCES families(id) ON DELETE CASCADE,
  child_id TEXT NOT NULL REFERENCES people(id) ON DELETE CASCADE,
  parent_id TEXT NOT NULL REFERENCES people(id) ON DELETE RESTRICT,
  relation_type TEXT NOT NULL CHECK (relation_type IN ('father', 'mother')),
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  CHECK (child_id <> parent_id),
  UNIQUE (family_id, child_id, relation_type)
);

CREATE TABLE spouse_relations (
  id TEXT PRIMARY KEY,
  family_id TEXT NOT NULL REFERENCES families(id) ON DELETE CASCADE,
  person_a_id TEXT NOT NULL REFERENCES people(id) ON DELETE CASCADE,
  person_b_id TEXT NOT NULL REFERENCES people(id) ON DELETE CASCADE,
  wife_person_id TEXT REFERENCES people(id) ON DELETE RESTRICT,
  wife_order INTEGER CHECK (wife_order IS NULL OR wife_order > 0),
  status TEXT NOT NULL DEFAULT 'married'
    CHECK (status IN ('married', 'divorced', 'widowed', 'unknown')),
  marriage_date TEXT NOT NULL DEFAULT '',
  notes TEXT NOT NULL DEFAULT '',
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  CHECK (person_a_id < person_b_id),
  CHECK (
    wife_person_id IS NULL
    OR wife_person_id = person_a_id
    OR wife_person_id = person_b_id
  ),
  UNIQUE (family_id, person_a_id, person_b_id)
);

CREATE TABLE social_relations (
  id TEXT PRIMARY KEY,
  family_id TEXT NOT NULL REFERENCES families(id) ON DELETE CASCADE,
  from_person_id TEXT NOT NULL REFERENCES people(id) ON DELETE CASCADE,
  to_person_id TEXT REFERENCES people(id) ON DELETE SET NULL,
  to_person_name TEXT,
  to_person_gender TEXT CHECK (
    to_person_gender IS NULL OR to_person_gender IN ('male', 'female')
  ),
  relation_type TEXT NOT NULL,
  label TEXT NOT NULL DEFAULT '',
  seniority_note TEXT NOT NULL DEFAULT '',
  notes TEXT NOT NULL DEFAULT '',
  visibility TEXT NOT NULL DEFAULT 'public'
    CHECK (visibility IN ('public', 'restricted', 'private')),
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  CHECK (to_person_id IS NOT NULL OR length(trim(to_person_name)) > 0)
);

CREATE TABLE draft_submissions (
  id TEXT PRIMARY KEY,
  family_id TEXT NOT NULL REFERENCES families(id) ON DELETE CASCADE,
  submitter_name TEXT NOT NULL,
  submitter_phone TEXT NOT NULL DEFAULT '',
  submitter_relation TEXT NOT NULL DEFAULT '',
  notes TEXT NOT NULL DEFAULT '',
  status TEXT NOT NULL DEFAULT 'draft'
    CHECK (status IN ('draft', 'submitted', 'approved', 'rejected')),
  review_notes TEXT NOT NULL DEFAULT '',
  reviewed_at TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE TABLE draft_people (
  id TEXT PRIMARY KEY,
  submission_id TEXT NOT NULL REFERENCES draft_submissions(id) ON DELETE CASCADE,
  temp_id INTEGER NOT NULL,
  payload_json TEXT NOT NULL,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  UNIQUE (submission_id, temp_id)
);

CREATE TABLE draft_spouse_relations (
  id TEXT PRIMARY KEY,
  submission_id TEXT NOT NULL REFERENCES draft_submissions(id) ON DELETE CASCADE,
  person_a_temp_id INTEGER NOT NULL,
  person_b_temp_id INTEGER NOT NULL,
  wife_order INTEGER CHECK (wife_order IS NULL OR wife_order > 0),
  status TEXT NOT NULL DEFAULT 'married',
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  CHECK (person_a_temp_id < person_b_temp_id),
  UNIQUE (submission_id, person_a_temp_id, person_b_temp_id)
);

CREATE TABLE import_batches (
  id TEXT PRIMARY KEY,
  family_id TEXT NOT NULL REFERENCES families(id) ON DELETE CASCADE,
  source_key TEXT NOT NULL,
  source_sha256 TEXT NOT NULL,
  status TEXT NOT NULL CHECK (
    status IN ('staging', 'validated', 'approved', 'applied', 'rejected')
  ),
  validation_json TEXT NOT NULL DEFAULT '{}',
  approved_by TEXT,
  approved_at TEXT,
  applied_at TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE TABLE audit_events (
  id TEXT PRIMARY KEY,
  family_id TEXT NOT NULL REFERENCES families(id) ON DELETE CASCADE,
  actor_email TEXT NOT NULL,
  action TEXT NOT NULL,
  entity_type TEXT NOT NULL,
  entity_id TEXT NOT NULL,
  before_json TEXT,
  after_json TEXT,
  request_id TEXT NOT NULL,
  created_at TEXT NOT NULL
);

CREATE INDEX idx_branches_family ON branches(family_id, number);
CREATE INDEX idx_people_tree ON people(family_id, tree_scope, branch_id, generation);
CREATE INDEX idx_people_search ON people(family_id, name);
CREATE INDEX idx_people_visibility ON people(family_id, visibility, deleted_at);
CREATE INDEX idx_parent_parent ON parent_relations(family_id, parent_id);
CREATE INDEX idx_parent_child ON parent_relations(family_id, child_id);
CREATE INDEX idx_spouse_a ON spouse_relations(family_id, person_a_id);
CREATE INDEX idx_spouse_b ON spouse_relations(family_id, person_b_id);
CREATE INDEX idx_social_from ON social_relations(family_id, from_person_id);
CREATE INDEX idx_audit_entity ON audit_events(family_id, entity_type, entity_id, created_at);
