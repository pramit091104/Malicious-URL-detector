/**
 * Feature extraction module for URL analysis.
 */

export interface UrlFeatures {
  urlLength: number;
  dotCount: number;
  subdomainCount: number;
  hasIpAddress: number; // 1 or 0
  isHttps: number; // 1 or 0
  suspiciousKeywordCount: number;
  specialCharCount: number;
  hyphenCount: number;
  domainLength: number;
  redirectCount: number; // Simulated or based on URL structure
}

const SUSPICIOUS_KEYWORDS = [
  'login', 'secure', 'verify', 'update', 'account', 'banking', 'signin',
  'confirm', 'password', 'credential', 'paypal', 'ebay', 'amazon', 'netflix'
];

export function extractFeatures(urlString: string): UrlFeatures {
  let url: URL;
  try {
    url = new URL(urlString);
  } catch (e) {
    // If it's not a full URL, try prepending http://
    try {
      url = new URL('http://' + urlString);
    } catch (e2) {
      // Fallback for extremely malformed strings
      return {
        urlLength: urlString.length,
        dotCount: (urlString.match(/\./g) || []).length,
        subdomainCount: 0,
        hasIpAddress: 0,
        isHttps: 0,
        suspiciousKeywordCount: 0,
        specialCharCount: (urlString.match(/[@%&=?#]/g) || []).length,
        hyphenCount: (urlString.match(/-/g) || []).length,
        domainLength: 0,
        redirectCount: 0
      };
    }
  }

  const hostname = url.hostname;
  const path = url.pathname;
  const search = url.search;

  // 1. URL Length
  const urlLength = urlString.length;

  // 2. Number of dots
  const dotCount = (urlString.match(/\./g) || []).length;

  // 3. Number of subdomains
  const domainParts = hostname.split('.');
  const subdomainCount = Math.max(0, domainParts.length - 2);

  // 4. Presence of IP address
  const ipRegex = /^(?:[0-9]{1,3}\.){3}[0-9]{1,3}$/;
  const hasIpAddress = ipRegex.test(hostname) ? 1 : 0;

  // 5. HTTPS usage
  const isHttps = url.protocol === 'https:' ? 1 : 0;

  // 6. Suspicious keywords
  let suspiciousKeywordCount = 0;
  const lowerUrl = urlString.toLowerCase();
  SUSPICIOUS_KEYWORDS.forEach(keyword => {
    if (lowerUrl.includes(keyword)) {
      suspiciousKeywordCount++;
    }
  });

  // 7. Special characters
  const specialCharCount = (urlString.match(/[@%&=?#]/g) || []).length;

  // 8. Hyphen count
  const hyphenCount = (urlString.match(/-/g) || []).length;

  // 9. Domain length
  const domainLength = hostname.length;

  // 10. Redirect count (In a real system, this would involve following redirects, 
  // but for feature extraction from a string, we look for common redirect patterns like // or multiple http)
  const redirectCount = (urlString.match(/\/\//g) || []).length - 1;

  return {
    urlLength,
    dotCount,
    subdomainCount,
    hasIpAddress,
    isHttps,
    suspiciousKeywordCount,
    specialCharCount,
    hyphenCount,
    domainLength,
    redirectCount
  };
}

export function featuresToArray(features: UrlFeatures): number[] {
  return [
    features.urlLength,
    features.dotCount,
    features.subdomainCount,
    features.hasIpAddress,
    features.isHttps,
    features.suspiciousKeywordCount,
    features.specialCharCount,
    features.hyphenCount,
    features.domainLength,
    features.redirectCount
  ];
}
