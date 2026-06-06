
const {
  SpanGridControl, SpanGridCanvasView, SpanGridCol, SpanGridRow,
  BorderDirection, SpanGridBorder, createDemoGrid, setLocale: spanGridSetLocale,
} = SpanGrid;

const DEFAULT_GRID_STYLE = {
    id: 'Default',
    name: 'Default',
    sub: 'Default',
    swatch: '#1a2744',
    headerBg: '#1a2744',   headerFg: '#ffffff',
    sectionHdrBg: '#2c3e50', sectionHdrFg: '#ffffff',
    bodyBg: '#ffffff',     bodyFg: '#2c3e50',
    altBg: '#ffffff',      altFg: '#2c3e50',
    borderColor: '#d0d7e0',
    accentBg: '#eef2f8',   accentFg: '#1a2744',
    font: '9pt sans-serif',
    headerFont: 'bold 9pt sans-serif',
};

let spanGrid = null;
function createDefaultGrid() {
  spanGrid = new SpanGridControl({ width: 480, height: 300, borderStyle: 'None' });
  [90, 120, 130, 120, 110, 140].forEach((width) => spanGrid.addCol(new SpanGridCol({ width })));
  [30, 34, 34, 34, 34, 34, 34, 44].forEach((height) => spanGrid.addRow(new SpanGridRow({ height })));

  const headers = ["Header", "Status", "Owner", "Start", "Finish", "Notes"];
  headers.forEach((text, index) => {
    const cell = spanGrid.getCell(0, index);
    cell.text = text;
    cell.backColor = "#253449";
    cell.foreColor = "#ffffff";
    cell.font = "bold 13px sans-serif";
  });

  for (let row = 1; row < spanGrid.rows.length; row += 1) {
    for (let col = 0; col < spanGrid.cols.length; col += 1) {
      const cell = spanGrid.getCell(row, col);
      cell.text = col === 0 ? `Item ${row}` : `R${row} C${col}`;
      cell.backColor = row % 2 === 0 ? "#f6f8fb" : "#ffffff";
      cell.foreColor = "#17202f";
      cell.textAlign = col === 0 || col === 5 ? "MiddleLeft" : "MiddleCenter";
    }
  }

  const json = buildStyleOnlyJSON(DEFAULT_GRID_STYLE);
  if (!json) return;

  const newGrid = SpanGridControl.fromJSON(json);
  return newGrid;
}
spanGrid = createDefaultGrid();

// ════════════════════════════════════
//  i18n – INTERNATIONALIZATION
// ════════════════════════════════════
const I18N = {
  en: {
    ob_lead: 'Select exactly <strong>1 frame/layer</strong> for the table (if multiple are selected, only the last one is kept). Click <strong>Create</strong> to enter grid editing, then use the toolbar <strong>Generate</strong> to apply to Figma.',
    ob_quickguide: 'Quick Guide',
    ob_step1_title: 'Select Node',
    ob_step1_txt: 'Select <strong>exactly 1 frame/group</strong> for the table. If multiple are selected during onboarding, the plugin uses the <strong>last clicked one</strong>.',
    ob_step2_title: 'Create',
    ob_step2_txt: 'The plugin window expands to <strong>fit the view</strong>, enabling cell, row, and column editing.',
    ob_step3_title: 'Generate',
    ob_step3_txt: 'Press <strong>Generate</strong> in the toolbar to apply the edited grid snapshot to the currently selected node.',
    ob_sel_section: 'Selection',
    ob_sel_hint_empty: 'Select exactly 1 layer',
    ob_create_btn_title: 'Select exactly 1 layer',
    ob_enter_msg: 'Preparing view and layer…',
    ob_enter_sub: 'This may take a moment for large nodes. Please wait until the canvas appears.',
    toolbar_aria: 'SpanGrid Actions',
    toolbar_eq_all: 'Equalize All',
    toolbar_eq_all_title: 'All: fit rows & cols — equalize both row heights and column widths at once',
    toolbar_eq_rows_title: 'All: row heights — distribute evenly (canvas height minus grid lines)',
    toolbar_eq_cols_title: 'All: col widths — distribute evenly (canvas width minus grid lines)',
    toolbar_eq_sel: 'Equalize Selection',
    toolbar_eq_rows_sel_title: 'Selection: rows — equalize heights preserving total',
    toolbar_eq_cols_sel_title: 'Selection: cols — equalize widths preserving total',
    toolbar_merge: 'Merge',
    toolbar_merge_title: 'Merge: 2+ selected cells',
    toolbar_split_title: 'Split: one merged cell (anchor)',
    toolbar_clearmerge_title: 'Clear all merges',
    toolbar_drop_size_title: 'Size adjustment (equalize rows/cols)',
    toolbar_drop_insert_title: 'Insert / Delete rows & columns',
    toolbar_drop_merge_title: 'Merge / Split',
    toolbar_drop_sort_title: 'Sort / Filter',
    toolbar_drop_move_title: 'Move row / column',
    toolbar_moverow_up_title: 'Move row up',
    toolbar_moverow_down_title: 'Move row down',
    toolbar_movecol_left_title: 'Move column left',
    toolbar_movecol_right_title: 'Move column right',
    toolbar_drop_border_title: 'Border presets',
    toolbar_drop_lbl_all: 'All',
    toolbar_drop_lbl_sel: 'Selected',
    toolbar_drop_lbl_insert: 'Insert',
    toolbar_drop_lbl_delete: 'Delete',
    toolbar_addrow_top_title: 'Insert row above',
    toolbar_addrow_bottom_title: 'Insert row below',
    toolbar_addcol_left_title: 'Insert column to the left',
    toolbar_addcol_right_title: 'Insert column to the right',
    toolbar_delrow_title: 'Delete row',
    toolbar_delcol_title: 'Delete column',
    toolbar_sort_asc_title: 'Sort ascending',
    toolbar_sort_desc_title: 'Sort descending',
    toolbar_filter_title: 'Filter',
    toolbar_brd_outer_title: 'Outer border only',
    toolbar_brd_all_title: 'All borders (outer + inner)',
    toolbar_brd_inner_title: 'Inner borders only',
    toolbar_brd_none_title: 'No border (clear)',
    toolbar_brd_horizontal_title: 'Horizontal lines only',
    toolbar_brd_vertical_title: 'Vertical lines only',
    toolbar_brd_top_title: 'Top border only',
    toolbar_brd_bottom_title: 'Bottom border only',
    toolbar_brd_left_title: 'Left border only',
    toolbar_brd_right_title: 'Right border only',
    toolbar_undo_title: 'Undo (Ctrl+Z)',
    toolbar_redo_title: 'Redo (Ctrl+Y)',
    toolbar_makegrid_title: 'Make grid',
    toolbar_selgrid_title: 'Select entire grid (background, Expand, etc.)',
    toolbar_fit_to_grid_title: 'Fit view to grid (center selected node)',
    toolbar_export: 'Export',
    toolbar_export_title: 'Generate grid snapshot in Figma',
    toolbar_mode_fixed: 'Fixed',
    toolbar_mode_fixed_title: 'Output as fixed-size Frame',
    toolbar_mode_auto: 'Auto',
    toolbar_mode_auto_title: 'Output as Auto Layout Frame (responsive)',
    toolbar_mode_image: 'Image',
    toolbar_mode_image_title: 'Output as Image — rasterizes the grid to a PNG fill',
    toolbar_mode_vector: 'SVG',
    toolbar_mode_vector_title: 'Export as SVG — renders the grid as a scalable vector',
    toolbar_gen_fixed_label: 'Generate',
    toolbar_gen_auto_label: 'Auto Generate',
    toolbar_gen_image_label: 'Image Generate',
    toolbar_gen_vector_label: 'SVG Generate (Beta)',
    toolbar_mode_tag_fixed: 'Basic',
    toolbar_mode_gen_caret_title: 'Select generation mode',
    ctx_lbl_grid: 'Grid',
    ctx_lbl_generate: 'Generate',
    toolbar_creategrid_title: 'Generate in current mode',
    ctx_makegrid: 'Make Grid',
    ctx_selgrid: 'Select Grid',
    ctx_undo: 'Undo',
    ctx_redo: 'Redo',
    ctx_size: 'Equalize Size',
    ctx_eq_all: 'All (rows & cols)',
    ctx_eq_rows: 'All rows',
    ctx_eq_cols: 'All cols',
    ctx_eq_rows_sel: 'Selected rows',
    ctx_eq_cols_sel: 'Selected cols',
    ctx_insert: 'Insert / Delete',
    ctx_addrow_top: 'Row above',
    ctx_addrow_bottom: 'Row below',
    ctx_addcol_left: 'Col left',
    ctx_addcol_right: 'Col right',
    ctx_delrow: 'Delete row',
    ctx_delcol: 'Delete col',
    ctx_move: 'Move',
    ctx_moverow_up: 'Row up',
    ctx_moverow_down: 'Row down',
    ctx_movecol_left: 'Col left',
    ctx_movecol_right: 'Col right',
    ctx_border: 'Border',
    ctx_brd_all: 'All borders',
    ctx_brd_outer: 'Outer',
    ctx_brd_inner: 'Inner',
    ctx_brd_horizontal: 'Horizontal',
    ctx_brd_vertical: 'Vertical',
    ctx_brd_top: 'Top',
    ctx_brd_bottom: 'Bottom',
    ctx_brd_left: 'Left',
    ctx_brd_right: 'Right',
    ctx_brd_none: 'Clear borders',
    ctx_merge: 'Merge / Split',
    ctx_merge_cells: 'Merge',
    ctx_split_cells: 'Split',
    ctx_clearmerge: 'Clear all merges',
    ctx_sort: 'Sort',
    ctx_sort_asc: 'Ascending',
    ctx_sort_desc: 'Descending',
    ctx_gen_fixed: 'Fixed Frame',
    ctx_gen_auto: 'Auto Layout',
    ctx_gen_image: 'Image',
    ctx_gen_vector: 'SVG (Beta)',
    ctx_loadgrid: 'Load Grid',
    toolbar_generate: 'Generate',
    toolbar_generating: 'Generating…',
    toolbar_done: 'Done ✓',
    toolbar_error: 'Error',
    gm_row_add: '+ Row',
    gm_col_add: '+ Col',
    gm_reset: 'Reset',
    gm_cols_label: 'Cols',
    gm_rows_label: 'Rows',
    gm_picker_aria: 'Drag to select rows × cols (max 10×10)',
    panel_back_title: 'Back to start',
    panel_back_aria: 'Back to start',
    sec_cell: 'Cell',
    sec_row: 'Row',
    sec_col: 'Col',
    sec_grid: 'Grid',
    sec_border: 'Border',
    cell_name: 'Name',
    cell_text: 'Text',
    cell_mode: 'Mode',
    cell_bg: 'Background',
    cell_fg: 'Foreground',
    cell_font: 'Font',
    cell_size: 'Size',
    cell_bold: 'Bold',
    cell_italic: 'Italic',
    cell_align: 'Align',
    cell_img_url: 'Image URL',
    cell_img_layout: 'Img Layout',
    cell_img_align: 'Img Align',
    row_height: 'Height (px)',
    col_width: 'Width (px)',
    grid_bg: 'Background',
    grid_focus: 'Focus',
    grid_expand: 'Expand',
    grid_expand_info: 'Automatically expands the grid area to fit the number of cells.',
    grid_poverflow: 'Paste Overflow',
    grid_poverflow_info: 'Automatically expands rows/columns when pasted content exceeds the grid bounds.',
    border_color: 'Color',
    border_width: 'Width',
    border_style: 'Style',
    border_left: 'Left',
    border_top: 'Top',
    border_right: 'Right',
    border_bottom: 'Bottom',
    border_reset: 'Reset to inherit',
    preset_tpl_label: 'Layout',
    preset_sty_label: 'Style',
    preset_style_only: 'Style Only',
    preset_apply: 'Apply',
    status_live: 'Live',
    status_calib: 'Live — Calibration needed',
    seltype_cell: 'Cell',
    seltype_cells: 'Multiple cells',
    seltype_row: 'Row',
    seltype_col: 'Col',
    seltype_grid: 'Entire grid',
    seltype_border: 'Border line',
    tpl_tracker: 'Tracker',
    tpl_finance: 'Finance',
    tpl_invoice: 'Invoice',
    tpl_roster: 'Roster',
    tpl_roadmap: 'Roadmap',
    tpl_pricing: 'Pricing',
    sty_classic: 'Classic',
    sty_modern: 'Modern',
    sty_sky: 'Sky',
    sty_coral: 'Coral',
    sty_mint: 'Mint',
    sty_sepia: 'Sepia',
    sty_luxury: 'Luxury',
    sty_brutal: 'Brutal',
    sty_terminal: 'Terminal',
    sty_sub_classic: 'Navy',
    sty_sub_modern: 'Indigo',
    sty_sub_sky: 'Blue',
    sty_sub_coral: 'Orange',
    sty_sub_mint: 'Green',
    sty_sub_sepia: 'Warm',
    sty_sub_luxury: 'Gold',
    sty_sub_brutal: 'Bold',
    sty_sub_terminal: 'Code',
    notify_onboarding_single: 'Onboarding: only 1 layer can be selected. Keeping the last one.',
    notify_create_select_one: 'Select exactly 1 layer to press Create.',
    notify_onboarding_deselect: 'Only 1 layer can be selected during onboarding. Please deselect others.',
    notify_enter_failed: 'Failed to enter workspace: ',
    notify_grid_failed: 'Failed to insert grid: ',
    ob_sel_hint_reducing: 'Reducing to 1… (last selection kept)',
    ob_sel_hint_ready: 'Ready — click Create to edit',
    ob_create_ready_title: 'Enter full-screen grid edit view',
    ob_create_not_ready_title: 'Select exactly 1 layer on the canvas',
    ob_sel_caption_auto: '1 / 1 layer (auto-adjusting…)',
    toolbar_load_grid: 'Load Grid',
    toolbar_load_grid_title: 'Load grid data from the selected xGrid node into the editor',
    toolbar_load_grid_loading: 'Loading…',
    toolbar_load_grid_loaded: 'Loaded ✓',
    toolbar_load_grid_no_data: 'No grid data on this node',
    xgrid_banner_detected: 'xGrid node detected — click Load Grid to edit',
    xgrid_loaded_notify: 'xGrid data loaded from node',
    ob_state_no_sel: 'SELECT FRAME',
    ob_state_selected: 'SELECTED FRAME',
    ob_desc_no_sel: 'Select 1 frame where the table will be placed in the Figma canvas.',
    ob_desc_selected: 'A frame has been selected in the Figma canvas.',
    ob_desc_reducing: 'Reducing to 1 selection… (keeping last)',
    tab_grid: 'Grid',
    tab_layout: 'Layout',
    tab_preset: 'Preset',
    acc_props: 'Properties',
    acc_preset: 'Preset',
    sec_layout: 'LAYOUT',
    layout_gap_label: 'Gap',
    layout_details: 'DETAILS',
    layout_columns: 'Columns',
    layout_rows: 'Rows',
    layout_count: 'Count',
    layout_type: 'Type',
    layout_stretch: 'Stretch',
    layout_fixed: 'Fixed',
    layout_margin: 'Margin',
    layout_top: 'Top',
    layout_bottom: 'Bottom',
    layout_left: 'Left',
    layout_right: 'Right',
    layout_gutter: 'Gutter',
    layout_col_width: 'Column wi...',
    layout_auto: 'Auto',
    layout_custom: 'Custom',
    layout_min: 'Min',
    layout_max: 'Max',
    layout_preview: 'PREVIEW',
    border_pos: 'Position',
    border_dir: 'Direction',
    panel_apply_btn: '✓ Apply',
    panel_help: 'Help',
  },};

let _lang = (function() {
  try {
    const s = localStorage.getItem('xamong_ge_settings');
    const saved = s ? JSON.parse(s).lang : null;
    return I18N[saved] ? saved : 'en';
  } catch(e) { return 'en'; }
})();

function t(key) {
  return (I18N[_lang] && I18N[_lang][key]) || (I18N.en && I18N.en[key]) || key;
}

window.t = t;

window.setLang = function(lang) {
  if (!I18N[lang]) return;
  _lang = lang;
  try {
    const s = localStorage.getItem('xamong_ge_settings');
    const settings = s ? JSON.parse(s) : {};
    settings.lang = lang;
    localStorage.setItem('xamong_ge_settings', JSON.stringify(settings));
  } catch(e) {}
  try { parent.postMessage({ pluginMessage: { type: 'SET_LANG', lang: lang } }, '*'); } catch(e) {}
  applyI18n();
};

function applyI18n() {
  document.querySelectorAll('[data-i18n]').forEach(function(el) {
    var key = el.getAttribute('data-i18n');
    var val = t(key);
    if (el.hasAttribute('data-i18n-html')) {
      el.innerHTML = val;
    } else {
      el.textContent = val;
    }
  });
  document.querySelectorAll('[data-i18n-title]').forEach(function(el) {
    el.title = t(el.getAttribute('data-i18n-title'));
  });
  document.querySelectorAll('[data-i18n-aria]').forEach(function(el) {
    el.setAttribute('aria-label', t(el.getAttribute('data-i18n-aria')));
  });
  document.querySelectorAll('[data-i18n-placeholder]').forEach(function(el) {
    el.placeholder = t(el.getAttribute('data-i18n-placeholder'));
  });
  var langSel = document.getElementById('lang-select');
  if (langSel) langSel.value = _lang;

  if (typeof spanGridSetLocale === 'function') spanGridSetLocale(_lang);

  document.querySelectorAll('[data-preset-tpl-id]').forEach(function(btn) {
    var id = btn.getAttribute('data-preset-tpl-id');
    if (id === 'style_only') {
      var nameEl = btn.querySelector('.pt-name');
      if (nameEl) nameEl.textContent = t('preset_style_only');
      btn.title = t('preset_style_only');
      return;
    }
    var nameEl = btn.querySelector('.pt-name');
    if (nameEl) nameEl.textContent = t('tpl_' + id);
    btn.title = t('tpl_' + id);
  });
  document.querySelectorAll('[data-preset-sty-id]').forEach(function(btn) {
    var id = btn.getAttribute('data-preset-sty-id');
    var nameEl = btn.querySelector('.ps-name');
    if (nameEl) nameEl.textContent = t('sty_' + id);
    btn.title = t('sty_' + id) + ' · ' + t('sty_sub_' + id);
  });

  var activeModeBtn = document.querySelector('#p-creategrid-mode .mode-btn.is-active');
  var genLabelEl = document.getElementById('p-creategrid-label');
  if (activeModeBtn && genLabelEl) {
    var genLabelKey = activeModeBtn.getAttribute('data-gen-label-key');
    if (genLabelKey) genLabelEl.textContent = t(genLabelKey);
  }
}

window.applyI18n = applyI18n;


spanGrid.scrollBarSize = 0;
spanGrid.borderStyle = 'none';
spanGrid.layout();

//spanGrid.expand = true;

const grid = document.getElementById('grid');
const spanGridScaffold = document.getElementById('span-grid-scaffold');
const pPropsToolbar = document.getElementById('p-props-toolbar');
const sgVScroll = document.getElementById('sg-vscroll');
const sgHScroll = document.getElementById('sg-hscroll');
const sgCorner  = document.getElementById('sg-corner');


const SB_W = 12;
const SB_H = 10;
function showScrollBars(show) {
  const d = show ? 'block' : 'none';
  if (sgVScroll) sgVScroll.style.display = d;
  if (sgHScroll) sgHScroll.style.display = d;
  if (sgCorner)  sgCorner.style.display  = d;
}

const view = new SpanGridCanvasView(grid, spanGrid, { hScroll: sgHScroll, vScroll: sgVScroll });

// ════════════════════════════════════

// ════════════════════════════════════


let spanGridReplace = null;


function saveSpanGridSnapshot() {
  try {
    if (!spanGrid) return;
    const snapshot = spanGrid.toJSON();
    if (!snapshot) return;
    parent.postMessage({ pluginMessage: { type: 'SAVE_GRID_SNAPSHOT', payload: snapshot } }, '*');
  } catch (e) {
    console.warn('saveSpanGridSnapshot failed:', e);
  }
}


function tryRestoreSpanGridSnapshot(snapshot) {
  try {
    if (!snapshot) return false;
    if (typeof spanGridReplace !== 'function') return false;
    const restored = SpanGridControl.fromJSON(snapshot);
    if (!restored) return false;
    spanGridReplace(restored);


    /*
    const _eqR = document.getElementById('p-eqrows');
    const _eqC = document.getElementById('p-eqcols');
    if (_eqR) _eqR.click();
    if (_eqC) _eqC.click();
    */
    return true;
  } catch (e) {
    console.warn('tryRestoreSpanGridSnapshot failed:', e);
    return false;
  }
}


let _autoSaveEnabled = false;
let _autoSaveTimer = null;
const _origViewDraw = view.draw.bind(view);
view.draw = function autoSaveDraw() {
  _origViewDraw();
  if (!_autoSaveEnabled) return;
  clearTimeout(_autoSaveTimer);
  _autoSaveTimer = setTimeout(saveSpanGridSnapshot, 1000);
};

//spanGrid.selectCell(0, 0);
//view.readonly = true;
//view.pasteOverflow = 'expand'; //truncate 


function dockPropsToolbarToGrid() { 
  const sc = spanGridScaffold;
  const bar = pPropsToolbar;
  if (!sc || !bar) return;
  if (getComputedStyle(sc).display === 'none') {
    bar.style.display = 'none';
    bar.style.removeProperty('left');
    bar.style.removeProperty('top');
    bar.style.removeProperty('width');
    bar.style.removeProperty('maxWidth');
    bar.style.removeProperty('transform');
    return;
  }

  const GAP = 4;
  const M = 4;
  const vh = window.innerHeight;
  const r0 = sc.getBoundingClientRect();
  if (r0.width < 1 || r0.height < 1) {
    bar.style.display = 'none';
    return;
  }
  const EST = 40;

  const placeBelow = (y) => {
    bar.style.top = `${y}px`;
    bar.style.transform = 'none';
  };
  const placeAbove = (nodeTop) => {
    bar.style.top = `${nodeTop}px`;
    bar.style.transform = 'translate(0, calc(-100% - ' + GAP + 'px))';
  };
  const chooseSide = (r) => {
    const roomTop = r.top - M;
    const roomBottom = vh - M - r.bottom - SB_H;
    const need = (h) => h + GAP;
    const hEst = EST;
    const okTop = roomTop >= need(hEst);
    const okBottom = roomBottom >= need(hEst);
    if (okTop && okBottom) return false; 
    if (!okTop && okBottom) return true;  
    if (okTop && !okBottom) return false;
    return roomBottom > roomTop;
  };

  bar.style.display = 'flex';
  bar.style.position = 'fixed';
  bar.style.left = `${r0.left}px`;
  
  bar.style.removeProperty('width');
  bar.style.removeProperty('maxWidth');
  bar.style.boxSizing = 'border-box';

  if (chooseSide(r0)) {
    placeBelow(r0.bottom + SB_H + GAP);
  } else {
    placeAbove(r0.top);
  }

  requestAnimationFrame(function () {
    if (getComputedStyle(sc).display === 'none' || getComputedStyle(bar).display === 'none') return;
    const r = sc.getBoundingClientRect();
    if (r.width < 1) return;
    const h = bar.getBoundingClientRect().height || EST;
    const need = h + GAP;
    const roomTop = r.top - M;
    const roomBottom = vh - M - r.bottom - SB_H;
    const okTop = roomTop >= need;
    const okBottom = roomBottom >= need;
    let useBelow;
    if (okTop && okBottom) {
      useBelow = false;
    } else if (!okTop && okBottom) {
      useBelow = true;
    } else if (okTop && !okBottom) {
      useBelow = false;
    } else {
      useBelow = roomBottom > roomTop;
    }
    if (useBelow) {
      placeBelow(r.bottom + SB_H + GAP);
    } else {
      placeAbove(r.top);
    }
  });
}

view.draw();

// ════════════════════════════════════
//  STATE
// ════════════════════════════════════
const S = {
  nodes: [], zoom:1, bounds:{x:0,y:0,width:0,height:0},
  bgColor:{r:.15,g:.15,b:.15,a:1},
  pageName:'', pageId: '',
  selectedIds:[], hoveredId:null,
  calibration:{dx:0,dy:0}, calibrated:false,
  frames: {},

  xGridNodeId: null,
  hasXGridSnapshot: false,
};

function isPhaseWorkspace() {
  return document.body && document.body.classList.contains('phase-workspace');
}


function syncOnboardingFromSelection() {
  const c = (S && S.selectedIds) ? S.selectedIds.length : 0;
  const btn = document.getElementById('ob-create');
  const stateHeader = document.getElementById('ob-state-header');
  const desc = document.getElementById('ob-desc');
  const illustEmpty = document.getElementById('ob-illus-empty');
  const illustSelected = document.getElementById('ob-illus-selected');

  
  if (stateHeader) {
    stateHeader.textContent = c === 1 ? t('ob_state_selected') : t('ob_state_no_sel');
  }

  
  if (desc) {
    if (c === 1) {
      desc.textContent = t('ob_desc_selected');
    } else if (c > 1) {
      desc.textContent = t('ob_desc_reducing');
    } else {
      desc.textContent = t('ob_desc_no_sel');
    }
  }

  
  if (illustEmpty && illustSelected) {
    illustEmpty.style.display = c === 1 ? 'none' : '';
    illustSelected.style.display = c === 1 ? '' : 'none';
  }

  
  if (btn) {
    btn.disabled = c !== 1;
    btn.title = c !== 1
      ? t('ob_create_not_ready_title')
      : t('ob_create_ready_title');
  }
}


