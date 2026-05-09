/**
 * Shared HTML wrapper used by every transactional email.
 * Keeps brand consistent and ensures email clients render predictably.
 */

export function wrap({ title, body, lang = 'ru' }) {
  const t = {
    ru: {
      footer: '© 2026 Gardina. Все права защищены.',
      footerNote: 'Это автоматическое письмо, отвечать на него не нужно.',
      address: 'Алматы, Казахстан',
    },
    kz: {
      footer: '© 2026 Gardina. Барлық құқықтар қорғалған.',
      footerNote: 'Бұл — автоматты хат, жауап беру қажет емес.',
      address: 'Алматы, Қазақстан',
    },
  }[lang === 'kz' ? 'kz' : 'ru'];

  return `<!doctype html>
<html lang="${lang === 'kz' ? 'kk' : 'ru'}">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width">
<title>${escape(title)}</title>
</head>
<body style="margin:0;padding:0;background:#f1f6f3;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;color:#101916">
  <table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0" style="background:#f1f6f3">
    <tr>
      <td align="center" style="padding:32px 16px">
        <table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0" style="max-width:560px;background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 4px 12px -2px rgba(27,94,69,0.1)">
          <!-- Brand bar -->
          <tr>
            <td style="background:linear-gradient(90deg,#1b5e45,#2d6a4f,#74c69d);height:4px;line-height:4px;font-size:1px">&nbsp;</td>
          </tr>
          <tr>
            <td style="padding:28px 32px 8px">
              <div style="font-size:20px;font-weight:800;color:#1b5e45;letter-spacing:-0.01em">Gardina</div>
            </td>
          </tr>
          <tr>
            <td style="padding:0 32px 32px">
              ${body}
            </td>
          </tr>
        </table>
        <table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0" style="max-width:560px;margin-top:16px">
          <tr>
            <td align="center" style="padding:8px 16px;font-size:12px;line-height:1.5;color:#4d5c54">
              ${escape(t.footer)}<br>
              ${escape(t.address)}<br>
              <span style="color:#9cb0a4">${escape(t.footerNote)}</span>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

export function btn(href, label) {
  return `<a href="${escape(href)}" style="display:inline-block;padding:14px 28px;background:#1b5e45;color:#ffffff;text-decoration:none;border-radius:12px;font-weight:700;font-size:15px;margin:16px 0">${escape(label)}</a>`;
}

export function escape(s) {
  if (s == null) return '';
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}
