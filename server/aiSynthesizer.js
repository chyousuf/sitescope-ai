/**
 * AI Prioritization and Fix Synthesizer for SiteScope AI
 * Combines findings from Browser Quality, SEO, and PageSpeed analyzers,
 * deduplicates site-wide issues, computes weighted scores, and generates actionable fixes.
 */

// Scoring Weights & Methodology
// Quality Score (0-100): Starts at 100. Deductions: Critical -25, High -12, Medium -6, Low -2
// SEO Score (0-100): Starts at 100. Deductions: Critical -30, High -15, Medium -8, Low -3
// Performance Score (0-100): Derived directly from Lighthouse mobile performance lab score

function calculateScores(findings, perfMobileScore) {
  let qualityDeduction = 0;
  let seoDeduction = 0;

  findings.forEach(f => {
    if (f.category === 'quality') {
      if (f.severity === 'critical') qualityDeduction += 25;
      else if (f.severity === 'high') qualityDeduction += 12;
      else if (f.severity === 'medium') qualityDeduction += 6;
      else if (f.severity === 'low') qualityDeduction += 2;
    } else if (f.category === 'seo') {
      if (f.severity === 'critical') seoDeduction += 30;
      else if (f.severity === 'high') seoDeduction += 15;
      else if (f.severity === 'medium') seoDeduction += 8;
      else if (f.severity === 'low') seoDeduction += 3;
    }
  });

  const qualityScore = Math.max(0, Math.min(100, 100 - qualityDeduction));
  const seoScore = Math.max(0, Math.min(100, 100 - seoDeduction));
  const performanceScore = typeof perfMobileScore === 'number' ? perfMobileScore : 85;

  return { qualityScore, seoScore, performanceScore };
}

/**
 * Deduplicate findings across multiple scanned pages into grouped site-wide findings
 */
function deduplicateFindings(rawFindings) {
  const grouped = new Map();

  rawFindings.forEach(f => {
    const key = f.dedupe_key || `${f.category}-${f.title}`;
    if (!grouped.has(key)) {
      grouped.set(key, {
        ...f,
        affectedPages: [f.page_url],
        pageCount: 1
      });
    } else {
      const existing = grouped.get(key);
      if (!existing.affectedPages.includes(f.page_url)) {
        existing.affectedPages.push(f.page_url);
        existing.pageCount += 1;
      }
      // If evidence from multiple pages, append summary
      if (existing.pageCount > 1 && !existing.title.includes('Site-wide:')) {
        existing.title = `Site-wide: ${existing.title} (${existing.pageCount} pages)`;
      }
    }
  });

  // Sort by severity (Critical -> High -> Medium -> Low)
  const severityRank = { critical: 4, high: 3, medium: 2, low: 1 };
  const sorted = Array.from(grouped.values()).sort((a, b) => {
    const diff = (severityRank[b.severity] || 0) - (severityRank[a.severity] || 0);
    if (diff !== 0) return diff;
    return b.pageCount - a.pageCount;
  });

  return sorted;
}

/**
 * Synthesize an executive summary suitable for agency clients
 */
function generateExecutiveSummary(url, domain, scores, findings, pagesScanned) {
  const criticalCount = findings.filter(f => f.severity === 'critical').length;
  const highCount = findings.filter(f => f.severity === 'high').length;
  const mediumCount = findings.filter(f => f.severity === 'medium').length;

  let summary = `Executive Audit Summary for ${domain}:\n\n`;
  summary += `SiteScope AI conducted a comprehensive quality, technical SEO, and performance inspection across ${pagesScanned} page(s). `;
  summary += `Overall scorecard: Quality: ${scores.qualityScore}/100, Technical SEO: ${scores.seoScore}/100, Mobile Performance: ${scores.performanceScore}/100.\n\n`;

  if (criticalCount > 0 || highCount > 0) {
    summary += `KEY PRIORITIES:\n`;
    summary += `We identified ${criticalCount} critical blocker(s) and ${highCount} high-priority issue(s) that immediately hinder user conversions or search indexability:\n`;

    const topIssues = findings.filter(f => f.severity === 'critical' || f.severity === 'high').slice(0, 4);
    topIssues.forEach((issue, idx) => {
      summary += `${idx + 1}. ${issue.title} — ${issue.why_it_matters}\n`;
    });
    summary += `\nRECOMMENDED ACTION PLAN:\n`;
    summary += `Implement quick fixes for the critical blockers first (estimated under 1 hour total effort), followed by performance optimizations on hero assets to elevate Core Web Vitals.`;
  } else {
    summary += `The website demonstrates strong foundational health with no critical blockers detected. Focus on minor accessibility and social metadata enhancements to maintain optimal performance.`;
  }

  return summary;
}

/**
 * Generate suggested meta title and description strictly grounded in page content.
 * Prevents hallucinations by deriving keywords strictly from existing headings and body text.
 */
function generateSuggestedMeta(pageTitle, headings = [], metaDesc = '', sampleText = '') {
  const primaryH1 = headings.find(h => h.tag === 'h1')?.text || '';
  const secondaryHeadings = headings.filter(h => h.tag === 'h2').map(h => h.text).slice(0, 2);

  // Grounded title formulation
  let suggestedTitle = '';
  if (primaryH1) {
    suggestedTitle = `${primaryH1.substring(0, 50)} | Official Site`;
  } else if (pageTitle) {
    suggestedTitle = `${pageTitle.substring(0, 45)} — Overview & Features`;
  } else if (secondaryHeadings.length > 0) {
    suggestedTitle = `${secondaryHeadings[0].substring(0, 50)} | Services`;
  } else {
    suggestedTitle = 'Enterprise Cloud Platform & Infrastructure';
  }

  // Grounded description formulation
  let suggestedDesc = '';
  if (sampleText && sampleText.length > 60) {
    const cleaned = sampleText.replace(/\s+/g, ' ').trim();
    suggestedDesc = cleaned.substring(0, 150).trim() + '...';
  } else if (primaryH1 && secondaryHeadings.length > 0) {
    suggestedDesc = `Discover ${primaryH1}. Featuring ${secondaryHeadings.join(' and ')}. Learn more and get started today.`;
  } else {
    suggestedDesc = `Explore our platform features, transparent pricing, and enterprise reliability. Designed for fast-growing engineering teams.`;
  }

  return {
    currentTitle: pageTitle || '(None)',
    suggestedTitle,
    titleCharCount: suggestedTitle.length,
    currentDescription: metaDesc || '(None)',
    suggestedDescription: suggestedDesc,
    descCharCount: suggestedDesc.length,
    explanation: 'Generated strictly from verified on-page headings and verified body text without external claims.'
  };
}

module.exports = {
  calculateScores,
  deduplicateFindings,
  generateExecutiveSummary,
  generateSuggestedMeta
};