const nodePreviewImages = new Map();

const modes = {
  bounds:false, labels:false, fill:false,
  grid:false, depth:false, spacing:false, hidden:false,
};


let calibState = {
  active:false,
  markerScreenX:0, markerScreenY:0,
  markerSize:40,
  previewW:0, previewH:0,
};

// ════════════════════════════════════
//  CANVAS
// ════════════════════════════════════
const canvas = document.getElementById('overlay');

const displayCtx = canvas.getContext('2d');
let bufferCanvas = document.createElement('canvas');
let ctx = bufferCanvas.getContext('2d', { alpha: true });


const blurOverlay = document.getElementById('blur-overlay');
let _blurOlTmpCanvas = null;

function buildBlurOverlay() {
  if (!blurOverlay || !bufferCanvas.width || !bufferCanvas.height) return;
  const SCALE = 1;
  const sw = Math.max(1, Math.ceil(bufferCanvas.width  * SCALE));
  const sh = Math.max(1, Math.ceil(bufferCanvas.height * SCALE));

  if (!_blurOlTmpCanvas) _blurOlTmpCanvas = document.createElement('canvas');
  _blurOlTmpCanvas.width  = sw;
  _blurOlTmpCanvas.height = sh;
  const tmpCtx = _blurOlTmpCanvas.getContext('2d');
  tmpCtx.clearRect(0, 0, sw, sh);

  tmpCtx.filter = 'blur(3px) brightness(0.75) saturate(0.65)';
  //tmpCtx.drawImage(bufferCanvas, 0, 0, sw, sh);
  //tmpCtx.filter = 'none';

  tmpCtx.fillStyle = 'rgba(0, 0, 0, 0.45)';
  tmpCtx.fillRect(0, 0, sw, sh);
  tmpCtx.filter = 'none';

  blurOverlay.width  = bufferCanvas.width;
  blurOverlay.height = bufferCanvas.height;
  const bCtx = blurOverlay.getContext('2d');

  bCtx.drawImage(_blurOlTmpCanvas, 0, 0, blurOverlay.width, blurOverlay.height);
  blurOverlay.style.display = 'block';
}

function hideBlurOverlay() {
  if (blurOverlay) blurOverlay.style.display = 'none';
}


let _rafId = null;
function scheduleRender() {
  if (_rafId !== null) return;
  _rafId = requestAnimationFrame(function() {
    _rafId = null;
    render();
  });
}


let _gridPositionRafId = null;
let _pendingGridPositionNode = null;
function scheduleGridPosition(n) {
  _pendingGridPositionNode = n;
  if (_gridPositionRafId !== null) return;
  _gridPositionRafId = requestAnimationFrame(function() {
    _gridPositionRafId = null;
    if (_pendingGridPositionNode) {
      positionGridToSelectedBounds(_pendingGridPositionNode);
      _pendingGridPositionNode = null;
    }
  });
}


let _canvasFilterOverride = false;


let _lastBodyBgKey = '';


let _sortedNodesCache = null;
function invalidateSortedCache() { _sortedNodesCache = null; }
function getSortedNodes() {
  if (_sortedNodesCache === null) {
    _sortedNodesCache = [...S.nodes].sort((a, b) => a.depth - b.depth);
  }
  return _sortedNodesCache;
}


const _nodeById = new Map();


function _rebuildNodeMap() {
  _nodeById.clear();
  for (const n of S.nodes) _nodeById.set(n.id, n);
}


function _getAnchorNode() {
  if (S.selectedIds && S.selectedIds.length > 0) {
    const sel = _nodeById.get(S.selectedIds[0]);
    if (sel && sel.canvasX !== undefined) return sel;
  }
  const sorted = getSortedNodes();
  for (const n of sorted) {
    if (n.canvasX !== undefined) return n;
  }
  return null;
}


const _pageCache = new Map();


function _cacheCurrentPage() {
  if (!S.pageId || !S.nodes.length) return;
  _pageCache.set(S.pageId, {
    pageId:   S.pageId,
    nodes:    S.nodes.slice(),
    frames:   Object.assign({}, S.frames),
    zoom:     S.zoom,
    bounds:   Object.assign({}, S.bounds),
    bgColor:  Object.assign({}, S.bgColor),
    pageName: S.pageName,
  });
}


function resizeGridCanvas() {
  if (view) view.resize();
}

function resizeCanvas() {
  const w = window.innerWidth;
  const h = window.innerHeight;
  canvas.width  = w;
  canvas.height = h;

  bufferCanvas.width  = w;
  bufferCanvas.height = h;
  resizeGridCanvas();
  render();
  
  try { dockPropsToolbarToGrid(); } catch (e) { /* noop */ }
}

window.addEventListener('resize', resizeCanvas);
resizeCanvas();
if (window.ResizeObserver) {
  new ResizeObserver(() => { resizeGridCanvas(); }).observe(grid);
}

// ════════════════════════════════════

