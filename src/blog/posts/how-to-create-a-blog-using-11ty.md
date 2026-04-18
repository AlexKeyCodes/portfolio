---
title: "How to Create a Blog Using 11ty"
description: "A step-by-step guide to building a blog with 11ty (Eleventy). Learn how to set up collections, write posts in Markdown, create layouts, generate SEO-friendly URLs, and ship structured data for better search visibility."
date: 2026-04-18
tags: ["blog", "11ty", "eleventy", "javascript", "tutorial"]
layout: layouts/blog-post.njk
permalink: "/blog/{{ title | slugify }}/"
---

{% raw %}
Originally I planned to build this portfolio / blog using rails. I mean I'm a rails developer after all. In fact I originally did build it on rails. I scaffolded the blog system, used devise for admin users, I even started building out the infrastructure to manage the work for my clients. Then one day I was building a static site for a client, and was using 11ty. I started wondering why I'm spending so much time building out a rails platform when 11ty can do everything I need. Do I really need to build out project management when I already use Notion? Do I really need a contact form when all I get out of it is spam? Then answer is a resounding NO! So I decided to keep things simple. A homepage and a blog.

This guide walks through building a complete 11ty blog from a fresh `npm init`: collections, custom filters, layouts, a listing page, SEO-friendly permalinks, Open Graph and Twitter Card meta tags, JSON-LD structured data, and a sitemap. Styling is intentionally left out — the goal here is the content pipeline, not the CSS. If you want to see the finished version, the source for this entire site lives at [github.com/AlexKeyCodes/portfolio](https://github.com/AlexKeyCodes/portfolio).

## What is 11ty?

11ty (Eleventy) is a static site generator written in JavaScript. It takes Markdown, Nunjucks, Liquid, or a handful of other template formats and outputs plain HTML. No client-side runtime, no hydration, no framework — the output is the same kind of static HTML you'd get from hand-writing it, just with templating and layouts data baked in.

For a blog — or really any content-heavy site like docs, a portfolio, or a marketing site — 11ty is about as simple as it gets.

## Part 1: Set Up a Fresh 11ty Project

### Step 1: Initialize the Project

Create a new directory and initialize npm:

```bash
mkdir my-blog
cd my-blog
npm init -y
```

Install 11ty as a dev dependency:

```bash
npm install --save-dev @11ty/eleventy
```

### Step 2: Add npm Scripts

Open `package.json` and add the following scripts:

```json
{
  "scripts": {
    "build": "eleventy",
    "serve": "eleventy --serve"
  }
}
```

- `npm run build` produces a static site in `dist/`
- `npm run serve` starts a local dev server with hot reload at `http://localhost:8080`

### Step 3: Create the Directory Structure

11ty doesn't enforce a structure, but this is the layout I use across every project:

```
my-blog/
├── src/
│   ├── _data/
│   ├── _includes/
│   │   ├── components/
│   │   │   └── blog/
│   │   └── layouts/
│   └── blog/
│       └── posts/
└── .eleventy.js
```

- `src/` — all source files
- `src/_includes/layouts/` — reusable page layouts
- `src/_includes/components/` — smaller reusable template pieces
- `src/_data/` — global data available to every template
- `src/blog/posts/` — your Markdown blog posts

### Step 4: Create the 11ty Config

Create `.eleventy.js` in the project root:

```javascript
module.exports = function (eleventyConfig) {
  return {
    dir: {
      input: 'src',
      output: 'dist',
      includes: '_includes',
      data: '_data'
    },
    templateFormats: ['njk', 'md', 'html'],
    htmlTemplateEngine: 'njk',
    markdownTemplateEngine: 'njk'
  }
}
```

This tells 11ty where to find source files, where to write the output, and that we want to use Nunjucks (`.njk`) as our template engine — including inside Markdown files, which is what lets us use `{{ variables }}` in the front matter.

## Part 2: Create the Base Layout

Every page on the site will extend a shared base layout — the HTML skeleton with `<head>`, meta tags, and a content block.

### Step 5: Create `base.njk`

Create `src/_includes/layouts/base.njk`:

```nunjucks
<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>{{ title }}</title>
    <meta name="description" content="{{ description }}" />
  </head>
  <body>
    <main>
      {% block content %}{% endblock %}
    </main>
  </body>
</html>
```

This is intentionally bare — no styles, no header, no footer. We'll build on it in Part 7 with SEO meta tags and structured data. The important part is the `{% block content %}` placeholder, which is what child layouts and pages will fill in.

## Part 3: Set Up the Blog Collection

This is where 11ty starts to shine. A "collection" is just a group of pages sharing a tag. 11ty builds the collection automatically — all you do is tell it how to filter and sort.

### Step 6: Add the Blog Collection

Update `.eleventy.js`:

```javascript
module.exports = function (eleventyConfig) {
  // Collect all posts tagged "blog", newest first
  eleventyConfig.addCollection("blog", function(collectionApi) {
    return collectionApi.getFilteredByTag("blog").sort((a, b) => {
      return b.date - a.date;
    });
  });

  return {
    dir: {
      input: 'src',
      output: 'dist',
      includes: '_includes',
      data: '_data'
    },
    templateFormats: ['njk', 'md', 'html'],
    htmlTemplateEngine: 'njk',
    markdownTemplateEngine: 'njk'
  }
}
```

Any Markdown file with `tags: ["blog"]` in its front matter now shows up in `collections.blog`, sorted newest first. You'll use this in the listing page in Part 5.

### Step 7: Add Date Filters

11ty's default date output isn't great for templates — you'll want both a machine-readable ISO format (for `<time datetime="...">` attributes and meta tags) and a human-readable format (for display). Add two custom filters:

```javascript
eleventyConfig.addFilter("dateIso", (dateObj) => {
  return new Date(dateObj).toISOString().split('T')[0];
});

eleventyConfig.addFilter("dateReadable", (dateObj) => {
  return new Date(dateObj).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
});
```

Now `{{ date | dateIso }}` outputs `2026-04-18` and `{{ date | dateReadable }}` outputs `April 18, 2026`.

## Part 4: Create the Blog Post Layout

### Step 8: Create `blog-post.njk`

Create `src/_includes/layouts/blog-post.njk`. This extends `base.njk` and adds the post-specific structure:

```nunjucks
{% extends "layouts/base.njk" %}

{% block content %}
<article>
  <a href="/blog/">&larr; Back to blog</a>

  <header>
    <h1>{{ title }}</h1>
    <time datetime="{{ date | dateIso }}">
      {{ date | dateReadable }}
    </time>
    {% if description %}
      <p>{{ description }}</p>
    {% endif %}
  </header>

  <div class="content">
    {{ content | safe }}
  </div>

  <a href="/blog/">&larr; Back to blog</a>
</article>
{% endblock %}
```

A few things worth pointing out:

- `{{ content | safe }}` is where the Markdown body gets rendered. The `safe` filter tells Nunjucks not to escape the HTML 11ty generated from Markdown.
- `<time datetime="{{ date | dateIso }}">` is important for accessibility and SEO — search engines and assistive tech rely on the machine-readable date attribute.
- The back link is repeated top and bottom. Readers should never have to scroll for navigation.

## Part 5: Create the Listing Page and Post Card

### Step 9: Create the Post Card Component

Create `src/_includes/components/blog/post-card.njk`. This is what renders each post on the listing page:

```nunjucks
<article>
  <time datetime="{{ post.date | dateIso }}">
    {{ post.date | dateReadable }}
  </time>
  <h3>{{ post.data.title }}</h3>
  <p>{{ post.data.description }}</p>
  <a href="{{ post.url }}">
    {{ post.data.title }} &rarr;
  </a>
</article>
```

Note the shape: when you loop over a collection, each item exposes `post.date`, `post.url`, and `post.data` (everything from the post's front matter).

### Step 10: Create the Blog Listing Page

Create `src/blog/index.njk`. This file will render at `/blog/`:

```nunjucks
---
title: "Blog"
description: "Articles on web development and software engineering"
---

{% extends "layouts/base.njk" %}

{% block content %}
<h1>From the blog</h1>

{% for post in collections.blog %}
  {% include "components/blog/post-card.njk" %}
{% endfor %}
{% endblock %}
```

**Why `src/blog/index.njk`?** 11ty maps file paths to URLs. An `index` file inside `src/blog/` renders to `/blog/`, which is exactly what we want for the listing page.

The `{% for post in collections.blog %}` loop iterates over every post tagged `"blog"`, sorted newest first, and passes each one to the card component.

## Part 6: Write Your First Post

### Step 11: Create a Markdown Post

Create `src/blog/posts/my-first-post.md`:

```markdown
---
title: "My First Post"
description: "A short summary that appears on the blog listing and in search results."
date: 2026-04-18
tags: ["blog"]
layout: layouts/blog-post.njk
permalink: "/blog/{{ title | slugify }}/"
---

## Hello, World

This is the body of the post. You can write **Markdown** here —
headings, lists, code blocks, links, images, whatever you need.

### Code blocks work too

\`\`\`javascript
const greeting = "Hello from 11ty";
console.log(greeting);
\`\`\`
```

### Step 12: Understand the Front Matter

Here's what each field does:

| Field | Required | Description |
|-------|----------|-------------|
| `title` | Yes | Post title. Displayed as H1 and used for URL generation. |
| `description` | Yes | 1–2 sentence summary shown on the listing page and used for meta tags. |
| `date` | Yes | Publication date in `YYYY-MM-DD` format. Used for sorting. |
| `tags` | Yes | Must include `"blog"` or the post won't show up in the collection. |
| `layout` | Yes | Points to the layout file — `layouts/blog-post.njk`. |
| `permalink` | Yes | URL pattern. Uses 11ty's built-in `slugify` filter to turn the title into a URL-safe slug. |

**Important**: Don't wrap the `date` value in quotes — 11ty parses unquoted YAML dates as Date objects. Quoted dates get treated as strings, which breaks sorting.

The `permalink: "/blog/{{ title | slugify }}/"` pattern means the title `"My First Post"` generates the URL `/blog/my-first-post/`. You get clean, SEO-friendly URLs for free, without having to maintain them by hand.

### Step 13: Preview It

Run the dev server:

```bash
npm run serve
```

Visit `http://localhost:8080/blog/` and you should see your new post in the listing. Click through and you'll land on `/blog/my-first-post/` with the full post rendered.

**Note**: I write all of my blog content in Markdown using [Claude Code](https://claude.com/claude-code). I describe the post I want, point it at the existing posts as a voice reference, and iterate on the draft directly in the editor. It keeps the authoring loop tight — no CMS, no context-switching, and the output is just a Markdown file committed to git alongside the rest of the source.

## Part 7: SEO and Structured Data

A blog post without proper meta tags and structured data is invisible to social platforms and harder for search engines to index correctly. This section upgrades `blog-post.njk` into something search- and share-ready.

### Step 14: Add Open Graph Meta Tags

Open Graph tags control how the post looks when shared on Facebook, LinkedIn, Slack, Discord, and anywhere else that scrapes the `<head>` for preview data. Add these to the `<head>` of `base.njk` (or directly in a `{% block head %}` overridden by `blog-post.njk`):

```nunjucks
<meta property="og:type" content="article" />
<meta property="og:title" content="{{ title }}" />
<meta property="og:description" content="{{ description }}" />
<meta property="og:image" content="{{ client.domain }}{{ image if image else '/assets/images/og-image.webp' }}" />
<meta property="og:url" content="{{ client.domain }}{{ page.url }}" />
<meta property="article:published_time" content="{{ date | dateIso }}" />
<meta property="article:modified_time" content="{{ (updated if updated else date) | dateIso }}" />
```

The `updated` field is optional in the front matter — if you add it to a post, the `article:modified_time` tag reflects the edit date, which is a small but real SEO signal.

### Step 15: Add Twitter Card Meta Tags

Twitter (and X) use a separate set of meta tags:

```nunjucks
<meta name="twitter:card" content="summary_large_image" />
<meta name="twitter:title" content="{{ title }}" />
<meta name="twitter:description" content="{{ description }}" />
<meta name="twitter:image" content="{{ client.domain }}{{ image if image else '/assets/images/og-image.webp' }}" />
```

`summary_large_image` gives you the big image card on Twitter rather than the thumbnail-style small card.

### Step 16: Add a Canonical Link

Search engines use the canonical URL to deduplicate pages that might be accessible at multiple URLs. Add this inside `<head>`:

```nunjucks
<link rel="canonical" href="{{ client.domain }}{{ page.url }}" />
```

### Step 17: Add JSON-LD Article Schema

JSON-LD is structured data that tells Google exactly what a page is about. For blog posts, the `Article` schema type is what you want. Add this inside `<head>`:

```nunjucks
<script type="application/ld+json">
  {
    "@context": "https://schema.org",
    "@type": "Article",
    "headline": "{{ title }}",
    "description": "{{ description }}",
    "image": "{{ client.domain }}{{ image if image else '/assets/images/og-image.webp' }}",
    "datePublished": "{{ date | dateIso }}",
    "dateModified": "{{ (updated if updated else date) | dateIso }}",
    "author": {
      "@type": "Person",
      "name": "{{ client.name }}",
      "url": "{{ client.domain }}/about/"
    },
    "publisher": {
      "@type": "Organization",
      "name": "{{ client.name }}",
      "logo": {
        "@type": "ImageObject",
        "url": "{{ client.domain }}/assets/images/logo.png"
      }
    },
    "mainEntityOfPage": {
      "@type": "WebPage",
      "@id": "{{ client.domain }}{{ page.url }}"
    }
  }
</script>
```

This is what unlocks rich results in Google — article publication dates, author attribution, and eligibility for the "Top Stories" carousel for timely content.

### Step 18: Add BreadcrumbList Schema

Breadcrumb structured data tells Google where a page sits in your site hierarchy, and can make breadcrumb trails appear in search results instead of the raw URL:

```nunjucks
<script type="application/ld+json">
  {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    "itemListElement": [
      {
        "@type": "ListItem",
        "position": 1,
        "name": "Home",
        "item": "{{ client.domain }}/"
      },
      {
        "@type": "ListItem",
        "position": 2,
        "name": "Blog",
        "item": "{{ client.domain }}/blog/"
      },
      {
        "@type": "ListItem",
        "position": 3,
        "name": "{{ title }}",
        "item": "{{ client.domain }}{{ page.url }}"
      }
    ]
  }
</script>
```

### Step 19: Install the Sitemap Plugin

Sitemaps help search engines discover and crawl every page on your site. 11ty has an official community plugin:

```bash
npm install @quasibit/eleventy-plugin-sitemap
```

Register it in `.eleventy.js`:

```javascript
const sitemap = require('@quasibit/eleventy-plugin-sitemap')

module.exports = function (eleventyConfig) {
  eleventyConfig.addPlugin(sitemap, {
    sitemap: {
      hostname: 'https://yourdomain.com'
    }
  })

  // ... existing collection and filters ...

  return { /* ... */ }
}
```

Create `src/sitemap.xml` with this minimal template:

```nunjucks
---
permalink: /sitemap.xml
eleventyExcludeFromCollections: true
---
<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  {%- for page in collections.all %}
  <url>
    <loc>https://yourdomain.com{{ page.url }}</loc>
  </url>
  {%- endfor %}
</urlset>
```

After `npm run build`, you'll find a fully populated `sitemap.xml` in `dist/`. Submit it to Google Search Console and you're done.

## Part 8: Global Data

The SEO snippets above reference `{{ client.name }}` and `{{ client.domain }}`. That data comes from the `_data/` folder, where every file is automatically exposed to every template.

### Step 20: Create Global Data Files

Create `src/_data/client.js`:

```javascript
module.exports = {
  name: "Your Name",
  domain: "https://yourdomain.com"
};
```

Create `src/_data/global.js`:

```javascript
module.exports = {
  currentYear: new Date().getFullYear()
};
```

Now `{{ client.name }}`, `{{ client.domain }}`, and `{{ global.currentYear }}` are available in every template — handy for footer copyright years, meta tags, and author attribution without repeating yourself.

## Part 9: Quality-of-Life Plugins

These aren't required, but I install them on every 11ty site.

### Minify HTML, CSS, and JS Output

```bash
npm install @sherby/eleventy-plugin-files-minifier
```

```javascript
const eleventyPluginFilesMinifier = require('@sherby/eleventy-plugin-files-minifier')

eleventyConfig.addPlugin(eleventyPluginFilesMinifier)
```

This automatically minifies your build output with zero configuration.

### Navigation Helpers

If you want to drive your nav menu from data rather than hard-coding links:

```bash
npm install @11ty/eleventy-navigation
```

```javascript
const eleventyNavigationPlugin = require('@11ty/eleventy-navigation')

eleventyConfig.addPlugin(eleventyNavigationPlugin)
```

You can then add `eleventyNavigation: { key: "Home", order: 1 }` to a page's front matter and generate a menu from it in any template.

## Part 10: Build and Deploy

### Local Development

```bash
npm run serve
```

Opens a live-reloading dev server at `http://localhost:8080`. Edit any Markdown or template file and the browser refreshes automatically.

### Production Build

```bash
npm run build
```

Produces a fully static `dist/` directory — just HTML, CSS, JS, and assets. No runtime dependencies.

### Hosting

Because the output is just a directory of static files, you can host it literally anywhere — Netlify, Cloudflare Pages, Vercel, GitHub Pages, S3, or a plain old VPS. There's no runtime, no server code, no database. Just HTML, CSS, JS, and assets.

I host this site on a Linode VPS running nginx. Nginx is pointed at `/var/www/alexanderkey.com/_site`, and my entire deploy pipeline is a three-line bash script:

```bash
#!/bin/bash
echo "Building site..."
npm run build

echo "Deploying to server..."
rsync -avz --delete dist/ user@your-server-ip:/var/www/yourdomain.com/_site

echo "Deployment complete!"
```

That's it. `npm run build` produces a fresh `dist/`, and `rsync` syncs it to the server — the `--delete` flag cleans up any files that no longer exist in the build. One command (`./deploy.sh`) and the site is live.

If you go the VPS route, I'd strongly recommend [hardening the server](/blog/how-to-harden-a-new-server/) before you point nginx at anything.

## Checklist

Before you ship, make sure you've got:

- Base layout at `src/_includes/layouts/base.njk`
- Blog post layout at `src/_includes/layouts/blog-post.njk`
- Post card component at `src/_includes/components/blog/post-card.njk`
- Listing page at `src/blog/index.njk`
- Blog collection registered in `.eleventy.js`
- `dateIso` and `dateReadable` filters registered in `.eleventy.js`
- At least one post in `src/blog/posts/` with the required front matter
- Open Graph, Twitter Card, and canonical meta tags in the base layout
- JSON-LD `Article` and `BreadcrumbList` schema on post pages
- Sitemap plugin registered and `sitemap.xml` generated
- Global data in `src/_data/client.js`

That's the whole setup. The blog you're reading right now uses this exact stack, and the full working version is at [github.com/AlexKeyCodes/portfolio](https://github.com/AlexKeyCodes/portfolio) — clone it if you want a head start.
{% endraw %}
