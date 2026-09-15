// Motor de almacenamiento local persistente para Banco de Tumores INOR
// SQLite mediante Tauri

import {
  AppState,
  Usuario,
  Biopsia,
  Vial,
  Nota,
  AccionHistorial,
  CopiaSeguridad,
} from '@/types';

import { getDatabase } from './database';

class StorageEngine {
  private static instance: StorageEngine | null = null;

  private constructor() {}

  static getInstance(): StorageEngine {
    if (!StorageEngine.instance) {
      StorageEngine.instance = new StorageEngine();
    }

    return StorageEngine.instance;
  }

  // ===== INICIALIZACIÓN =====

  async initialize(): Promise<void> {
    await getDatabase();
    console.log('StorageEngine SQLite inicializado correctamente');
  }

  // ===== USUARIOS =====

  async getUsuarios(): Promise<Usuario[]> {
    const db = await getDatabase();

    const rows = await db.select<any[]>(`
      SELECT * FROM usuarios
    `);

    return rows.map((row) => ({
      ...row,
      active: Boolean(row.active),
    })) as Usuario[];
  }

  async getUsuarioById(id: string): Promise<Usuario | undefined> {
    const db = await getDatabase();

    const rows = await db.select<any[]>(
      `SELECT * FROM usuarios WHERE id = $1 LIMIT 1`,
      [id]
    );

    if (!rows.length) return undefined;

    return {
      ...rows[0],
      active: Boolean(rows[0].active),
    } as Usuario;
  }

  async getUsuarioByUsername(username: string): Promise<Usuario | undefined> {
    const db = await getDatabase();

    const rows = await db.select<any[]>(
      `SELECT * FROM usuarios WHERE username = $1 LIMIT 1`,
      [username]
    );

    if (!rows.length) return undefined;

    return {
      ...rows[0],
      active: Boolean(rows[0].active),
    } as Usuario;
  }

  async createUsuario(usuario: Usuario): Promise<void> {
    const db = await getDatabase();

    await db.execute(
      `
      INSERT INTO usuarios (
        id,
        username,
        password_hash,
        salt,
        role,
        active,
        created_at,
        updated_at,
        last_login
      )
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)
      `,
      [
        usuario.id,
        usuario.username,
        usuario.password_hash,
        usuario.salt,
        usuario.role,
        usuario.active ? 1 : 0,
        usuario.created_at,
        usuario.updated_at,
        usuario.last_login,
      ]
    );
  }

  async updateUsuario(usuario: Usuario): Promise<void> {
    const db = await getDatabase();

    await db.execute(
      `
      UPDATE usuarios
      SET
        username = $1,
        password_hash = $2,
        salt = $3,
        role = $4,
        active = $5,
        created_at = $6,
        updated_at = $7,
        last_login = $8
      WHERE id = $9
      `,
      [
        usuario.username,
        usuario.password_hash,
        usuario.salt,
        usuario.role,
        usuario.active ? 1 : 0,
        usuario.created_at,
        usuario.updated_at,
        usuario.last_login,
        usuario.id,
      ]
    );
  }

  async deleteUsuario(id: string): Promise<void> {
    const db = await getDatabase();

    await db.execute(
      `DELETE FROM usuarios WHERE id = $1`,
      [id]
    );
  }

  async getActiveAdmins(): Promise<Usuario[]> {
    const usuarios = await this.getUsuarios();

    return usuarios.filter(
      (usuario) => usuario.role === 'admin' && usuario.active
    );
  }

  // ===== BIOPSIAS =====

  async getBiopsias(): Promise<Biopsia[]> {
    const db = await getDatabase();

    return await db.select<Biopsia[]>(`
      SELECT * FROM biopsias
    `);
  }

  async getBiopsiaById(id: string): Promise<Biopsia | undefined> {
    const db = await getDatabase();

    const rows = await db.select<Biopsia[]>(
      `SELECT * FROM biopsias WHERE id = $1 LIMIT 1`,
      [id]
    );

    return rows[0];
  }

  async getBiopsiaByNumero(numero: string): Promise<Biopsia | undefined> {
    const db = await getDatabase();

    const rows = await db.select<Biopsia[]>(
      `SELECT * FROM biopsias WHERE numero_biopsia = $1 LIMIT 1`,
      [numero]
    );

    return rows[0];
  }

