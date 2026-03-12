const normalizeHeader = value => String(value ?? '').trim().toLowerCase();
const normalizeText = value => String(value ?? '').trim();
const hasOwn = (value, key) => Object.prototype.hasOwnProperty.call(value, key);

const parseBoolean = value => {
  const normalized = normalizeText(value).toLowerCase();
  if (!normalized) return undefined;
  if (['true', '1', 'yes', 'y'].includes(normalized)) return true;
  if (['false', '0', 'no', 'n'].includes(normalized)) return false;
  return undefined;
};

const parseInteger = value => {
  const normalized = normalizeText(value);
  if (!normalized) return null;
  const parsed = Number.parseInt(normalized, 10);
  return Number.isNaN(parsed) ? NaN : parsed;
};

const parseCsvRecords = text => {
  const rows = [];
  let currentRow = [];
  let currentValue = '';
  let inQuotes = false;

  for (let index = 0; index < text.length; index += 1) {
    const char = text[index];
    const nextChar = text[index + 1];

    if (char === '"') {
      if (inQuotes && nextChar === '"') {
        currentValue += '"';
        index += 1;
      } else {
        inQuotes = !inQuotes;
      }
      continue;
    }

    if (char === ',' && !inQuotes) {
      currentRow.push(currentValue);
      currentValue = '';
      continue;
    }

    if ((char === '\n' || char === '\r') && !inQuotes) {
      if (char === '\r' && nextChar === '\n') {
        index += 1;
      }
      currentRow.push(currentValue);
      if (currentRow.some(cell => normalizeText(cell) !== '')) {
        rows.push(currentRow);
      }
      currentRow = [];
      currentValue = '';
      continue;
    }

    currentValue += char;
  }

  currentRow.push(currentValue);
  if (currentRow.some(cell => normalizeText(cell) !== '')) {
    rows.push(currentRow);
  }

  return rows;
};

export const getCategoryImportKey = ({ type, name }) => `${normalizeText(type).toLowerCase()}::${normalizeText(name).toLowerCase()}`;

export const parseCategoryCsvText = text => {
  const records = parseCsvRecords(String(text ?? ''));
  if (records.length === 0) {
    return { rows: [], errors: ['CSV is empty.'] };
  }

  const headers = records[0].map(normalizeHeader);
  const errors = [];
  const rows = [];

  if (!headers.includes('name') || !headers.includes('type')) {
    return { rows: [], errors: ['CSV must include `name` and `type` columns.'] };
  }

  records.slice(1).forEach((record, recordIndex) => {
    const csvRowNumber = recordIndex + 2;
    const raw = headers.reduce((accumulator, header, headerIndex) => {
      if (header) accumulator[header] = record[headerIndex] ?? '';
      return accumulator;
    }, {});

    const name = normalizeText(raw.name);
    const type = normalizeText(raw.type);
    if (!name || !type) {
      errors.push(`Row ${csvRowNumber}: missing required name or type.`);
      return;
    }

    const isActive = parseBoolean(raw.is_active);
    if (hasOwn(raw, 'is_active') && normalizeText(raw.is_active) && isActive === undefined) {
      errors.push(`Row ${csvRowNumber}: invalid is_active value \`${raw.is_active}\`.`);
      return;
    }

    const sortOrder = parseInteger(raw.sort_order);
    if (hasOwn(raw, 'sort_order') && sortOrder !== null && Number.isNaN(sortOrder)) {
      errors.push(`Row ${csvRowNumber}: invalid sort_order value \`${raw.sort_order}\`.`);
      return;
    }

    rows.push({
      csvRowNumber,
      key: getCategoryImportKey({ type, name }),
      data: {
        ...(normalizeText(raw.id) ? { id: normalizeText(raw.id) } : {}),
        type,
        name,
        ...(hasOwn(raw, 'description') ? { description: normalizeText(raw.description) || null } : {}),
        ...(hasOwn(raw, 'icon') ? { icon: normalizeText(raw.icon) || null } : {}),
        ...(hasOwn(raw, 'is_active') && isActive !== undefined ? { is_active: isActive } : {}),
        ...(hasOwn(raw, 'sort_order') ? { sort_order: sortOrder } : {}),
      },
    });
  });

  return { rows, errors };
};

