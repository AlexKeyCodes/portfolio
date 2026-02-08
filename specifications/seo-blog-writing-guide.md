# SEO Blog Writing Guide for 11ty

A complete reference for writing blog posts that rank in Google, covering on-page SEO, E-E-A-T signals, structured data, and 11ty-specific implementation.

---

## 1. Front Matter Template

Every blog post should start with comprehensive front matter. Here's the ideal template for your 11ty posts:

```yaml
---
title: "Your Primary Keyword — Supporting Context"
description: "A compelling 150-160 character meta description containing your primary keyword naturally."
date: 2025-02-08
updated: 2025-02-08  # Update this when you revise the post
author:
  name: "Alex"
  url: "https://yoursite.com/about/"  # Link to your author bio page
  image: "https://yoursite.com/images/alex-headshot.jpg"
tags:
  - restaurants
  - technology
permalink: "/blog/your-primary-keyword-slug/"
image: "/images/blog/featured-image.jpg"
imageAlt: "Descriptive alt text for the featured image"
draft: false
---
```

### Key Rules for Front Matter

- **`title`**: Include your primary keyword as close to the front as possible. Keep it under 60 characters so it doesn't get truncated in search results.
- **`description`**: This becomes your meta description. 150-160 characters. Include the primary keyword. Make it a compelling pitch — this is your ad copy in search results.
- **`date`** and **`updated`**: Both matter for E-E-A-T. Google wants to see when content was published AND when it was last reviewed/updated.
- **`author`**: Critical for E-E-A-T. Must link to a real author page with credentials.
- **`permalink`**: Use a clean, keyword-rich URL slug. No dates in the URL (they make content look stale).

---

## 2. E-E-A-T Signals (Experience, Expertise, Authoritativeness, Trustworthiness)

Google's quality raters evaluate content based on E-E-A-T. Here's how to signal each one:

### Experience
- Write from first-hand experience. Use phrases like "In my experience building reservation systems..." or "After 8 years of Rails development..."
- Include original screenshots, data, or examples from your actual work
- Mention specific tools, versions, or configurations you've actually used

### Expertise
- Create a dedicated **author page** at `/about/` with your bio, credentials, experience, and links to your work
- Link to your author page from every blog post
- Use proper technical terminology — don't dumb things down artificially

### Authoritativeness
- Link out to authoritative sources (official docs, studies, etc.)
- Get backlinks by writing genuinely useful content others want to reference
- Be consistent in your niche — a restaurant tech blog should mostly cover restaurant tech

### Trustworthiness
- Display the publish date and last-updated date visibly on each post
- Include author name and photo
- Have a clear About page, Contact page, and Privacy Policy
- Use HTTPS (obviously)
- Cite sources when making claims

---

## 3. On-Page SEO Checklist

### URL Structure
```
✅ /blog/restaurant-reservation-system-rails/
❌ /blog/2025/02/08/how-to-build-a-restaurant-reservation-system-with-ruby-on-rails-guide/
```
- Short, keyword-focused, no dates, no filler words