  async createBiopsia(biopsia: Biopsia): Promise<void> {
    const db = await getDatabase();

    await db.execute(
      `
      INSERT INTO biopsias (
        id,
        numero_biopsia,
        localizacion,
        localizacion_especifica,
        diagnostico,
        anio_extraccion,
        sexo,
        ubicacion,
        created_by,
        fecha_creacion,
        updated_by,
        fecha_modificacion
      )
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12)
      `,
      [
        biopsia.id,
        biopsia.numero_biopsia,
        biopsia.localizacion,
        biopsia.localizacion_especifica,
        biopsia.diagnostico,
        biopsia.anio_extraccion,
        biopsia.sexo,
        biopsia.ubicacion,
        biopsia.created_by,
        biopsia.fecha_creacion,
        biopsia.updated_by,
        biopsia.fecha_modificacion,
      ]
    );
  }

  async updateBiopsia(biopsia: Biopsia): Promise<void> {
    const db = await getDatabase();

    await db.execute(
      `
      UPDATE biopsias
      SET
        numero_biopsia = $1,
        localizacion = $2,
        localizacion_especifica = $3,
        diagnostico = $4,
        anio_extraccion = $5,
        sexo = $6,
        ubicacion = $7,
        created_by = $8,
        fecha_creacion = $9,
        updated_by = $10,
        fecha_modificacion = $11
      WHERE id = $12
      `,
      [
        biopsia.numero_biopsia,
        biopsia.localizacion,
        biopsia.localizacion_especifica,
        biopsia.diagnostico,
        biopsia.anio_extraccion,
        biopsia.sexo,
        biopsia.ubicacion,
        biopsia.created_by,
        biopsia.fecha_creacion,
        biopsia.updated_by,
        biopsia.fecha_modificacion,
        biopsia.id,
      ]
    );
  }

  async deleteBiopsia(id: string): Promise<void> {
    const db = await getDatabase();

    await db.execute(
      `DELETE FROM biopsias WHERE id = $1`,
      [id]
    );
  }

  async getBiopsiasByLocalizacion(
    localizacion: string
  ): Promise<Biopsia[]> {
    const db = await getDatabase();

    return await db.select<Biopsia[]>(
      `SELECT * FROM biopsias WHERE localizacion = $1`,
      [localizacion]
    );
  }

  // ===== VIALES =====

  async getViales(): Promise<Vial[]> {
    const db = await getDatabase();

    return await db.select<Vial[]>(`
      SELECT * FROM viales
    `);
  }

  async getVialesByBiopsia(biopsiaId: string): Promise<Vial[]> {
    const db = await getDatabase();

    return await db.select<Vial[]>(
      `SELECT * FROM viales WHERE biopsia_id = $1`,
      [biopsiaId]
    );
  }

  async createVial(vial: Vial): Promise<void> {
    const db = await getDatabase();

    await db.execute(
      `
      INSERT INTO viales (
        id,
        biopsia_id,
        identificador_vial,
        tipo,
        created_by,
        created_at,
        updated_by,
        updated_at
      )
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8)
      `,
      [
        vial.id,
        vial.biopsia_id,
        vial.identificador_vial,
        vial.tipo,
        vial.created_by,
        vial.created_at,
        vial.updated_by,
        vial.updated_at,
      ]
    );
  }

  async updateVial(vial: Vial): Promise<void> {
    const db = await getDatabase();

    await db.execute(
      `
      UPDATE viales
      SET
        biopsia_id = $1,
        identificador_vial = $2,
        tipo = $3,
        created_by = $4,
        created_at = $5,
        updated_by = $6,
        updated_at = $7
      WHERE id = $8
      `,
      [
        vial.biopsia_id,
        vial.identificador_vial,
        vial.tipo,
        vial.created_by,
        vial.created_at,
        vial.updated_by,
        vial.updated_at,
        vial.id,
      ]
    );
  }

  async deleteVial(id: string): Promise<void> {
    const db = await getDatabase();

    await db.execute(
      `DELETE FROM viales WHERE id = $1`,
      [id]
    );
  }

  async deleteVialesByBiopsia(biopsiaId: string): Promise<void> {
    const db = await getDatabase();

    await db.execute(
      `DELETE FROM viales WHERE biopsia_id = $1`,
      [biopsiaId]
    );
  }

  // ===== NOTAS =====

  async getNotas(): Promise<Nota[]> {
    const db = await getDatabase();

    return await db.select<Nota[]>(`
      SELECT * FROM notas
    `);
  }

  async getNotasByBiopsia(biopsiaId: string): Promise<Nota[]> {
    const db = await getDatabase();

    return await db.select<Nota[]>(
      `
      SELECT *
      FROM notas
      WHERE biopsia_id = $1
      ORDER BY fecha_creacion DESC
      `,
      [biopsiaId]
    );
  }