// ════════════════════════════════════
(function spanGridPropsPanel() {
  let g = spanGrid;
  const el = (id) => document.getElementById(id);


  spanGridReplace = function(newGrid) {
    try {
      g = newGrid;
      spanGrid = g;

      if (typeof g.reserveScrollbarInViewport !== 'undefined') {
        g.reserveScrollbarInViewport = false;
      }
      g.scrollBarSize = 0;
      view.grid = g;
      
      g.onSelectionChange(() => scheduleSyncProps());
      g.onCellClick(() => {scheduleSyncProps();});
      
      _wrapGridForUndo(g);
      g.selectGrid();
      pRedraw();
      try { dockPropsToolbarToGrid(); } catch (e) { /* noop */ }
    } catch (e) {
      console.warn('spanGridReplace failed:', e);
    }
  };
  
  window._gridPRedraw = function() { pRedraw(); };
  
  
  function _undoPush() { if (window._undoManager) window._undoManager.push(); }
  window._undoPush = _undoPush;
  
  var _undoBatchTimer = null;
  function _undoPushBatched() {
    if (_undoBatchTimer) return;
    _undoPush();
    _undoBatchTimer = setTimeout(function() { _undoBatchTimer = null; }, 200);
  }
  
  window._spanGridView = view;
  
  function _wrapGridForUndo(grid) {
    if (grid._undoWrapped) return;
    ['pasteTsv', 'setRowHeight', 'setColWidth'].forEach(function(m) {
      if (!grid[m]) return;
      var orig = grid[m].bind(grid);
      grid[m] = function() {
        _undoPushBatched();
        return orig.apply(grid, arguments);
      };
    });
    grid._undoWrapped = true;
  }
  const p = {
    st: el('p-status'),
    csec: el('p-sec-cell'),
    rsec: el('p-sec-row'),
    cosec: el('p-sec-col'),
    bsec: el('p-sec-brd'),
    gsec: el('p-sec-grid'),
  };
  const cname = el('p-cname'), ctext = el('p-ctext'), cmode = el('p-cmode');
  const bgc = el('p-bgc'), fgc = el('p-fgc');
  const ff = el('p-ff'), fsz = el('p-fsz'), fb = el('p-fbld'), fi = el('p-fital'), ta = el('p-ta');
  const iu = el('p-iurl'), ilay = el('p-ilay'), ialign = el('p-ialign');
  const rh = el('p-rh'), cw = el('p-cw');
  const bcol = el('p-bcol'), bw = el('p-bw'), bls = el('p-bls');
  const bl = el('p-bl'), btop = el('p-bt'), br = el('p-br'), bot = el('p-bb');
  const breset = el('p-breset');
  const gbc = el('p-gbc'), fc = el('p-fc'), exp = el('p-exp'), poverflow = el('p-poverflow');
  const pmerge = el('p-merge');
  const psplit = el('p-split');
  const pclearm = el('p-clearmerge');
  const psecm = el('p-sec-merge');

  function pRedraw() { view.draw(); scheduleSyncProps(); }


  let _syncPropsRafId = null;
  function scheduleSyncProps() {
    if (_syncPropsRafId !== null) return;
    _syncPropsRafId = requestAnimationFrame(function() {
      _syncPropsRafId = null;
      syncProps();
    });
  }

  function defaultColWFromSnapshot(s) {
    const a = s.cols;
    if (!a || a.length === 0) return 100;
    const w = a[a.length - 1] && a[a.length - 1].width;
    return Math.max(10, w || 100);
  }
  function defaultRowHFromSnapshot(s) {
    const a = s.rows;
    if (!a || a.length === 0) return 32;
    const h = a[a.length - 1] && a[a.length - 1].height;
    return Math.max(10, h || 32);
  }
  function snapshotResizeTo(snap, tr, tc) {
    tr = Math.max(1, Math.min(20, Math.round(Number(tr) || 1)));
    tc = Math.max(1, Math.min(20, Math.round(Number(tc) || 1)));
    const j = JSON.parse(JSON.stringify(snap));
    const defW = defaultColWFromSnapshot(j);
    const defH = defaultRowHFromSnapshot(j);
    while (j.cols.length < tc) {
      j.cols.push({ width: defW, border: null });
    }
    j.cols = j.cols.slice(0, tc);
    while (j.rows.length < tr) {
      j.rows.push({ height: defH, border: null, cells: [] });
    }
    j.rows = j.rows.slice(0, tr);
    for (const row of j.rows) {
      if (!row.cells) row.cells = [];
      while (row.cells.length < tc) {
        row.cells.push({});
      }
      row.cells = row.cells.slice(0, tc);
    }
    if (Array.isArray(j.merges)) {
      j.merges = j.merges.filter((m) => {
        const a = m.start;
        const b = m.end;
        if (!a || !b) return false;
        return a.row < tr && b.row < tr && a.col < tc && b.col < tc;
      });
    } else {
      j.merges = [];
    }
    if (j.fixed) {
      if (j.fixed.row >= tr) j.fixed.row = -1;
      if (j.fixed.col >= tc) j.fixed.col = -1;
    }
    return j;
  }

  function inheritStylesForNewItems(current, j) {
    const origRowCount = (current.rows || []).length;
    const origColCount = (current.cols || []).length;
    const newRowCount  = (j.rows || []).length;
    const newColCount  = (j.cols || []).length;

    if (origRowCount === 0 && origColCount === 0) return;

    const lastOrigRow = origRowCount > 0 ? current.rows[origRowCount - 1] : null;
    const lastOrigCol = origColCount > 0 ? current.cols[origColCount - 1] : null;


    function cellStyle(src) {
      if (!src) return {};
      const s = {};
      if (src.backColor) s.backColor = src.backColor;
      if (src.foreColor) s.foreColor = src.foreColor;
      if (src.font)      s.font = src.font;
      if (src.textAlign) s.textAlign = src.textAlign;
      if (src.border)    s.border = JSON.parse(JSON.stringify(src.border));
      return s;
    }


    for (let ci = origColCount; ci < newColCount; ci++) {
      if (!j.cols[ci]) continue;
      if (lastOrigCol && lastOrigCol.border && !j.cols[ci].border) {
        j.cols[ci].border = JSON.parse(JSON.stringify(lastOrigCol.border));
      }
    }

    for (let ri = 0; ri < newRowCount; ri++) {
      const jRow = j.rows[ri];
      if (!jRow) continue;
      const isNewRow = ri >= origRowCount;


      if (isNewRow && lastOrigRow && lastOrigRow.border && !jRow.border) {
        jRow.border = JSON.parse(JSON.stringify(lastOrigRow.border));
      }

      if (!jRow.cells) continue;
      for (let ci = 0; ci < newColCount; ci++) {
        const jCell = jRow.cells[ci];
        if (!jCell) continue;

        if (isNewRow) {

          if (!lastOrigRow || !lastOrigRow.cells) continue;
          const srcCell = lastOrigRow.cells[Math.min(ci, lastOrigRow.cells.length - 1)];
          Object.assign(jCell, cellStyle(srcCell));
        } else if (ci >= origColCount) {

          const srcRow = current.rows[ri];
          if (!srcRow || !srcRow.cells || srcRow.cells.length === 0) continue;
          const srcCell = srcRow.cells[srcRow.cells.length - 1];
          Object.assign(jCell, cellStyle(srcCell));
        }
      }
    }
  }

  function applyTableSize(targetRows, targetCols) {
    _undoPush();
    const current = g.toJSON();
    const j = snapshotResizeTo(current, targetRows, targetCols);
    inheritStylesForNewItems(current, j);
    const next = SpanGridControl.fromJSON(j);
    spanGridReplace(next);
  }

  
  function equalizeRowHeights() {
    g.layout();
    const m = g.rows.length;
    if (m < 1) return;

    const _eqSelNode = S && S.nodes && S.nodes.find(function(n) { return n.isSelected; });
    const innerH = (_eqSelNode && _eqSelNode.canvasH > 0 && S && S.zoom > 0)
      ? _eqSelNode.canvasH * g.zoom
      : (typeof g.innerLayoutHeight === 'number' ? g.innerLayoutHeight : g.viewportRect.height);
    const H = innerH / g.zoom;
    const inner = H - m - 1;
    if (inner < 0) return;
    const base = Math.floor(inner / m);
    const rem = inner % m;
    for (let i = 0; i < m; i += 1) {
      g.rows[i].height = Math.max(SpanGridRow.MIN_HEIGHT, base + (i < rem ? 1 : 0));
    }
    g.layout();
    pRedraw();
  }

  function equalizeColWidths() {
    g.layout();
    const n = g.cols.length;
    if (n < 1) return;

    const _eqSelNode = S && S.nodes && S.nodes.find(function(n) { return n.isSelected; });
    const innerW = (_eqSelNode && _eqSelNode.canvasW > 0 && S && S.zoom > 0)
      ? _eqSelNode.canvasW * g.zoom
      : (typeof g.innerLayoutWidth === 'number' ? g.innerLayoutWidth : g.viewportRect.width);
    const W = innerW / g.zoom;
    const inner = W - n - 1;
    if (inner < 0) return;
    const base = Math.floor(inner / n);
    const rem = inner % n;
    for (let i = 0; i < n; i += 1) {
      g.cols[i].width = Math.max(SpanGridCol.MIN_WIDTH, base + (i < rem ? 1 : 0));
    }
    g.layout();
    pRedraw();
  }

  function uSortedInt(arr) {
    return [...new Set(arr.filter((i) => Number.isInteger(i) && i >= 0))].sort((a, b) => a - b);
  }

  
  function selectedRowIndices() {
    const fromCells = uSortedInt(
      (g.selectedCells || []).map((c) => (c && c.row ? g.rows.indexOf(c.row) : -1))
    );
    if (fromCells.length) return fromCells;
    if (g.selectedRow) {
      const i = g.rows.indexOf(g.selectedRow);
      return i >= 0 ? [i] : [];
    }
    return [];
  }

  function selectedColIndices() {
    const fromCells = uSortedInt(
      (g.selectedCells || []).map((c) => {
        if (!c || !c.row) return -1;
        return c.row.cells.indexOf(c);
      })
    );
    if (fromCells.length) return fromCells;
    if (g.selectedCol) {
      const i = g.cols.indexOf(g.selectedCol);
      return i >= 0 ? [i] : [];
    }
    return [];
  }

  
  function equalizeHeightsForSelection() {
    const R = selectedRowIndices();
    if (R.length < 2) return;
    g.layout();
    const k = R.length;
    const sumH = R.reduce((s, i) => s + g.rows[i].height, 0);
    const base = Math.floor(sumH / k);
    const rem = sumH % k;
    R.forEach((ri, j) => {
      g.rows[ri].height = Math.max(SpanGridRow.MIN_HEIGHT, base + (j < rem ? 1 : 0));
    });
    g.layout();
    pRedraw();
  }

  function equalizeWidthsForSelection() {
    const C = selectedColIndices();
    if (C.length < 2) return;
    g.layout();
    const k = C.length;
    const sumW = C.reduce((s, i) => s + g.cols[i].width, 0);
    const base = Math.floor(sumW / k);
    const rem = sumW % k;
    C.forEach((ci, j) => {
      g.cols[ci].width = Math.max(SpanGridCol.MIN_WIDTH, base + (j < rem ? 1 : 0));
    });
    g.layout();
    pRedraw();
  }

  function updateEqualizeSelectionButtons() {
    const a = el('p-eqrows-sel');
    const b = el('p-eqcols-sel');
    if (a) {
      a.disabled = selectedRowIndices().length < 2;
    }
    if (b) {
      b.disabled = selectedColIndices().length < 2;
    }
    
    const hasSel = (g.selectedCells && g.selectedCells.length > 0) ||
                   !!g.selectedRow || !!g.selectedCol;
    const hasRowSel = !!g.selectedRow || (g.selectedCells && g.selectedCells.length > 0);
    const hasColSel = !!g.selectedCol || (g.selectedCells && g.selectedCells.length > 0);
    ['p-addrow-top','p-addrow-bottom'].forEach(function(id) {
      var btn = el(id); if (btn) btn.disabled = !hasRowSel;
    });
    ['p-addcol-left','p-addcol-right'].forEach(function(id) {
      var btn = el(id); if (btn) btn.disabled = !hasColSel;
    });
    ['p-delrow'].forEach(function(id) {
      var btn = el(id); if (btn) btn.disabled = !hasRowSel;
    });
    ['p-delcol'].forEach(function(id) {
      var btn = el(id); if (btn) btn.disabled = !hasColSel;
    });
    ['p-sort-asc','p-sort-desc'].forEach(function(id) {
      var btn = el(id); if (btn) btn.disabled = !hasSel;
    });
    
    var onlyRowSel  = !!g.selectedRow && !g.selectedCol;
    var onlyColSel  = !!g.selectedCol && !g.selectedRow;
    var rowArr = g.rows || [];
    var colArr = g.cols || [];
    
    var selCell = (!onlyRowSel && !onlyColSel && g.selectedCell) ? g.selectedCell : null;
    var cellRowIdx = (selCell && selCell.row) ? rowArr.indexOf(selCell.row) : -1;
    var cellColIdx = (selCell && selCell.row) ? selCell.row.cells.indexOf(selCell) : -1;
    
    var selRowIdx = onlyRowSel ? rowArr.indexOf(g.selectedRow) : cellRowIdx;
    var selColIdx = onlyColSel ? colArr.indexOf(g.selectedCol) : cellColIdx;
    var mrUp   = el('p-moverow-up');
    var mrDown = el('p-moverow-down');
    var mcLeft = el('p-movecol-left');
    var mcRight= el('p-movecol-right');
    if (mrUp)    mrUp.disabled    = selRowIdx <= 0;
    if (mrDown)  mrDown.disabled  = selRowIdx < 0 || selRowIdx >= rowArr.length - 1;
    if (mcLeft)  mcLeft.disabled  = selColIdx <= 0;
    if (mcRight) mcRight.disabled = selColIdx < 0 || selColIdx >= colArr.length - 1;
  }

  
  function updateMergeBar() {
    if (!psecm || !pmerge) return;
    const canMerge = g.selectedCells.length >= 2;
    const canSplit = g.selectedCells.length === 1
      && g.merges.some((m) => m.sCell === g.selectedCells[0]);
    const hasMerges = g.merges.length > 0;
    
    pmerge.disabled = !canMerge;
    psplit.disabled = !canSplit;
    pclearm.disabled = !hasMerges;
    
    psecm.classList.toggle('hidden', !canMerge && !canSplit && !hasMerges);
  }

  function oneCell() { return g.selectedCell || (g.selectedCells[0] || null); }

  function selType() {
    if (g.selectedBorderLine) return 'borderLine';
    if (g.selectedCells.length > 1) return 'cells';
    if (g.selectedCell) return 'cell';
    if (g.selectedRow) return 'row';
    if (g.selectedCol) return 'col';
    
    return 'grid';
  }

  function setVis(sectionEl, vis) {
    if (!sectionEl) return;
    sectionEl.classList.toggle('hidden', !vis);
    sectionEl.querySelectorAll('input, select, button').forEach((f) => { f.disabled = !vis; });
  }

  
  function ncolor(v) {
    if (/^#[0-9a-f]{6}$/i.test(v)) return v;

    var m = /^rgba?\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)/i.exec(v);
    if (m) return '#' + [m[1], m[2], m[3]].map((n) => parseInt(n, 10).toString(16).padStart(2, '0')).join('');
    return '#ffffff';
  }

  
  function parseColorWithAlpha(v) {
    if (!v) return { hex: '#ffffff', alpha: 100 };
    var rgba = /^rgba?\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)(?:\s*,\s*([\d.]+))?\s*\)$/i.exec(v);
    if (rgba) {
      var hex = '#' + [rgba[1], rgba[2], rgba[3]].map((n) => parseInt(n, 10).toString(16).padStart(2, '0')).join('');
      var alpha = rgba[4] !== undefined ? Math.round(parseFloat(rgba[4]) * 100) : 100;
      return { hex: hex, alpha: Math.max(0, Math.min(100, alpha)) };
    }
    if (/^#[0-9a-f]{6}$/i.test(v)) return { hex: v.toLowerCase(), alpha: 100 };
    return { hex: '#ffffff', alpha: 100 };
  }

  
  function buildColorWithAlpha(hex, alpha) {
    alpha = Math.max(0, Math.min(100, alpha ?? 100));
    hex = ncolor(hex);
    if (alpha === 100) return hex;
    var r = parseInt(hex.slice(1, 3), 16);
    var g = parseInt(hex.slice(3, 5), 16);
    var b = parseInt(hex.slice(5, 7), 16);
    return 'rgba(' + r + ',' + g + ',' + b + ',' + (alpha / 100).toFixed(2) + ')';
  }

  
  function syncHex(swatchEl) {
    var row = swatchEl && swatchEl.parentElement;
    if (!row) return;
    var hexIn = row.querySelector('.panel-hex-in');
    if (hexIn) hexIn.value = swatchEl.value.toUpperCase();
  }

  
  function syncColorRow(swatchEl, colorVal) {
    if (!swatchEl) return;
    var parsed = parseColorWithAlpha(colorVal);
    swatchEl.value = parsed.hex;
    var row = swatchEl.parentElement;
    if (!row) return;
    var hexIn = row.querySelector('.panel-hex-in');
    if (hexIn) hexIn.value = parsed.hex.toUpperCase();
    var opaIn = row.querySelector('.panel-opacity-in');
    if (opaIn) opaIn.value = parsed.alpha;
  }

  function sidxBounds(cells) {
    return cells.reduce((b, cell) => {
      const row = g.rows.indexOf(cell.row);
      const col = cell.row.cells.indexOf(cell);
      return { minR: Math.min(b.minR, row), maxR: Math.max(b.maxR, row), minC: Math.min(b.minC, col), maxC: Math.max(b.maxC, col) };
    }, { minR: Infinity, maxR: -1, minC: Infinity, maxC: -1 });
  }

  function bFromLine(line) {
    const b = new SpanGridBorder({ color: '#a0a0a0', borderDirection: BorderDirection.None });
    const c = line.type === 'row' ? g.getCell(line.index, 0) : g.getCell(0, line.index);
    if (!c) return b;
    const r = g.resolveCellBorder(c, line.side);
    if (r.visible) {
      b.setSide(line.side, { color: r.color, lineStyle: r.lineStyle, lineWidth: r.lineWidth, visible: true });
      b.lineStyle = r.lineStyle; b.lineWidth = r.lineWidth;
    }
    return b;
  }

  function bFromSelection(cells) {
    if (!cells.length) return g.gridBorder;
    const b = sidxBounds(cells);
    const o = new SpanGridBorder({ color: '#a0a0a0', borderDirection: BorderDirection.None });
    const sideCell = [
      ['top', cells.find((c) => g.rows.indexOf(c.row) === b.minR)],
      ['bottom', cells.find((c) => g.rows.indexOf(c.row) === b.maxR)],
      ['left', cells.find((c) => c.row.cells.indexOf(c) === b.minC)],
      ['right', cells.find((c) => c.row.cells.indexOf(c) === b.maxC)],
    ];
    for (const [side, c] of sideCell) {
      if (!c) continue;
      const r = g.resolveCellBorder(c, side);
      if (!r.visible) continue;
      o.setSide(side, { color: r.color, lineStyle: r.lineStyle, lineWidth: r.lineWidth, visible: true });
      o.lineStyle = r.lineStyle; o.lineWidth = r.lineWidth;
    }
    return o;
  }

  function bFromCell(c) {
    const sides = ['left', 'right', 'top', 'bottom'];
    const o = new SpanGridBorder({ color: '#a0a0a0', borderDirection: BorderDirection.None });
    let fv = null;
    for (const side of sides) {
      const r = g.resolveCellBorder(c, side);
      if (!r.visible) continue;
      if (side === 'left') o.leftColor = r.color; if (side === 'right') o.rightColor = r.color;
      if (side === 'top') o.topColor = r.color; if (side === 'bottom') o.bottomColor = r.color;
      o.borderDirection |= BorderDirection[side[0].toUpperCase() + side.slice(1)];
      if (!fv) fv = r;
    }
    if (fv) { o.lineStyle = fv.lineStyle; o.lineWidth = fv.lineWidth; }
    return o;
  }

  function selBTarget() {
    if (g.selectedBorderLine) return g.selectedBorderLine;
    if (g.selectedCells.length > 1) return { type: 'cells', cells: g.selectedCells };
    if (g.selectedCell) return g.selectedCell;
    if (g.selectedRow) return g.selectedRow;
    if (g.selectedCol) return g.selectedCol;
    return g;
  }

  function bForView(t) {
    if (t === g) return g.gridBorder;
    if (g.selectedBorderLine && t === g.selectedBorderLine) return bFromLine(t);
    if (t && t.type === 'cells') return bFromSelection(t.cells);
    if (t && t.border) return t.border;
    if (t && t.row && t.col) return bFromCell(t);
    return g.gridBorder;
  }

  function editB() {
    const t = selBTarget();
    if (t === g) return g.gridBorder;
    if (t && (t.type === 'row' || t.type === 'col' || t.type === 'cells')) return null;
    if (!t.border) {
      const src = t.row && t.col ? bFromCell(t) : g.gridBorder.clone();
      t.border = src.clone ? src.clone() : new SpanGridBorder({ color: '#a0a0a0' });
    }
    return t.border;
  }

  
  function propagateSides(changedCells, sides) {
    var D   = BorderDirection;
    var OPP = { right: 'left', left: 'right', bottom: 'top', top: 'bottom' };
    var OFF = { right: [0, 1], left: [0, -1], bottom: [1, 0], top: [-1, 0] };
    var BIT = { left: D.Left, top: D.Top, right: D.Right, bottom: D.Bottom };

    changedCells.forEach(function(c) {
      var ri = g.rows.indexOf(c.row);
      var ci = c.row.cells.indexOf(c);
      sides.forEach(function(side) {
        var off = OFF[side];
        var nr = ri + off[0], nc = ci + off[1];
        if (nr < 0 || nc < 0 || nr >= g.rows.length) return;
        var nRow = g.rows[nr];
        if (!nRow || nc >= nRow.cells.length) return;
        var nb  = nRow.cells[nc];
        var opp = OPP[side];
        var isSet = c.border && (c.border.borderDirection & BIT[side]) !== 0;
        if (isSet) {
          
          var sc = c.border[side + 'Color']      || c.border.leftColor;
          var sw = c.border[side + 'LineWidth'] != null ? c.border[side + 'LineWidth'] : (c.border.lineWidth || 1);
          var ss = c.border[side + 'LineStyle']  || c.border.lineStyle || 'Solid';
          if (!nb.border) nb.border = new SpanGridBorder({ color: sc, borderDirection: D.None, lineStyle: ss, lineWidth: sw });
          nb.border.setSide(opp, { color: sc, lineStyle: ss, lineWidth: sw, visible: true });
        } else {
          
          if (nb.border) {
            nb.border.setSide(opp, { visible: false });
            if (nb.border.borderDirection === D.None) nb.border = null;
          }
        }
      });
    });
  }

  
  window._applyBorderPreset = function(type) {
    _undoPush();
    var color = bcol.value;
    var lw    = Number(bw.value) || 1;
    var ls    = bls.value;
    var D     = BorderDirection;
    var t     = selBTarget();
    var cells = (t && t.type === 'cells') ? t.cells
              : (g.selectedCell ? [g.selectedCell] : []);

    
    function applyDirToCell(c, dir) {
      if (!c.border) c.border = new SpanGridBorder({ color: color, borderDirection: D.None, lineStyle: ls, lineWidth: lw });
      ['left','top','right','bottom'].forEach(function(side) {
        var bit = side === 'top' ? D.Top : side === 'bottom' ? D.Bottom : side === 'right' ? D.Right : D.Left;
        if ((dir & bit) !== 0) {
          c.border.setSide(side, { color: color, lineStyle: ls, lineWidth: lw, visible: true });
        }
      });
    }

    
    if (type === 'none') {
      if (t === g) return;
      if (cells.length > 0) {
        cells.forEach(function(c) { c.border = null; });
        propagateSides(cells, ['left', 'top', 'right', 'bottom']);
        g.layout();
      } else if (t) {
        t.border = null;
        if (g.selectedCell) propagateSides([g.selectedCell], ['left', 'top', 'right', 'bottom']);
      }
      pRedraw(); syncProps(); return;
    }

    
    if (type === 'all') {
      if (cells.length > 0) {
        cells.forEach(function(c) { applyDirToCell(c, D.Left | D.Top | D.Right | D.Bottom); });
        propagateSides(cells, ['left', 'top', 'right', 'bottom']);
        g.layout();
      } else {
        var eb = editB();
        if (eb) { eb.setColor(color); eb.setLineWidth(lw); eb.setLineStyle(ls); eb.borderDirection = D.Left | D.Top | D.Right | D.Bottom; if (t === g) { g.lineColor = color; g.lineStyle = ls; } }
      }
      pRedraw(); syncProps(); return;
    }

    
    if (type === 'outer') {
      if (cells.length > 0) {
        var obds = sidxBounds(cells);
        g.applyBorderToSelectedCells(new SpanGridBorder({ color: color, borderDirection: D.Left | D.Top | D.Right | D.Bottom, lineStyle: ls, lineWidth: lw }));
        
        cells.forEach(function(c) {
          var ri = g.rows.indexOf(c.row), ci = c.row.cells.indexOf(c);
          var sides = [];
          if (ri === obds.minR) sides.push('top');
          if (ri === obds.maxR) sides.push('bottom');
          if (ci === obds.minC) sides.push('left');
          if (ci === obds.maxC) sides.push('right');
          if (sides.length) propagateSides([c], sides);
        });
      } else {
        var eb = editB();
        if (eb) { eb.setColor(color); eb.setLineWidth(lw); eb.setLineStyle(ls); eb.borderDirection = D.Left | D.Top | D.Right | D.Bottom; if (t === g) { g.lineColor = color; g.lineStyle = ls; } }
      }
      pRedraw(); syncProps(); return;
    }

    
    if (type === 'inner') {
      if (cells.length > 1) {
        var bds = sidxBounds(cells);
        cells.forEach(function(c) {
          var ri = g.rows.indexOf(c.row), ci = c.row.cells.indexOf(c);
          var border = c.border || new SpanGridBorder({
            color: color,
            borderDirection: D.None,
            lineStyle: ls,
            lineWidth: lw,
            inheritUnspecified: true,
          });
          border.inheritUnspecified = true;
          if (ci < bds.maxC) border.setSide('right',  { color: color, lineStyle: ls, lineWidth: lw, visible: true });
          if (ri < bds.maxR) border.setSide('bottom', { color: color, lineStyle: ls, lineWidth: lw, visible: true });
          c.border = border;
          
          var innerSides = [];
          if (ci < bds.maxC) innerSides.push('right');
          if (ri < bds.maxR) innerSides.push('bottom');
          if (innerSides.length) propagateSides([c], innerSides);
        });
        g.layout();
      }
      pRedraw(); syncProps(); return;
    }

    
    if (type === 'horizontal') {
      if (cells.length > 0) {
        cells.forEach(function(c) { applyDirToCell(c, D.Top | D.Bottom); });
        propagateSides(cells, ['top', 'bottom']);
        g.layout();
      } else {
        var eb = editB();
        if (eb) { eb.setColor(color); eb.setLineWidth(lw); eb.setLineStyle(ls); eb.borderDirection = D.Top | D.Bottom; }
      }
      pRedraw(); syncProps(); return;
    }

    
    if (type === 'vertical') {
      if (cells.length > 0) {
        cells.forEach(function(c) { applyDirToCell(c, D.Left | D.Right); });
        propagateSides(cells, ['left', 'right']);
        g.layout();
      } else {
        var eb = editB();
        if (eb) { eb.setColor(color); eb.setLineWidth(lw); eb.setLineStyle(ls); eb.borderDirection = D.Left | D.Right; }
      }
      pRedraw(); syncProps(); return;
    }

    
    if (type === 'top' || type === 'bottom' || type === 'left' || type === 'right') {
      var dir = type === 'top' ? D.Top : type === 'bottom' ? D.Bottom
              : type === 'left' ? D.Left : D.Right;
      if (cells.length > 0) {
        var bds = sidxBounds(cells);
        var edgeCells = [];
        cells.forEach(function(c) {
          var ri = g.rows.indexOf(c.row);
          var ci = c.row.cells.indexOf(c);
          var onEdge = (type === 'top'    && ri === bds.minR)
                    || (type === 'bottom' && ri === bds.maxR)
                    || (type === 'left'   && ci === bds.minC)
                    || (type === 'right'  && ci === bds.maxC);
          if (onEdge) { applyDirToCell(c, dir); edgeCells.push(c); }
        });
        propagateSides(edgeCells, [type]);
        g.layout();
      } else {
        var eb = editB();
        if (eb) { eb.setColor(color); eb.setLineWidth(lw); eb.setLineStyle(ls); eb.borderDirection = dir; }
      }
      pRedraw(); syncProps(); return;
    }
  };

  function syncBDir(t) {
    
    const fld = { left: bl, top: btop, right: br, bottom: bot };
    const btnMap = { top: 'p-bt-btn', right: 'p-br-btn', bottom: 'p-bb-btn', left: 'p-bl-btn' };

    
    Object.values(fld).forEach((f) => { f.disabled = false; });
    Object.keys(btnMap).forEach(function(side) {
      const btn = document.getElementById(btnMap[side]);
      if (btn) btn.disabled = false;
    });

    
    if (t && (t.type === 'row' || t.type === 'col')) {
      const a = t.side;
      if (a && fld[a]) {
        Object.keys(fld).forEach(function(side) {
          const ok = side === a;
          fld[side].disabled = !ok;
          const btn = document.getElementById(btnMap[side]);
          if (btn) {
            btn.disabled = !ok;
            if (!ok) btn.classList.remove('active');
          }
        });
        fld[a].checked = true;
      }
    }
  }

  function syncBposActive() {
    
    const checkMap = { 'p-bt-btn': btop, 'p-br-btn': br, 'p-bb-btn': bot, 'p-bl-btn': bl };
    Object.keys(checkMap).forEach(function(btnId) {
      var btn = document.getElementById(btnId);
      if (btn && !btn.disabled) {
        btn.classList.toggle('active', !!checkMap[btnId].checked);
      }
    });
  }

  function syncB() {
    const t = selBTarget();
    const b = bForView(t);
    syncColorRow(bcol, b.leftColor);
    bw.value = String(b.lineWidth || 1);
    bls.value = b.lineStyle || 'Solid';
    
    bl.checked = (b.borderDirection & BorderDirection.Left) !== 0;
    btop.checked = (b.borderDirection & BorderDirection.Top) !== 0;
    br.checked = (b.borderDirection & BorderDirection.Right) !== 0;
    bot.checked = (b.borderDirection & BorderDirection.Bottom) !== 0;
    syncBDir(t);       
    syncBposActive();  
    
    breset.disabled = t === g || (t && t.type !== 'cells' && t.type !== 'row' && t.type !== 'col' && !t.border);
  }

  function bTpl() {
    let d = BorderDirection.None;
    if (bl.checked) d |= BorderDirection.Left;
    if (btop.checked) d |= BorderDirection.Top;
    if (br.checked) d |= BorderDirection.Right;
    if (bot.checked) d |= BorderDirection.Bottom;
    const bcolOpa = el('p-bcol-opa');
    const bcolColor = buildColorWithAlpha(bcol.value, bcolOpa ? Number(bcolOpa.value) : 100);
    return new SpanGridBorder({
      color: bcolColor, borderDirection: d, lineStyle: bls.value, lineWidth: Number(bw.value) || 1,
    });
  }

  function applyB() {
    _undoPushBatched();
    const t = selBTarget();
    const x = bTpl();
    if (g.selectedBorderLine && t === g.selectedBorderLine) {
      const u = BorderDirection[t.side[0].toUpperCase() + t.side.slice(1)];
      x.borderDirection = (x.borderDirection & u) ? u : BorderDirection.None;
      g.applyBorderToSelectedLine(x);
      pRedraw();
      return;
    }
    if (t && t.type === 'cells') {
      g.applyBorderToSelectedCells(x);
      
      var _cells = g.selectedCells;
      if (_cells.length > 0) {
        var _bds = sidxBounds(_cells);
        _cells.forEach(function(c) {
          var ri = g.rows.indexOf(c.row), ci = c.row.cells.indexOf(c);
          var sides = [];
          if (ri === _bds.minR) sides.push('top');
          if (ri === _bds.maxR) sides.push('bottom');
          if (ci === _bds.minC) sides.push('left');
          if (ci === _bds.maxC) sides.push('right');
          if (sides.length) propagateSides([c], sides);
        });
      }
      pRedraw(); return;
    }
    const eb = editB();
    if (!eb) { pRedraw(); return; }
    const bcolOpa = el('p-bcol-opa');
    const bcolColor = buildColorWithAlpha(bcol.value, bcolOpa ? Number(bcolOpa.value) : 100);
    eb.setColor(bcolColor); eb.setLineWidth(bw.value); eb.setLineStyle(bls.value);
    eb.borderDirection = x.borderDirection;
    if (t === g) { g.lineColor = eb.leftColor; g.lineStyle = eb.lineStyle; }
    
    if (g.selectedCell) propagateSides([g.selectedCell], ['left', 'top', 'right', 'bottom']);
    pRedraw();
  }

  function pFont() { const t = fTxt(ff.value), w = (fb.checked ? 'bold ' : ''), it = (fi && fi.checked ? 'italic ' : ''), s = Math.max(8, Number(fsz.value) || 13), fam = t.family || 'sans-serif'; toCells({ font: `${it}${w}${s}px ${fam}` }); }
  function fTxt(v) {
    const t = v || '13px sans-serif';
    const m = t.match(/(\d+(?:\.\d+)?)(px|pt)/i);
    const s = m ? Math.round(Number(m[1]) * (m[2].toLowerCase() === 'pt' ? 4 / 3 : 1)) : 13;
    const fam = t.replace(/\bbold\b/gi, '').replace(/\bitalic\b/gi, '').replace(/\bnormal\b/gi, '').replace(m ? m[0] : '', '').trim() || 'sans-serif';
    return { bold: /\bbold\b/i.test(t), italic: /\bitalic\b/i.test(t), size: s, family: fam };
  }
  function toCells(props) { if (g.selectedCells.length === 0) return; _undoPushBatched(); g.applyPropertiesToSelectedCells(props); view.draw(); }
  function setImgUrl(s) {
    const cells = g.selectedCells; if (cells.length === 0) return;
    _undoPush();
    const v = s.trim();
    cells.forEach((c) => { c.backgroundImageUrl = v; });
    if (!v) { cells.forEach((c) => { c.backgroundImage = null; }); pRedraw(); return; }
    const im = new Image();
    im.onload = im.onerror = () => pRedraw();
    cells.forEach((c) => { c.backgroundImage = im; });
    im.src = v;
  }

  function stTxt() {
    const ty = selType();
    const m = { cell: t('seltype_cell'), cells: t('seltype_cells'), row: t('seltype_row'), col: t('seltype_col'), grid: t('seltype_grid'), borderLine: t('seltype_border') };
    p.st.textContent = m[ty] + (g.selectedCell ? ' · (r' + g.rows.indexOf(g.selectedCell.row) + ',c' + g.selectedCell.row.cells.indexOf(g.selectedCell) + ')' : '') + (g.selectedCells.length > 1 ? ' (' + g.selectedCells.length + ' cells)' : '');
  }

  function syncProps() {
    const t = selType();
    setVis(p.csec, t === 'cell' || t === 'cells');
    setVis(p.rsec, t === 'row' || (t === 'borderLine' && g.selectedBorderLine && g.selectedBorderLine.type === 'row'));
    setVis(p.cosec, t === 'col' || (t === 'borderLine' && g.selectedBorderLine && g.selectedBorderLine.type === 'col'));
    setVis(p.bsec, ['cell', 'cells', 'row', 'col', 'grid', 'borderLine'].indexOf(t) >= 0);
    setVis(p.gsec, t === 'grid');

    const c = oneCell();
    if (!c) {
      cname.value = ctext.value = '';
      if (cmode) cmode.value = 'default';
    } else {
      cname.value = c.name; ctext.value = c.text; if (cmode) cmode.value = c.mode || 'default';
      const fo = fTxt(c.font);
      syncColorRow(bgc, c.backColor);
      syncColorRow(fgc, c.foreColor);
      ff.value = fo.family; fsz.value = String(fo.size); fb.checked = fo.bold; if (fi) fi.checked = fo.italic;
      ta.value = c.textAlign;
      
      if (iu) iu.value = c.backgroundImageUrl || '';
      if (ilay) ilay.value = c.backgroundImageLayout || 'None';
      if (ialign) ialign.value = c.backgroundImageAlign || 'TopLeft';
    }
    if (g.selectedRow) rh.value = String(g.selectedRow.height);
    if (g.selectedCol) cw.value = String(g.selectedCol.width);
    if (exp) exp.checked = g.expand;
    syncColorRow(gbc, g.backColor);

    fc.value = ncolor(g.focusColor); syncHex(fc);
    var fcOpaEl = el('p-fc-opa');
    if (fcOpaEl) fcOpaEl.value = Math.round((g.selectionFillAlpha ?? 0.12) * 100);

    poverflow.checked = view.pasteOverflow === 'expand';

    syncB(); stTxt();
    updateMergeBar();
    updateEqualizeSelectionButtons();
  }

  pmerge.addEventListener('click', () => {
    _undoPush();
    try { g.mergeSelectedCells(); } catch (e) {  }
    pRedraw();
  });
  psplit.addEventListener('click', () => {
    _undoPush();
    g.splitSelectedCell();
    pRedraw();
  });
  pclearm.addEventListener('click', () => {
    _undoPush();
    g.merges.length = 0;
    g.layout();
    pRedraw();
  });


  el('p-creategrid').addEventListener('click', () => {
    const btn = el('p-creategrid');
    const label = btn.querySelector('.creategrid-label');
    if (btn.classList.contains('is-creating')) return;


    const modeGrp = document.getElementById('p-creategrid-mode');
    const activeMode = modeGrp
      ? (modeGrp.querySelector('.mode-btn.is-active')?.getAttribute('data-mode') ?? 'fixed')
      : 'fixed';


    btn.classList.add('is-creating');
    if (label) label.textContent = t('toolbar_generating');


    const snapshot = g.toJSON();


    if (activeMode === 'vector') {
      let svgStr;
      try {
        svgStr = g.toSVG();
      } catch (err) {
        console.error('toSVG error', err);
        btn.classList.remove('is-creating');
        btn.classList.add('is-error');
        if (label) label.textContent = t('toolbar_generate');
        return;
      }

      if (typeof parent !== 'undefined' && parent !== window) {
        parent.postMessage({
          pluginMessage: {
            type: 'CREATE_GRID_SVG',
            svgString: svgStr,
            snapshot,
          },
        }, '*');
      } else {

        const blob = new Blob([svgStr], { type: 'image/svg+xml' });
        const url  = URL.createObjectURL(blob);
        const a    = document.createElement('a');
        a.href     = url;
        a.download = 'spangrid.svg';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        btn.classList.remove('is-creating');
        if (label) label.textContent = t('toolbar_generate');
      }
      return;
    }


    if (activeMode === 'image') {
      g.toImage().then((result) => {
        if (!result) {
          btn.classList.remove('is-creating');
          btn.classList.add('is-error');
          if (label) label.textContent = t('toolbar_generate');
          return;
        }
        parent.postMessage({
          pluginMessage: {
            type: 'CREATE_GRID_IMAGE',
            dataURL: result.dataURL,
            width: result.width,
            height: result.height,
            snapshot,
          },
        }, '*');
      }).catch((err) => {
        console.error('toImage error', err);
        btn.classList.remove('is-creating');
        btn.classList.add('is-error');
        if (label) label.textContent = t('toolbar_generate');
      });
      return;
    }


    saveSpanGridSnapshot();


    //


    const _selNode = S && S.nodes && S.nodes.find(function(n) { return n.isSelected; });
    if (_selNode && _selNode.canvasW > 0 && _selNode.canvasH > 0 && g && g.zoom > 0) {
      snapshot.width  = Math.round(_selNode.canvasW * g.zoom);
      snapshot.height = Math.round(_selNode.canvasH * g.zoom);
    }

    parent.postMessage({ pluginMessage: { type: 'CREATE_GRID', payload: snapshot, mode: activeMode } }, '*');
  });


  const modeGrp = document.getElementById('p-creategrid-mode');
  if (modeGrp) {
    modeGrp.addEventListener('click', (e) => {
      const target = e.target.closest('.mode-btn');
      if (!target) return;
      modeGrp.querySelectorAll('.mode-btn').forEach((b) => b.classList.remove('is-active'));
      target.classList.add('is-active');

      const genLabelKey = target.getAttribute('data-gen-label-key');
      const labelEl = document.getElementById('p-creategrid-label');
      if (labelEl && genLabelKey) labelEl.textContent = t(genLabelKey);

      const genBtn = document.getElementById('p-creategrid');
      if (genBtn && !genBtn.classList.contains('is-creating')) {
        setTimeout(() => genBtn.click(), 120);
      }
    });
  }

  el('p-selgrid').addEventListener('click', () => { 
    //console.log('p-selgrid click');
    g.selectGrid(); pRedraw();
   });


  const loadGridBtn = document.getElementById('p-loadgrid');
  if (loadGridBtn) {
    loadGridBtn.addEventListener('click', function () {
      if (!S.xGridNodeId || !S.hasXGridSnapshot) return;
      if (loadGridBtn.classList.contains('is-loading')) return;
      loadGridBtn.classList.add('is-loading');
      const loadLabel = loadGridBtn.querySelector('.loadgrid-label');
      if (loadLabel) loadLabel.textContent = t('toolbar_load_grid_loading');
      send('LOAD_XGRID_NODE', { nodeId: S.xGridNodeId });
    });
  }

  
  const mkBtn = el('p-makegrid');
  const mkPop = el('grid-mk-pop');
  const mkRows = el('grid-mk-rows');
  const mkCols = el('grid-mk-cols');
  const mkPicker = el('grid-mk-picker');
  const mkTip = el('grid-mk-tip');
  const mkAddRow = el('grid-mk-row-add');
  const mkAddCol = el('grid-mk-col-add');
  const mkReset = el('grid-mk-reset');
  if (mkPicker) {
    for (let r = 0; r < 10; r += 1) {
      for (let c = 0; c < 10; c += 1) {
        const b = document.createElement('button');
        b.type = 'button';
        b.className = 'grid-mk-cell';
        b.setAttribute('data-ri', String(r));
        b.setAttribute('data-ci', String(c));
        b.title = (r + 1) + ' x ' + (c + 1);
        mkPicker.appendChild(b);
      }
    }
  }
  let mkOpen = false;
  let mkDragging = false;
  let mkAnchorTr = 1;
  let mkAnchorTc = 1;
  function positionMkPop() {
    if (!mkBtn || !mkPop) return;
    const r = mkBtn.getBoundingClientRect();
    mkPop.style.top = (r.bottom + 4) + 'px';
    mkPop.style.left = Math.max(4, Math.min(r.left, window.innerWidth - 16 - (mkPop.offsetWidth || 220))) + 'px';
  }
  function mkPaintValue(tr, tc) {
    if (!mkPicker) return;
    mkAnchorTr = tr;
    mkAnchorTc = tc;
    const visR = Math.min(10, tr);
    const visC = Math.min(10, tc);
    mkPicker.querySelectorAll('button.grid-mk-cell').forEach((cell) => {
      const ri = +cell.getAttribute('data-ri');
      const ci = +cell.getAttribute('data-ci');
      const on = ri < visR && ci < visC;
      cell.classList.toggle('is-sel', on);
      cell.classList.remove('is-hov');
    });
  }
  
  function mkPaintHover(hoverTr, hoverTc) {
    if (!mkPicker) return;
    const aR = Math.min(10, mkAnchorTr);
    const aC = Math.min(10, mkAnchorTc);
    const hR = Math.min(10, hoverTr);
    const hC = Math.min(10, hoverTc);
    mkPicker.querySelectorAll('button.grid-mk-cell').forEach((cell) => {
      const ri = +cell.getAttribute('data-ri');
      const ci = +cell.getAttribute('data-ci');
      const inA = ri < aR && ci < aC;
      const inH = ri < hR && ci < hC;
      cell.classList.toggle('is-sel', inA);
      cell.classList.toggle('is-hov', inH && !inA);
    });
  }
  function mkSetInputsAndTip(rr, cc, opts) {
    opts = opts || {};
    const fromHover = !!opts.fromHover;
    if (!mkRows || !mkCols) return;
    const tr = Math.max(1, Math.min(20, Math.round(Number(rr) || 1)));
    const tc = Math.max(1, Math.min(20, Math.round(Number(cc) || 1)));
    mkRows.value = String(tr);
    mkCols.value = String(tc);
    if (mkTip) { mkTip.textContent = tr + ' × ' + tc; }
    if (!mkPicker) return;
    if (fromHover) {
      mkPaintHover(tr, tc);
    } else {
      mkPaintValue(tr, tc);
    }
  }
  function mkReadInputs() {
    if (!mkRows || !mkCols) return { tr: 1, tc: 1 };
    return {
      tr: Math.max(1, Math.min(20, Math.round(parseInt(mkRows.value, 10) || 1))),
      tc: Math.max(1, Math.min(20, Math.round(parseInt(mkCols.value, 10) || 1))),
    };
  }
  function mkOnPointerToCell(ri, ci) {
    if (ri < 0 || ci < 0) return;
    const tr = Math.max(1, Math.min(20, ri + 1));
    const tc = Math.max(1, Math.min(20, ci + 1));
    mkSetInputsAndTip(tr, tc);
  }
  if (mkBtn && mkPop) {
    mkBtn.setAttribute('aria-haspopup', 'true');
    mkBtn.setAttribute('aria-expanded', 'false');
    mkBtn.addEventListener('click', function (e) {
      e.stopPropagation();
      e.preventDefault();
      mkOpen = !mkOpen;
      if (mkOpen) {
        mkPop.hidden = false;
        const nr = g.rows ? g.rows.length : 1;
        const nc = g.cols ? g.cols.length : 1;
        mkSetInputsAndTip(nr, nc);
        requestAnimationFrame(function () { positionMkPop(); });
        mkBtn.setAttribute('aria-expanded', 'true');
      } else {
        mkPop.hidden = true;
        mkBtn.setAttribute('aria-expanded', 'false');
      }
    });
  }
  function endMkDrag() {
    document.removeEventListener('pointerup', endMkDrag, true);
    document.removeEventListener('pointercancel', endMkDrag, true);
    document.removeEventListener('pointermove', onMkMove, true);
    if (!mkDragging) return;
    mkDragging = false;
    const a = mkReadInputs();
    applyTableSize(a.tr, a.tc);
    if (mkOpen && mkPop) {
      mkPop.hidden = true;
      mkOpen = false;
    }
    if (mkBtn) { mkBtn.setAttribute('aria-expanded', 'false'); }
  }
  function onMkMove(e) {
    if (!mkDragging) return;
    e.preventDefault();
    const at = document.elementFromPoint(e.clientX, e.clientY);
    if (!at) return;
    const cell = (at.className === 'grid-mk-cell' && at.getAttribute) ? at : (at.closest ? at.closest('button.grid-mk-cell') : null);
    if (!cell) return;
    const ri = +cell.getAttribute('data-ri');
    const ci = +cell.getAttribute('data-ci');
    if (ri >= 0 && ci >= 0) { mkOnPointerToCell(ri, ci); }
  }
  if (mkPicker) {
    mkPicker.addEventListener('pointermove', function (e) {
      if (mkDragging) return;
      const at = document.elementFromPoint(e.clientX, e.clientY);
      if (!at || !mkPicker.contains(at)) return;
      const elCell = at.className === 'grid-mk-cell' && at.getAttribute
        ? at
        : (at.closest ? at.closest('button.grid-mk-cell') : null);
      if (!elCell) return;
      const ri = +elCell.getAttribute('data-ri');
      const ci = +elCell.getAttribute('data-ci');
      if (ri < 0 || ci < 0) return;
      const tr = Math.max(1, Math.min(20, ri + 1));
      const tc = Math.max(1, Math.min(20, ci + 1));
      mkSetInputsAndTip(tr, tc, { fromHover: true });
    });
    mkPicker.addEventListener('pointerleave', function (e) {
      if (mkDragging) return;
      const to = e.relatedTarget;
      if (to && mkPicker.contains && mkPicker.contains(to)) return;
      const a = mkReadInputs();
      mkSetInputsAndTip(a.tr, a.tc);
    });
    mkPicker.addEventListener('pointerdown', function (e) {
      const elCell = (e.target && e.target.closest) ? e.target.closest('button.grid-mk-cell') : null;
      if (!elCell) return;
      e.preventDefault();
      e.stopPropagation();
      mkDragging = true;
      const ri = +elCell.getAttribute('data-ri');
      const ci = +elCell.getAttribute('data-ci');
      mkOnPointerToCell(ri, ci);
      document.addEventListener('pointermove', onMkMove, true);
      document.addEventListener('pointerup', endMkDrag, true);
      document.addEventListener('pointercancel', endMkDrag, true);
    });
  }
  if (mkAddRow) {
    mkAddRow.addEventListener('click', function (e) {
      e.stopPropagation();
      const a = mkReadInputs();
      const ntr = Math.min(20, a.tr + 1);
      applyTableSize(ntr, a.tc);
      if (mkOpen) { mkSetInputsAndTip(ntr, a.tc); }
    });
  }
  if (mkAddCol) {
    mkAddCol.addEventListener('click', function (e) {
      e.stopPropagation();
      const a = mkReadInputs();
      const ntc = Math.min(20, a.tc + 1);
      applyTableSize(a.tr, ntc);
      if (mkOpen) { mkSetInputsAndTip(a.tr, ntc); }
    });
  }
  if (mkReset) {
    mkReset.addEventListener('click', function (e) {
      e.stopPropagation();
      _undoPush();
      const fresh = createDefaultGrid(); //createDemoGrid
      if (typeof spanGridReplace === 'function') {
        spanGridReplace(fresh);
      }


      const selNode = S && S.nodes && S.nodes.find(function(n) { return n.isSelected; });
      if (selNode) {
        positionGridToSelectedBounds(selNode);
      }

      //const _eqR = document.getElementById('p-eqrows');
      //const _eqC = document.getElementById('p-eqcols');
      //if (_eqR) _eqR.click();
      //if (_eqC) _eqC.click();

      if (mkOpen && mkPop) {
        mkPop.hidden = true;
        mkOpen = false;
        if (mkBtn) { mkBtn.setAttribute('aria-expanded', 'false'); }
      }
    });
  }
  function onMkInput() {
    const a = mkReadInputs();
    mkSetInputsAndTip(a.tr, a.tc);
  }
  if (mkRows) { mkRows.addEventListener('input', onMkInput); }
  if (mkCols) { mkCols.addEventListener('input', onMkInput); }
  if (mkRows) { mkRows.addEventListener('change', function (e) { e.stopPropagation(); const a = mkReadInputs(); applyTableSize(a.tr, a.tc); if (mkOpen) positionMkPop(); }); }
  if (mkCols) { mkCols.addEventListener('change', function (e) { e.stopPropagation(); const a = mkReadInputs(); applyTableSize(a.tr, a.tc); if (mkOpen) positionMkPop(); }); }
  document.addEventListener('click', function (e) {
    if (!mkOpen) return;
    if (!mkPop || !mkBtn) return;
    const t = e.target;
    if (t && mkPop.contains && mkPop.contains(t)) return;
    if (t && mkBtn.contains && mkBtn.contains(t)) return;
    mkOpen = false;
    mkPop.hidden = true;
    if (mkBtn) { mkBtn.setAttribute('aria-expanded', 'false'); }
  });
  document.addEventListener('keydown', function (e) {
    if (!mkOpen) return;
    if (e.key === 'Escape') {
      mkOpen = false;
      if (mkPop) mkPop.hidden = true;
      if (mkBtn) mkBtn.setAttribute('aria-expanded', 'false');
    }
  });
  window.addEventListener('resize', function () { if (mkOpen) { positionMkPop(); } });
  if (mkPop) {
    mkPop.addEventListener('click', function (e) { e.stopPropagation(); });
  }

  const peqAll = el('p-eqall');
  const peqR = el('p-eqrows');
  const peqC = el('p-eqcols');
  if (peqAll) peqAll.addEventListener('click', () => { _undoPush(); equalizeRowHeights(); equalizeColWidths(); });
  if (peqR) peqR.addEventListener('click', () => { _undoPush(); equalizeRowHeights(); });
  if (peqC) peqC.addEventListener('click', () => { _undoPush(); equalizeColWidths(); });
  if (el('p-eqrows-sel')) el('p-eqrows-sel').addEventListener('click', () => { _undoPush(); equalizeHeightsForSelection(); });
  if (el('p-eqcols-sel')) el('p-eqcols-sel').addEventListener('click', () => { _undoPush(); equalizeWidthsForSelection(); });
  cname.addEventListener('input', () => toCells({ name: cname.value }));
  ctext.addEventListener('input', () => toCells({ text: ctext.value }));
  if (cmode) cmode.addEventListener('change', () => toCells({ mode: cmode.value }));
  bgc.addEventListener('input', () => {
    syncHex(bgc);
    var opaEl = el('p-bgc-opa');
    toCells({ backColor: buildColorWithAlpha(bgc.value, opaEl ? Number(opaEl.value) : 100) });
  });
  fgc.addEventListener('input', () => {
    syncHex(fgc);
    var opaEl = el('p-fgc-opa');
    toCells({ foreColor: buildColorWithAlpha(fgc.value, opaEl ? Number(opaEl.value) : 100) });
  });
  ff.addEventListener('input', pFont);
  fsz.addEventListener('input', pFont);
  fb.addEventListener('change', pFont);
  if (fi) fi.addEventListener('change', pFont);
  ta.addEventListener('change', () => toCells({ textAlign: ta.value }));
  if (iu) iu.addEventListener('change', () => setImgUrl(iu.value));
  if (ilay) ilay.addEventListener('change', () => toCells({ backgroundImageLayout: ilay.value }));
  if (ialign) ialign.addEventListener('change', () => toCells({ backgroundImageAlign: ialign.value }));
  rh.addEventListener('input', () => { if (g.selectedRow) { g.setRowHeight(g.selectedRow, rh.value); pRedraw(); } });
  cw.addEventListener('input', () => { if (g.selectedCol) { g.setColWidth(g.selectedCol, cw.value); pRedraw(); } });
  bcol.addEventListener('input', () => { syncHex(bcol); applyB(); });
  bw.addEventListener('input', applyB);
  bls.addEventListener('change', applyB);
  [bl, btop, br, bot].forEach((f) => f.addEventListener('change', () => { applyB(); }));
  breset.addEventListener('click', () => {
    _undoPush();
    const t = selBTarget();
    if (g.selectedBorderLine && t === g.selectedBorderLine) {
      if (t.item && t.item.border) { t.item.border.inheritUnspecified = true; t.item.border.setSide(t.side, { visible: false }); }
    } else if (t && t.type === 'cells') { t.cells.forEach((c) => { c.border = null; }); }
    else if (t && t !== g) { t.border = null; }
    pRedraw();
  });
  gbc.addEventListener('input', () => {
    syncHex(gbc);
    _undoPushBatched();
    var opaEl = el('p-gbc-opa');
    g.backColor = buildColorWithAlpha(gbc.value, opaEl ? Number(opaEl.value) : 100);
    pRedraw();
  });
  fc.addEventListener('input', () => {
    syncHex(fc);
    _undoPushBatched();
    g.focusColor = fc.value;
    pRedraw();
  });
  if (exp) exp.addEventListener('change', () => { _undoPush(); g.expand = exp.checked; g.scrollTo(0, 0); pRedraw(); });
  poverflow.addEventListener('change', () => { view.pasteOverflow = poverflow.checked ? 'expand' : 'truncate'; pRedraw(); });


  var p_bgc_opa = el('p-bgc-opa');
  if (p_bgc_opa) p_bgc_opa.addEventListener('input', () => {
    toCells({ backColor: buildColorWithAlpha(bgc.value, Number(p_bgc_opa.value)) });
  });

  var p_fgc_opa = el('p-fgc-opa');
  if (p_fgc_opa) p_fgc_opa.addEventListener('input', () => {
    toCells({ foreColor: buildColorWithAlpha(fgc.value, Number(p_fgc_opa.value)) });
  });

  var p_bcol_opa = el('p-bcol-opa');
  if (p_bcol_opa) p_bcol_opa.addEventListener('input', () => { applyB(); });

  var p_gbc_opa = el('p-gbc-opa');
  if (p_gbc_opa) p_gbc_opa.addEventListener('input', () => {
    _undoPushBatched();
    g.backColor = buildColorWithAlpha(gbc.value, Number(p_gbc_opa.value));
    pRedraw();
  });

  var p_fc_opa = el('p-fc-opa');
  if (p_fc_opa) p_fc_opa.addEventListener('input', () => {
    _undoPushBatched();
    g.selectionFillAlpha = Math.max(0, Math.min(100, Number(p_fc_opa.value))) / 100;
    pRedraw();
  });


  g.onCellClick(() => scheduleSyncProps());
  g.onSelectionChange(() => scheduleSyncProps());
  grid.addEventListener('mouseup', () => scheduleSyncProps());
  grid.addEventListener('mouseleave', () => scheduleSyncProps());
  grid.addEventListener('mousemove', () => { if (view.resizeTarget) scheduleSyncProps(); });

  //g.selectCell(0, 0);
  syncProps();
  
  _wrapGridForUndo(g);
})();


