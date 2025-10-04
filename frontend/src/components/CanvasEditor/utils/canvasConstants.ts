/**
 * Canvas Editor Constants
 * Centralized constants for canvas dimensions, default styles, and data
 */

// Import canvas sizes from TemplateManager for consistency
import { CANVAS_SIZES } from '../../TemplateManager';

// Default canvas dimensions (PowerPoint format)
export const DEFAULT_CANVAS_WIDTH = CANVAS_SIZES.PRESENTATION.width;
export const DEFAULT_CANVAS_HEIGHT = CANVAS_SIZES.PRESENTATION.height;

// Export canvas sizes for easy access
export { CANVAS_SIZES };

// Default canvas properties
export const DEFAULT_CANVAS_CONFIG = {
  width: DEFAULT_CANVAS_WIDTH,
  height: DEFAULT_CANVAS_HEIGHT,
  background: '#ffffff',
  borderWidth: 4,
  borderColor: '#000000',
} as const;

// Default element styles
export const DEFAULT_ELEMENT_STYLES = {
  text: {
    fontSize: 16,
    color: '#000000',
    fontWeight: 'normal',
    fontStyle: 'normal',
    fontFamily: 'Arial',
    textAlign: 'left' as const,
    backgroundColor: 'transparent',
  },
  table: {
    fontSize: 12,
    borderColor: '#000000',
    borderWidth: 1,
    borderStyle: 'solid',
    headerBackgroundColor: '#f3f4f6',
  },
  unit_name: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#000000',
    textAlign: 'center' as const,
  },
  unit_class: {
    fontSize: 18,
    fontWeight: 'normal',
    color: '#666666',
    textAlign: 'center' as const,
  },
} as const;

// Default table data for naval units
export const DEFAULT_TABLE_DATA = [
  ['LUNGHEZZA', 'XXX m', 'LARGHEZZA', 'XXX m'],
  ['DISLOCAMENTO', 'XXX t', 'VELOCITÀ', 'XXX kn'],
  ['EQUIPAGGIO', 'XXX', 'ARMA', 'XXX'],
];

// Default element dimensions
export const DEFAULT_ELEMENT_DIMENSIONS = {
  logo: { width: 150, height: 150 },
  flag: { width: 120, height: 80 },
  silhouette: { width: 300, height: 150 },
  text: { width: 200, height: 40 },
  table: { width: 400, height: 150 },
  unit_name: { width: 400, height: 50 },
  unit_class: { width: 400, height: 40 },
} as const;