  async createNota(nota: Nota): Promise<void> {
    const db = await getDatabase();

    await db.execute(
      `
      INSERT INTO notas (
        id,
        biopsia_id,
        usuario_id,
        texto,
        fecha_creacion
      )
      VALUES ($1,$2,$3,$4,$5)
      `,
      [
        nota.id,
        nota.biopsia_id,
        nota.usuario_id,
        nota.texto,
        nota.fecha_creacion,
      ]
    );
  }

  async deleteNota(id: string): Promise<void> {
    const db = await getDatabase();

    await db.execute(
      `DELETE FROM notas WHERE id = $1`,
      [id]
    );
  }

  // ===== HISTORIAL =====

  async getHistorial(): Promise<AccionHistorial[]> {
    const db = await getDatabase();

    return await db.select<AccionHistorial[]>(`
      SELECT * FROM historial
    `);
  }

  async createHistorial(accion: AccionHistorial): Promise<void> {
    const db = await getDatabase();

    await db.execute(
      `
      INSERT INTO historial (
        id,
        usuario_id,
        username,
        accion,
        entidad,
        entidad_id,
        descripcion,
        fecha,
        hora
      )
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)
      `,
      [
        accion.id,
        accion.usuario_id,
        accion.username,
        accion.accion,
        accion.entidad,
        accion.entidad_id,
        accion.descripcion,
        accion.fecha,
        accion.hora,
      ]
    );
  }

  // ===== COPIAS DE SEGURIDAD =====

  async getCopiasSeguridad(): Promise<CopiaSeguridad[]> {
    const db = await getDatabase();

    return await db.select<CopiaSeguridad[]>(`
      SELECT * FROM copias_seguridad
    `);
  }

  async createCopiaSeguridad(copia: CopiaSeguridad): Promise<void> {
    const db = await getDatabase();

    await db.execute(
      `
      INSERT INTO copias_seguridad (
        id,
        nombre,
        fecha,
        tamano_bytes,
        creado_por
      )
      VALUES ($1,$2,$3,$4,$5)
      `,
      [
        copia.id,
        copia.nombre,
        copia.fecha,
        copia.tamano_bytes,
        copia.creado_por,
      ]
    );
  }

  async deleteCopiaSeguridad(id: string): Promise<void> {
    const db = await getDatabase();

    await db.execute(
      `DELETE FROM copias_seguridad WHERE id = $1`,
      [id]
    );
  }

  // ===== OBTENER TODO EL ESTADO =====

  async getFullState(): Promise<AppState> {
    const [
      usuarios,
      biopsias,
      viales,
      notas,
      historial,
      copias,
    ] = await Promise.all([
      this.getUsuarios(),
      this.getBiopsias(),
      this.getViales(),
      this.getNotas(),
      this.getHistorial(),
      this.getCopiasSeguridad(),
    ]);

    return {
      usuarios,
      biopsias,
      viales,
      notas,
      historial,
      copias_seguridad: copias,
    };
  }

  // ===== RESTAURAR ESTADO COMPLETO =====