(function initUndoRedo() {
  var past    = [];   
  var future  = [];   
  var MAX     = 50;
  var _locked = false; 

  
  function snapshot() {
    if (!spanGrid) return null;
    return spanGrid.toJSON();
  }

  
  function push() {
    if (_locked) return;
    var snap = snapshot();
    if (!snap) return;
    past.push(snap);
    if (past.length > MAX) past.shift();
    future = []; 
    _syncBtns();
  }

  
  function undo() {
    if (past.length === 0) return;
    var cur = snapshot();
    if (cur) future.unshift(cur);
    var prev = past.pop();
    _restore(prev);
  }

  
  function redo() {
    if (future.length === 0) return;
    var cur = snapshot();
    if (cur) past.push(cur);
    var next = future.shift();
    _restore(next);
  }

  
  function _restore(snap) {
    if (!snap || typeof spanGridReplace !== 'function') return;
    _locked = true;
    try {
      spanGridReplace(SpanGridControl.fromJSON(snap));
    } catch (e) {
      console.warn('[undo] restore failed:', e);
    } finally {
      _locked = false;
    }
    _syncBtns();
  }

  
  function _syncBtns() {
    var btnU = document.getElementById('p-undo');
    var btnR = document.getElementById('p-redo');
    if (btnU) btnU.disabled = past.length === 0;
    if (btnR) btnR.disabled = future.length === 0;
  }

  
  window._undoManager = { push: push, undo: undo, redo: redo,
    isLocked: function() { return _locked; } };

  
  document.addEventListener('keydown', function(e) {
    if (!e.ctrlKey && !e.metaKey) return;
    if (e.key === 'z' && !e.shiftKey) {
      e.preventDefault();
      undo();
    } else if (e.key === 'y' || (e.key === 'z' && e.shiftKey)) {
      e.preventDefault();
      redo();
    }
  });

  
  var btnUndo = document.getElementById('p-undo');
  var btnRedo = document.getElementById('p-redo');
  if (btnUndo) btnUndo.addEventListener('click', undo);
  if (btnRedo) btnRedo.addEventListener('click', redo);

  
  
  var v = window._spanGridView;
  if (v && typeof v.commitCellEdit === 'function') {
    var _origCommit = v.commitCellEdit.bind(v);
    v.commitCellEdit = function(moveAction) {
      
      if (v.editingCell) push();
      return _origCommit(moveAction);
    };
  }

  
  _syncBtns();
})();


const ENTER_WORKSPACE_TTL = 120000; /* 2 min */
let enterWorkspaceTimer = null;

function setEnterWorkspaceUI(busy) {
  const root = document.getElementById('onboarding-root');
  const ob = document.getElementById('ob-create');
  const ovl = document.getElementById('ob-enter-overlay');
  if (root) {
    root.classList.toggle('is-entering', busy);
    root.setAttribute('aria-busy', busy ? 'true' : 'false');
  }
  if (ovl) {
    ovl.setAttribute('aria-hidden', busy ? 'false' : 'true');
  }
  if (ob) {
    ob.disabled = busy || (S && S.selectedIds && S.selectedIds.length !== 1);
    if (busy) {
      if (ob.textContent && !ob.dataset._prevObLabel) {
        ob.dataset._prevObLabel = ob.textContent;
      }
      ob.textContent = 'Opening…';
    } else {
      if (ob.dataset._prevObLabel) {
        ob.textContent = ob.dataset._prevObLabel;
        delete ob.dataset._prevObLabel;
      } else if (ob.textContent === 'Opening…') {
        ob.textContent = 'Create';
      }
    }
  }
  if (enterWorkspaceTimer) {
    clearTimeout(enterWorkspaceTimer);
    enterWorkspaceTimer = null;
  }
  if (busy) {
    enterWorkspaceTimer = setTimeout(function () {
      enterWorkspaceTimer = null;
      if (!document.body.classList.contains('phase-onboarding')) return;
      setEnterWorkspaceUI(false);
    }, ENTER_WORKSPACE_TTL);
  } else {
    try { syncOnboardingFromSelection(); } catch (e) { /* noop */ }
  }
}

function applyViewportDataPayload(p) {
  const cal = p.calibration || { dx: 0, dy: 0 };
  const incomingPageId = p.pageId || '';


  if (incomingPageId && S.pageId && incomingPageId !== S.pageId) {
    _cacheCurrentPage();

    const cached = _pageCache.get(incomingPageId);
    if (cached) {


      S.pageId   = incomingPageId;
      S.nodes    = cached.nodes;
      S.frames   = cached.frames;
      S.zoom     = cached.zoom;
      S.bounds   = cached.bounds;
      S.bgColor  = p.bgColor  || cached.bgColor;
      S.pageName = p.pageName || cached.pageName;
      S.selectedIds = p.selectedIds || [];
      S.calibration = cal;
      S.calibrated  = (cal.dx !== 0 || cal.dy !== 0);
      invalidateSortedCache();
      _rebuildNodeMap();
      S.nodes.forEach(n => { n.isSelected = S.selectedIds.indexOf(n.id) !== -1; });


      _vpDx = 0; _vpDy = 0; _vpScale = 1;
      const anchor = _getAnchorNode();
      if (anchor && anchor.canvasX !== undefined) {
        const s = p.zoom / cached.zoom;
        const ax = (anchor.canvasX - p.bounds.x) * p.zoom;
        const ay = (anchor.canvasY - p.bounds.y) * p.zoom;
        _vpDx = ax - anchor.x * s;
        _vpDy = ay - anchor.y * s;
        _vpScale = s;
      }
      if (!pan.active && !pan._standaloneMode) { pan.offsetX = 0; pan.offsetY = 0; }

      const idSet = new Set(S.nodes.map(n => n.id));
      for (const k of nodePreviewImages.keys()) { if (!idSet.has(k)) nodePreviewImages.delete(k); }
      updateInfoPanel(p);
      updateNodeList();
      updateColors();
      render();
      const dot2 = document.getElementById('status-dot');
      if (dot2) dot2.className = 'dot' + (S.calibrated ? '' : ' uncalib');
      const sTxt2 = document.getElementById('status-txt');
      if (sTxt2) sTxt2.textContent = S.calibrated ? t('status_live') : t('status_calib');
      return;
    }
  }


  S.pageId = incomingPageId || S.pageId;
  S.nodes = p.nodes || [];
  invalidateSortedCache();
  _rebuildNodeMap();

  _vpDx = 0; _vpDy = 0; _vpScale = 1;
  S.frames = p.frames || {};
  S.zoom = p.zoom || 1;
  S.bounds = p.bounds || S.bounds;
  S.bgColor = p.bgColor || S.bgColor;
  S.pageName = p.pageName || '';
  S.selectedIds = p.selectedIds || [];
  S.calibration = cal;
  S.calibrated = (cal.dx !== 0 || cal.dy !== 0);

  if (!pan.active && !pan._standaloneMode) {
    pan.offsetX = 0;
    pan.offsetY = 0;
  }
  const idSet = new Set(S.nodes.map((n) => n.id));
  for (const k of nodePreviewImages.keys()) {
    if (!idSet.has(k)) nodePreviewImages.delete(k);
  }
  updateInfoPanel(p);
  updateNodeList();
  updateColors();
  render();
  const dot = document.getElementById('status-dot');
  if (dot) { dot.className = 'dot' + (S.calibrated ? '' : ' uncalib'); }
  const sTxt = document.getElementById('status-txt');
  if (sTxt) {
    sTxt.textContent = S.calibrated ? t('status_live') : t('status_calib');
  }
}


function setDotLoading() {
  pan.syncing = true;
  const dot = document.getElementById('status-dot');
  const txt = document.getElementById('status-txt');
  if (dot) dot.className = 'dot loading';
  if (txt) txt.textContent = 'Syncing…';
}


function setDotDone() {
  pan.syncing = false;

  _cacheCurrentPage();
  const dot = document.getElementById('status-dot');
  const txt = document.getElementById('status-txt');
  if (dot) {
    dot.className = 'dot done';
    setTimeout(function() {
      if (dot && dot.classList.contains('done')) {
        dot.className = 'dot' + (S.calibrated ? '' : ' uncalib');
      }
    }, 700);
  }
  if (txt) txt.textContent = S.calibrated ? t('status_live') : t('status_calib');
}

// ════════════════════════════════════
//  PLUGIN MESSAGE
// ════════════════════════════════════
window.onmessage = (ev) => {
  try {
  const d = ev.data;
  const msg = (d && d.pluginMessage) || (d && d.type && d) || null;
  if (!msg || !msg.type) return;

  switch (msg.type) {

    case 'LOAD_LANG': {
      const lang = msg.lang;
      if (lang && I18N[lang] && lang !== _lang) {
        _lang = lang;
        try {
          const s = localStorage.getItem('xamong_ge_settings');
          const settings = s ? JSON.parse(s) : {};
          settings.lang = lang;
          localStorage.setItem('xamong_ge_settings', JSON.stringify(settings));
        } catch(e) {}
        applyI18n();
      }
      break;
    }

    case 'WORKSPACE_READY': {
      try {
        setEnterWorkspaceUI(false);
        document.body.classList.remove('phase-onboarding');
        document.body.classList.add('phase-workspace');
        requestAnimationFrame(function () {
          try {
            resizeCanvas();
            render();
          } catch (e) { /* noop */ }
        });
      } catch (e) {
        console.error('---> WORKSPACE_READY error: ', e);
      }
      break;
    }

    case 'WORKSPACE_ENTER_FAILED': {
      try {
        if (document.body.classList.contains('phase-onboarding')) {
          setEnterWorkspaceUI(false);
        }
      } catch (e) {
        console.error('---> WORKSPACE_ENTER_FAILED error: ', e);
      }
      break;
    }

    case 'ONBOARDING_READY': {
      try {
        setEnterWorkspaceUI(false);
        document.body.classList.remove('phase-workspace');
        document.body.classList.add('phase-onboarding');
        requestAnimationFrame(function () {
          try {
            resizeCanvas();
            render();
            syncOnboardingFromSelection();
          } catch (e) { /* noop */ }
        });
      } catch (e) {
        console.error('---> ONBOARDING_READY error: ', e);
      }
      break;
    }

    case 'VIEWPORT_DATA': {
      try {
        const p = msg.payload;
        if (!p) return;
        setTimeout(function () {
          try {
            applyViewportDataPayload(p);

            if (p.hasMore) {
              setDotLoading();


              requestAnimationFrame(function () {
                parent.postMessage({ pluginMessage: { type: 'ACK_VIEWPORT_DATA' } }, '*');
              });
            }
          } catch (e) {
            console.error('---> VIEWPORT_DATA (async) error: ', e);
          }
        }, 0);
      } catch (e) {
        console.error('---> VIEWPORT_DATA error: ', e);
      }
      break;
    }

    case 'APPEND_NODES': {

      try {
        const p = msg.payload;
        if (!p || !p.nodes || !p.nodes.length) break;
        const newNodes = p.nodes.filter(function(n) { return !_nodeById.has(n.id); });
        if (!newNodes.length) break;
        S.nodes = S.nodes.concat(newNodes);
        invalidateSortedCache();
        for (const n of newNodes) _nodeById.set(n.id, n);
        Object.assign(S.frames, p.frames || {});
        updateNodeList();
        scheduleRender();

        if (p.isLast) setDotDone();
      } catch (e) {
        console.error('---> APPEND_NODES error: ', e);
      }
      break;
    }

    case 'UPDATE_VIEWPORT': {
      
      try {
        const p = msg.payload;
        if (!p) break;
        if (p.bgColor) S.bgColor = p.bgColor;

        const anchor = _getAnchorNode();
        if (anchor) {
          const s = p.zoom / S.zoom;
          const ax_new = (anchor.canvasX - p.bounds.x) * p.zoom;
          const ay_new = (anchor.canvasY - p.bounds.y) * p.zoom;
          _vpDx = ax_new - anchor.x * s;
          _vpDy = ay_new - anchor.y * s;
          _vpScale = s;
        }


        if (!pan.active && !pan._standaloneMode) {
          pan.offsetX = 0;
          pan.offsetY = 0;
        }
        render();
      } catch (e) {
        console.error('---> UPDATE_VIEWPORT error: ', e);
      }
      break;
    }

    case 'PATCH_NODES': {
      
      try {
        const p = msg.payload;
        if (!p || !p.nodes) break;
        let changed = false;
        for (const n of p.nodes) {
          const existing = _nodeById.get(n.id);
          if (existing) {
            Object.assign(existing, n);
          } else {
            S.nodes.push(n);
            _nodeById.set(n.id, n);
          }
          changed = true;
        }
        if (!changed) break;
        Object.assign(S.frames, p.frames || {});
        invalidateSortedCache();
        updateNodeList();
        scheduleRender();
      } catch (e) {
        console.error('---> PATCH_NODES error: ', e);
      }
      break;
    }

    case 'DELETE_NODES': {
      
      try {
        const p = msg.payload;
        if (!p || !p.ids || !p.ids.length) break;
        const delSet = new Set(p.ids);
        S.nodes = S.nodes.filter(function(n) { return !delSet.has(n.id); });
        for (const id of p.ids) _nodeById.delete(id);
        invalidateSortedCache();
        updateNodeList();
        scheduleRender();
      } catch (e) {
        console.error('---> DELETE_NODES error: ', e);
      }
      break;
    }

    case 'SELECTION_CHANGE': {
      try {
        const p = msg.payload;
        if (!p) return;
        S.selectedIds = p.selectedIds || [];
        S.nodes.forEach(n => { n.isSelected = S.selectedIds.indexOf(n.id) !== -1; });

        S.xGridNodeId = p.xGridNodeId || null;
        S.hasXGridSnapshot = !!p.hasXGridSnapshot;
        updateXGridLoadButton();
        updateNodeList();
        try { syncOnboardingFromSelection(); } catch (e) { /* noop */ }
        render();
      } catch (e) {
        console.error('---> SELECTION_CHANGE error: ', e);
      }
      break;
    }

    case 'DEBUG': {
      try {
        const text =
`bounds:
  x: ${msg.bounds.x}
  y: ${msg.bounds.y}
  w: ${msg.bounds.width}
  h: ${msg.bounds.height}

zoom: ${msg.zoom}

viewport(px):
  w: ${msg.viewportPixel.width}
  h: ${msg.viewportPixel.height}`;

        const ivLog = document.getElementById('iv-log');
        if (ivLog) ivLog.textContent = text;
        //else console.log('DEBUG: ', text);
      } catch (e) {
        console.error('---> DEBUG error: ', e);
      }
      break;
    }

    case 'DISPLAY_IMAGE': {
      try {
        const id = msg.id;
        if (!id || !msg.bytes) break;
        let dataUrl;
        if (typeof msg.bytes === 'string') {
          dataUrl = 'data:image/png;base64,' + msg.bytes;
        } else if (msg.bytes instanceof ArrayBuffer) {
          const u8 = new Uint8Array(msg.bytes);
          let s = '';
          for (let i = 0; i < u8.length; i += 0x8000) {
            s += String.fromCharCode.apply(null, u8.subarray(i, i + 0x8000) );
          }
          dataUrl = 'data:image/png;base64,' + btoa(s);
        } else if (msg.bytes instanceof Uint8Array) {
          const u8 = msg.bytes;
          let s = '';
          for (let i = 0; i < u8.length; i += 0x8000) {
            s += String.fromCharCode.apply(null, u8.subarray(i, i + 0x8000) );
          }
          dataUrl = 'data:image/png;base64,' + btoa(s);
        } else if (msg.bytes && msg.bytes.buffer instanceof ArrayBuffer) {
          const u8 = new Uint8Array(msg.bytes);
          let s = '';
          for (let i = 0; i < u8.length; i += 0x8000) {
            s += String.fromCharCode.apply(null, u8.subarray(i, i + 0x8000) );
          }
          dataUrl = 'data:image/png;base64,' + btoa(s);
        } else {
          break;
        }
        const im = new Image();
        im.onload = () => {
          nodePreviewImages.set(id, im);
          render();
        };
        im.onerror = () => { nodePreviewImages.delete(id); };
        im.src = dataUrl;
      } catch (e) {
        console.error('---> DISPLAY_IMAGE error: ', e);
      }
      break;
    }

    case 'GRIDEDITOR_CLOSED': {
      saveSpanGridSnapshot();
      break;
    }

    case 'RESTORE_GRID_SNAPSHOT': {
      try {
        if (msg.payload) {
          const restored = tryRestoreSpanGridSnapshot(msg.payload);

          if (restored && msg.source === 'node') {
            showXGridBanner(t('xgrid_loaded_notify'), 2800);
          }
        }
      } catch (e) {
        console.error('---> RESTORE_GRID_SNAPSHOT error: ', e);
      }

      _autoSaveEnabled = true;
      break;
    }


    case 'XGRID_NODE_SNAPSHOT': {
      try {
        const loadBtn = document.getElementById('p-loadgrid');
        const loadLabel = loadBtn && loadBtn.querySelector('.loadgrid-label');
        if (!msg.payload) {
          if (loadBtn) { loadBtn.classList.remove('is-loading'); }
          if (loadLabel) loadLabel.textContent = t('toolbar_load_grid_no_data');
          setTimeout(function() {
            if (loadLabel) loadLabel.textContent = t('toolbar_load_grid');
          }, 2000);
          break;
        }
        const ok = tryRestoreSpanGridSnapshot(msg.payload);
        if (ok) {
          if (loadBtn) { loadBtn.classList.remove('is-loading'); loadBtn.classList.add('is-loaded'); }
          if (loadLabel) loadLabel.textContent = t('toolbar_load_grid_loaded');
          showXGridBanner(t('xgrid_loaded_notify'), 2500);
          setTimeout(function() {
            if (loadBtn) loadBtn.classList.remove('is-loaded');
            if (loadLabel) loadLabel.textContent = t('toolbar_load_grid');
          }, 2000);
        } else {
          if (loadBtn) loadBtn.classList.remove('is-loading');
          if (loadLabel) loadLabel.textContent = t('toolbar_load_grid');
        }
      } catch (e) {
        console.error('---> XGRID_NODE_SNAPSHOT error: ', e);
        const loadBtn = document.getElementById('p-loadgrid');
        if (loadBtn) loadBtn.classList.remove('is-loading');
      }
      break;
    }

    case 'CREATE_GRID_DONE': {
      try {
        const btn = document.getElementById('p-creategrid');
        if (!btn) break;
        const label = btn.querySelector('.creategrid-label');
        btn.classList.remove('is-creating', 'is-error');
        btn.classList.add('is-done');
        if (label) label.textContent = t('toolbar_done');
        setTimeout(() => {
          btn.classList.remove('is-done');
          if (label) label.textContent = t('toolbar_generate');
        }, 1800);
      } catch (e) { /* noop */ }
      break;
    }

    case 'CREATE_GRID_ERROR': {
      try {
        const btn = document.getElementById('p-creategrid');
        if (!btn) break;
        const label = btn.querySelector('.creategrid-label');
        btn.classList.remove('is-creating', 'is-done');
        btn.classList.add('is-error');
        if (label) label.textContent = t('toolbar_error');
        setTimeout(() => {
          btn.classList.remove('is-error');
          if (label) label.textContent = t('toolbar_generate');
        }, 2200);
      } catch (e) { /* noop */ }
      break;
    }
  }
  } catch (e) {
    console.error('---> window.onmessage error: ', e);
  }
};

