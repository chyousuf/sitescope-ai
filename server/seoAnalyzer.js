const cheerio = require('cheerio');
const { URL } = require('url');

/**
 * Analyzes on-page and technical SEO signals from HTML and HTTP headers
 */
function analyzeSEO(html, pageUrl, headers = {}) {
  const $ = cheerio.load(html || '');
  const issues = [];

  // -------------------------------------------------------------
  // 1. PAGE TITLE
  // -------------------------------------------------------------
  const titleText = $('title').first().text().trim();
  const titleIssues = [];
  if (!titleText) {
    issues.push({
      category: 'seo',
      severity: 'high',
      title: 'Missing or Empty Page Title (<title>)',
      description: 'The page lacks a <title> element or the title is empty.',
      why_it_matters: 'The page title is the primary anchor used by search engines to understand page topic and is displayed as the clickable headline in search engine result pages (SERPs).',
      evidence: '<title> tag missing or empty in <head>',
      suggested_fix: 'Add a concise, descriptive <title> tag (50–60 characters) summarizing the core page topic.',
      effort: 'Quick Fix (<15m)',
      verification_steps: 'Inspect the <head> element and verify <title> contains 50–60 descriptive characters.',
      dedupe_key: 'missing-page-title'
    });
  } else {
    if (titleText.length < 20) {
      titleIssues.push(`Short title (${titleText.length} chars). Consider adding primary keyword and brand name.`);
    } else if (titleText.length > 70) {
      titleIssues.push(`Long title (${titleText.length} chars). Titles over 65 chars may be truncated in Google search snippets.`);
    }
  }

  // -------------------------------------------------------------
  // 2. META DESCRIPTION
  // -------------------------------------------------------------
  const metaDesc = $('meta[name="description" i]').attr('content')?.trim() || '';
  const metaDescIssues = [];
  if (!metaDesc) {
    issues.push({
      category: 'seo',
      severity: 'medium',
      title: 'Missing Meta Description',
      description: 'The page does not define a <meta name="description"> tag.',
      why_it_matters: 'Meta descriptions serve as the ad copy snippet in search results. A compelling summary drives higher click-through rates (CTR) from organic search.',
      evidence: '<meta name="description"> not found in <head>',
      suggested_fix: 'Add a 120–160 character meta description summarizing the value proposition of this page.',
      effort: 'Quick Fix (<15m)',
      verification_steps: 'Inspect <head> and confirm meta description is present with 120–160 characters.',
      dedupe_key: 'missing-meta-description'
    });
  } else {
    if (metaDesc.length < 50) {
      metaDescIssues.push(`Short description (${metaDesc.length} chars). 120–160 chars recommended for optimal SERP snippets.`);
    } else if (metaDesc.length > 170) {
      metaDescIssues.push(`Long description (${metaDesc.length} chars). May be truncated on mobile SERP displays.`);
    }
  }

  // -------------------------------------------------------------
  // 3. HEADING HIERARCHY (H1 - H6)
  // -------------------------------------------------------------
  const headings = [];
  const h1Elements = $('h1').toArray();
  const allHeadings = $('h1, h2, h3, h4, h5, h6').toArray();

  allHeadings.forEach((el) => {
    headings.push({
      tag: el.tagName.toLowerCase(),
      level: parseInt(el.tagName.substring(1), 10),
      text: $(el).text().trim().replace(/\s+/g, ' ')
    });
  });

  if (h1Elements.length === 0) {
    issues.push({
      category: 'seo',
      severity: 'high',
      title: 'Missing Main <h1> Heading',
      description: 'The page does not contain an <h1> heading tag.',
      why_it_matters: 'The <h1> tag provides the primary structural topic signal to search engine spiders and assistive technologies.',
      evidence: '0 <h1> elements found. Headings found: ' + (headings.slice(0, 3).map(h => `<${h.tag}>: "${h.text.substring(0, 30)}"`).join(', ') || 'None'),
      suggested_fix: 'Wrap the primary headline of the page in a single <h1> tag.',
      effort: 'Quick Fix (<15m)',
      verification_steps: 'Check document outline and verify an <h1> exists near the top of the main content.',
      dedupe_key: 'missing-h1'
    });
  } else if (h1Elements.length > 1) {
    issues.push({
      category: 'seo',
      severity: 'low',
      title: 'Multiple <h1> Headings Detected',
      description: `Found ${h1Elements.length} <h1> tags on the page.`,
      why_it_matters: 'While HTML5 permits multiple H1s, best practice recommends a single distinct <h1> per page to maintain clear topic hierarchy.',
      evidence: h1Elements.map(el => `<h1>${$(el).text().trim().substring(0, 50)}...</h1>`).join(' | '),
      suggested_fix: 'Reserve <h1> for the page title and convert secondary section headers to <h2>.',
      effort: 'Quick Fix (<15m)',
      verification_steps: 'Verify only 1 main <h1> remains on the page.',
      dedupe_key: 'multiple-h1'
    });
  }

  // Check for heading hierarchy skips (e.g. H1 followed by H3 without H2)
  for (let i = 0; i < headings.length - 1; i++) {
    const current = headings[i].level;
    const next = headings[i + 1].level;
    if (next > current + 1) {
      issues.push({
        category: 'seo',
        severity: 'low',
        title: `Heading Hierarchy Skip (<h${current}> to <h${next}>)`,
        description: `Headings skip levels from <h${current}> to <h${next}> ("${headings[i + 1].text.substring(0, 40)}...") without an intermediate level.`,
        why_it_matters: 'Skipping heading levels creates confusing document navigation for screen readers and search bots.',
        evidence: `<h${current}> "${headings[i].text.substring(0, 30)}" -> <h${next}> "${headings[i + 1].text.substring(0, 30)}"`,
        suggested_fix: `Adjust <h${next}> to <h${current + 1}> or restructure subsections.`,
        effort: 'Quick Fix (<15m)',
        verification_steps: 'Check DOM hierarchy and ensure headings step down by at most 1 level.',
        dedupe_key: `heading-skip-${current}-${next}`
      });
      break; // report once per page
    }
  }

  // -------------------------------------------------------------
  // 4. CANONICAL TAGS
  // -------------------------------------------------------------
  const canonicalHrefs = $('link[rel="canonical" i]').map((_, el) => $(el).attr('href')?.trim()).get();
  let canonicalUrl = canonicalHrefs[0] || null;

  if (canonicalHrefs.length === 0) {
    issues.push({
      category: 'seo',
      severity: 'medium',
      title: 'Missing Canonical Tag',
      description: 'The page lacks a <link rel="canonical"> tag.',
      why_it_matters: 'Canonical tags prevent duplicate content issues when URLs can be accessed via query parameters, trailing slashes, or HTTP/HTTPS variations.',
      evidence: 'No <link rel="canonical"> in <head>',
      suggested_fix: `Add <link rel="canonical" href="${pageUrl}" /> to the <head>.`,
      effort: 'Quick Fix (<15m)',
      verification_steps: 'Inspect <head> and confirm canonical tag points to the preferred URL format.',
      dedupe_key: 'missing-canonical'
    });
  } else if (canonicalHrefs.length > 1) {
    issues.push({
      category: 'seo',
      severity: 'high',
      title: 'Multiple Conflicting Canonical Tags',
      description: `Found ${canonicalHrefs.length} canonical tags in document head.`,
      why_it_matters: 'When search engines detect conflicting canonical tags, they ignore all canonical declarations.',
      evidence: canonicalHrefs.join(', '),
      suggested_fix: 'Remove extra canonical tags so exactly one valid canonical URL remains.',
      effort: 'Quick Fix (<15m)',
      verification_steps: 'Verify only 1 <link rel="canonical"> tag exists in <head>.',
      dedupe_key: 'multiple-canonicals'
    });
  } else if (canonicalUrl) {
    try {
      const canonicalParsed = new URL(canonicalUrl, pageUrl);
      const pageParsed = new URL(pageUrl);
      if (canonicalParsed.host !== pageParsed.host) {
        issues.push({
          category: 'seo',
          severity: 'high',
          title: 'Cross-Domain or Inconsistent Canonical Target',
          description: `Canonical tag points to an external domain: "${canonicalUrl}".`,
          why_it_matters: 'If accidental, pointing the canonical tag to another host (such as staging or dev) instructs search engines not to index this live site.',
          evidence: `<link rel="canonical" href="${canonicalUrl}" /> on page ${pageUrl}`,
          suggested_fix: `Change canonical URL to match the live production page: "${pageUrl}".`,
          effort: 'Quick Fix (<15m)',
          verification_steps: 'Check canonical tag points to the current production domain and protocol.',
          dedupe_key: 'inconsistent-canonical'
        });
      }
    } catch {
      issues.push({
        category: 'seo',
        severity: 'high',
        title: 'Malformed Canonical URL',
        description: `The canonical href value "${canonicalUrl}" is not a valid URL.`,
        why_it_matters: 'Invalid canonical tags are ignored by search crawlers.',
        evidence: `<link rel="canonical" href="${canonicalUrl}">`,
        suggested_fix: 'Ensure canonical URL is a valid absolute URL with http:// or https://.',
        effort: 'Quick Fix (<15m)',
        verification_steps: 'Verify canonical URL parses as a valid absolute URL.',
        dedupe_key: 'malformed-canonical'
      });
    }
  }

  // -------------------------------------------------------------
  // 5. META ROBOTS & X-ROBOTS-TAG DIRECTIVES
  // -------------------------------------------------------------
  const metaRobots = $('meta[name="robots" i], meta[name="googlebot" i]').map((_, el) => $(el).attr('content')).get().join(', ');
  const xRobotsTag = headers['x-robots-tag'] || '';
  const combinedRobots = `${metaRobots} ${xRobotsTag}`.toLowerCase();

  const isNoindex = combinedRobots.includes('noindex');
  const isNofollow = combinedRobots.includes('nofollow');

  if (isNoindex) {
    issues.push({
      category: 'seo',
      severity: 'critical',
      title: 'Page Blocked by "noindex" Directive',
      description: 'The page contains a "noindex" directive in meta robots or X-Robots-Tag header.',
      why_it_matters: 'Search engines are explicitly instructed NOT to index this page. It will not appear in Google search results.',
      evidence: metaRobots ? `Meta robots: content="${metaRobots}"` : `X-Robots-Tag: ${xRobotsTag}`,
      suggested_fix: 'Remove "noindex" from the robots tag or server response header if this page should receive organic search traffic.',
      effort: 'Quick Fix (<15m)',
      verification_steps: 'Inspect meta tags and response headers to confirm noindex directive has been removed.',
      dedupe_key: 'noindex-directive'
    });
  }

  // -------------------------------------------------------------
  // 6. IMAGE ALT ATTRIBUTES (Content vs Decorative)
  // -------------------------------------------------------------
  const images = [];
  const missingAltImages = [];
  $('img').each((_, el) => {
    const src = $(el).attr('src') || '';
    const alt = $(el).attr('alt');
    const role = $(el).attr('role');
    const ariaHidden = $(el).attr('aria-hidden');

    const isDecorative = role === 'presentation' || role === 'none' || ariaHidden === 'true' || alt === '';
    const hasAlt = typeof alt === 'string' && alt.trim().length > 0;

    images.push({
      src: src.substring(0, 100),
      alt: alt ?? null,
      isDecorative,
      hasAlt
    });

    if (!isDecorative && !hasAlt) {
      missingAltImages.push({
        src: src.substring(0, 100),
        snippet: $(el).parent().html()?.substring(0, 120) || $(el).attr('class') || 'img'
      });
    }
  });

  if (missingAltImages.length > 0) {
    issues.push({
      category: 'seo',
      severity: 'medium',
      title: `Missing Alt Text on ${missingAltImages.length} Content Image(s)`,
      description: `${missingAltImages.length} image(s) on the page lack alt attributes and are not marked as decorative.`,
      why_it_matters: 'Image alt text helps search engines index images, provides visual context for image search, and allows screen readers to describe images to visually impaired visitors.',
      evidence: missingAltImages.slice(0, 3).map(img => `<img src="${img.src}"> (missing alt)`).join(' | '),
      suggested_fix: 'Add descriptive alt text to content images, or set alt="" / role="presentation" if the image is purely decorative.',
      effort: 'Quick Fix (<15m)',
      verification_steps: 'Inspect all <img> tags and ensure every content image has descriptive alt text.',
      dedupe_key: 'missing-image-alt'
    });
  }

  // -------------------------------------------------------------
  // 7. OPEN GRAPH & SOCIAL METADATA
  // -------------------------------------------------------------
  const ogTags = {
    title: $('meta[property="og:title" i]').attr('content') || null,
    description: $('meta[property="og:description" i]').attr('content') || null,
    image: $('meta[property="og:image" i]').attr('content') || null,
    url: $('meta[property="og:url" i]').attr('content') || null,
    type: $('meta[property="og:type" i]').attr('content') || null
  };

  const twitterTags = {
    card: $('meta[name="twitter:card" i]').attr('content') || null,
    title: $('meta[name="twitter:title" i]').attr('content') || null,
    description: $('meta[name="twitter:description" i]').attr('content') || null,
    image: $('meta[name="twitter:image" i]').attr('content') || null
  };

  if (!ogTags.image && !twitterTags.image) {
    issues.push({
      category: 'seo',
      severity: 'low',
      title: 'Missing Social Share Image (og:image)',
      description: 'The page does not declare an Open Graph image (<meta property="og:image">).',
      why_it_matters: 'When links are shared on LinkedIn, Slack, X, or Facebook, links without an image preview generate significantly lower click-through engagement.',
      evidence: 'No <meta property="og:image"> found in <head>',
      suggested_fix: 'Add <meta property="og:image" content="https://yourdomain.com/social-preview.png" /> (1200x630px recommended).',
      effort: 'Quick Fix (<15m)',
      verification_steps: 'Test link with Facebook Sharing Debugger or Twitter Card Validator.',
      dedupe_key: 'missing-og-image'
    });
  }

  // -------------------------------------------------------------
  // 8. STRUCTURED DATA (JSON-LD)
  // -------------------------------------------------------------
  const structuredData = [];
  const jsonLdScripts = $('script[type="application/ld+json"]').toArray();

  jsonLdScripts.forEach((script) => {
    const rawContent = $(script).html()?.trim();
    if (!rawContent) return;

    try {
      const parsed = JSON.parse(rawContent);
      structuredData.push({
        valid: true,
        type: parsed['@type'] || (Array.isArray(parsed) ? 'Array' : 'Unknown'),
        context: parsed['@context'] || null,
        data: parsed
      });
    } catch (parseErr) {
      structuredData.push({
        valid: false,
        error: parseErr.message,
        rawSnippet: rawContent.substring(0, 120)
      });

      issues.push({
        category: 'seo',
        severity: 'high',
        title: 'Structured Data (JSON-LD) Syntax Error',
        description: `JSON-LD script could not be parsed: ${parseErr.message}`,
        why_it_matters: 'Invalid JSON prevents search engines from parsing your rich snippets (Organization, Product, FAQ, Article), disabling rich search results.',
        evidence: rawContent.substring(0, 100) + '...',
        suggested_fix: 'Fix the syntax error in the JSON-LD snippet (ensure valid quotes, commas, and curly braces).',
        effort: 'Quick Fix (<15m)',
        verification_steps: 'Validate snippet using Schema Markup Validator (schema.org) or Google Rich Results Test.',
        dedupe_key: 'invalid-json-ld'
      });
    }
  });

  return {
    title: { text: titleText, length: titleText.length, issues: titleIssues },
    metaDescription: { text: metaDesc, length: metaDesc.length, issues: metaDescIssues },
    headings: {
      tree: headings,
      h1Count: h1Elements.length,
      primaryH1: h1Elements[0] ? $(h1Elements[0]).text().trim() : null
    },
    canonical: { url: canonicalUrl, isPresent: !!canonicalUrl, allFound: canonicalHrefs },
    robots: { metaRobots, xRobotsTag, isNoindex, isNofollow },
    images: { total: images.length, missingAltCount: missingAltImages.length, sampleMissing: missingAltImages },
    social: { openGraph: ogTags, twitter: twitterTags },
    structuredData: { count: structuredData.length, items: structuredData },
    issues
  };
}

module.exports = {
  analyzeSEO
};
