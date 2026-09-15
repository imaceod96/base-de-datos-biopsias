import Database from '@tauri-apps/plugin-sql';

let db: Database | null = null;

export async function getDatabase(): Promise<Database> {
  // Si ya está completamente inicializada, reutilizamos la conexión
  if (db) {
    return db;
  }

  // Abrir/crear la base de datos SQLite
  const database = await Database.load('sqlite:BancoDeTumoresINOR.db');

  // Activar claves foráneas
  await database.execute(`PRAGMA foreign_keys = ON`);

  // ===== USUARIOS =====

  await database.execute(`
    CREATE TABLE IF NOT EXISTS usuarios (
      id TEXT PRIMARY KEY,
      username TEXT NOT NULL UNIQUE,
      password_hash TEXT NOT NULL,
      salt TEXT NOT NULL,
      role TEXT NOT NULL,
      active INTEGER NOT NULL DEFAULT 1,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      last_login TEXT
    )
  `);

  // ===== BIOPSIAS =====

  await database.execute(`
    CREATE TABLE IF NOT EXISTS biopsias (
      id TEXT PRIMARY KEY,
      numero_biopsia TEXT NOT NULL UNIQUE,
      localizacion TEXT NOT NULL,
      localizacion_especifica TEXT,
      diagnostico TEXT NOT NULL,
      anio_extraccion INTEGER NOT NULL,
      sexo TEXT NOT NULL,
      ubicacion TEXT NOT NULL,
      created_by TEXT NOT NULL,
      fecha_creacion TEXT NOT NULL,
      updated_by TEXT,
      fecha_modificacion TEXT
    )
  `);

  // ===== VIALES =====

  await database.execute(`
    CREATE TABLE IF NOT EXISTS viales (
      id TEXT PRIMARY KEY,
      biopsia_id TEXT NOT NULL,
      identificador_vial TEXT NOT NULL,
      tipo TEXT NOT NULL,
      created_by TEXT NOT NULL,
      created_at TEXT NOT NULL,
      updated_by TEXT,
      updated_at TEXT,
      FOREIGN KEY (biopsia_id)
        REFERENCES biopsias(id)
        ON DELETE CASCADE
    )
  `);

  // ===== NOTAS =====

  await database.execute(`
    CREATE TABLE IF NOT EXISTS notas (
      id TEXT PRIMARY KEY,
      biopsia_id TEXT NOT NULL,
      usuario_id TEXT NOT NULL,
      texto TEXT NOT NULL,
      fecha_creacion TEXT NOT NULL,
      FOREIGN KEY (biopsia_id)
        REFERENCES biopsias(id)
        ON DELETE CASCADE
    )
  `);

  // ===== HISTORIAL =====

  await database.execute(`
    CREATE TABLE IF NOT EXISTS historial (
      id TEXT PRIMARY KEY,
      usuario_id TEXT NOT NULL,
      username TEXT NOT NULL,
      accion TEXT NOT NULL,
      entidad TEXT NOT NULL,
      entidad_id TEXT,
      descripcion TEXT NOT NULL,
      fecha TEXT NOT NULL,
      hora TEXT NOT NULL
    )
  `);

  // ===== COPIAS DE SEGURIDAD =====

  await database.execute(`
    CREATE TABLE IF NOT EXISTS copias_seguridad (
      id TEXT PRIMARY KEY,
      nombre TEXT NOT NULL,
      fecha TEXT NOT NULL,
      tamano_bytes INTEGER NOT NULL,
      creado_por TEXT NOT NULL
    )
  `);

  // ===== ÍNDICES =====

  await database.execute(`
    CREATE INDEX IF NOT EXISTS idx_usuarios_username
    ON usuarios(username)
  `);

  await database.execute(`
    CREATE INDEX IF NOT EXISTS idx_usuarios_role
    ON usuarios(role)
  `);

  await database.execute(`
    CREATE INDEX IF NOT EXISTS idx_biopsias_localizacion
    ON biopsias(localizacion)
  `);

  await database.execute(`
    CREATE INDEX IF NOT EXISTS idx_biopsias_anio
    ON biopsias(anio_extraccion)
  `);

  await database.execute(`
    CREATE INDEX IF NOT EXISTS idx_biopsias_created_by
    ON biopsias(created_by)
  `);

  await database.execute(`
    CREATE INDEX IF NOT EXISTS idx_viales_biopsia
    ON viales(biopsia_id)
  `);

  await database.execute(`
    CREATE INDEX IF NOT EXISTS idx_viales_tipo
    ON viales(tipo)
  `);

  await database.execute(`
    CREATE INDEX IF NOT EXISTS idx_notas_biopsia
    ON notas(biopsia_id)
  `);

  await database.execute(`
    CREATE INDEX IF NOT EXISTS idx_notas_usuario
    ON notas(usuario_id)
  `);

  await database.execute(`
    CREATE INDEX IF NOT EXISTS idx_historial_usuario
    ON historial(usuario_id)
  `);

  await database.execute(`
    CREATE INDEX IF NOT EXISTS idx_historial_entidad
    ON historial(entidad)
  `);

  await database.execute(`
    CREATE INDEX IF NOT EXISTS idx_historial_fecha
    ON historial(fecha)
  `);

  // Solo guardamos la conexión después de haber creado
  // correctamente todas las tablas e índices.
  db = database;

  console.log('SQLite inicializada correctamente');

  return database;
}
