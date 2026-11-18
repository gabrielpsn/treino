-- Esquema inicial do D1 (Overload AI).
--
-- Identidade anônima: uma "conta" é só um id aleatório + hash de um token
-- secreto. Nada de e-mail, senha ou nome real no servidor. O apelido que
-- aparece em ligas e turmas é escolhido pelo usuário.

CREATE TABLE IF NOT EXISTS accounts (
  id TEXT PRIMARY KEY,
  token_hash TEXT NOT NULL,
  created_at TEXT NOT NULL
);

-- Um retrato do backup do aparelho (o mesmo JSON do botão de backup, sem fotos).
CREATE TABLE IF NOT EXISTS sync_snapshots (
  account_id TEXT PRIMARY KEY REFERENCES accounts(id) ON DELETE CASCADE,
  payload TEXT NOT NULL,
  size INTEGER NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS leagues (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  invite_code TEXT NOT NULL UNIQUE,
  owner_id TEXT NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
  created_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS league_members (
  league_id TEXT NOT NULL REFERENCES leagues(id) ON DELETE CASCADE,
  account_id TEXT NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
  nickname TEXT NOT NULL,
  joined_at TEXT NOT NULL,
  PRIMARY KEY (league_id, account_id)
);
CREATE INDEX IF NOT EXISTS idx_league_members_account ON league_members(account_id);

CREATE TABLE IF NOT EXISTS league_scores (
  league_id TEXT NOT NULL REFERENCES leagues(id) ON DELETE CASCADE,
  account_id TEXT NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
  week_key TEXT NOT NULL,
  score INTEGER NOT NULL,
  updated_at TEXT NOT NULL,
  PRIMARY KEY (league_id, account_id, week_key)
);

CREATE TABLE IF NOT EXISTS trainer_classes (
  id TEXT PRIMARY KEY,
  trainer_id TEXT NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  invite_code TEXT NOT NULL UNIQUE,
  created_at TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_trainer_classes_trainer ON trainer_classes(trainer_id);

-- O aluno escolhe entrar e pode sair a qualquer momento (o resumo some junto).
CREATE TABLE IF NOT EXISTS class_students (
  class_id TEXT NOT NULL REFERENCES trainer_classes(id) ON DELETE CASCADE,
  student_id TEXT NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
  display_name TEXT NOT NULL,
  joined_at TEXT NOT NULL,
  summary TEXT,
  summary_updated_at TEXT,
  PRIMARY KEY (class_id, student_id)
);
CREATE INDEX IF NOT EXISTS idx_class_students_student ON class_students(student_id);

CREATE TABLE IF NOT EXISTS trainer_plans (
  id TEXT PRIMARY KEY,
  class_id TEXT NOT NULL REFERENCES trainer_classes(id) ON DELETE CASCADE,
  student_id TEXT NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
  payload TEXT NOT NULL,
  note TEXT,
  status TEXT NOT NULL DEFAULT 'pending',
  created_at TEXT NOT NULL,
  responded_at TEXT
);
CREATE INDEX IF NOT EXISTS idx_trainer_plans_student ON trainer_plans(student_id, status);

-- Lembretes: não exige conta. O id é o hash do endpoint do navegador.
CREATE TABLE IF NOT EXISTS push_subscriptions (
  id TEXT PRIMARY KEY,
  endpoint TEXT NOT NULL,
  days TEXT NOT NULL,
  time TEXT NOT NULL,
  tz_offset INTEGER NOT NULL,
  last_sent_at TEXT,
  created_at TEXT NOT NULL
);
