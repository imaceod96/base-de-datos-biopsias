// Exportador multi-hoja Excel y CSV para Banco de Tumores INOR
// Genera archivos .xlsx y .csv sin dependencias externas

import { Biopsia, Vial } from '@/types';
import * as XLSX from 'xlsx';
import { DateUtils } from './crypto';

export interface ExportFilters {
  anio?: number | null;
  localizacion?: string | null;
}

// Genera nombre de archivo con fecha
function generateFileName(prefix: string, filters: ExportFilters = {}): string {
  const now = new Date();
  const dateStr = now.toISOString().split('T')[0]; // YYYY-MM-DD
  const parts = [prefix];
  if (filters.anio) parts.push(filters.anio.toString());
  if (filters.localizacion) parts.push(filters.localizacion);
  parts.push(dateStr);
  return `${parts.join('_')}.xlsx`;
}

// Crea hoja de Biopsias como CSV
function createBiopsiasSheet(biopsias: Biopsia[], viales: Vial[]): string[][] {
  const headers = [
    'Número', 'Localización', 'Localización Específica', 'Diagnóstico',
    'Año', 'Sexo', 'Ubicación', 'Nº de Viales'
  ];

  const rows = biopsias.map((b) => [
    b.numero_biopsia,
    b.localizacion,
    b.localizacion_especifica || '',
    b.diagnostico,
    b.anio_extraccion.toString(),
    b.sexo,
    b.ubicacion,
    viales.filter(v => v.biopsia_id === b.id).length.toString()
  ]);

  return [headers, ...rows];
}

// Crea hoja de Viales como CSV
function createVialesSheet(viales: Vial[]): string[][] {
  const headers = ['Número de Biopsia', 'Identificador', 'Tipo'];

  const rows = viales.map((v) => [
    '', // Se llenará en el componente principal
    v.identificador_vial,
    v.tipo === 'tumoral' ? 'TUMORAL' : 'NO TUMORAL'
  ]);

  return [headers, ...rows];
}

// Exporta a Excel
export function exportToExcel(
  biopsias: Biopsia[],
  viales: Vial[],
  filters: ExportFilters = {}
): void {
  try {
    const biopsiasFiltradas = filterBiopsias(biopsias, filters);
    const vialesFiltrados = filterViales(viales, biopsiasFiltradas);

    // Crear hoja de Biopsias
        const biopsiasSheet = createBiopsiasSheet(biopsiasFiltradas, vialesFiltrados);
    // Crear hoja de Viales
    const vialesSheet = createVialesSheet(vialesFiltrados);

    // Combinar en un solo workbook
    const workbook = XLSX.utils.book_new();
    const biopsiasWs = XLSX.utils.aoa_to_sheet(biopsiasSheet);
    const vialesWs = XLSX.utils.aoa_to_sheet(vialesSheet);

    XLSX.utils.book_append_sheet(workbook, biopsiasWs, 'Biopsias');
    XLSX.utils.book_append_sheet(workbook, vialesWs, 'Viales');

    // Descargar archivo
    XLSX.writeFile(workbook, generateFileName('Biopsias', filters));
  } catch (error) {
    console.error('Error exportando a Excel:', error);
    throw error;
  }
}

// Exporta a CSV
export function exportToCSV(
  biopsias: Biopsia[],
  viales: Vial[],
  filters: ExportFilters = {}
): void {
  try {
    const biopsiasFiltradas = filterBiopsias(biopsias, filters);
    const vialesFiltrados = filterViales(viales, biopsiasFiltradas);

    // Crear CSV de biopsias
    const biopsiasCsv = createCsvFromData(createBiopsiasSheet(biopsiasFiltradas, vialesFiltrados));
    const vialesCsv = createCsvFromData(createVialesSheet(vialesFiltrados));

    // Descargar ambos archivos
    downloadFile(biopsiasCsv, `Biopsias_${formatFilterSuffix(filters)}_${DateUtils.getCurrentDate()}.csv`);
    downloadFile(vialesCsv, `Viales_${formatFilterSuffix(filters)}_${DateUtils.getCurrentDate()}.csv`);
  } catch (error) {
    console.error('Error exportando a CSV:', error);
    throw error;
  }
}

// Filtra biopsias según los filtros proporcionados
export function filterBiopsias(biopsias: Biopsia[], filters: ExportFilters = {}): Biopsia[] {
  return biopsias.filter((b) => {
    const matchesAnio = !filters.anio || b.anio_extraccion === filters.anio;
    const matchesLocalizacion = !filters.localizacion || b.localizacion === filters.localizacion;
    return matchesAnio && matchesLocalizacion;
  });
}

// Filtra viales según las biopsias filtradas
function filterViales(viales: Vial[], biopsiasFiltradas: Biopsia[]): Vial[] {
  const biopsiaIds = new Set(biopsiasFiltradas.map((b) => b.id));
  return viales.filter((v) => biopsiaIds.has(v.biopsia_id));
}

// Genera sufijo para nombre de archivo basado en filtros
function formatFilterSuffix(filters: ExportFilters = {}): string {
  if (!filters.anio && !filters.localizacion) return 'Completo';
  const parts: string[] = [];
  if (filters.anio) parts.push(filters.anio.toString());
  if (filters.localizacion) parts.push(filters.localizacion);
  return parts.join('_');
}

// Crea un workbook Excel en formato XML/HTML
function createWorkbook(sheets: { name: string; data: string[][] }[]): string {
  // Generar XML de Excel usando formato SpreadsheetML
  const sheetXmls = sheets.map((sheet) => {
    const sheetRowsXml = sheet.data.map((row) => {
      const cells = row.map((cell, colIndex) => {
        const escaped = String(cell).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
        const cellRef = getCellRef(colIndex);
        return `<c r="${cellRef}"><v>${escaped}</v></c>`;
      }).join('');
      return `<row>${cells}</row>`;
    }).join('');

    return `
      <worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">
        <sheetData>${sheetRowsXml}</sheetData>
      </worksheet>
    `;
  }).join('');

  return `<?xml version="1.0"?>
    <workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main"
              xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships">
      ${sheetXmls}
    </workbook>`;
}

function getCellRef(colIndex: number): string {
  let col = '';
  let n = colIndex + 1;
  while (n > 0) {
    const remainder = (n - 1) % 26;
    col = String.fromCharCode(65 + remainder) + col;
    n = Math.floor((n - 1) / 26);
  }
  return col;
}

// Descarga un archivo
function downloadFile(content: string, filename: string): void {
  const blob = new Blob([content], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

function createCsvFromData(data: string[][]): string {
  return data.map((row) => 
    row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(',')
  ).join('\n');
}

// Funciones auxiliares que necesitan acceso a datos
export function countVialesForBiopsia(biopsiaId: string): number {
  // Implementado en el componente principal
  return 0;
}

export function getBiopsiaNumero(biopsiaId: string): string | null {
  // Implementado en el componente principal
  return null;
}