# Blog System Specification

Technical reference for the blog system built with 11ty, Nunjucks, and Markdown.

---

## Quick Start

1. Create a new `.md` file in `src/blog/posts/`
2. Add the required front matter (see template below)
3. Write content in Markdown
4. Run `npm run serve` to preview

---

## File Structure

```
src/
├── blog/
│   ├── index.njk                    # Blog listing page (/blog/)
│   └── posts/
│       └── your-post.md             # Blog posts go here
├── _includes/
│   ├── layouts/
│   │   ├── base.njk                 # Base HTML layout
│   │   └── blog-post.njk            # Blog post layout
│   └── components/
│       └── blog/
│           └── post-card.njk        # Post preview card
└── _data/
    ├── client.js                    # Author/site info
    └── global.js                    # Global utilities
```

---

## Front Matter Template

Every blog post requires this front matter:

```yaml
---
title: "Your Post Title"
description: "Brief summary displayed on the blog listing page (1-2 sentences)"
date: 2026-02-08
tags: ["blog"]
layout: layouts/blog-post.njk
permalink: "/blog/{{ title | slugify }}/"
---
```

### Field Reference

| Field | Required | Description |
|-------|----------|-------------|
| `title` | Yes | Post title, displayed as H1 and used for URL generation |
| `description` | Yes | Summary text shown on blog listing (truncated to 3 lines) |
| `date` | Yes | Publication date in `YYYY-MM-DD` format |
| `tags` | Yes | Must include `"blog"` for the post to appear in the collection |
| `layout` | Yes | Must be `layouts/blog-post.njk` |
| `permalink` | Yes | URL pattern — uses `slugify` filter on title |

### Additional Optional Fields

For SEO-optimized posts (see `seo-blog-writing-guide.md`), you can add:

```yaml
---
# ... required fields above ...
updated: 2026-02-08              # Last modified date
author:
  name: "Alex"
  url: "/about/"
  image: "/assets/images/author.jpg"
image: "/assets/images/blog/featured.jpg"
imageAlt: "Descriptive alt text"
---
```

---

## URL Generation

URLs are auto-generated from the title using the `slugify` filter:

| Title | Generated URL |
|-------|---------------|
| "My First Post" | `/blog/my-first-post/` |
| "Building REST APIs with Rails" | `/blog/building-rest-apis-with-rails/` |
| "What's New in 2026?" | `/blog/whats-new-in-2026/` |

---

## Blog Collection

Defined in `.eleventy.js`:

```javascript
eleventyConfig.addCollection("blog", function(collectionApi) {
  return collectionApi.getFilteredByTag("blog").sort((a, b) => {
    return b.date - a.date; // Newest first
  });
});
```

**How it works:**
- Collects all files with `tags: ["blog"]`
- Sorts by date descending (newest first)
- Available in templates as `collections.blog`

---

## Date Filters

Two custom filters defined in `.eleventy.js`:

| Filter | Output Example | Usage |
|--------|----------------|-------|
| `dateIso` | `2026-02-08` | `{{ date \| dateIso }}` |
| `dateReadable` | `February 8, 2026` | `{{ date \| dateReadable }}` |

---

## Layouts & Components

### Blog Post Layout (`layouts/blog-post.njk`)

Extends `base.njk` and provides:
- Post header with title, date, and description
- Content area styled with Tailwind Typography (`prose-lg prose-indigo`)
- Back link to `/blog/`

### Post Card Component (`components/blog/post-card.njk`)

Used on the blog listing page. Displays:
- Publication date
- Post title (linked)
- Description (truncated to 3 lines via `line-clamp-3`)
- Author info from `client.js`
- "Read more" link

---

## Global Data Access

Posts can access data from `src/_data/`:

```nunjucks
{{ client.name }}         {# Author name #}
{{ client.domain }}       {# Site domain #}
{{ global.currentYear }}  {# Current year #}
```

---

## Writing Content

Posts support standard Markdown:

```markdown
## Headings

Regular paragraphs with **bold** and *italic* text.

- Bullet lists
- Work as expected

1. Numbered lists
2. Also work

### Code Blocks

\`\`\`javascript
const example = "syntax highlighted";
\`\`\`

Inline \`code\` is supported too.

### Links and Images

[Link text](https://example.com)

![Alt text](/assets/images/example.jpg)
```

---

## Styling

Post content is styled with Tailwind's Typography plugin:

- **Base class:** `prose`
- **Size modifier:** `prose-lg` (larger text)
- **Color theme:** `prose-indigo` (indigo accent colors)

To customize, edit `src/_includes/layouts/blog-post.njk`.

---

## Checklist: New Post

- [ ] Create `.md` file in `src/blog/posts/`
- [ ] Add all required front matter fields
- [ ] Include `tags: ["blog"]` (critical!)
- [ ] Set `layout: layouts/blog-post.njk`
- [ ] Set `date` in `YYYY-MM-DD` format
- [ ] Write description (1-2 sentences)
- [ ] Write content in Markdown
- [ ] Test locally with `npm run serve`
- [ ] Verify post appears on `/blog/` listing
- [ ] Check individual post URL works

---

## Troubleshooting

### Post not appearing on blog listing
- Verify `tags: ["blog"]` is present in front matter
- Check that `date` is valid and not in the future

### 404 on post URL
- Verify `permalink` field is present
- Check for typos in `layout` path

### Styling looks broken
- Ensure `layout: layouts/blog-post.njk` is set
- Check that Tailwind Typography plugin is installed

### Date showing incorrectly
- Use `YYYY-MM-DD` format (e.g., `2026-02-08`)
- Don't wrap date in quotes