// Predefined flags by region
export const PREDEFINED_FLAGS = [
  // Europa
  { name: 'Italia', url: 'https://flagcdn.com/w320/it.png' },
  { name: 'Francia', url: 'https://flagcdn.com/w320/fr.png' },
  { name: 'Germania', url: 'https://flagcdn.com/w320/de.png' },
  { name: 'Regno Unito', url: 'https://flagcdn.com/w320/gb.png' },
  { name: 'Spagna', url: 'https://flagcdn.com/w320/es.png' },
  { name: 'Grecia', url: 'https://flagcdn.com/w320/gr.png' },
  { name: 'Olanda', url: 'https://flagcdn.com/w320/nl.png' },
  { name: 'Belgio', url: 'https://flagcdn.com/w320/be.png' },
  { name: 'Portogallo', url: 'https://flagcdn.com/w320/pt.png' },
  { name: 'Norvegia', url: 'https://flagcdn.com/w320/no.png' },
  { name: 'Danimarca', url: 'https://flagcdn.com/w320/dk.png' },
  { name: 'Svezia', url: 'https://flagcdn.com/w320/se.png' },
  { name: 'Finlandia', url: 'https://flagcdn.com/w320/fi.png' },
  { name: 'Polonia', url: 'https://flagcdn.com/w320/pl.png' },
  { name: 'Austria', url: 'https://flagcdn.com/w320/at.png' },
  { name: 'Svizzera', url: 'https://flagcdn.com/w320/ch.png' },

  // America
  { name: 'USA', url: 'https://flagcdn.com/w320/us.png' },
  { name: 'Canada', url: 'https://flagcdn.com/w320/ca.png' },
  { name: 'Messico', url: 'https://flagcdn.com/w320/mx.png' },
  { name: 'Brasile', url: 'https://flagcdn.com/w320/br.png' },
  { name: 'Argentina', url: 'https://flagcdn.com/w320/ar.png' },
  { name: 'Cile', url: 'https://flagcdn.com/w320/cl.png' },
  { name: 'Colombia', url: 'https://flagcdn.com/w320/co.png' },
  { name: 'Venezuela', url: 'https://flagcdn.com/w320/ve.png' },

  // Asia
  { name: 'Giappone', url: 'https://flagcdn.com/w320/jp.png' },
  { name: 'Cina', url: 'https://flagcdn.com/w320/cn.png' },
  { name: 'India', url: 'https://flagcdn.com/w320/in.png' },
  { name: 'Corea del Sud', url: 'https://flagcdn.com/w320/kr.png' },
  { name: 'Thailandia', url: 'https://flagcdn.com/w320/th.png' },
  { name: 'Singapore', url: 'https://flagcdn.com/w320/sg.png' },
  { name: 'Malaysia', url: 'https://flagcdn.com/w320/my.png' },
  { name: 'Indonesia', url: 'https://flagcdn.com/w320/id.png' },
  { name: 'Filippine', url: 'https://flagcdn.com/w320/ph.png' },
  { name: 'Vietnam', url: 'https://flagcdn.com/w320/vn.png' },

  // Medio Oriente & Africa
  { name: 'Turchia', url: 'https://flagcdn.com/w320/tr.png' },
  { name: 'Israele', url: 'https://flagcdn.com/w320/il.png' },
  { name: 'Egitto', url: 'https://flagcdn.com/w320/eg.png' },
  { name: 'Sud Africa', url: 'https://flagcdn.com/w320/za.png' },
  { name: 'Marocco', url: 'https://flagcdn.com/w320/ma.png' },
  { name: 'Arabia Saudita', url: 'https://flagcdn.com/w320/sa.png' },
  { name: 'Emirati Arabi', url: 'https://flagcdn.com/w320/ae.png' },

  // Oceania
  { name: 'Australia', url: 'https://flagcdn.com/w320/au.png' },
  { name: 'Nuova Zelanda', url: 'https://flagcdn.com/w320/nz.png' },

  // Europa Orientale
  { name: 'Russia', url: 'https://flagcdn.com/w320/ru.png' },
  { name: 'Ucraina', url: 'https://flagcdn.com/w320/ua.png' },
  { name: 'Romania', url: 'https://flagcdn.com/w320/ro.png' },
  { name: 'Bulgaria', url: 'https://flagcdn.com/w320/bg.png' },
  { name: 'Croazia', url: 'https://flagcdn.com/w320/hr.png' },
  { name: 'Serbia', url: 'https://flagcdn.com/w320/rs.png' },

  // Organizzazioni
  { name: 'NATO', url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/3/37/Flag_of_NATO.svg/320px-Flag_of_NATO.svg.png' },
  { name: 'Unione Europea', url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/b/b7/Flag_of_Europe.svg/320px-Flag_of_Europe.svg.png' },
  { name: 'ONU', url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/2/2f/Flag_of_the_United_Nations.svg/320px-Flag_of_the_United_Nations.svg.png' },
];

// Resize handle positions
export const RESIZE_HANDLES = ['nw', 'ne', 'sw', 'se', 'n', 's', 'e', 'w'] as const;

// Minimum element dimensions
export const MIN_ELEMENT_DIMENSIONS = {
  width: 20,
  height: 20,
} as const;

// Grid snap settings
export const GRID_SNAP = {
  enabled: true,
  size: 10,
} as const;

// Z-index layers
export const Z_INDEX = {
  canvas: 0,
  element: 10,
  selectedElement: 20,
  resizeHandle: 30,
  modal: 1000,
} as const;
