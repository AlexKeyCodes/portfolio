# Alexander Key Portfolio

Personal portfolio website built with 11ty (Eleventy), TailwindCSS, and Nunjucks. Live at [alexanderkey.com](https://www.alexanderkey.com).

## Quick Start

```bash
# Install dependencies
npm install

# Start development server (with live reload)
npm run serve

# Build for production
npm run build
```

The dev server runs at http://localhost:8080

## Available Commands

| Command | Description |
|---------|-------------|
| `npm run serve` | Start dev server with CSS watch and live reload |
| `npm run watch` | Same as `serve` (alias) |
| `npm run build` | Compile CSS and build static site to `dist/` |
| `npm run build:css` | Compile SCSS to CSS via PostCSS (includes TailwindCSS) |
| `npm run watch:css` | Watch SCSS file and recompile on changes |
| `npm run serve:eleventy` | Start Eleventy server only (no CSS watch) |

## Project Structure

```
src/
├── _data/                  # Global data
│   ├── client.js          # Client info (name, address, domain, phone)
│   └── global.js          # Utilities (currentYear, etc.)
├── _includes/
│   ├── layouts/
│   │   └── base.njk       # Base HTML layout
│   └── components/
│       ├── header.njk
│       ├── footer.njk
│       └── homepage/      # Homepage sections
│           ├── hero.njk
│           ├── portfolio.njk
│           ├── testimonials.njk
│           ├── mobile_showcase.njk
│           └── modal.njk
├── assets/
│   ├── css/               # Compiled CSS output
│   ├── sass/              # SASS source (styles.scss)
│   ├── js/                # JavaScript (main.js, modal.js)
│   ├── images/            # Image assets
│   └── favicons/          # Favicon files
├── index.njk              # Homepage
├── robots.txt
└── sitemap.xml

dist/                      # Build output (gitignored)
```

## Tech Stack

- **Eleventy 2.0.1** - Static site generator
- **Nunjucks** - Templating engine
- **TailwindCSS 3.4.10** - Utility-first CSS framework
- **SASS 1.77.8** - CSS preprocessor
- **PostCSS** - CSS transformations (Autoprefixer)

### Plugins
- `@11ty/eleventy-navigation` - Navigation helpers
- `@quasibit/eleventy-plugin-sitemap` - Auto-generates sitemap.xml
- `@sherby/eleventy-plugin-files-minifier` - Minifies HTML/CSS/JS

## Development Notes

### CSS Build Process
SCSS → PostCSS (TailwindCSS + Autoprefixer) → CSS

The SASS file (`src/assets/sass/styles.scss`) only imports Tailwind directives:
```scss
@tailwind base;
@tailwind components;
@tailwind utilities;
```

### Dark Mode
TailwindCSS is configured with class-based dark mode. Add `dark` class to a parent element to enable dark mode styles.

### Data Layer
Global data in `src/_data/` is accessible in all templates:
- `{{ client.name }}` - Client information
- `{{ global.currentYear }}` - Current year (for footer)

### Adding Pages
1. Create `.njk` file in `src/`
2. Add frontmatter:
   ```yaml
   ---
   title: Page Title
   description: Page description for SEO
   ---
   ```
3. Extend base layout:
   ```njk
   {% extends "layouts/base.njk" %}
   {% block content %}
     <!-- Page content -->
   {% endblock %}
   ```

## Blog System

The portfolio includes a blog built with Eleventy collections, supporting Markdown posts with frontmatter metadata.

### Blog Structure

```
src/
├── blog/
│   ├── index.njk              # Blog listing page
│   └── posts/
│       └── *.md               # Individual blog posts (Markdown)
├── _includes/
│   ├── layouts/
│   │   └── blog-post.njk      # Blog post layout
│   └── components/
│       └── blog/
│           └── post-card.njk  # Blog post preview card
```

### How It Works

1. **Blog Collection**: Eleventy automatically creates a "blog" collection from all Markdown files tagged with `tags: ["blog"]`
2. **Sorting**: Posts are automatically sorted by date (newest first)
3. **Date Filters**: Custom filters (`dateIso` and `dateReadable`) format post dates
4. **Typography**: Uses `@tailwindcss/typography` plugin for automatic Markdown styling
5. **URLs**:
   - Blog listing: `/blog/`
   - Individual posts: `/blog/post-slug/` (slug generated from title)

### Writing a New Blog Post

1. **Create a new Markdown file** in `src/blog/posts/`:
   ```bash
   touch src/blog/posts/my-new-post.md
   ```

2. **Add frontmatter** at the top of the file:
   ```markdown
   ---
   title: "Your Post Title"
   description: "A short description for SEO and the listing page (150-160 chars)"
   date: 2025-12-14
   tags: ["blog"]
   layout: layouts/blog-post.njk
   permalink: "/blog/{{ title | slugify }}/"
   ---
   ```

3. **Write your content** in Markdown below the frontmatter:
   ```markdown
   ## Introduction

   Your blog post content here...

   - Lists work
   - Multiple items supported

   **Bold** and *italic* text supported.

   \`\`\`javascript
   // Code blocks work too
   console.log("Hello world");
   \`\`\`
   ```

4. **Build and preview**:
   ```bash
   npm run watch
   # Visit http://localhost:8080/blog/
   ```

### Blog Post Frontmatter Fields

| Field | Required | Description |
|-------|----------|-------------|
| `title` | Yes | Post title displayed on listing and post page |
| `description` | Yes | Short excerpt for SEO and blog listing preview |
| `date` | Yes | Publication date (YYYY-MM-DD format) - used for sorting |
| `tags` | Yes | Must include `["blog"]` to add post to collection |
| `layout` | Yes | Should be `layouts/blog-post.njk` |
| `permalink` | Yes | URL structure - use `"/blog/{{ title | slugify }}/"` for clean URLs |

### Blog Styling

- **Listing Page**: Vertical list layout with post cards showing date, title, description, and author info
- **Post Page**: Centered column (max-width) with Typography plugin styling for Markdown content
- **Author Info**: Displays your photo (`alex_profile.jpg`), name (from `client.name`), and "Rails Developer" title

### Blog Navigation

The blog is accessible via:
- Header navigation link (desktop and mobile)
- Direct URL: `/blog/`
- Individual posts: `/blog/post-title-slug/`

## Deployment

Deploy to server using the deployment script:

```bash
./deploy.sh
```

This script:
1. Builds the site (`npm run build`)
2. Uses rsync to copy `dist/` to the server at `69.164.204.88:/var/www/alexanderkey.com`
