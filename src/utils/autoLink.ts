export function escapeHtml(s: string) {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

export function toLinkedHtml(raw: string) {
  const text = escapeHtml(raw);

  const httpLinked = text.replace(
    /\bhttps?:\/\/[^\s<]+/gi,
    (url) => `<a href="${url}" target="_blank" rel="noopener noreferrer">${url}</a>`
  );

  const wwwLinked = httpLinked.replace(
    /(^|[\s(])www\.[^\s<]+/gi,
    (m, p1) => `${p1}<a href="http://${m.trim()}" target="_blank" rel="noopener noreferrer">${m.trim()}</a>`
  );

  const emailLinked = wwwLinked.replace(
    /\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/gi,
    (mail) => `<a href="mailto:${mail}">${mail}</a>`
  );

  return emailLinked.replace(/\n/g, "<br/>");
}
