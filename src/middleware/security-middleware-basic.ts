import { NextRequest, NextResponse } from 'next/server';

/**
 * Middleware de sécurité basique pour protection immédiate
 */
export class SecurityMiddleware {
  // Patterns XSS de base
  private static readonly XSS_PATTERNS = [
    /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi,
    /javascript:/gi,
    /on\w+\s*=/gi,
    /<iframe/gi,
    /vbscript:/gi
  ];

  // Patterns SQL Injection de base
  private static readonly SQL_PATTERNS = [
    /(union.*select)|(select.*from)|(insert.*into)|(delete.*from)/gi,
    /(drop.*table)|(create.*table)/gi,
    /(;|--|\bor\b|\band\b)/gi
  ];

  // IPs suspectes blacklistées (exemple)
  private static blacklistedIPs = new Set<string>();

  /**
   * Handler principal de sécurité simplifié
   */
  static async securityHandler(request: NextRequest): Promise<NextResponse | null> {
    try {
      const ip = this.getClientIP(request);
      const url = request.nextUrl.toString();

      // 1. Vérifier blacklist IP
      if (this.blacklistedIPs.has(ip)) {
        console.warn(`🚫 IP blacklistée bloquée: ${ip}`);
        return NextResponse.json({ error: 'Accès refusé' }, { status: 403 });
      }

      // 2. Scanner XSS dans l'URL
      if (this.containsXSS(url)) {
        console.warn(`🚫 Tentative XSS bloquée de ${ip}: ${url}`);
        this.blacklistedIPs.add(ip);
        return NextResponse.json({ error: 'Contenu malveillant détecté' }, { status: 403 });
      }

      // 3. Scanner SQL Injection dans l'URL
      if (this.containsSQLInjection(url)) {
        console.warn(`🚫 Tentative SQL Injection bloquée de ${ip}: ${url}`);
        this.blacklistedIPs.add(ip);
        return NextResponse.json({ error: 'Requête malveillante détectée' }, { status: 403 });
      }

      // 4. Vérifier User-Agent suspect
      const userAgent = request.headers.get('user-agent') || '';
      if (this.isSuspiciousUserAgent(userAgent)) {
        console.warn(`🚫 User-Agent suspect de ${ip}: ${userAgent}`);
        return NextResponse.json({ error: 'Client non autorisé' }, { status: 403 });
      }

      // Requête valide, continuer
      return null;

    } catch (error) {
      console.error('🚨 Erreur SecurityMiddleware:', error);
      // En cas d'erreur, ne pas bloquer
      return null;
    }
  }

  /**
   * Obtenir l'IP client
   */
  private static getClientIP(request: NextRequest): string {
    return request.headers.get('x-forwarded-for')?.split(',')[0] ||
           request.headers.get('x-real-ip') ||
           'unknown';
  }

  /**
   * Détecter XSS
   */
  private static containsXSS(input: string): boolean {
    const decoded = decodeURIComponent(input);
    return this.XSS_PATTERNS.some(pattern => pattern.test(decoded));
  }

  /**
   * Détecter SQL Injection
   */
  private static containsSQLInjection(input: string): boolean {
    const decoded = decodeURIComponent(input).toLowerCase();
    return this.SQL_PATTERNS.some(pattern => pattern.test(decoded));
  }

  /**
   * Détecter User-Agent suspect
   */
  private static isSuspiciousUserAgent(userAgent: string): boolean {
    const suspiciousPatterns = [
      /sqlmap/i,
      /nikto/i,
      /nessus/i,
      /nmap/i,
      /masscan/i,
      /\.\.$/,
      /^$/
    ];
    
    return suspiciousPatterns.some(pattern => pattern.test(userAgent));
  }

  /**
   * Obtenir les statistiques (version simplifiée)
   */
  static getSecurityStats() {
    return {
      blacklistedIPs: this.blacklistedIPs.size,
      blockedRequests: 0,
      totalRequests: 0
    };
  }
}