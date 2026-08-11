'use strict';

const App = {
  template: null,
  templateName: '',
  batchRows: [],

  init() {
    this.setupTemplateUpload();
    this.setupTabs();
    this.setupForm();
    this.setupCompensationCalc();
    this.setupBatchMode();
    this.setDefaultDate();
  },

  // ─── Template Upload ────────────────────────────────────────────────────────

  setupTemplateUpload() {
    const dropZone = document.getElementById('drop-zone');
    const fileInput = document.getElementById('template-input');

    dropZone.addEventListener('dragover', e => {
      e.preventDefault();
      dropZone.classList.add('drag-over');
    });
    dropZone.addEventListener('dragleave', () => dropZone.classList.remove('drag-over'));
    dropZone.addEventListener('drop', e => {
      e.preventDefault();
      dropZone.classList.remove('drag-over');
      const file = e.dataTransfer.files[0];
      if (file) this.handleTemplateFile(file);
    });
    dropZone.addEventListener('click', () => fileInput.click());

    fileInput.addEventListener('change', e => {
      const file = e.target.files[0];
      if (file) this.handleTemplateFile(file);
    });

    document.getElementById('change-template').addEventListener('click', e => {
      e.stopPropagation();
      this.clearTemplate();
    });
  },

  handleTemplateFile(file) {
    if (!file.name.toLowerCase().endsWith('.docx')) {
      this.showError('Please upload a .docx Word document.');
      return;
    }
    const reader = new FileReader();
    reader.onload = e => {
      this.template = e.target.result;
      this.templateName = file.name;
      document.getElementById('template-name').textContent = file.name;
      document.getElementById('template-status').hidden = false;
      document.getElementById('drop-zone').hidden = true;
      this.hideError();
      this.updateGenerateBtn();

      // Auto-suggest output filename from template name (strip .docx)
      const outputField = document.getElementById('output_filename');
      if (!outputField.value) {
        outputField.value = file.name.replace(/\.docx$/i, '');
      }
    };
    reader.readAsArrayBuffer(file);
  },

  clearTemplate() {
    this.template = null;
    this.templateName = '';
    document.getElementById('template-status').hidden = true;
    document.getElementById('drop-zone').hidden = false;
    document.getElementById('template-input').value = '';
    this.updateGenerateBtn();
  },

  // ─── Tabs ───────────────────────────────────────────────────────────────────

  setupTabs() {
    document.querySelectorAll('.tab').forEach(tab => {
      tab.addEventListener('click', () => {
        document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
        tab.classList.add('active');
        const target = tab.dataset.tab;
        document.getElementById('tab-single').hidden = target !== 'single';
        document.getElementById('tab-batch').hidden = target !== 'batch';
      });
    });
  },

  // ─── Single Agreement Form ──────────────────────────────────────────────────

  setupForm() {
    document.getElementById('generate-btn').addEventListener('click', () => this.generateSingle());

    // Auto-build output filename from artist + record
    const autoFilename = () => {
      const artist = document.getElementById('artist_name').value.trim();
      const record = document.getElementById('record_name').value.trim();
      if (artist && record) {
        document.getElementById('output_filename').value = `${artist} - ${record} - VPA (Loan Out)`;
      }
    };
    document.getElementById('artist_name').addEventListener('input', autoFilename);
    document.getElementById('record_name').addEventListener('input', autoFilename);
  },

  setDefaultDate() {
    const today = new Date();
    document.getElementById('agreement_date').value = today.toLocaleDateString('en-US', {
      year: 'numeric', month: 'long', day: 'numeric',
    });
  },

  updateGenerateBtn() {
    document.getElementById('generate-btn').disabled = !this.template;
  },

  collectFormData() {
    const filmingStart = document.getElementById('filming_start').value;
    const filmingEnd   = document.getElementById('filming_end').value;
    const total        = parseFloat(document.getElementById('total_compensation').value) || 0;
    const splitPct     = parseInt(document.getElementById('split_ratio').value, 10) || 75;
    const frontEndAmt  = this.round2(total * splitPct / 100);
    const balanceAmt   = this.round2(total - frontEndAmt);

    let filmingDates = '';
    if (filmingStart && filmingEnd) {
      filmingDates = `${this.fmtSlash(filmingStart)} – ${this.fmtSlash(filmingEnd)}`;
    } else if (filmingStart) {
      filmingDates = this.fmtSlash(filmingStart);
    }

    return {
      agreement_date:      document.getElementById('agreement_date').value,
      company_name:        document.getElementById('company_name').value,
      producer_name:       document.getElementById('producer_name').value,
      director_name:       document.getElementById('director_name').value,
      artist_name:         document.getElementById('artist_name').value,
      record_name:         document.getElementById('record_name').value,
      filming_dates:       filmingDates,
      rough_cut_date:      this.fmtSlash(document.getElementById('rough_cut_date').value),
      final_cut_date:      this.fmtSlash(document.getElementById('final_cut_date').value),
      compensation_words:  this.toLegalWords(total),
      compensation_dollars: this.fmtDollars(total),
      front_end_words:     this.toLegalWords(frontEndAmt),
      front_end_dollars:   this.fmtDollars(frontEndAmt),
      balance_words:       this.toLegalWords(balanceAmt),
      balance_dollars:     this.fmtDollars(balanceAmt),
    };
  },

  // ─── Compensation Calculator ────────────────────────────────────────────────

  setupCompensationCalc() {
    const update = () => {
      const total    = parseFloat(document.getElementById('total_compensation').value) || 0;
      const splitPct = parseInt(document.getElementById('split_ratio').value, 10) || 75;
      const frontEnd = this.round2(total * splitPct / 100);
      const balance  = this.round2(total - frontEnd);

      document.getElementById('front-end-display').textContent =
        total > 0 ? `${splitPct}% → ${this.fmtDollars(frontEnd)}` : '—';
      document.getElementById('balance-display').textContent =
        total > 0 ? `${100 - splitPct}% → ${this.fmtDollars(balance)}` : '—';
    };
    document.getElementById('total_compensation').addEventListener('input', update);
    document.getElementById('split_ratio').addEventListener('change', update);
  },

  // ─── Document Generation ────────────────────────────────────────────────────

  generateSingle() {
    if (!this.template) {
      this.showError('Please upload a Word template first.');
      return;
    }
    const data     = this.collectFormData();
    const filename = (document.getElementById('output_filename').value.trim() || 'Agreement') + '.docx';

    try {
      const result = this.fillTemplate(this.template, data);
      this.downloadDocx(result, filename);
      this.hideError();
    } catch (err) {
      const msg = this.extractDocxError(err);
      this.showError(msg);
      console.error(err);
    }
  },

  fillTemplate(arrayBuffer, data) {
    const zip = new PizZip(arrayBuffer);
    const doc = new docxtemplater(zip, {
      paragraphLoop: true,
      linebreaks: true,
      nullGetter: () => '',
    });
    doc.render(data);
    return doc.getZip().generate({
      type: 'arraybuffer',
      mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    });
  },

  downloadDocx(buffer, filename) {
    const blob = new Blob([buffer], {
      type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    });
    saveAs(blob, filename);
  },

  extractDocxError(err) {
    // docxtemplater wraps errors; surface the most useful message
    if (err && err.properties && err.properties.errors) {
      return err.properties.errors
        .map(e => e.properties && e.properties.explanation ? e.properties.explanation : e.message)
        .join('\n');
    }
    return err && err.message ? err.message : String(err);
  },

  // ─── Batch Mode ─────────────────────────────────────────────────────────────

  setupBatchMode() {
    const csvDropZone = document.getElementById('csv-drop-zone');
    const csvInput    = document.getElementById('csv-input');

    csvDropZone.addEventListener('dragover', e => { e.preventDefault(); csvDropZone.classList.add('drag-over'); });
    csvDropZone.addEventListener('dragleave', () => csvDropZone.classList.remove('drag-over'));
    csvDropZone.addEventListener('drop', e => {
      e.preventDefault();
      csvDropZone.classList.remove('drag-over');
      const file = e.dataTransfer.files[0];
      if (file) this.handleCSVFile(file);
    });
    csvDropZone.addEventListener('click', () => csvInput.click());

    csvInput.addEventListener('change', e => {
      const file = e.target.files[0];
      if (file) this.handleCSVFile(file);
    });

    document.getElementById('download-csv-template').addEventListener('click', () => this.downloadCSVTemplate());
    document.getElementById('batch-generate-btn').addEventListener('click', () => this.generateBatch());
    document.getElementById('clear-batch').addEventListener('click', () => {
      this.batchRows = [];
      document.getElementById('batch-preview').hidden = true;
      csvInput.value = '';
    });
  },

  handleCSVFile(file) {
    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: result => {
        this.batchRows = result.data;
        this.renderBatchPreview(result.data, result.meta.fields);
      },
      error: err => this.showBatchError('Error parsing CSV: ' + err.message),
    });
  },

  renderBatchPreview(rows, fields) {
    document.getElementById('batch-count').textContent = rows.length;

    const visibleFields = (fields || []).slice(0, 8); // cap columns shown
    document.getElementById('batch-thead').innerHTML =
      '<tr>' + visibleFields.map(f => `<th>${f}</th>`).join('') + (fields.length > 8 ? '<th>…</th>' : '') + '</tr>';

    document.getElementById('batch-tbody').innerHTML = rows.map(row =>
      '<tr>' + visibleFields.map(f => `<td>${row[f] || ''}</td>`).join('') + '</tr>'
    ).join('');

    document.getElementById('batch-preview').hidden = false;
  },

  async generateBatch() {
    if (!this.template) {
      this.showBatchError('Please upload a Word template first (Step 1).');
      return;
    }
    if (!this.batchRows.length) return;

    const zip    = new JSZip();
    const errors = [];

    for (const row of this.batchRows) {
      try {
        const data     = this.rowToData(row);
        const buffer   = this.fillTemplate(this.template, data);
        const filename = (
          row.output_filename ||
          [row.artist_name, row.record_name].filter(Boolean).join(' - ') ||
          'Agreement'
        ).trim() + '.docx';
        zip.file(filename, buffer);
      } catch (err) {
        const label = row.record_name || row.artist_name || '?';
        errors.push(`"${label}": ${this.extractDocxError(err)}`);
      }
    }

    if (errors.length) {
      this.showBatchError('Some rows had errors:\n' + errors.join('\n'));
    } else {
      this.hideBatchError();
    }

    const content = await zip.generateAsync({ type: 'blob' });
    saveAs(content, 'Agreements.zip');
  },

  rowToData(row) {
    const total       = parseFloat(row.total_compensation) || 0;
    const splitPct    = parseInt(row.split_ratio, 10) || 75;
    const frontEndAmt = this.round2(total * splitPct / 100);
    const balanceAmt  = this.round2(total - frontEndAmt);

    const start = (row.filming_start || '').trim();
    const end   = (row.filming_end || '').trim();
    const filmingDates = start && end ? `${start} – ${end}` : start || '';

    return {
      agreement_date:      row.agreement_date || '',
      company_name:        row.company_name || '',
      producer_name:       row.producer_name || '',
      director_name:       row.director_name || '',
      artist_name:         row.artist_name || '',
      record_name:         row.record_name || '',
      filming_dates:       filmingDates,
      rough_cut_date:      row.rough_cut_date || '',
      final_cut_date:      row.final_cut_date || '',
      compensation_words:  this.toLegalWords(total),
      compensation_dollars: this.fmtDollars(total),
      front_end_words:     this.toLegalWords(frontEndAmt),
      front_end_dollars:   this.fmtDollars(frontEndAmt),
      balance_words:       this.toLegalWords(balanceAmt),
      balance_dollars:     this.fmtDollars(balanceAmt),
    };
  },

  downloadCSVTemplate() {
    const headers = [
      'output_filename', 'agreement_date', 'company_name',
      'producer_name', 'director_name', 'artist_name', 'record_name',
      'filming_start', 'filming_end', 'rough_cut_date', 'final_cut_date',
      'total_compensation', 'split_ratio',
    ];
    const example = [
      'Friday - Haiku - VPA (Loan Out)', 'August 11, 2026', 'Fridayy Entertainment LLC',
      'Jamila Gimba', 'Jyde Ajala', 'Fridayy', 'Haiku',
      '08/18/2026', '08/20/2026', '08/26/2026', '09/04/2026',
      '65929.60', '75',
    ];
    const csv  = [headers.join(','), example.join(',')].join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    saveAs(blob, 'batch-template.csv');
  },

  // ─── Number Formatting ───────────────────────────────────────────────────────

  fmtDollars(n) {
    return '$' + n.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  },

  // ISO date (yyyy-mm-dd) → MM/DD/YYYY
  fmtSlash(iso) {
    if (!iso) return '';
    const parts = iso.split('-');
    if (parts.length !== 3) return iso; // already formatted or empty
    return `${parts[1]}/${parts[2]}/${parts[0]}`;
  },

  round2(n) {
    return Math.round(n * 100) / 100;
  },

  // "$65,929.60" → "Sixty-Five Thousand Nine Hundred Twenty-Nine and 60/100 US Dollars"
  toLegalWords(amount) {
    const dollars = Math.floor(amount);
    const cents   = Math.round((amount - dollars) * 100);
    return `${this.intToWords(dollars)} and ${String(cents).padStart(2, '0')}/100 US Dollars`;
  },

  intToWords(n) {
    if (n === 0) return 'Zero';

    const ones = [
      '', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine',
      'Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen',
      'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen',
    ];
    const tensWords = [
      '', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety',
    ];

    const chunk = v => {
      if (v === 0) return '';
      let r = '';
      if (v >= 100) {
        r += ones[Math.floor(v / 100)] + ' Hundred';
        v %= 100;
        if (v) r += ' ';
      }
      if (v >= 20) {
        r += tensWords[Math.floor(v / 10)];
        if (v % 10) r += '-' + ones[v % 10];
      } else if (v > 0) {
        r += ones[v];
      }
      return r;
    };

    let result = '';
    if (n >= 1000000) { result += chunk(Math.floor(n / 1000000)) + ' Million '; n %= 1000000; }
    if (n >= 1000)    { result += chunk(Math.floor(n / 1000))    + ' Thousand '; n %= 1000; }
    result += chunk(n);
    return result.trim();
  },

  // ─── Error Helpers ───────────────────────────────────────────────────────────

  showError(msg) {
    const el = document.getElementById('error-msg');
    el.textContent = msg;
    el.hidden = false;
  },
  hideError() {
    document.getElementById('error-msg').hidden = true;
  },
  showBatchError(msg) {
    const el = document.getElementById('batch-error-msg');
    el.textContent = msg;
    el.hidden = false;
  },
  hideBatchError() {
    document.getElementById('batch-error-msg').hidden = true;
  },
};

document.addEventListener('DOMContentLoaded', () => App.init());
