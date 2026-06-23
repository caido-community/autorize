export function resolvePort(hostHeader: string, tls: boolean): number {
  const defaultPort = tls ? 443 : 80;
  const host = hostHeader.trim();

  const bracketEnd = host.lastIndexOf("]");
  if (bracketEnd === -1 && (host.match(/:/g)?.length ?? 0) > 1) {
    return defaultPort;
  }

  const tail = bracketEnd === -1 ? host : host.slice(bracketEnd + 1);
  const colon = tail.lastIndexOf(":");
  if (colon === -1) return defaultPort;

  const portText = tail.slice(colon + 1);
  if (!/^\d+$/.test(portText)) return defaultPort;

  const port = Number(portText);
  if (port < 1 || port > 65535) return defaultPort;
  return port;
}
