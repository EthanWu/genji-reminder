export function isAllowedEmail(email: string, allowedEmails: string | undefined): boolean {
  return !!allowedEmails?.split(',').some(allowed => !!allowed.trim() && allowed.trim().toLowerCase() === email.trim().toLowerCase());
}

export function accessStatus(identity: {email: string; verified: boolean} | null, allowedEmail: string | undefined): number {
  if (!identity) return 401;
  if (!identity.verified || !isAllowedEmail(identity.email, allowedEmail)) return 403;
  return 200;
}

export function sameOrigin(req: Request): boolean {
  return req.headers.get('origin') === new URL(req.url).origin;
}