### Heading Hierarchy
```html
<h1>Primary Keyword in Title (only one per page)</h1>
  <h2>Major Section (secondary keyword or variation)</h2>
    <h3>Subsection</h3>
  <h2>Another Major Section</h2>
    <h3>Subsection</h3>
```
- **One H1 per page** — this is your post title
- H2s should target secondary keywords or natural variations
- H3s for subsections — use them to answer specific questions (great for featured snippets)
- Never skip levels (don't go from H2 to H4)

### Keyword Placement
Place your primary keyword in:
1. Title tag (H1)
2. Meta description
3. URL slug
4. First 100 words of the post
5. At least one H2
6. Image alt text
7. Naturally throughout the body (don't stuff — aim for ~1-2% density)

### Content Structure
- **First paragraph**: State what the post covers and who it's for. Include primary keyword.
- **Body**: Break into scannable sections with H2/H3 headings. Answer questions directly.
- **Conclusion**: Summarize key takeaways. Include a call to action.
- **Word count**: Aim for whatever length fully covers the topic. For competitive keywords, check what's ranking and aim to be more comprehensive. Generally 1,500-3,000 words for tutorial/guide content.

### Internal & External Links
- Link to 2-5 of your own relevant posts (internal linking)
- Link to 3-5 authoritative external sources (official docs, studies, etc.)
- Use descriptive anchor text: "our guide to Stripe integration" not "click here"

### Images
- Use descriptive filenames: `restaurant-reservation-dashboard.png` not `screenshot-1.png`
- Always include alt text with keywords where natural
- Compress images (use WebP format when possible)
- Include at least one original image per post

---

## 4. JSON-LD Structured Data

This is what helps Google display rich results (author info, dates, ratings, FAQ dropdowns, etc.). Add this to your 11ty blog post layout.

### Article Schema (Required for Blog Posts)

Create or update your blog post layout (e.g., `_includes/layouts/post.njk`):

```html
<script type="application/ld+json">
{
  "@context": "https://schema.org",
  "@type": "Article",
  "headline": "{{ title }}",
  "description": "{{ description }}",
  "image": "https://yoursite.com{{ image }}",
  "datePublished": "{{ date | isoDate }}",
  "dateModified": "{{ updated | isoDate }}",
  "author": {
    "@type": "Person",
    "name": "{{ author.name }}",
    "url": "{{ author.url }}",
    "image": "{{ author.image }}"
  },
  "publisher": {
    "@type": "Organization",
    "name": "Your Site Name",
    "logo": {
      "@type": "ImageObject",
      "url": "https://yoursite.com/images/logo.png"
    }
  },
  "mainEntityOfPage": {
    "@type": "WebPage",
    "@id": "https://yoursite.com{{ page.url }}"
  }
}
</script>
```

### BreadcrumbList Schema

Helps Google understand your site hierarchy and can show breadcrumbs in search results:

```html
<script type="application/ld+json">
{
  "@context": "https://schema.org",
  "@type": "BreadcrumbList",
  "itemListElement": [
    {
      "@type": "ListItem",
      "position": 1,
      "name": "Home",
      "item": "https://yoursite.com/"
    },
    {
      "@type": "ListItem",
      "position": 2,
      "name": "Blog",
      "item": "https://yoursite.com/blog/"
    },
    {
      "@type": "ListItem",
      "position": 3,
      "name": "{{ title }}",
      "item": "https://yoursite.com{{ page.url }}"
    }
  ]
}
</script>
```

### FAQ Schema (When Your Post Answers Questions)

If your blog post has a FAQ section or answers specific questions, add this to get FAQ rich results in Google:

```html
<script type="application/ld+json">
{
  "@context": "https://schema.org",
  "@type": "FAQPage",
  "mainEntity": [
    {
      "@type": "Question",
      "name": "How do I set up online reservations for my restaurant?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "Your concise answer here..."
      }
    },
    {
      "@type": "Question",
      "name": "What does a restaurant reservation system cost?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "Your concise answer here..."
      }
    }
  ]
}
</script>
```

### HowTo Schema (For Tutorial Posts)

```html
<script type="application/ld+json">
{
  "@context": "https://schema.org",
  "@type": "HowTo",
  "name": "{{ title }}",
  "description": "{{ description }}",
  "step": [
    {
      "@type": "HowToStep",
      "name": "Step title",
      "text": "Full step description",
      "url": "https://yoursite.com{{ page.url }}#step-1"
    }
  ]
}
</script>
```

---

## 5. 11ty Implementation Details

### Essential Head Tags

In your base layout or post layout, make sure your `<head>` includes:

```html
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">

  <!-- Primary SEO -->
  <title>{{ title }} | Your Site Name</title>
  <meta name="description" content="{{ description }}">
  <link rel="canonical" href="https://yoursite.com{{ page.url }}">

  <!-- Open Graph (Facebook, LinkedIn, etc.) -->
  <meta property="og:type" content="article">
  <meta property="og:title" content="{{ title }}">
  <meta property="og:description" content="{{ description }}">
  <meta property="og:image" content="https://yoursite.com{{ image }}">
  <meta property="og:url" content="https://yoursite.com{{ page.url }}">
  <meta property="article:published_time" content="{{ date | isoDate }}">
  <meta property="article:modified_time" content="{{ updated | isoDate }}">
  <meta property="article:author" content="{{ author.url }}">

  <!-- Twitter Card -->
  <meta name="twitter:card" content="summary_large_image">
  <meta name="twitter:title" content="{{ title }}">
  <meta name="twitter:description" content="{{ description }}">
  <meta name="twitter:image" content="https://yoursite.com{{ image }}">

  <!-- JSON-LD structured data goes here (see Section 4) -->
</head>
```

### Visible Post Metadata (E-E-A-T Display)

In your post layout, display author and date info visibly:

```html
<article>
  <header>
    <h1>{{ title }}</h1>
    <div class="post-meta">
      <img src="{{ author.image }}" alt="{{ author.name }}" width="40" height="40">
      <span>By <a href="{{ author.url }}">{{ author.name }}</a></span>
      <time datetime="{{ date | isoDate }}">Published: {{ date | readableDate }}</time>
      {% if updated != date %}
        <time datetime="{{ updated | isoDate }}">Updated: {{ updated | readableDate }}</time>
      {% endif %}
    </div>
  </header>

  <div class="post-content">
    {{ content | safe }}
  </div>
</article>
```

### Sitemap

Use the `@11ty/eleventy-plugin-sitemap` or generate one manually. Google needs this to discover your pages. Make sure each blog post entry includes `<lastmod>`:

```xml
<url>
  <loc>https://yoursite.com/blog/your-post/</loc>
  <lastmod>2025-02-08</lastmod>
  <changefreq>monthly</changefreq>
</url>
```

### RSS Feed

Create an RSS/Atom feed. This helps with indexing and distribution. Use the `@11ty/eleventy-plugin-rss` plugin.

### Robots.txt

```
User-agent: *
Allow: /
Sitemap: https://yoursite.com/sitemap.xml
```

---

## 6. Keyword Research & Targeting Workflow

Before writing each post:

1. **Pick a primary keyword** — one specific phrase you want to rank for (e.g., "restaurant reservation system")
2. **Find secondary keywords** — variations and related terms (e.g., "online booking for restaurants", "restaurant booking software")
3. **Check search intent** — Google your keyword and look at what's ranking. Is it tutorials? Listicles? Product pages? Match that format.
4. **Analyze the competition** — Can you write something more comprehensive, more current, or from a more experienced perspective than what's on page 1?
5. **Map one primary keyword per post** — Don't try to rank for everything in one post. Each post targets one main keyword cluster.

### Where to Research Keywords
- Google's "People also ask" boxes
- Google Autocomplete suggestions
- Google Search Console (for your existing traffic)
- Free tools: Ubersuggest, AnswerThePublic, Google Keyword Planner
- Paid tools: Ahrefs, SEMrush

---

## 7. Post-Publish Checklist

After hitting publish:

- [ ] Validate structured data at https://search.google.com/test/rich-results
- [ ] Check your page with Google's PageSpeed Insights
- [ ] Submit the URL in Google Search Console (URL Inspection → Request Indexing)
- [ ] Verify all meta tags render correctly (use social share preview tools for OG tags)
- [ ] Confirm the canonical URL is correct
- [ ] Check that the sitemap has been updated
- [ ] Internal link to the new post from 2-3 existing relevant posts

---

## 8. Content Refresh Strategy

Google rewards fresh, maintained content. Schedule reviews:

- **Every 3-6 months**: Review top-performing posts. Update stats, links, screenshots. Bump the `updated` date.
- **Annually**: Audit all content. Consolidate thin posts. Remove or redirect outdated ones.
- **Always update `dateModified`** in front matter when you revise — this updates both the visible date and the structured data.

---

## Quick Reference: Blog Post Template

```markdown
---
title: "Primary Keyword — Brief Supporting Context"
description: "150-160 chars with primary keyword. Compelling pitch."
date: 2025-02-08
updated: 2025-02-08
author:
  name: "Alex"
  url: "https://yoursite.com/about/"
  image: "https://yoursite.com/images/alex.jpg"
tags:
  - relevant-tag
permalink: "/blog/primary-keyword-slug/"
image: "/images/blog/post-featured.jpg"
imageAlt: "Descriptive alt with keyword"
---

Opening paragraph with primary keyword in first 100 words. State what the reader
will learn and why it matters. Write from experience.

## H2 With Secondary Keyword {#descriptive-anchor}

Body content. Link to [relevant internal post](/blog/other-post/) and
[authoritative external source](https://example.com). Include original
screenshots or examples from your actual work.

### H3 Answering a Specific Question

Direct answer here (great for featured snippets). Then elaborate.

## Another H2 Section

More content...

## Conclusion

Summarize key points. Call to action (try the tool, read the next post, etc.).
```
