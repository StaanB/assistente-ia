// src/utils/autoLink.ts
export function escapeHtml(s: string) {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

export function toLinkedHtml(raw: string) {
  const text = escapeHtml(raw);
  const style = 'color:#2563eb;text-decoration:underline;';

  const makeA = (href: string, label?: string) =>
    `<a style="${style}" href="${href}" target="_blank" rel="noopener noreferrer">${label ?? href}</a>`;


  let linked = text.replace(/\bhttps?:\/\/[^\s<]+/gi, (url) => makeA(url));

  linked = linked.replace(/(^|[\s(])www\.[^\s<]+/gi, (m, p1) => {
    const trimmed = m.trim();
    const url = trimmed.startsWith("www.") ? `http://${trimmed}` : trimmed;
    return `${p1}${makeA(url, trimmed)}`;
  });

  linked = linked.replace(
    /\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/gi,
    (mail) => `<a style="${style}" href="mailto:${mail}">${mail}</a>`
  );

  return linked.replace(/\n/g, "<br/>");
}