const FIGMA_PLUGIN_IFRAME_HEADER_HEIGHT = 60;
const FIGMA_DESIGNER_RULER_HEIGHT = 20;
const WHY_NEED_TRANSLATE_Y_40 = 40;


function positionGridToSelectedBounds(n) {
  const {x, y, w, h} = n;
  if (w <= 0 || h <= 0) return;
  const t = WHY_NEED_TRANSLATE_Y_40;
  const ox = pan.offsetX;
  const oy = pan.offsetY;
  const padding = spanGrid.borderStyle === 'FixedSingle' ? 1 : spanGrid.borderStyle === 'Fixed3D' ? 2 : 0;


  //   ctx.translate(ox + _vpDx,  oy - t + _vpDy)
  //   ctx.scale(_vpScale, _vpScale)

  //   screen_left   = n.x * _vpScale + _vpDx + ox
  //   screen_top    = n.y * _vpScale + _vpDy + oy - t
  //   screen_width  = n.w * _vpScale
  //   screen_height = n.h * _vpScale

  const sx = x * _vpScale + _vpDx + ox;
  const sy = y * _vpScale + _vpDy + oy - t;
  const sw = w * _vpScale;
  const sh = h * _vpScale;

  if (spanGridScaffold) {
    spanGridScaffold.style.display = 'block';


    buildBlurOverlay();
    spanGridScaffold.style.left   = (sx - padding) + 'px';
    spanGridScaffold.style.top    = (sy - padding) + 'px';
    spanGridScaffold.style.width  = (sw + padding * 2) + 'px';
    spanGridScaffold.style.height = (sh + padding * 2) + 'px';
    spanGridScaffold.style.right  = 'auto';
    spanGridScaffold.style.bottom = 'auto';
  }

  if (sgVScroll) {
    sgVScroll.style.left   = (sx + sw + padding) + 'px';
    sgVScroll.style.top    = (sy - padding) + 'px';
    sgVScroll.style.width  = SB_W + padding * 2 + 'px';
    sgVScroll.style.height = (sh + padding * 2) + 'px';
  }

  if (sgHScroll) {
    sgHScroll.style.left   = (sx - padding) + 'px';
    sgHScroll.style.top    = (sy + sh + padding) + 'px';
    sgHScroll.style.width  = (sw + padding * 2) + 'px';
    sgHScroll.style.height = SB_H + padding * 2 + 'px';
  }

  if (sgCorner) {
    sgCorner.style.left   = (sx + sw + padding) + 'px';
    sgCorner.style.top    = (sy + sh + padding) + 'px';
    sgCorner.style.width  = SB_W + padding * 2 + 'px';
    sgCorner.style.height = SB_H + padding * 2 + 'px';
  }
  showScrollBars(true);

  spanGrid.setZoom(S.zoom * _vpScale);
  resizeGridCanvas();
  try { dockPropsToolbarToGrid(); } catch (e) { /* noop */ }
}

// ════════════════════════════════════

// ════════════════════════════════════


const pan = {
  active: false,
  startX: 0,
  startY: 0,
  offsetX: 0,
  offsetY: 0,
  pendingDx: 0,
  pendingDy: 0,
  wheelTimer: null,
  syncing: false,
  _standaloneMode: false,
};


let _renderedPanX = 0;
let _renderedPanY = 0;


let _vpDx = 0;
let _vpDy = 0;
let _vpScale = 1;


const ZOOM_MIN = 0.02;
const ZOOM_MAX = 256;
let _pendingZoomNewZoom = null;
let _zoomPivotCanvasX  = 0;
let _zoomPivotCanvasY  = 0;
let _zoomTimer         = null;


function flushZoomToFigma() {
  if (_pendingZoomNewZoom === null) return;
  if (pan._standaloneMode) return;
  parent.postMessage(
    { pluginMessage: {
        type: 'ZOOM_VIEWPORT',
        newZoom: _pendingZoomNewZoom,
        pivotCanvasX: _zoomPivotCanvasX,
        pivotCanvasY: _zoomPivotCanvasY,
    }},
    '*'
  );
  _pendingZoomNewZoom = null;
}


function applyPanTransform() {
  const dx = pan.offsetX - _renderedPanX;
  const dy = pan.offsetY - _renderedPanY;
  canvas.style.transform = `translate(${dx}px, ${dy}px)`;
}


function flushPanToFigma(dxFigma, dyFigma) {
  if (dxFigma === 0 && dyFigma === 0) return;

  if (pan._standaloneMode) return;
  parent.postMessage(
    { pluginMessage: { type: 'PAN_VIEWPORT', dx: dxFigma, dy: dyFigma } },
    '*'
  );
}


document.addEventListener('wheel', function(e) {
  if (!isPhaseWorkspace()) return;
  if (PAN_OFF) return;
  if (pan.syncing && !PAN_DURING_SYNC) return;


  const scaffold = document.getElementById('span-grid-scaffold');
  if (scaffold && scaffold.contains(e.target)) return;

  e.preventDefault();


  if (e.ctrlKey) {

    const rawDelta = e.deltaY * (e.deltaMode === 2 ? 200 : 1);
    const ZOOM_SPEED = e.deltaMode === 0 ? 0.003 : 0.15;
    const factor = Math.exp(-rawDelta * ZOOM_SPEED);

    const effZoom  = S.zoom * _vpScale;
    const newEffZoom = Math.max(ZOOM_MIN, Math.min(ZOOM_MAX, effZoom * factor));
    const actualFactor = newEffZoom / effZoom;

    const mx = e.clientX;
    const my = e.clientY;
    const ox = pan.offsetX;
    const by = pan.offsetY - WHY_NEED_TRANSLATE_Y_40;


    if (!_zoomTimer) {
      _zoomPivotCanvasX = (mx - ox - _vpDx) / (_vpScale * S.zoom) + S.bounds.x;
      _zoomPivotCanvasY = (my - by - _vpDy) / (_vpScale * S.zoom) + S.bounds.y;
    }


    //   new_px = mx + (old_px - mx) * f   (px = screen origin + _vpDx)
    const px = ox + _vpDx;
    const py = by + _vpDy;
    _vpDx   = mx + (px - mx) * actualFactor - ox;
    _vpDy   = my + (py - my) * actualFactor - by;
    _vpScale *= actualFactor;

    _pendingZoomNewZoom = S.zoom * _vpScale;


    if (!_zoomTimer) {
      if (spanGridScaffold) spanGridScaffold.style.display = 'none';
      hideBlurOverlay();
      if (pPropsToolbar)    pPropsToolbar.style.display   = 'none';
      showScrollBars(false);
      canvas.style.filter = 'none'; _canvasFilterOverride = true;
    }
    render();


    if (_zoomTimer) clearTimeout(_zoomTimer);
    _zoomTimer = setTimeout(function() {
      _zoomTimer = null;
      render();
      flushZoomToFigma();
    }, 300);

    return;
  }


  const SCALE = e.deltaMode === 1 ? 24 : e.deltaMode === 2 ? 200 : 1;
  const zoom = S.zoom || 1;

  let dxPx, dyPx;
  if (e.shiftKey) {

    dxPx = e.deltaY * SCALE;
    dyPx = 0;
  } else {

    dxPx = (e.deltaX || 0) * SCALE;
    dyPx = e.deltaY * SCALE;
  }


  pan.offsetX -= dxPx;
  pan.offsetY -= dyPx;

  _renderedPanX = pan.offsetX;
  _renderedPanY = pan.offsetY;


  pan.pendingDx += dxPx / zoom;
  pan.pendingDy += dyPx / zoom;


  applyPanTransform();
  render();


  // 
  if (!pan.wheelTimer || spanGridScaffold.style.display === 'block') {
    if (spanGridScaffold) spanGridScaffold.style.display = 'none';
    hideBlurOverlay();
    if (pPropsToolbar) pPropsToolbar.style.display = 'none';
    showScrollBars(false);
    canvas.style.filter = 'none'; _canvasFilterOverride = true;
  }


  if (pan.wheelTimer) clearTimeout(pan.wheelTimer);
  pan.wheelTimer = setTimeout(function() {
    pan.wheelTimer = null;
    render();
    flushPanToFigma(pan.pendingDx, pan.pendingDy);
    pan.pendingDx = 0;
    pan.pendingDy = 0;

  }, 500);
}, { passive: false });


document.addEventListener('mousedown', function(e) {
  if (!isPhaseWorkspace()) return;
  if (PAN_OFF) return;
  if (pan.syncing && !PAN_DURING_SYNC) return;
  if (pan.active) return;

  const isMiddle   = e.button === 1;
  const isSpacePan = e.button === 0 && _spaceDown;
  if (!isMiddle && !isSpacePan) return;


  const scaffold = document.getElementById('span-grid-scaffold');
  if (scaffold && scaffold.contains(e.target)) return;

  e.preventDefault();

  pan.active = true;
  pan._spacePanActive = isSpacePan;
  pan.startX = e.clientX;
  pan.startY = e.clientY;
  pan.offsetX = 0;
  pan.offsetY = 0;

  _renderedPanX = pan.offsetX;
  _renderedPanY = pan.offsetY;

  document.body.style.cursor = 'grabbing';

  if (spanGridScaffold) spanGridScaffold.style.display = 'none';
  hideBlurOverlay();
  if (pPropsToolbar) pPropsToolbar.style.display = 'none';
  showScrollBars(false);
  canvas.style.filter = 'none'; _canvasFilterOverride = true;
});

document.addEventListener('mousemove', function(e) {
  if (!pan.active) return;

  pan.offsetX = e.clientX - pan.startX;
  pan.offsetY = e.clientY - pan.startY;

  applyPanTransform();


  scheduleRender();
});

function _endMiddleDrag(e) {
  if (!pan.active || pan._spacePanActive) return;
  pan.active = false;
  document.body.style.cursor = '';

  const dxPx = e ? (e.clientX - pan.startX) : 0;
  const dyPx = e ? (e.clientY - pan.startY) : 0;
  const zoom = S.zoom || 1;


  render();


  flushPanToFigma(-dxPx / zoom, -dyPx / zoom);
}

document.addEventListener('mouseup', _endMiddleDrag);
document.addEventListener('mouseleave', _endMiddleDrag);


let _spaceDown = false;

document.addEventListener('keydown', function(e) {
  if (e.key !== ' ') return;
  if (!isPhaseWorkspace()) return;

  const ae = document.activeElement;
  if (ae && (ae.tagName === 'INPUT' || ae.tagName === 'TEXTAREA' || ae.isContentEditable)) return;
  if (_spaceDown) return;
  _spaceDown = true;
  e.preventDefault();
  if (!pan.active) document.body.style.cursor = 'grab';
}, { capture: true });

document.addEventListener('keyup', function(e) {
  if (e.key !== ' ') return;
  _spaceDown = false;
  if (pan._spacePanActive) {

    _endSpaceDrag(null);
  } else if (!pan.active) {
    document.body.style.cursor = '';
  }
}, { capture: true });

function _endSpaceDrag(e) {
  if (!pan._spacePanActive) return;
  pan._spacePanActive = false;
  pan.active = false;
  document.body.style.cursor = _spaceDown ? 'grab' : '';

  const dxPx = e ? (e.clientX - pan.startX) : 0;
  const dyPx = e ? (e.clientY - pan.startY) : 0;
  const zoom = S.zoom || 1;

  render();
  flushPanToFigma(-dxPx / zoom, -dyPx / zoom);
}

document.addEventListener('mouseup', function(e) { if (pan._spacePanActive) _endSpaceDrag(e); });
document.addEventListener('mouseleave', function(e) { if (pan._spacePanActive) _endSpaceDrag(e); });

// ════════════════════════════════════
//  RENDER
// ════════════════════════════════════
function render() {


  try {
    canvas.style.transform = '';

    _renderedPanX = pan.offsetX;
    _renderedPanY = pan.offsetY;
  } catch (e) {  }


  if (S.bgColor) {
    const rr = Math.round(S.bgColor.r*255), gg = Math.round(S.bgColor.g*255), bb = Math.round(S.bgColor.b*255);
    const bgKey = `${rr},${gg},${bb}`;
    if (bgKey !== _lastBodyBgKey) {
      _lastBodyBgKey = bgKey;
      document.body.style.background = `rgb(${bgKey})`;
    }
  }

  try {
    if (!isPhaseWorkspace()) {
      if (spanGridScaffold) spanGridScaffold.style.display = 'none';
      showScrollBars(false);
      try { dockPropsToolbarToGrid(); } catch (e) { /* noop */ }
      return;
    }

    if (!S.nodes.length) {
      if (spanGridScaffold) spanGridScaffold.style.display = 'none';
      showScrollBars(false);
      try { dockPropsToolbarToGrid(); } catch (e) { /* noop */ }
      return;
    }


    ctx.fillStyle = `rgba(${Math.round(S.bgColor.r * 255)}, ${Math.round(S.bgColor.g * 255)}, ${Math.round(S.bgColor.b * 255)}, ${S.bgColor.a})`;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.save();


    ctx.translate(pan.offsetX + _vpDx, pan.offsetY - WHY_NEED_TRANSLATE_Y_40 + _vpDy);
    if (_vpScale !== 1) ctx.scale(_vpScale, _vpScale);


    const sorted = getSortedNodes();

    sorted.forEach(n => { if (n.visible || modes.hidden) drawNode(n); });
    let selectedNodeFound = false;
    sorted.filter(n => n.isSelected).forEach(n => {
      drawSelected(n);
      selectedNodeFound = true;
    });

    if (!selectedNodeFound && !pan.active && !pan.wheelTimer) {

      if (_canvasFilterOverride) { canvas.style.filter = ''; _canvasFilterOverride = false; }
    }

    if (S.hoveredId) {
      const h = S.nodes.find(n => n.id === S.hoveredId);
      if (h) drawHovered(h);
    }
    if (modes.spacing) drawSpacing(sorted);
    if (modes.grid)    drawGrid();

    ctx.restore();

    if (!S.nodes.some(n => n.isSelected)) {
      if (spanGridScaffold) spanGridScaffold.style.display = 'none';
      showScrollBars(false);
      try { dockPropsToolbarToGrid(); } catch (e) { /* noop */ }
    }
    

  } finally {


    displayCtx.drawImage(bufferCanvas, 0, 0);
  }
}


function drawNode(n) {
  const {x,y,w,h} = n;
  if (w<=0 || h<=0) return;
  ctx.save();

  const col = nodeColor(n);


  if (!n.visible && modes.hidden) {
    ctx.globalAlpha = 0.3;
  }


  const pv = nodePreviewImages.get(n.id);
  if (pv && pv.complete && pv.naturalWidth > 0) {
    try {
      ctx.save();
      ctx.imageSmoothingEnabled = true;
      if (ctx.imageSmoothingQuality !== undefined) {
        ctx.imageSmoothingQuality = 'high';
      }
      ctx.drawImage(pv, x, y, w, h);
      ctx.restore();
    } catch (e) {}
  }


  if (modes.fill && n.fillColor) {
    ctx.fillStyle = fadeAlpha(n.fillColor, 0.18); //0.18
    ctx.fillRect(x,y,w,h);
  } else {

    if (S.frames[n.id] && !(pv && pv.complete && pv.naturalWidth > 0)) {
      ctx.fillStyle = fadeAlpha('#ffffff', 0.18);
      ctx.fillRect(x,y,w,h);
    }
  }


  if (modes.depth) {
    ctx.fillStyle = `rgba(100,140,255,${Math.min(.05*n.depth,.28)})`;
    ctx.fillRect(x,y,w,h);
  }

  // Bounds
  if (modes.bounds) {
    ctx.strokeStyle = col;
    ctx.lineWidth = n.depth===0 ? 1.2 : 0.7;
    if (n.locked) ctx.setLineDash([3,3]);
    ctx.strokeRect(x+.5, y+.5, w-1, h-1);
    ctx.setLineDash([]);
  } else {

    if (S.frames[n.id] && !(pv && pv.complete && pv.naturalWidth > 0)) {
      ctx.strokeStyle = col;
      ctx.lineWidth = n.depth===0 ? 1.2 : 0.7;
      if (n.locked) ctx.setLineDash([3,3]);
      ctx.strokeRect(x+.5, y+.5, w-1, h-1);
      ctx.setLineDash([]);
    }
  }

  // Labels
  if (modes.labels && w>24 && h>10) drawLabel(n, col);

  ctx.globalAlpha = 1;
  ctx.restore();
}

function drawLabel(n, col) {
  const {x,y,w} = n;
  const lbl = trunc(n.name, 24);
  const fs  = Math.max(9, Math.min(11, w / lbl.length * 1.4));

  ctx.font = `500 ${fs}px 'JetBrains Mono', monospace`;
  ctx.textBaseline = 'bottom';
  const tw = ctx.measureText(lbl).width;


  ctx.fillStyle = 'rgba(6,8,18,.72)';
  rr(ctx, x+1, y - fs - 4, tw+8, fs+4, 3);
  ctx.fill();

  ctx.fillStyle = col;
  ctx.fillText(lbl, x+5, y-2);


  if (n.type==='TEXT' && n.textContent) {
    ctx.font = '400 8.5px sans-serif';
    ctx.fillStyle = 'rgba(255,200,70,.65)';
    ctx.fillText(`"${trunc(n.textContent,32)}"`, x+4, y+13);
  }
}

function drawSelected(n) {
  const {x,y,w,h} = n;
  ctx.save();
  ctx.shadowColor = 'rgba(255,82,114,.7)';
  ctx.shadowBlur  = 10;
  ctx.strokeStyle = 'rgba(255,82,114,.95)';
  ctx.lineWidth   = 2;
  ctx.strokeRect(x+.5, y+.5, w-1, h-1);
  ctx.shadowBlur  = 0;


  [[x,y],[x+w,y],[x,y+h],[x+w,y+h]].forEach(([cx,cy]) => {
    ctx.fillStyle = '#fff';
    ctx.fillRect(cx-3, cy-3, 6, 6);
  });


  ctx.fillStyle = 'rgba(255,82,114,.9)';
  ctx.font = '500 9px "JetBrains Mono",monospace';
  ctx.textBaseline = 'top';
  ctx.fillText(`${n.canvasW} × ${n.canvasH}`, x+3, y+3);
  ctx.restore();


  if (!pan.active && !pan.wheelTimer) {

    if (_canvasFilterOverride) { canvas.style.filter = ''; _canvasFilterOverride = false; }

    scheduleGridPosition(n);
  }
}

function drawHovered(n) {
  ctx.save();
  ctx.strokeStyle = 'rgba(74,240,196,.85)';
  ctx.lineWidth   = 1.5;
  ctx.setLineDash([4,3]);
  ctx.strokeRect(n.x, n.y, n.w, n.h);
  ctx.setLineDash([]);
  ctx.restore();
}


function drawSpacing(sorted) {
  const top = sorted.filter(n=>n.depth<=1 && n.w>0 && n.h>0);
  if (top.length<2) return;
  ctx.save();
  ctx.strokeStyle = 'rgba(255,184,48,.55)';
  ctx.fillStyle   = 'rgba(255,184,48,.85)';
  ctx.font        = '9px "JetBrains Mono",monospace';
  ctx.textBaseline= 'middle';
  ctx.lineWidth   = 1;
  ctx.setLineDash([3,3]);

  for (let i=0;i<top.length-1;i++) {
    const a=top[i], b=top[i+1];
    const gap = b.x-(a.x+a.w);
    if (gap>0 && gap<300) {
      const my = Math.min(a.y+a.h/2, b.y+b.h/2);
      ctx.beginPath();
      ctx.moveTo(a.x+a.w, my);
      ctx.lineTo(b.x, my);
      ctx.stroke();
      ctx.fillText(Math.round(gap/S.zoom)+'', a.x+a.w+gap/2-8, my-10);
    }
  }
  ctx.setLineDash([]);
  ctx.restore();
}


