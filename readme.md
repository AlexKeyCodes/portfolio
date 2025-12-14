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

## Deployment

Deploy to server using the deployment script:

```bash
./deploy.sh
```

This script:
1. Builds the site (`npm run build`)
2. Uses rsync to copy `dist/` to the server at `69.164.204.88:/var/www/alexanderkey.com`
