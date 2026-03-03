export function renderTemplate(
  body: string,
  fieldValues: Record<string, unknown>,
  settings: Record<string, string>
): string {
  let result = body;

  // [[IF field.KEY]] ... [[END]]
  const ifRegex = /\[\[IF\s+field\.(\w+)\]\]([\s\S]*?)\[\[END\]\]/g;
  result = result.replace(ifRegex, (_, key, content) => {
    const value = fieldValues[key];
    const isPresent =
      value !== undefined &&
      value !== null &&
      value !== '' &&
      value !== false &&
      !(Array.isArray(value) && value.length === 0);
    return isPresent ? content : '';
  });

  // [[IF settings.KEY]] ... [[END]]
  const ifSettingsRegex = /\[\[IF\s+settings\.(\w+)\]\]([\s\S]*?)\[\[END\]\]/g;
  result = result.replace(ifSettingsRegex, (_, key, content) => {
    const value = settings[key];
    return value ? content : '';
  });

  // {{field.KEY}}
  result = result.replace(/\{\{field\.(\w+)\}\}/g, (_, key) => {
    const value = fieldValues[key];
    if (value === undefined || value === null) return '';
    if (Array.isArray(value)) return value.join(', ');
    if (typeof value === 'object') {
      return renderTableAsText(value as TableRow[]);
    }
    return String(value);
  });

  // {{settings.KEY}}
  result = result.replace(/\{\{settings\.(\w+)\}\}/g, (_, key) => {
    return settings[key] ?? '';
  });

  return result;
}

interface TableRow {
  [key: string]: string;
}

function renderTableAsText(rows: TableRow[]): string {
  if (!rows || rows.length === 0) return '(aucune entrée)';
  return rows
    .map((row, i) => {
      const cells = Object.entries(row)
        .map(([k, v]) => `${k}: ${v}`)
        .join(' | ');
      return `  ${i + 1}. ${cells}`;
    })
    .join('\n');
}

export function renderTableAsHtml(
  rows: TableRow[],
  columns: { key: string; label: string }[]
): string {
  if (!rows || rows.length === 0) return '<em>(aucune entrée)</em>';

  const header = columns
    .map(
      c =>
        `<th style="border:1px solid #ccc;padding:6px 10px;background:#f0f0f0;text-align:left;">${c.label}</th>`
    )
    .join('');

  const bodyRows = rows
    .map(row => {
      const cells = columns
        .map(
          c =>
            `<td style="border:1px solid #ccc;padding:6px 10px;">${row[c.key] ?? ''}</td>`
        )
        .join('');
      return `<tr>${cells}</tr>`;
    })
    .join('');

  return `<table style="border-collapse:collapse;width:100%;margin:8px 0;">
    <thead><tr>${header}</tr></thead>
    <tbody>${bodyRows}</tbody>
  </table>`;
}