function drawGrid() {
  const zoom=S.zoom, bx=S.bounds.x, by=S.bounds.y;
  const base=8, bigBase=64;
  const gPx = base*zoom;
  if (gPx<3) return;

  ctx.save();


  ctx.strokeStyle = 'rgba(74,240,196,.055)';
  ctx.lineWidth   = .5;
  const ox = (-bx%base)*zoom, oy = (-by%base)*zoom;
  for (let x=ox;x<canvas.width;x+=gPx) { ctx.beginPath(); ctx.moveTo(x,0); ctx.lineTo(x,canvas.height); ctx.stroke(); }
  for (let y=oy;y<canvas.height;y+=gPx) { ctx.beginPath(); ctx.moveTo(0,y); ctx.lineTo(canvas.width,y); ctx.stroke(); }


  const bgPx = bigBase*zoom;
  if (bgPx>=12) {
    ctx.strokeStyle = 'rgba(74,240,196,.12)';
    ctx.lineWidth   = .8;
    const bOx=(-bx%bigBase)*zoom, bOy=(-by%bigBase)*zoom;
    for (let x=bOx;x<canvas.width;x+=bgPx) { ctx.beginPath(); ctx.moveTo(x,0); ctx.lineTo(x,canvas.height); ctx.stroke(); }
    for (let y=bOy;y<canvas.height;y+=bgPx) { ctx.beginPath(); ctx.moveTo(0,y); ctx.lineTo(canvas.width,y); ctx.stroke(); }
  }
  ctx.restore();
}

// ════════════════════════════════════
//  PANEL UI
// ════════════════════════════════════
const cardOpen = { props:true, preset:false, vp:false, layers:false, colors:false };

function toggleCard(id) {
  
}


(function initPanelCards() {
  document.querySelectorAll('.panel-card-toggle[data-card]').forEach(function(btn) {
    btn.addEventListener('click', function(e) {
      e.stopPropagation();
      var card = btn.closest('.panel-card');
      if (!card) return;
      var isCollapsed = card.classList.contains('collapsed');

      document.querySelectorAll('.panel-card').forEach(function(c) {
        c.classList.add('collapsed');
      });

      if (isCollapsed) card.classList.remove('collapsed');
    });
  });
})();


(function initHexInputSync() {
  document.querySelectorAll('.panel-color-row').forEach(function(row) {
    var swatch = row.querySelector('.panel-color-swatch');
    var hexIn  = row.querySelector('.panel-hex-in');
    if (!swatch || !hexIn) return;
    hexIn.addEventListener('input', function() {
      var v = hexIn.value.trim();
      if (!/^#/.test(v)) v = '#' + v;
      if (/^#[0-9a-f]{6}$/i.test(v)) {
        swatch.value = v.toLowerCase();
        swatch.dispatchEvent(new Event('input', { bubbles: false }));
      }
    });
    hexIn.addEventListener('blur', function() {
      var v = hexIn.value.trim();
      if (/^#[0-9a-f]{3}$/i.test(v)) {
        var r = v[1]+v[1], g = v[2]+v[2], b = v[3]+v[3];
        v = '#' + r + g + b;
        hexIn.value = v.toUpperCase();
        swatch.value = v.toLowerCase();
        swatch.dispatchEvent(new Event('input', { bubbles: false }));
      }
    });
  });
})();


(function initDetailTabs() {
  document.querySelectorAll('.panel-detail-tab').forEach(function(tab) {
    tab.addEventListener('click', function() {
      const parent = tab.closest('.panel-section');
      if (!parent) return;
      const target = tab.getAttribute('data-detail-tab');
      parent.querySelectorAll('.panel-detail-tab').forEach(function(t) {
        t.classList.remove('active'); t.setAttribute('aria-selected','false');
      });
      tab.classList.add('active'); tab.setAttribute('aria-selected','true');
      const colPane = document.getElementById('detail-pane-columns');
      const rowPane = document.getElementById('detail-pane-rows');
      if (colPane) colPane.style.display = target === 'columns' ? '' : 'none';
      if (rowPane) rowPane.style.display = target === 'rows' ? '' : 'none';
    });
  });
})();


(function initToggleBtns() {
  document.querySelectorAll('.panel-toggle-row').forEach(function(row) {
    row.querySelectorAll('.panel-toggle-btn').forEach(function(btn) {
      btn.addEventListener('click', function() {
        row.querySelectorAll('.panel-toggle-btn').forEach(function(b) { b.classList.remove('active'); });
        btn.classList.add('active');
      });
    });
  });
})();


(function initToolbarDropdowns() {
  function closeAll() {
    document.querySelectorAll('#p-props-toolbar .tb-dropdown-trigger.tb-drop-open').forEach(function(t) {
      t.classList.remove('tb-drop-open');
      t.setAttribute('aria-expanded', 'false');
    });
    document.querySelectorAll('#p-props-toolbar .tb-dropdown-menu.tb-drop-open').forEach(function(m) {
      m.classList.remove('tb-drop-open');
    });
  }
  document.querySelectorAll('#p-props-toolbar .tb-dropdown-trigger').forEach(function(trig) {
    trig.addEventListener('click', function(e) {
      e.stopPropagation();
      var menuId = trig.getAttribute('data-menu');
      var menu = document.getElementById(menuId);
      if (!menu) return;
      var isOpen = menu.classList.contains('tb-drop-open');
      closeAll();
      if (!isOpen) {
        trig.classList.add('tb-drop-open');
        trig.setAttribute('aria-expanded', 'true');
        menu.classList.add('tb-drop-open');
      }
    });
  });
  
  document.querySelectorAll('#p-props-toolbar .tb-dropdown-menu').forEach(function(menu) {
    menu.addEventListener('click', function(e) {
      e.stopPropagation();
      if (!menu.hasAttribute('data-keep-open') &&
          e.target.closest('button') && !e.target.closest('button').disabled) {
        setTimeout(closeAll, 80);
      }
    });
  });
  document.addEventListener('click', function() { closeAll(); });
  document.addEventListener('keydown', function(e) { if (e.key === 'Escape') closeAll(); });
})();


(function initBorderPosBtns() {
  
  const map = { left:'p-bl', top:'p-bt', right:'p-br', bottom:'p-bb' };
  document.querySelectorAll('.panel-bpos-btn').forEach(function(btn) {
    const side = btn.getAttribute('data-border');
    const chkId = map[side];
    if (!chkId) return;
    const chk = document.getElementById(chkId);
    btn.addEventListener('click', function() {
      if (btn.disabled) return;
      btn.classList.toggle('active');
      if (chk) { chk.checked = btn.classList.contains('active'); chk.dispatchEvent(new Event('change')); }
    });
    
  });
})();


(function initBorderStyleBtns() {
  var sel = document.getElementById('p-bls');
  if (!sel) return;
  document.querySelectorAll('#p-bls-btns .panel-seg-btn').forEach(function(btn) {
    btn.addEventListener('click', function() {
      document.querySelectorAll('#p-bls-btns .panel-seg-btn').forEach(function(b) { b.classList.remove('active'); });
      btn.classList.add('active');
      sel.value = btn.getAttribute('data-bls');
      sel.dispatchEvent(new Event('change'));
    });
  });
  
  function syncBorderStyleBtns(val) {
    document.querySelectorAll('#p-bls-btns .panel-seg-btn').forEach(function(b) {
      b.classList.toggle('active', b.getAttribute('data-bls') === val);
    });
  }
  sel.addEventListener('change', function() { syncBorderStyleBtns(sel.value); });
  
  var _origBlsDesc = Object.getOwnPropertyDescriptor(HTMLSelectElement.prototype, 'value');
  if (_origBlsDesc) {
    try {
      Object.defineProperty(sel, 'value', {
        get: function() { return _origBlsDesc.get.call(this); },
        set: function(v) { _origBlsDesc.set.call(this, v); syncBorderStyleBtns(v); }
      });
    } catch(e) {}
  }
  
  var obs = new MutationObserver(function() { syncBorderStyleBtns(sel.value); });
  obs.observe(sel, { attributes: true, attributeFilter: ['value'] });
})();


(function initAlignBtns() {
  var sel = document.getElementById('p-ta');
  if (!sel) return;
  function getCombo() {
    var hBtn = document.querySelector('#p-ta-h-btns .panel-seg-btn.active');
    var vBtn = document.querySelector('#p-ta-v-btns .panel-seg-btn.active');
    var h = hBtn ? hBtn.getAttribute('data-align-h') : 'Left';
    var v = vBtn ? vBtn.getAttribute('data-align-v') : 'Top';
    return v + h; /* e.g. "MiddleCenter" */
  }
  document.querySelectorAll('#p-ta-h-btns .panel-seg-btn').forEach(function(btn) {
    btn.addEventListener('click', function() {
      document.querySelectorAll('#p-ta-h-btns .panel-seg-btn').forEach(function(b) { b.classList.remove('active'); });
      btn.classList.add('active');
      sel.value = getCombo();
      sel.dispatchEvent(new Event('change'));
    });
  });
  document.querySelectorAll('#p-ta-v-btns .panel-seg-btn').forEach(function(btn) {
    btn.addEventListener('click', function() {
      document.querySelectorAll('#p-ta-v-btns .panel-seg-btn').forEach(function(b) { b.classList.remove('active'); });
      btn.classList.add('active');
      sel.value = getCombo();
      sel.dispatchEvent(new Event('change'));
    });
  });
  
  function syncAlignBtns(val) {
    var vMap = ['Top','Middle','Bottom'];
    var hMap = ['Left','Center','Right'];
    vMap.forEach(function(v) {
      var hit = val && val.startsWith(v);
      var btn = document.querySelector('#p-ta-v-btns [data-align-v="'+v+'"]');
      if (btn) btn.classList.toggle('active', hit);
    });
    hMap.forEach(function(h) {
      var hit = val && val.endsWith(h);
      var btn = document.querySelector('#p-ta-h-btns [data-align-h="'+h+'"]');
      if (btn) btn.classList.toggle('active', hit);
    });
  }
  sel.addEventListener('change', function() { syncAlignBtns(sel.value); });
  
  var obs = new MutationObserver(function() { syncAlignBtns(sel.value); });
  obs.observe(sel, { attributes: true });
  
  var _origDesc = Object.getOwnPropertyDescriptor(HTMLSelectElement.prototype, 'value');
  if (_origDesc) {
    try {
      Object.defineProperty(sel, 'value', {
        get: function() { return _origDesc.get.call(this); },
        set: function(v) { _origDesc.set.call(this, v); syncAlignBtns(v); }
      });
    } catch(e) {}
  }
})();


(function initRowColEditBtns() {

  
  function firstSelectedCell() {
    if (!spanGrid) return null;
    if (spanGrid.selectedCell) return spanGrid.selectedCell;
    var cells = spanGrid.selectedCells;
    if (cells && cells.length > 0) return cells[0];
    return null;
  }
  function getSelRowIdx() {
    if (!spanGrid) return -1;
    if (spanGrid.selectedRow) return spanGrid.rows.indexOf(spanGrid.selectedRow);
    var cell = firstSelectedCell();
    if (cell && cell.row) return spanGrid.rows.indexOf(cell.row);
    return -1;
  }
  function getSelColIdx() {
    if (!spanGrid) return -1;
    if (spanGrid.selectedCol) return spanGrid.cols.indexOf(spanGrid.selectedCol);
    var cell = firstSelectedCell();
    if (cell && cell.row) return cell.row.cells.indexOf(cell);
    return -1;
  }
  
  function getSelRowIndices() {
    var set = {};
    if (spanGrid.selectedRow) {
      var ri = spanGrid.rows.indexOf(spanGrid.selectedRow);
      if (ri >= 0) set[ri] = true;
    }
    var cells = spanGrid.selectedCells || [];
    cells.forEach(function(c) {
      if (c && c.row) { var ri2 = spanGrid.rows.indexOf(c.row); if (ri2 >= 0) set[ri2] = true; }
    });
    return Object.keys(set).map(Number).sort(function(a,b){return a-b;});
  }
  
  function getSelColIndices() {
    var set = {};
    if (spanGrid.selectedCol) {
      var ci = spanGrid.cols.indexOf(spanGrid.selectedCol);
      if (ci >= 0) set[ci] = true;
    }
    var cells = spanGrid.selectedCells || [];
    cells.forEach(function(c) {
      if (c && c.row) { var ci2 = c.row.cells.indexOf(c); if (ci2 >= 0) set[ci2] = true; }
    });
    return Object.keys(set).map(Number).sort(function(a,b){return a-b;});
  }

  
  function makeBlankCell() {
    return { text: '', backColor: '#ffffff', foreColor: '#000000',
             font: '9pt sans-serif', textAlign: 'MiddleCenter', border: null };
  }

  function cellStyleOnly(src) {
    if (!src) return {};
    var s = {};
    if (src.backColor) s.backColor = src.backColor;
    if (src.foreColor) s.foreColor = src.foreColor;
    if (src.font)      s.font = src.font;
    if (src.textAlign) s.textAlign = src.textAlign;
    if (src.border)    s.border = JSON.parse(JSON.stringify(src.border));
    return s;
  }
  function makeStyledCell(refCell) {
    var base = makeBlankCell();
    if (refCell) Object.assign(base, cellStyleOnly(refCell));
    return base;
  }
  function makeBlankRow(json, refIdx) {
    var ref = json.rows[refIdx];
    return {
      height: ref ? ref.height : 32,
      border: ref && ref.border ? JSON.parse(JSON.stringify(ref.border)) : null,
      cells: json.cols.map(function(_, ci) {
        var refCell = ref && ref.cells ? ref.cells[ci] : null;
        return makeStyledCell(refCell);
      })
    };
  }
  function makeBlankCol(json, refIdx) {
    var ref = json.cols[refIdx];
    return {
      width: ref ? ref.width : 80,
      border: ref && ref.border ? JSON.parse(JSON.stringify(ref.border)) : null
    };
  }

  
  function shiftMergesRow(merges, at, delta) {
    return merges.map(function(m) {
      var s = m.start.row, e = m.end.row;
      if (delta > 0) { // insert
        return { start: { row: s >= at ? s + delta : s, col: m.start.col },
                 end:   { row: e >= at ? e + delta : e, col: m.end.col } };
      } else { // delete: at == idx
        if (s === at && e === at) return null;
        var ns = s > at ? s - 1 : s, ne = e > at ? e - 1 : e;
        if (ns > ne) return null;
        return { start: { row: ns, col: m.start.col }, end: { row: ne, col: m.end.col } };
      }
    }).filter(Boolean);
  }
  function shiftMergesCol(merges, at, delta) {
    return merges.map(function(m) {
      var s = m.start.col, e = m.end.col;
      if (delta > 0) { // insert
        return { start: { row: m.start.row, col: s >= at ? s + delta : s },
                 end:   { row: m.end.row,   col: e >= at ? e + delta : e } };
      } else { // delete
        if (s === at && e === at) return null;
        var ns = s > at ? s - 1 : s, ne = e > at ? e - 1 : e;
        if (ns > ne) return null;
        return { start: { row: m.start.row, col: ns }, end: { row: m.end.row, col: ne } };
      }
    }).filter(Boolean);
  }

  
  function replaceAndSelect(json, selectFn) {
    if (typeof window._undoPush === 'function') window._undoPush();
    var newGrid = SpanGridControl.fromJSON(json);
    if (typeof spanGridReplace === 'function') {
      spanGridReplace(newGrid);
      selectFn(spanGrid);
      if (typeof window._gridPRedraw === 'function') window._gridPRedraw();
    }
  }

  
  function insertRowAbove() {
    var idx = getSelRowIdx();
    if (idx < 0) return;
    var json = spanGrid.toJSON();
    json.rows.splice(idx, 0, makeBlankRow(json, idx));
    json.merges = shiftMergesRow(json.merges, idx, 1);
    replaceAndSelect(json, function(sg) { sg.selectRow(idx); });
  }

  
  function insertRowBelow() {
    var idx = getSelRowIdx();
    if (idx < 0) return;
    var json = spanGrid.toJSON();
    var newIdx = idx + 1;
    json.rows.splice(newIdx, 0, makeBlankRow(json, idx));
    json.merges = shiftMergesRow(json.merges, newIdx, 1);
    replaceAndSelect(json, function(sg) { sg.selectRow(newIdx); });
  }

  
  function deleteRow() {
    var indices = getSelRowIndices();
    if (indices.length === 0) return;
    if (spanGrid.rows.length <= indices.length) return;
    var json = spanGrid.toJSON();
    
    var sorted = indices.slice().sort(function(a,b){return b-a;});
    sorted.forEach(function(idx) {
      json.rows.splice(idx, 1);
      json.merges = shiftMergesRow(json.merges, idx, -1);
    });
    var selIdx = Math.min(indices[0], json.rows.length - 1);
    replaceAndSelect(json, function(sg) { sg.selectRow(selIdx); });
  }

  
  function deleteCol() {
    var indices = getSelColIndices();
    if (indices.length === 0) return;
    if (spanGrid.cols.length <= indices.length) return;
    var json = spanGrid.toJSON();
    var sorted = indices.slice().sort(function(a,b){return b-a;});
    sorted.forEach(function(idx) {
      json.cols.splice(idx, 1);
      json.rows.forEach(function(row) { row.cells.splice(idx, 1); });
      json.merges = shiftMergesCol(json.merges, idx, -1);
    });
    var selIdx = Math.min(indices[0], json.cols.length - 1);
    replaceAndSelect(json, function(sg) { sg.selectCol(selIdx); });
  }

  
  function insertColLeft() {
    var idx = getSelColIdx();
    if (idx < 0) return;
    var json = spanGrid.toJSON();
    json.cols.splice(idx, 0, makeBlankCol(json, idx));
    json.rows.forEach(function(row) {
      var refCell = row.cells ? row.cells[idx] : null;
      row.cells.splice(idx, 0, makeStyledCell(refCell));
    });
    json.merges = shiftMergesCol(json.merges, idx, 1);
    replaceAndSelect(json, function(sg) { sg.selectCol(idx); });
  }

  
  function insertColRight() {
    var idx = getSelColIdx();
    if (idx < 0) return;
    var json = spanGrid.toJSON();
    var newIdx = idx + 1;
    json.cols.splice(newIdx, 0, makeBlankCol(json, idx));
    json.rows.forEach(function(row) {
      var refCell = row.cells ? row.cells[idx] : null;
      row.cells.splice(newIdx, 0, makeStyledCell(refCell));
    });
    json.merges = shiftMergesCol(json.merges, newIdx, 1);
    replaceAndSelect(json, function(sg) { sg.selectCol(newIdx); });
  }

  var btnFns = {
    'p-addrow-top':    insertRowAbove,
    'p-addrow-bottom': insertRowBelow,
    'p-addcol-left':   insertColLeft,
    'p-addcol-right':  insertColRight,
    'p-delrow':        deleteRow,
    'p-delcol':        deleteCol,
  };
  Object.keys(btnFns).forEach(function(id) {
    var btn = document.getElementById(id);
    if (btn) btn.addEventListener('click', btnFns[id]);
  });
})();


(function initSortBtns() {

  
  function getRowIndices() {
    var set = {};
    if (spanGrid.selectedRow) {
      var ri = spanGrid.rows.indexOf(spanGrid.selectedRow);
      if (ri >= 0) set[ri] = true;
    }
    var cells = spanGrid.selectedCells || [];
    cells.forEach(function(c) {
      if (c && c.row) { var r = spanGrid.rows.indexOf(c.row); if (r >= 0) set[r] = true; }
    });
    return Object.keys(set).map(Number).sort(function(a,b){return a-b;});
  }

  
  function getColIndices() {
    var set = {};
    if (spanGrid.selectedCol) {
      var ci = spanGrid.cols.indexOf(spanGrid.selectedCol);
      if (ci >= 0) set[ci] = true;
    }
    var cells = spanGrid.selectedCells || [];
    cells.forEach(function(c) {
      if (c && c.row) { var cc = c.row.cells.indexOf(c); if (cc >= 0) set[cc] = true; }
    });
    return Object.keys(set).map(Number).sort(function(a,b){return a-b;});
  }

  
  function compareRows(ra, rb, colKeys, dir) {
    for (var k = 0; k < colKeys.length; k++) {
      var ci = colKeys[k];
      var ta = (ra.cells[ci] && ra.cells[ci].text) ? String(ra.cells[ci].text) : '';
      var tb = (rb.cells[ci] && rb.cells[ci].text) ? String(rb.cells[ci].text) : '';
      var na = parseFloat(ta), nb = parseFloat(tb);
      var cmp;
      if (!isNaN(na) && !isNaN(nb) && ta.trim() !== '' && tb.trim() !== '') {
        cmp = na - nb;
      } else {
        cmp = ta.localeCompare(tb, undefined, { numeric: true, sensitivity: 'base' });
      }
      if (cmp !== 0) return dir === 'asc' ? cmp : -cmp;
    }
    return 0;
  }

  function sortRows(dir) {
    if (!spanGrid) return;
    if (typeof window._undoPush === 'function') window._undoPush();
    var json = spanGrid.toJSON();
    var totalRows = json.rows.length;

    
    var rowIdxs = getRowIndices();
    var minR, maxR;
    if (rowIdxs.length >= 2) {
      minR = rowIdxs[0];
      maxR = rowIdxs[rowIdxs.length - 1];
    } else {
      
      minR = 0;
      maxR = totalRows - 1;
    }

    
    var colKeys = getColIndices();
    if (colKeys.length === 0) colKeys = [0]; 

    
    var slice = json.rows.slice(minR, maxR + 1);
    slice.sort(function(a, b) { return compareRows(a, b, colKeys, dir); });
    for (var i = 0; i < slice.length; i++) {
      json.rows[minR + i] = slice[i];
    }

    
    json.merges = json.merges.filter(function(m) {
      var inRange = m.start.row >= minR && m.end.row <= maxR;
      
      return !(inRange && m.start.row !== m.end.row);
    });

    spanGridReplace(SpanGridControl.fromJSON(json));
    if (typeof window._gridPRedraw === 'function') window._gridPRedraw();
  }

  var asc  = document.getElementById('p-sort-asc');
  var desc = document.getElementById('p-sort-desc');
  if (asc)  asc.addEventListener('click',  function() { sortRows('asc');  });
  if (desc) desc.addEventListener('click', function() { sortRows('desc'); });
})();


(function initMoveRowColBtns() {
  
  function moveRow(direction) {
    if (!spanGrid) return;
    if (typeof window._undoPush === 'function') window._undoPush();
    
    var rows = spanGrid.rows;
    var idx = -1;
    var wasCell = false;
    var savedCellColIdx = -1;
    if (spanGrid.selectedRow) {
      idx = rows.indexOf(spanGrid.selectedRow);
    } else if (spanGrid.selectedCell && spanGrid.selectedCell.row) {
      idx = rows.indexOf(spanGrid.selectedCell.row);
      wasCell = true;
      savedCellColIdx = spanGrid.selectedCell.row.cells.indexOf(spanGrid.selectedCell);
    }
    if (idx < 0) return;
    var newIdx = direction === 'up' ? idx - 1 : idx + 1;
    if (newIdx < 0 || newIdx >= rows.length) return;

    var json = spanGrid.toJSON();
    
    var tmp = json.rows[idx];
    json.rows[idx] = json.rows[newIdx];
    json.rows[newIdx] = tmp;
    
    (json.merges || []).forEach(function(m) {
      function swapR(r) { return r === idx ? newIdx : r === newIdx ? idx : r; }
      m.start.row = swapR(m.start.row);
      m.end.row   = swapR(m.end.row);
      if (m.start.row > m.end.row) {
        var t = m.start.row; m.start.row = m.end.row; m.end.row = t;
      }
    });
    var newGrid = SpanGridControl.fromJSON(json);
    if (typeof spanGridReplace === 'function') {
      spanGridReplace(newGrid);
      
      if (wasCell && savedCellColIdx >= 0) {
        spanGrid.selectCell(newIdx, savedCellColIdx);
      } else {
        spanGrid.selectRow(newIdx);
      }
      if (typeof window._gridPRedraw === 'function') window._gridPRedraw();
    }
  }

  
  function moveCol(direction) {
    if (!spanGrid) return;
    if (typeof window._undoPush === 'function') window._undoPush();
    
    var cols = spanGrid.cols;
    var idx = -1;
    var wasCell = false;
    var savedCellRowIdx = -1;
    if (spanGrid.selectedCol) {
      idx = cols.indexOf(spanGrid.selectedCol);
    } else if (spanGrid.selectedCell && spanGrid.selectedCell.row) {
      idx = spanGrid.selectedCell.row.cells.indexOf(spanGrid.selectedCell);
      wasCell = true;
      savedCellRowIdx = spanGrid.rows.indexOf(spanGrid.selectedCell.row);
    }
    if (idx < 0) return;
    var newIdx = direction === 'left' ? idx - 1 : idx + 1;
    if (newIdx < 0 || newIdx >= cols.length) return;

    var json = spanGrid.toJSON();
    
    var tmpC = json.cols[idx];
    json.cols[idx] = json.cols[newIdx];
    json.cols[newIdx] = tmpC;
    
    (json.rows || []).forEach(function(row) {
      if (row.cells && row.cells.length > Math.max(idx, newIdx)) {
        var tmpCell = row.cells[idx];
        row.cells[idx] = row.cells[newIdx];
        row.cells[newIdx] = tmpCell;
      }
    });
    
    (json.merges || []).forEach(function(m) {
      function swapC(c) { return c === idx ? newIdx : c === newIdx ? idx : c; }
      m.start.col = swapC(m.start.col);
      m.end.col   = swapC(m.end.col);
      if (m.start.col > m.end.col) {
        var t = m.start.col; m.start.col = m.end.col; m.end.col = t;
      }
    });
    var newGrid = SpanGridControl.fromJSON(json);
    if (typeof spanGridReplace === 'function') {
      spanGridReplace(newGrid);
      
      if (wasCell && savedCellRowIdx >= 0) {
        spanGrid.selectCell(savedCellRowIdx, newIdx);
      } else {
        spanGrid.selectCol(newIdx);
      }
      if (typeof window._gridPRedraw === 'function') window._gridPRedraw();
    }
  }

  var btnActions = {
    'p-moverow-up':    function() { moveRow('up');    },
    'p-moverow-down':  function() { moveRow('down');  },
    'p-movecol-left':  function() { moveCol('left');  },
    'p-movecol-right': function() { moveCol('right'); }
  };
  Object.keys(btnActions).forEach(function(id) {
    var btn = document.getElementById(id);
    if (btn) btn.addEventListener('click', btnActions[id]);
  });
})();

(function initBorderPresetBtns() {
  
  document.querySelectorAll('#p-props-toolbar [data-brd-preset]').forEach(function(btn) {
    btn.addEventListener('click', function() {
      if (typeof window._applyBorderPreset === 'function') {
        window._applyBorderPreset(btn.getAttribute('data-brd-preset'));
      }
    });
  });
})();
(function initPanelApply() {
  var applyBtn = document.getElementById('p-panel-apply');
  if (!applyBtn) return;
  applyBtn.addEventListener('click', function() {
    
    var presetBtn = document.getElementById('preset-apply-btn');
    if (presetBtn && !presetBtn.disabled) {
      presetBtn.click();
    }
    
    //var gen = document.getElementById('p-creategrid');
    //if (gen && !gen.disabled) gen.click();
  });
})();


(function initPreviewToggle() {
  const desktopBtn = document.getElementById('preview-btn-desktop');
  const mobileBtn  = document.getElementById('preview-btn-mobile');
  const previewCols = document.getElementById('layout-preview-cols');
  if (!desktopBtn || !mobileBtn || !previewCols) return;
  function setPreview(mode) {
    desktopBtn.classList.toggle('active', mode === 'desktop');
    mobileBtn.classList.toggle('active', mode === 'mobile');
    const count = mode === 'desktop' ? 6 : 3;
    previewCols.innerHTML = '';
    for (var i = 0; i < count; i++) {
      const col = document.createElement('div');
      col.className = 'panel-preview-col';
      previewCols.appendChild(col);
    }
  }
  desktopBtn.addEventListener('click', function() { setPreview('desktop'); });
  mobileBtn.addEventListener('click',  function() { setPreview('mobile'); });
})();

function toggleMode(name) {
  modes[name] = !modes[name];
  document.getElementById('btn-'+name).classList.toggle('active', modes[name]);
  render();
}

function updateInfoPanel(p) {

}

function updateNodeList() {

}

function updateColors() {

}


function updateXGridLoadButton() {
  const btn = document.getElementById('p-loadgrid');
  if (!btn) return;
  const hasGrid = S.xGridNodeId && S.hasXGridSnapshot;
  if (hasGrid) {
    btn.classList.add('xgrid-active');
    btn.title = t('toolbar_load_grid_title');
  } else {
    btn.classList.remove('xgrid-active', 'is-loading', 'is-loaded');
    const label = btn.querySelector('.loadgrid-label');
    if (label) label.textContent = t('toolbar_load_grid');
  }
}


let _xgridBannerTimer = null;
function showXGridBanner(text, ms) {
  const banner = document.getElementById('xgrid-node-banner');
  if (!banner) return;
  banner.textContent = text;
  banner.classList.add('show');
  clearTimeout(_xgridBannerTimer);
  _xgridBannerTimer = setTimeout(function() {
    banner.classList.remove('show');
  }, ms || 2500);
}


function selectNode(id) { send('SELECT_NODE', {id}); }
function zoomTo(id)      { send('ZOOM_TO_NODE', {id}); }
function copyHex(h)      { if (navigator.clipboard) navigator.clipboard.writeText(h).catch(function(){}); }

// ════════════════════════════════════
//  HELPERS
// ════════════════════════════════════
function send(type, extra={}) {
  parent.postMessage({ pluginMessage:{type,...extra} }, '*');
}


(function() {
  var fitBtn = document.getElementById('p-fit-to-grid');
  if (!fitBtn) return;
  fitBtn.addEventListener('click', function() {
    parent.postMessage({ pluginMessage: { type: 'FIT_TO_GRID' } }, '*');
  });
})();

try { syncOnboardingFromSelection(); } catch (e) { /* initial selection from plugin (sendSelectionData) */ }
const _obC = document.getElementById('ob-create');
if (_obC) {
  _obC.addEventListener('click', function () {
    if (!S || !S.selectedIds || S.selectedIds.length !== 1) return;
    if (document.getElementById('onboarding-root') && document.getElementById('onboarding-root').classList.contains('is-entering')) {
      return;
    }
    setEnterWorkspaceUI(true);
    requestAnimationFrame(function () {
      setTimeout(function () {
        send('ENTER_WORKSPACE', {});
      }, 0);
    });
  });
}
const _backO = document.getElementById('panel-back-to-onboarding');
if (_backO) {
  _backO.addEventListener('click', function (e) {
    e.stopPropagation();
    send('LEAVE_WORKSPACE', {});
  });
}

function nodeColor(n) {
  if (n.isSelected) return 'rgba(255,82,114,.9)';
  return nodeColorRaw(n);
}
function nodeColorRaw(n) {
  if (n.isComponent) return '#7b8cff';
  const m = {
    FRAME:'#4af0c4', SECTION:'#4af0c4',
    TEXT:'#ffc850', GROUP:'#b4b4ff',
    RECTANGLE:'#80c8ff', ELLIPSE:'#ff9f80',
    VECTOR:'#ff80c8', INSTANCE:'#a78bfa',
    COMPONENT:'#a78bfa', COMPONENT_SET:'#a78bfa',
  };
  return m[n.type] || '#c0c4e0';
}
function fadeAlpha(css, a) {
  const m = css.match(/rgba?\(([^)]+)\)/);
  if (!m) return css;
  const [r,g,b] = m[1].split(',');
  return `rgba(${r},${g},${b},${a})`;
}
function trunc(s,n) { return s&&s.length>n ? s.slice(0,n)+'…' : (s||''); }
function rr(ctx,x,y,w,h,r) {
  ctx.beginPath();
  ctx.moveTo(x+r,y); ctx.lineTo(x+w-r,y);
  ctx.quadraticCurveTo(x+w,y,x+w,y+r);
  ctx.lineTo(x+w,y+h-r);
  ctx.quadraticCurveTo(x+w,y+h,x+w-r,y+h);
  ctx.lineTo(x+r,y+h);
  ctx.quadraticCurveTo(x,y+h,x,y+h-r);
  ctx.lineTo(x,y+r);
  ctx.quadraticCurveTo(x,y,x+r,y);
  ctx.closePath();
}

