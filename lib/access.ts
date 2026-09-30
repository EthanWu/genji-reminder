export function accessStatus(identity: {email: string; verified: boolean} | null, allowedEmail: string | undefined): number {
  if (!identity) return 401;
  if (!allowedEmail || !identity.verified || identity.email.toLowerCase() !== allowedEmail.trim().toLowerCase()) return 403;
  return 200;
}

export function sameOrigin(req: Request): boolean {
  return req.headers.get('origin') === new URL(req.url).origin;
}