  async restoreFullState(state: AppState): Promise<void> {
    const db = await getDatabase();

    // La restauración completa se realiza dentro de una transacción.
    // Si cualquier operación falla, ROLLBACK recupera el estado anterior.
    await db.execute(`BEGIN IMMEDIATE TRANSACTION`);

    try {
      // El orden es importante por las relaciones entre tablas.
      await db.execute(`DELETE FROM notas`);
      await db.execute(`DELETE FROM viales`);
      await db.execute(`DELETE FROM historial`);
      await db.execute(`DELETE FROM copias_seguridad`);
      await db.execute(`DELETE FROM biopsias`);
      await db.execute(`DELETE FROM usuarios`);

      // USUARIOS
      for (const usuario of state.usuarios) {
        await db.execute(
          `
          INSERT INTO usuarios (
            id,
            username,
            password_hash,
            salt,
            role,
            active,
            created_at,
            updated_at,
            last_login
          )
          VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)
          `,
          [
            usuario.id,
            usuario.username,
            usuario.password_hash,
            usuario.salt,
            usuario.role,
            usuario.active ? 1 : 0,
            usuario.created_at,
            usuario.updated_at,
            usuario.last_login,
          ]
        );
      }

      // BIOPSIAS
      for (const biopsia of state.biopsias) {
        await db.execute(
          `
          INSERT INTO biopsias (
            id,
            numero_biopsia,
            localizacion,
            localizacion_especifica,
            diagnostico,
            anio_extraccion,
            sexo,
            ubicacion,
            created_by,
            fecha_creacion,
            updated_by,
            fecha_modificacion
          )
          VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12)
          `,
          [
            biopsia.id,
            biopsia.numero_biopsia,
            biopsia.localizacion,
            biopsia.localizacion_especifica,
            biopsia.diagnostico,
            biopsia.anio_extraccion,
            biopsia.sexo,
            biopsia.ubicacion,
            biopsia.created_by,
            biopsia.fecha_creacion,
            biopsia.updated_by,
            biopsia.fecha_modificacion,
          ]
        );
      }

      // VIALES
      for (const vial of state.viales) {
        await db.execute(
          `
          INSERT INTO viales (
            id,
            biopsia_id,
            identificador_vial,
            tipo,
            created_by,
            created_at,
            updated_by,
            updated_at
          )
          VALUES ($1,$2,$3,$4,$5,$6,$7,$8)
          `,
          [
            vial.id,
            vial.biopsia_id,
            vial.identificador_vial,
            vial.tipo,
            vial.created_by,
            vial.created_at,
            vial.updated_by,
            vial.updated_at,
          ]
        );
      }

      // NOTAS
      for (const nota of state.notas) {
        await db.execute(
          `
          INSERT INTO notas (
            id,
            biopsia_id,
            usuario_id,
            texto,
            fecha_creacion
          )
          VALUES ($1,$2,$3,$4,$5)
          `,
          [
            nota.id,
            nota.biopsia_id,
            nota.usuario_id,
            nota.texto,
            nota.fecha_creacion,
          ]
        );
      }

      // HISTORIAL
      for (const accion of state.historial) {
        await db.execute(
          `
          INSERT INTO historial (
            id,
            usuario_id,
            username,
            accion,
            entidad,
            entidad_id,
            descripcion,
            fecha,
            hora
          )
          VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)
          `,
          [
            accion.id,
            accion.usuario_id,
            accion.username,
            accion.accion,
            accion.entidad,
            accion.entidad_id,
            accion.descripcion,
            accion.fecha,
            accion.hora,
          ]
        );
      }

      // METADATOS DE COPIAS
      for (const copia of state.copias_seguridad) {
        await db.execute(
          `
          INSERT INTO copias_seguridad (
            id,
            nombre,
            fecha,
            tamano_bytes,
            creado_por
          )
          VALUES ($1,$2,$3,$4,$5)
          `,
          [
            copia.id,
            copia.nombre,
            copia.fecha,
            copia.tamano_bytes,
            copia.creado_por,
          ]
        );
      }

      await db.execute(`COMMIT`);
    } catch (error) {
      try {
        await db.execute(`ROLLBACK`);
      } catch (rollbackError) {
        console.error('Error ejecutando ROLLBACK:', rollbackError);
      }

      console.error('Error restaurando la base de datos:', error);
      throw error;
    }
  }

  // ===== CONTADORES =====

  async getBiopsiasCount(): Promise<number> {
    const db = await getDatabase();

    const rows = await db.select<{ total: number }[]>(`
      SELECT COUNT(*) AS total FROM biopsias
    `);

    return Number(rows[0]?.total ?? 0);
  }

  async getBiopsiasCountByLocalizacion(
    localizacion: string
  ): Promise<number> {
    const db = await getDatabase();

    const rows = await db.select<{ total: number }[]>(
      `SELECT COUNT(*) AS total FROM biopsias WHERE localizacion = $1`,
      [localizacion]
    );

    return Number(rows[0]?.total ?? 0);
  }

  async getVialesCount(): Promise<number> {
    const db = await getDatabase();

    const rows = await db.select<{ total: number }[]>(`
      SELECT COUNT(*) AS total FROM viales
    `);

    return Number(rows[0]?.total ?? 0);
  }

  async getVialesTumoralesCount(): Promise<number> {
    const db = await getDatabase();

    const rows = await db.select<{ total: number }[]>(`
      SELECT COUNT(*) AS total
      FROM viales
      WHERE tipo = 'tumoral'
    `);

    return Number(rows[0]?.total ?? 0);
  }

  async getVialesNoTumoralesCount(): Promise<number> {
    const db = await getDatabase();

    const rows = await db.select<{ total: number }[]>(`
      SELECT COUNT(*) AS total
      FROM viales
      WHERE tipo = 'no_tumoral'
    `);

    return Number(rows[0]?.total ?? 0);
  }
}

export const storageEngine = StorageEngine.getInstance();