// ═══════════════════════════════════════════════
// PRESET SYSTEM
// ═══════════════════════════════════════════════
const PRESET_TEMPLATES = [
  {
    id: 'tracker',
    name: 'Tracker',
    icon: '✦',
    cols: [130, 75, 68, 62, 65],
    rows: [34, 28, 28, 28, 28, 28],
    headerRows: 1,
    data: [
      ['Task',                  'Owner',    'Priority', 'Progress', 'Due'],
      ['Login UI Redesign',     'M. Kim',   'High',     '75%',      'May 8'],
      ['API Performance',       'J. Lee',   'Critical', '40%',      'May 5'],
      ['Design System',         'S. Park',  'Medium',   '90%',      'May 12'],
      ['Mobile QA',             'H. Jung',  'High',     '60%',      'May 10'],
      ['CI/CD Pipeline',        'J. Han',   'Low',      '20%',      'May 20'],
    ],
  },
  {
    id: 'finance',
    name: 'Finance',
    icon: '◆',
    cols: [110, 80, 78, 78, 64],
    rows: [36, 28, 28, 28, 28, 28],
    headerRows: 1,
    data: [
      ['Metric',           'This Mo.',  'Prev Mo.',  'Target',   'Result'],
      ['Total Revenue',    '$2.84M',    '$2.61M',    '$2.80M',   '101%'],
      ['New Customers',    '1,247',     '1,102',     '1,200',    '104%'],
      ['Churn Rate',       '2.3%',      '2.8%',      '< 3.0%',  'Good'],
      ['Avg. Order Value', '$89',        '$82',        '$85',     '105%'],
      ['Operating Margin', '34.2%',     '31.8%',     '33.0%',   '104%'],
    ],
  },
  {
    id: 'invoice',
    name: 'Invoice',
    icon: '▤',
    cols: [130, 42, 80, 80, 68],
    rows: [34, 28, 28, 28, 28, 28, 34],
    headerRows: 1,
    stripeAlt: true,
    data: [
      ['Item',                      'Qty', 'Unit Price',  'Amount',  'Note'],
      ['UI/UX Design Consulting',   '8h',  '$154',        '$1,231',  ''],
      ['Frontend Development',      '40h', '$138',        '$5,538',  ''],
      ['Server Hosting (1 mo.)',     '1',   '$246',        '$246',    'Cloud'],
      ['Domain & SSL Setup',         '1',   '$62',         '$62',     '1yr incl.'],
      ['QA Testing',                '16h', '$115',        '$1,846',  ''],
      ['',                           '',    'Total',       '$8,923',  'excl. tax'],
    ],
  },
  {
    id: 'roster',
    name: 'Roster',
    icon: '—',
    cols: [88, 110, 104, 96, 52],
    rows: [32, 28, 28, 28, 28, 28],
    headerRows: 1,
    noFill: true,
    data: [
      ['Name',     'Role',               'Expertise',         'Email',         'Status'],
      ['D. Kim',   'Product Manager',    'Roadmap · OKR',     'doyeon@co.',   'Active'],
      ['J. Lee',   'Lead Engineer',      'React · Node.js',   'junso@co.',    'Active'],
      ['N. Park',  'UX Designer',        'Figma · Research',  'naeun@co.',    'Active'],
      ['S. Choi',  'Data Analyst',       'SQL · Tableau',     'siwoo@co.',    'Active'],
      ['H. Jung',  'DevOps',             'K8s · AWS',         'hayun@co.',    'Probation'],
    ],
  },
  {
    id: 'roadmap',
    name: 'Roadmap',
    icon: '≡',
    cols: [135, 58, 58, 58, 70],
    rows: [38, 32, 28, 28, 28, 28],
    headerRows: 2,
    sectionHeaderRow: 0,
    data: [
      ['2025 Product Roadmap',     '',    '',    '',    ''],
      ['Feature',                  'Q1',  'Q2',  'Q3',  'Team'],
      ['AI Auto-generate v2.0',    '✓',   '',    '',    'Platform'],
      ['Real-time Collaboration',  '',    '✓',   '',    'Core'],
      ['Mobile App Beta',          '',    '✓',   '',    'Mobile'],
      ['Enterprise SSO',           '',    '',    '✓',   'Infra'],
    ],
    merges: [{ start: { row: 0, col: 0 }, end: { row: 0, col: 4 } }],
  },
  {
    id: 'pricing',
    name: 'Pricing',
    icon: '$',
    cols: [110, 62, 62, 80],
    rows: [36, 28, 28, 28, 28, 28, 28],
    headerRows: 1,
    accentCol: 3,
    data: [
      ['Feature',            'Starter',   'Growth',    'Scale'],
      ['Monthly Active Users','Up to 1K', 'Up to 10K', 'Unlimited'],
      ['Custom Domain',      '✕',         '✓',         '✓'],
      ['Team Members',       '3 seats',   '15 seats',  'Unlimited'],
      ['Analytics',          'Basic',     'Advanced',  'AI Insights'],
      ['SLA Guarantee',      '✕',         '99.5%',     '99.9%'],
      ['Dedicated Manager',  '✕',         '✕',         '✓'],
    ],
  },
];

const PRESET_STYLES = [
  {
    id: 'classic',
    name: 'Classic',
    sub: 'Navy',
    swatch: '#1a2744',
    headerBg: '#1a2744',   headerFg: '#ffffff',
    sectionHdrBg: '#2c3e50', sectionHdrFg: '#ffffff',
    bodyBg: '#ffffff',     bodyFg: '#2c3e50',
    altBg: '#f5f7fb',      altFg: '#2c3e50',
    borderColor: '#d0d7e0',
    accentBg: '#eef2f8',   accentFg: '#1a2744',
    font: '9pt sans-serif',
    headerFont: 'bold 9pt sans-serif',
  },
  {
    id: 'modern',
    name: 'Modern',
    sub: 'Indigo',
    swatch: '#4f46e5',
    headerBg: '#4f46e5',   headerFg: '#ffffff',
    sectionHdrBg: '#6d28d9', sectionHdrFg: '#ffffff',
    bodyBg: '#ffffff',     bodyFg: '#1e1b4b',
    altBg: '#f5f3ff',      altFg: '#1e1b4b',
    borderColor: '#c7d2fe',
    accentBg: '#ede9fe',   accentFg: '#4338ca',
    font: '9pt sans-serif',
    headerFont: 'bold 9pt sans-serif',
  },
  {
    id: 'sky',
    name: 'Sky',
    sub: 'Blue',
    swatch: '#0ea5e9',
    headerBg: '#0ea5e9',   headerFg: '#ffffff',
    sectionHdrBg: '#0284c7', sectionHdrFg: '#ffffff',
    bodyBg: '#ffffff',     bodyFg: '#0c4a6e',
    altBg: '#f0f9ff',      altFg: '#0c4a6e',
    borderColor: '#bae6fd',
    accentBg: '#e0f2fe',   accentFg: '#0284c7',
    font: '9pt sans-serif',
    headerFont: 'bold 9pt sans-serif',
  },
  {
    id: 'coral',
    name: 'Coral',
    sub: 'Orange',
    swatch: '#ea580c',
    headerBg: '#ea580c',   headerFg: '#ffffff',
    sectionHdrBg: '#9a3412', sectionHdrFg: '#ffffff',
    bodyBg: '#ffffff',     bodyFg: '#7c2d12',
    altBg: '#fff7ed',      altFg: '#7c2d12',
    borderColor: '#fed7aa',
    accentBg: '#ffedd5',   accentFg: '#c2410c',
    font: '9pt sans-serif',
    headerFont: 'bold 9pt sans-serif',
  },
  {
    id: 'mint',
    name: 'Mint',
    sub: 'Mint',
    swatch: '#0d9488',
    headerBg: '#0d9488',   headerFg: '#ffffff',
    sectionHdrBg: '#0f766e', sectionHdrFg: '#ffffff',
    bodyBg: '#ffffff',     bodyFg: '#134e4a',
    altBg: '#f0fdfa',      altFg: '#134e4a',
    borderColor: '#99f6e4',
    accentBg: '#ccfbf1',   accentFg: '#0f766e',
    font: '9pt sans-serif',
    headerFont: 'bold 9pt sans-serif',
  },
  {
    id: 'sepia',
    name: 'Sepia',
    sub: 'Sepia',
    swatch: '#292524',
    headerBg: '#292524',   headerFg: '#faf7ef',
    sectionHdrBg: '#44403c', sectionHdrFg: '#faf7ef',
    bodyBg: '#fffdf8',     bodyFg: '#292524',
    altBg: '#f5efe4',      altFg: '#44403c',
    borderColor: '#c4a882',
    accentBg: '#fdf4e7',   accentFg: '#92400e',
    font: '9pt serif',
    headerFont: 'bold 9pt serif',
  },
  {
    id: 'luxury',
    name: 'Luxury',
    sub: 'Gold',
    swatch: '#181611',
    headerBg: '#181611',   headerFg: '#d4af37',
    sectionHdrBg: '#211e17', sectionHdrFg: '#d4af37',
    bodyBg: '#181611',     bodyFg: '#faf7ef',
    altBg: '#211e17',      altFg: '#c8b891',
    borderColor: '#3a3428',
    accentBg: '#2a2518',   accentFg: '#d4af37',
    font: '9pt sans-serif',
    headerFont: 'bold 9pt sans-serif',
  },
  {
    id: 'brutal',
    name: 'Brutal',
    sub: 'Brutal',
    swatch: '#111111',
    headerBg: '#111111',   headerFg: '#fff200',
    sectionHdrBg: '#222222', sectionHdrFg: '#fff200',
    bodyBg: '#fffef0',     bodyFg: '#111111',
    altBg: '#fff9a6',      altFg: '#111111',
    borderColor: '#111111',
    accentBg: '#fff200',   accentFg: '#111111',
    font: '9pt sans-serif',
    headerFont: 'bold 9pt sans-serif',
  },
  {
    id: 'terminal',
    name: 'Terminal',
    sub: 'Green',
    swatch: '#0d1117',
    headerBg: '#0d1117',   headerFg: '#7ee787',
    sectionHdrBg: '#0d2115', sectionHdrFg: '#56d364',
    bodyBg: '#161b22',     bodyFg: '#e6edf3',
    altBg: '#0d1117',      altFg: '#c9d1d9',
    borderColor: '#30363d',
    accentBg: '#0d2b15',   accentFg: '#56d364',
    font: '9pt monospace',
    headerFont: 'bold 9pt monospace',
  },
];

let _presetTplId = 'style_only';
let _presetStyId = null;

function buildStyleOnlyJSON(sty) {
  if (typeof spanGrid === 'undefined' || !spanGrid) return null;
  var json = spanGrid.toJSON();

  json.borderColor = sty.borderColor;
  json.backColor   = sty.bodyBg;
  json.gridBorder  = {
    borderDirection: 'All', lineStyle: 'Solid', lineWidth: 1,
    topColor: sty.borderColor, leftColor: sty.borderColor,
    rightColor: sty.borderColor, bottomColor: sty.borderColor,
  };

  if (Array.isArray(json.rows)) {
    json.rows.forEach(function(row, ri) {
      var isHdr = ri === 0;
      var isAlt = !isHdr && (ri % 2 === 0);
      var bg   = isHdr ? sty.headerBg  : (isAlt ? sty.altBg  : sty.bodyBg);
      var fg   = isHdr ? sty.headerFg  : (isAlt ? sty.altFg  : sty.bodyFg);
      var font = isHdr ? sty.headerFont : sty.font;
      if (Array.isArray(row.cells)) {
        row.cells.forEach(function(cell) {
          cell.backColor = bg;
          cell.foreColor = fg;
          cell.font      = font;
        });
      }
    });
  }
  return json;
}

function buildPresetJSON(tpl, sty) {
  const rowsData = [];
  const activeData = tpl.data;
  for (let ri = 0; ri < activeData.length; ri++) {
    const rowD = activeData[ri];
    const isSectionHdr = tpl.sectionHeaderRow !== undefined && ri === tpl.sectionHeaderRow;
    const isHdr = !isSectionHdr && ri < (tpl.headerRows || 1);
    const isAlt  = !isHdr && !isSectionHdr && tpl.stripeAlt && (ri % 2 === 0);

    const rowObj = { height: tpl.rows[ri] || 28, cells: [] };

    // Minimal: header row gets a heavier bottom border
    if (tpl.noFill && ri === 0) {
      rowObj.border = {
        borderDirection: 'Bottom', lineStyle: 'Solid', lineWidth: 2,
        bottomColor: sty.headerBg,
      };
    }

    for (let ci = 0; ci < rowD.length; ci++) {
      const text = rowD[ci];
      let bg, fg, font, align;
      if (isSectionHdr) {
        bg = sty.sectionHdrBg; fg = sty.sectionHdrFg;
        font = sty.headerFont;  align = 'MiddleCenter';
      } else if (isHdr) {
        bg = sty.headerBg;  fg = sty.headerFg;
        font = sty.headerFont; align = 'MiddleCenter';
      } else if (tpl.noFill) {
        bg = sty.bodyBg;   fg = sty.bodyFg;
        font = sty.font;   align = 'MiddleLeft';
      } else if (tpl.accentCol !== undefined && ci === tpl.accentCol) {
        bg = sty.accentBg; fg = sty.accentFg;
        font = sty.headerFont; align = 'MiddleCenter';
      } else if (isAlt) {
        bg = sty.altBg;    fg = sty.altFg;
        font = sty.font;   align = 'MiddleLeft';
      } else {
        bg = sty.bodyBg;   fg = sty.bodyFg;
        font = sty.font;   align = 'MiddleLeft';
      }
      rowObj.cells.push({ text, backColor: bg, foreColor: fg, font, textAlign: align });
    }
    rowsData.push(rowObj);
  }

  return {
    version: '1.2.1',
    width: 420, height: 260,  // overridden at apply-time with current grid dims
    borderStyle: 'None',
    borderDirection: 'All',
    borderColor: sty.borderColor,
    backColor: sty.bodyBg,
    expand: false,
    autoScroll: true,
    zoom: 1,
    scrollMode: 'None',
    scrollBarSize: 0,
    reserveScrollbarInViewport: false,
    fitCellWidth: false,
    fitCellHeight: false,
    gridBorder: {
      borderDirection: 'All', lineStyle: 'Solid', lineWidth: 1,
      topColor: sty.borderColor, leftColor: sty.borderColor,
      rightColor: sty.borderColor, bottomColor: sty.borderColor,
    },
    fixed: { row: -1, col: -1 },
    cols: tpl.cols.map(function(w) { return { width: w }; }),
    rows: rowsData,
    merges: tpl.merges ? tpl.merges.slice() : [],
  };
}

function renderPresetComboPreview(tpl, sty) {
  const container = document.getElementById('preset-combo-preview');
  const tblEl = document.getElementById('preset-preview-table');
  if (!container || !tblEl) return;

  const activeData = tpl.data;
  const MAX_R = 4, MAX_C = 4;
  const rowCount = Math.min(activeData.length, MAX_R);
  const colCount = Math.min(tpl.cols.length, MAX_C);

  let html = '';
  for (let ri = 0; ri < rowCount; ri++) {
    const isSectionHdr = tpl.sectionHeaderRow !== undefined && ri === tpl.sectionHeaderRow;
    const isHdr = !isSectionHdr && ri < (tpl.headerRows || 1);
    const isAlt  = !isHdr && !isSectionHdr && tpl.stripeAlt && (ri % 2 === 0);
    html += '<tr>';
    for (let ci = 0; ci < colCount; ci++) {
      const text = (activeData[ri] && activeData[ri][ci]) || '';
      let bg, fg;
      if (isSectionHdr)     { bg = sty.sectionHdrBg; fg = sty.sectionHdrFg; }
      else if (isHdr)       { bg = sty.headerBg;      fg = sty.headerFg; }
      else if (tpl.noFill)  { bg = sty.bodyBg;         fg = sty.bodyFg; }
      else if (tpl.accentCol !== undefined && ci === tpl.accentCol) { bg = sty.accentBg; fg = sty.accentFg; }
      else if (isAlt)       { bg = sty.altBg;           fg = sty.altFg; }
      else                  { bg = sty.bodyBg;           fg = sty.bodyFg; }
      const bord = '1px solid ' + sty.borderColor;
      html += `<td style="background:${bg};color:${fg};border:${bord};padding:3px 5px;max-width:55px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;font-size:7px">${text}</td>`;
    }
    html += '</tr>';
  }
  tblEl.innerHTML = html;
  container.classList.add('visible');
}

function initPresets() {
  const tplGrid   = document.getElementById('preset-tpl-grid');
  const styRow    = document.getElementById('preset-sty-row');
  const applyBtn  = document.getElementById('preset-apply-btn');
  const secHead   = document.getElementById('preset-sec-h4');
  const bodyEl    = document.getElementById('preset-body');
  const chevEl    = document.getElementById('preset-chev');
  if (!tplGrid || !styRow || !applyBtn) return;

  secHead && secHead.addEventListener('click', function() {
    const open = bodyEl.style.display !== 'none';
    bodyEl.style.display = open ? 'none' : 'block';
    if (chevEl) chevEl.style.transform = open ? '' : 'rotate(180deg)';
  });


  const styleOnlyBtn = document.getElementById('btn-style-only');
  if (styleOnlyBtn) {
    styleOnlyBtn.addEventListener('click', function() {
      _presetTplId = 'style_only';
      tplGrid.querySelectorAll('.preset-tpl-btn').forEach(function(b) { b.classList.remove('selected'); });
      styleOnlyBtn.classList.add('selected');
      _updatePresetBtn();
    });
  }

  PRESET_TEMPLATES.forEach(function(tpl) {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'preset-tpl-btn';
    btn.setAttribute('data-preset-tpl-id', tpl.id);
    btn.title = t('tpl_' + tpl.id);
    btn.innerHTML = '<span class="pt-icon">' + tpl.icon + '</span><span class="pt-name">' + t('tpl_' + tpl.id) + '</span>';
    btn.addEventListener('click', function() {
      _presetTplId = tpl.id;
      tplGrid.querySelectorAll('.preset-tpl-btn').forEach(function(b) { b.classList.remove('selected'); });
      if (styleOnlyBtn) styleOnlyBtn.classList.remove('selected');
      btn.classList.add('selected');
      _updatePresetBtn();
    });
    tplGrid.appendChild(btn);
  });

  PRESET_STYLES.forEach(function(sty) {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'preset-sty-btn';
    btn.setAttribute('data-preset-sty-id', sty.id);
    btn.title = t('sty_' + sty.id) + ' · ' + t('sty_sub_' + sty.id);
    btn.innerHTML = '<span class="ps-swatch" style="background:' + sty.swatch + '"></span><span class="ps-name">' + t('sty_' + sty.id) + '</span>';
    btn.addEventListener('click', function() {
      _presetStyId = sty.id;
      styRow.querySelectorAll('.preset-sty-btn').forEach(function(b) { b.classList.remove('selected'); });
      btn.classList.add('selected');
      _updatePresetBtn();
    });
    styRow.appendChild(btn);
  });

  function _updatePresetBtn() {

    const ready = !!_presetStyId;
    applyBtn.disabled = !ready;

    if (ready && _presetTplId !== 'style_only') {
      const tpl = PRESET_TEMPLATES.find(function(t) { return t.id === _presetTplId; });
      const sty = PRESET_STYLES.find(function(s) { return s.id === _presetStyId; });
      if (tpl && sty) renderPresetComboPreview(tpl, sty);
    } else {
      var previewEl = document.getElementById('preset-combo-preview');
      if (previewEl) previewEl.classList.remove('visible');
    }
  }

  applyBtn.addEventListener('click', function() {
    const sty = PRESET_STYLES.find(function(s) { return s.id === _presetStyId; });
    if (!sty) return;
    if (typeof window._undoPush === 'function') window._undoPush();


    if (_presetTplId === 'style_only') {
      const json = buildStyleOnlyJSON(sty);
      if (!json) return;
      try {
        const newGrid = SpanGridControl.fromJSON(json);
        if (typeof spanGridReplace === 'function') {
          spanGridReplace(newGrid);
        }
      } catch (err) {
        console.warn('[preset] style-only apply failed:', err);
      }
      return;
    }

    const tpl = PRESET_TEMPLATES.find(function(t) { return t.id === _presetTplId; });
    if (!tpl) return;
    const json = buildPresetJSON(tpl, sty);
    // Preserve current grid viewport dimensions
    if (typeof g !== 'undefined' && g && g.width > 0)  json.width  = g.width;
    if (typeof g !== 'undefined' && g && g.height > 0) json.height = g.height;
    try {
      const newGrid = SpanGridControl.fromJSON(json);
      if (typeof spanGridReplace === 'function') {
        spanGridReplace(newGrid);


        const selNode = S && S.nodes && S.nodes.find(function(n) { return n.isSelected; });
        if (selNode) {
          positionGridToSelectedBounds(selNode);
        }

        const _eqR = document.getElementById('p-eqrows');
        const _eqC = document.getElementById('p-eqcols');
        if (_eqR) _eqR.click();
        if (_eqC) _eqC.click();
      }
    } catch (err) {
      console.warn('[preset] apply failed:', err);
    }
  });
}

// Run after all init code has completed
setTimeout(initPresets, 0);
setTimeout(applyI18n, 0);

// ════════════════════════════════════════════════════════════════
//  PAN DEBUG MODE


//
//  PAN_DEBUG_MODE:


//
//  PAN_OFF:


//
//  PAN_DURING_SYNC:


//


//

// ════════════════════════════════════════════════════════════════
const PAN_DEBUG_MODE  = false;
const PAN_OFF         = false;
const PAN_DURING_SYNC = true;

if (PAN_DEBUG_MODE) {
  pan._standaloneMode = true;
  console.log('[PAN_DEBUG_MODE] enabled; panning does not communicate with Figma.\n'
    + 'Controls: wheel scroll / Shift+wheel horizontal / middle-button drag');
}

// ════════════════════════════════════════════════════════════════

//


//


//


// ════════════════════════════════════════════════════════════════
(function () {
  'use strict';


  window.SG_CTX_MENU_DEF = [
    { label_key: 'ctx_lbl_grid', submenu: [
        { label_key: 'ctx_makegrid', target: 'p-makegrid' },
        { label_key: 'ctx_selgrid',  target: 'p-selgrid'  },
    ]},
    { sep: true },
    { label_key: 'ctx_undo', target: 'p-undo' },
    { label_key: 'ctx_redo', target: 'p-redo' },
    { sep: true },
    { label_key: 'ctx_size', submenu: [
        { label_key: 'ctx_eq_all',      target: 'p-eqall'      },
        { label_key: 'ctx_eq_rows',     target: 'p-eqrows'     },
        { label_key: 'ctx_eq_cols',     target: 'p-eqcols'     },
        { sep: true },
        { label_key: 'ctx_eq_rows_sel', target: 'p-eqrows-sel' },
        { label_key: 'ctx_eq_cols_sel', target: 'p-eqcols-sel' },
    ]},
    { label_key: 'ctx_insert', submenu: [
        { label_key: 'ctx_addrow_top',    target: 'p-addrow-top'    },
        { label_key: 'ctx_addrow_bottom', target: 'p-addrow-bottom' },
        { label_key: 'ctx_addcol_left',   target: 'p-addcol-left'   },
        { label_key: 'ctx_addcol_right',  target: 'p-addcol-right'  },
        { sep: true },
        { label_key: 'ctx_delrow', target: 'p-delrow', danger: true },
        { label_key: 'ctx_delcol', target: 'p-delcol', danger: true },
    ]},
    { label_key: 'ctx_move', submenu: [
        { label_key: 'ctx_moverow_up',    target: 'p-moverow-up'    },
        { label_key: 'ctx_moverow_down',  target: 'p-moverow-down'  },
        { label_key: 'ctx_movecol_left',  target: 'p-movecol-left'  },
        { label_key: 'ctx_movecol_right', target: 'p-movecol-right' },
    ]},
    { label_key: 'ctx_border', submenu: [
        { label_key: 'ctx_brd_all',        target: 'p-brd-all'        },
        { label_key: 'ctx_brd_outer',      target: 'p-brd-outer'      },
        { label_key: 'ctx_brd_inner',      target: 'p-brd-inner'      },
        { sep: true },
        { label_key: 'ctx_brd_horizontal', target: 'p-brd-horizontal' },
        { label_key: 'ctx_brd_vertical',   target: 'p-brd-vertical'   },
        { sep: true },
        { label_key: 'ctx_brd_top',        target: 'p-brd-top'        },
        { label_key: 'ctx_brd_bottom',     target: 'p-brd-bottom'     },
        { label_key: 'ctx_brd_left',       target: 'p-brd-left'       },
        { label_key: 'ctx_brd_right',      target: 'p-brd-right'      },
        { sep: true },
        { label_key: 'ctx_brd_none', target: 'p-brd-none', danger: true },
    ]},
    { label_key: 'ctx_merge', condition: 'merge-visible', submenu: [
        { label_key: 'ctx_merge_cells', target: 'p-merge'      },
        { label_key: 'ctx_split_cells', target: 'p-split'      },
        { sep: true },
        { label_key: 'ctx_clearmerge', target: 'p-clearmerge', danger: true },
    ]},
    { label_key: 'ctx_sort', submenu: [
        { label_key: 'ctx_sort_asc',  target: 'p-sort-asc'  },
        { label_key: 'ctx_sort_desc', target: 'p-sort-desc' },
    ]},
    { sep: true },
    { label_key: 'ctx_lbl_generate', primary: true, submenu: [
        { label_key: 'ctx_gen_fixed',  mode: 'fixed',       primary: true },
        { label_key: 'ctx_gen_auto',   mode: 'auto-layout', primary: true },
        { label_key: 'ctx_gen_image',  mode: 'image',       primary: true },
        { label_key: 'ctx_gen_vector', mode: 'vector',      primary: true },
    ]},
    { sep: true },
    { label_key: 'ctx_loadgrid', target: 'p-loadgrid', condition: 'loadgrid-active' },
  ];


  var _hoverTimer    = null;
  var _activeSubItem = null;
  var _mouseInSub    = false;

  function _cancelHover() {
    if (_hoverTimer) { clearTimeout(_hoverTimer); _hoverTimer = null; }
  }

  function _scheduleClose(itemEl) {
    _cancelHover();
    _hoverTimer = setTimeout(function () {
      _hoverTimer = null;
      _doCloseSubmenu(itemEl);
    }, 300);
  }

  function _doCloseSubmenu(itemEl) {
    if (!itemEl) return;
    _mouseInSub = false;
    itemEl.classList.remove('ctx-sub-open');
    var sub = itemEl._ctxSubmenu;
    if (sub) sub.style.display = 'none';
    if (_activeSubItem === itemEl) _activeSubItem = null;
  }


  function makeArrowSvg() {
    var svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.setAttribute('class', 'ctx-arrow');
    svg.setAttribute('viewBox', '0 0 24 24');
    svg.setAttribute('fill', 'none');
    svg.setAttribute('stroke', 'currentColor');
    svg.setAttribute('stroke-width', '2.2');
    svg.setAttribute('stroke-linecap', 'round');
    svg.setAttribute('stroke-linejoin', 'round');
    var path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    path.setAttribute('d', 'M9 6l6 6-6 6');
    svg.appendChild(path);
    return svg;
  }


  var CTX_ICON_SVG = {
    ctx_lbl_grid:       '<rect x="4" y="4" width="7" height="7" rx="1.5"/><rect x="13" y="4" width="7" height="7" rx="1.5"/><rect x="4" y="13" width="7" height="7" rx="1.5"/><rect x="13" y="13" width="7" height="7" rx="1.5"/><path d="M17 11v6M14 14h6"/>',
    ctx_makegrid:       '<rect x="4" y="4" width="7" height="7" rx="1.5"/><rect x="13" y="4" width="7" height="7" rx="1.5"/><rect x="4" y="13" width="7" height="7" rx="1.5"/><rect x="13" y="13" width="7" height="7" rx="1.5"/><path d="M17 11v6M14 14h6"/>',
    ctx_selgrid:        '<rect x="4" y="4" width="16" height="16" rx="2"/><path d="M4 10h16M4 14h16M10 4v16M14 4v16" opacity=".45"/><rect x="9" y="9" width="6" height="6" rx="1" fill="currentColor" opacity=".25"/>',
    ctx_undo:           '<path d="M3 9.5h11a5 5 0 0 1 0 10H8"/><path d="M3 9.5l4-4M3 9.5l4 4"/>',
    ctx_redo:           '<path d="M21 9.5H10a5 5 0 0 0 0 10h6"/><path d="M21 9.5l-4-4M21 9.5l-4 4"/>',
    ctx_size:           '<rect x="4" y="5" width="16" height="14" rx="2"/><path d="M4 9.5h16M4 14.5h16"/><path d="M21 7v10M19.5 7h3M19.5 17h3"/>',
    ctx_eq_all:         '<rect x="5" y="5" width="14" height="14" rx="2"/><path d="M9 5v14M15 5v14M5 9h14M5 15h14"/><path d="M3 8V3h5M21 8V3h-5M3 16v5h5M21 16v5h-5"/>',
    ctx_eq_rows:        '<rect x="5" y="5" width="14" height="14" rx="2"/><path d="M5 9.7h14M5 14.3h14"/><path d="M20.5 7v10M19 7h3M19 17h3"/>',
    ctx_eq_cols:        '<rect x="5" y="5" width="14" height="14" rx="2"/><path d="M9.7 5v14M14.3 5v14"/><path d="M7 20.5h10M7 19v3M17 19v3"/>',
    ctx_eq_rows_sel:    '<rect x="5" y="5" width="14" height="14" rx="2" opacity=".4"/><rect x="5" y="10" width="14" height="4" rx=".7"/><path d="M21 9v6M19.5 9h3M19.5 15h3"/>',
    ctx_eq_cols_sel:    '<rect x="5" y="5" width="14" height="14" rx="2" opacity=".4"/><rect x="10" y="5" width="4" height="14" rx=".7"/><path d="M9 21h6M9 19.5v3M15 19.5v3"/>',
    ctx_insert:         '<rect x="4" y="7" width="16" height="11" rx="2"/><path d="M4 11.5h16M4 15h16"/><path d="M12 2v4M10 4h4"/>',
    ctx_addrow_top:     '<rect x="5" y="7" width="14" height="12" rx="2"/><path d="M5 11h14M5 15h14"/><path d="M12 2v4M10 4h4"/>',
    ctx_addrow_bottom:  '<rect x="5" y="5" width="14" height="12" rx="2"/><path d="M5 9h14M5 13h14"/><path d="M12 18v4M10 20h4"/>',
    ctx_addcol_left:    '<rect x="7" y="5" width="12" height="14" rx="2"/><path d="M11 5v14M15 5v14"/><path d="M2 12h4M4 10v4"/>',
    ctx_addcol_right:   '<rect x="5" y="5" width="12" height="14" rx="2"/><path d="M9 5v14M13 5v14"/><path d="M18 12h4M20 10v4"/>',
    ctx_delrow:         '<rect x="5" y="5" width="14" height="14" rx="2"/><path d="M5 10h14M5 14h14"/><path d="M8 12h8"/>',
    ctx_delcol:         '<rect x="5" y="5" width="14" height="14" rx="2"/><path d="M10 5v14M14 5v14"/><path d="M12 8v8"/>',
    ctx_move:           '<rect x="3" y="7" width="18" height="12" rx="1.5"/><path d="M3 11h18M3 15h18"/><path d="M12 21V3M10 5l2-2 2 2"/>',
    ctx_moverow_up:     '<rect x="3" y="7" width="18" height="12" rx="1.5"/><path d="M3 11h18M3 15h18"/><path d="M12 21V3M10 5l2-2 2 2"/>',
    ctx_moverow_down:   '<rect x="3" y="5" width="18" height="12" rx="1.5"/><path d="M3 9h18M3 13h18"/><path d="M12 3v18M10 19l2 2 2-2"/>',
    ctx_movecol_left:   '<rect x="7" y="3" width="12" height="18" rx="1.5"/><path d="M11 3v18M15 3v18"/><path d="M21 12H3M5 10l-2 2 2 2"/>',
    ctx_movecol_right:  '<rect x="5" y="3" width="12" height="18" rx="1.5"/><path d="M9 3v18M13 3v18"/><path d="M3 12h18M19 10l2 2-2 2"/>',
    ctx_border:         '<rect x="5" y="5" width="14" height="14" rx="1.5"/><path d="M12 6v12M6 12h12" opacity=".25"/>',
    ctx_brd_all:        '<rect x="5" y="5" width="14" height="14" rx="1.5"/><path d="M9.7 5v14M14.3 5v14M5 9.7h14M5 14.3h14"/>',
    ctx_brd_outer:      '<rect x="5" y="5" width="14" height="14" rx="1.5"/><path d="M12 6v12M6 12h12" opacity=".25"/>',
    ctx_brd_inner:      '<rect x="5" y="5" width="14" height="14" rx="1.5" opacity=".35"/><path d="M12 5v14M5 12h14"/>',
    ctx_brd_horizontal: '<rect x="5" y="5" width="14" height="14" rx="1.5" opacity=".35"/><path d="M5 9.7h14M5 14.3h14"/>',
    ctx_brd_vertical:   '<rect x="5" y="5" width="14" height="14" rx="1.5" opacity=".35"/><path d="M9.7 5v14M14.3 5v14"/>',
    ctx_brd_top:        '<rect x="6" y="7" width="12" height="12" rx="1.5" opacity=".35"/><path d="M6 5h12"/>',
    ctx_brd_bottom:     '<rect x="6" y="5" width="12" height="12" rx="1.5" opacity=".35"/><path d="M6 19h12"/>',
    ctx_brd_left:       '<rect x="7" y="6" width="12" height="12" rx="1.5" opacity=".35"/><path d="M5 6v12"/>',
    ctx_brd_right:      '<rect x="5" y="6" width="12" height="12" rx="1.5" opacity=".35"/><path d="M19 6v12"/>',
    ctx_brd_none:       '<rect x="5" y="5" width="14" height="14" rx="1.5" opacity=".35"/><path d="M5 19L19 5"/>',
    ctx_merge:          '<rect x="4" y="6" width="16" height="12" rx="2"/><path d="M4 12h16M12 6v12" opacity=".35"/><path d="M9 10l3 2-3 2M15 10l-3 2 3 2"/>',
    ctx_merge_cells:    '<rect x="4" y="6" width="16" height="12" rx="2"/><path d="M4 12h16M12 6v12" opacity=".35"/><path d="M9 10l3 2-3 2M15 10l-3 2 3 2"/>',
    ctx_split_cells:    '<rect x="4" y="6" width="16" height="12" rx="2"/><path d="M12 6v12"/><path d="M12 12H4M12 12h8" opacity=".45"/><path d="M10 10l-3 2 3 2M14 10l3 2-3 2"/>',
    ctx_clearmerge:     '<rect x="4" y="6" width="16" height="12" rx="2"/><path d="M9.3 6v12M14.7 6v12M4 12h16"/><path d="M5 4l14 16"/>',
    ctx_sort:           '<path d="M7 17V5M4 8l3-3 3 3"/><path d="M13 7h7M13 12h5M13 17h3"/>',
    ctx_sort_asc:       '<path d="M7 17V5M4 8l3-3 3 3"/><path d="M13 7h7M13 12h5M13 17h3"/>',
    ctx_sort_desc:      '<path d="M7 7v12M4 16l3 3 3-3"/><path d="M13 7h3M13 12h5M13 17h7"/>',
    ctx_lbl_generate:   '<path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/>',
    ctx_gen_fixed:      '<rect x="3" y="3" width="18" height="18" rx="2"/><path d="M3 8h18M8 3v5"/>',
    ctx_gen_auto:       '<rect x="3" y="7" width="18" height="10" rx="2"/><path d="M8 7v10M14 7v10M3 12h18"/>',
    ctx_gen_image:      '<rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><path d="M21 15l-5-5-4 4-2-2-5 5"/>',
    ctx_gen_vector:     '<path d="M7 8l-4 4 4 4M17 8l4 4-4 4M14 4l-4 16"/>',
    ctx_loadgrid:       '<path d="M12 3v12M7.5 10.5L12 15l4.5-4.5"/><path d="M4 18h16"/>',
  };


  function makeIconSvg(key) {
    var svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.setAttribute('viewBox', '0 0 24 24');
    svg.setAttribute('fill', 'none');
    svg.setAttribute('stroke', 'currentColor');
    svg.setAttribute('stroke-width', '1.7');
    svg.setAttribute('stroke-linecap', 'round');
    svg.setAttribute('stroke-linejoin', 'round');
    svg.setAttribute('class', 'ctx-icon');
    var content = CTX_ICON_SVG[key];
    if (content) {
      svg.innerHTML = content;
    }
    return svg;
  }


  function _positionAndShowSub(itemEl) {
    var sub = itemEl._ctxSubmenu;
    if (!sub) return;


    sub.style.visibility = 'hidden';
    sub.style.display    = 'block';
    var sw = sub.offsetWidth;
    var sh = sub.offsetHeight;

    var rect = itemEl.getBoundingClientRect();
    var ww   = window.innerWidth;
    var wh   = window.innerHeight;

    var left = rect.right;
    var top  = rect.top - 4;
    if (left + sw > ww) left = Math.max(4, rect.left - sw);
    if (top  + sh > wh) top  = Math.max(4, wh - sh - 4);

    sub.style.left       = left + 'px';
    sub.style.top        = top  + 'px';
    sub.style.visibility = '';
  }

  function openSubmenu(itemEl) {
    _cancelHover();
    _mouseInSub = false;


    if (_activeSubItem && _activeSubItem !== itemEl) {
      _doCloseSubmenu(_activeSubItem);
    }
    _activeSubItem = itemEl;
    itemEl.classList.add('ctx-sub-open');
    _positionAndShowSub(itemEl);
  }


  function buildItemEl(item) {
    if (item.sep) {
      var sep = document.createElement('div');
      sep.className = 'ctx-sep';
      return sep;
    }

    var el = document.createElement('div');
    el.setAttribute('role', 'menuitem');

    var classes = ['ctx-item'];
    if (item.danger)    classes.push('ctx-danger');
    if (item.primary)   classes.push('ctx-primary');
    if (item.submenu)   classes.push('ctx-has-sub');
    if (item.condition) {
      classes.push('ctx-cond');
      el.dataset.ctxCondition = item.condition;
    }
    el.className = classes.join(' ');

    if (item.target) el.dataset.ctxTarget = item.target;
    if (item.mode)   el.dataset.ctxMode   = item.mode;


    el.appendChild(makeIconSvg(item.label_key));


    var label = document.createElement('span');
    label.className = 'ctx-item-label';
    if (item.label_key) label.setAttribute('data-i18n', item.label_key);
    label.textContent = (typeof t === 'function' && item.label_key) ? t(item.label_key) : (item.label || item.label_key || '');
    el.appendChild(label);

    if (item.submenu && item.submenu.length) {

      el.appendChild(makeArrowSvg());

      var sub = document.createElement('div');
      sub.className = 'ctx-submenu';
      item.submenu.forEach(function (child) { sub.appendChild(buildItemEl(child)); });
      document.body.appendChild(sub);
      el._ctxSubmenu = sub;


      el.addEventListener('mouseenter', function () {
        _cancelHover();
        openSubmenu(el);
      });

      el.addEventListener('mouseleave', function () {
        if (_mouseInSub) return;
        _scheduleClose(el);
      });


      sub.addEventListener('mouseenter', function () {
        _mouseInSub = true;
        _cancelHover();
      });
      sub.addEventListener('mouseleave', function () {
        _mouseInSub = false;
      });

    } else {

      el.addEventListener('mouseenter', function () {
        _mouseInSub = false;
        _cancelHover();
      });
    }

    return el;
  }


  function buildSgContextMenu() {
    var ctxMenu = document.getElementById('sg-context-menu');
    if (!ctxMenu) return;


    document.querySelectorAll('.ctx-submenu').forEach(function (s) { s.remove(); });
    ctxMenu.innerHTML = '';

    (window.SG_CTX_MENU_DEF || []).forEach(function (item) {
      ctxMenu.appendChild(buildItemEl(item));
    });


    ctxMenu.addEventListener('mouseleave', function (e) {

      if (e.relatedTarget && e.relatedTarget.closest && e.relatedTarget.closest('.ctx-submenu')) return;
      _mouseInSub = false;
      if (_activeSubItem) _scheduleClose(_activeSubItem);
    });
    ctxMenu.addEventListener('mouseenter', function () {
      _cancelHover();
    });
  }
  window.buildSgContextMenu = buildSgContextMenu;


  function hideCtxMenu() {
    var ctxMenu = document.getElementById('sg-context-menu');
    if (!ctxMenu) return;
    _cancelHover();
    _mouseInSub = false;
    if (_activeSubItem) _doCloseSubmenu(_activeSubItem);
    ctxMenu.style.display = 'none';
    document.removeEventListener('mousedown', onDocMouseDown, true);
    document.removeEventListener('keydown',   onDocKeyDown,   true);
    document.removeEventListener('scroll',    hideCtxMenu,    true);
  }

  function onDocMouseDown(e) {
    var ctxMenu = document.getElementById('sg-context-menu');
    var inMenu  = ctxMenu && ctxMenu.contains(e.target);
    var inSub   = !!e.target.closest('.ctx-submenu');
    if (!inMenu && !inSub) hideCtxMenu();
  }
  function onDocKeyDown(e) { if (e.key === 'Escape') hideCtxMenu(); }


  window.showSgContextMenu = function (x, y) {
    var ctxMenu = document.getElementById('sg-context-menu');
    if (!ctxMenu) return;


    ctxMenu.querySelectorAll('[data-ctx-target]').forEach(function (item) {
      var btn = document.getElementById(item.dataset.ctxTarget);
      item.classList.toggle('ctx-disabled', !!(btn && btn.disabled));
    });

    ctxMenu.querySelectorAll('.ctx-cond').forEach(function (item) {
      var cond = item.dataset.ctxCondition;
      var vis  = true;
      if (cond === 'merge-visible') {
        var sec = document.getElementById('p-sec-merge');
        vis = !!(sec && !sec.classList.contains('hidden'));
      } else if (cond === 'loadgrid-active') {
        var btn = document.getElementById('p-loadgrid');
        vis = !!(btn && btn.classList.contains('xgrid-active'));
      }
      item.style.display = vis ? '' : 'none';
    });


    ctxMenu.style.left = '0px';
    ctxMenu.style.top  = '0px';
    ctxMenu.style.display = 'block';
    var mw = ctxMenu.offsetWidth, mh = ctxMenu.offsetHeight;
    var ww = window.innerWidth,   wh = window.innerHeight;
    ctxMenu.style.left = Math.min(x, ww - mw - 4) + 'px';
    ctxMenu.style.top  = Math.min(y, wh - mh - 4) + 'px';

    setTimeout(function () {
      document.addEventListener('mousedown', onDocMouseDown, true);
      document.addEventListener('keydown',   onDocKeyDown,   true);
      document.addEventListener('scroll',    hideCtxMenu,    true);
    }, 0);
  };


  document.addEventListener('click', function (e) {
    var item = e.target.closest('.ctx-item');
    if (!item) return;
    if (item.classList.contains('ctx-disabled')) return;
    if (item.classList.contains('ctx-has-sub')) return;

    var ctxMenu = document.getElementById('sg-context-menu');
    var inMenu  = ctxMenu && ctxMenu.contains(item);
    var inSub   = !!item.closest('.ctx-submenu');
    if (!inMenu && !inSub) return;

    hideCtxMenu();

    var targetId = item.dataset.ctxTarget;
    var mode     = item.dataset.ctxMode;

    if (targetId) {
      var btn = document.getElementById(targetId);
      if (btn && !btn.disabled) btn.click();
    } else if (mode) {
      var modeBtn = document.querySelector('#p-creategrid-mode [data-mode="' + mode + '"]');
      if (modeBtn) modeBtn.click();
      setTimeout(function () {
        var genBtn = document.getElementById('p-creategrid');
        if (genBtn) genBtn.click();
      }, 50);
    }
  });


  setTimeout(buildSgContextMenu, 0);
}());
