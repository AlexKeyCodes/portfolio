const sitemap = require('@quasibit/eleventy-plugin-sitemap')
const eleventyPluginFilesMinifier = require('@sherby/eleventy-plugin-files-minifier')
const eleventyNavigationPlugin = require('@11ty/eleventy-navigation')

module.exports = function (eleventyConfig) {
  // Add date filters
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

  // Add plugins
  eleventyConfig.addPlugin(sitemap, {
    sitemap: {
      hostname: 'https://www.alexanderkey.com'
    }
  })
  eleventyConfig.addPlugin(eleventyPluginFilesMinifier)
  eleventyConfig.addPlugin(eleventyNavigationPlugin)

  // Create blog posts collection
  eleventyConfig.addCollection("blog", function(collectionApi) {
    return collectionApi.getFilteredByTag("blog").sort((a, b) => {
      return b.date - a.date; // Sort by date, newest first
    });
  });

  // Passthrough copy for assets
  eleventyConfig.addPassthroughCopy('src/assets')
  eleventyConfig.addPassthroughCopy('dist/css/styles.css')

  return {
    dir: {
      input: 'src',
      output: 'dist',
      includes: '_includes',
      data: '_data'
    },
    templateFormats: ['njk', 'md', 'html'],
    htmlTemplateEngine: 'njk',
    markdownTemplateEngine: 'njk',
    dataTemplateEngine: 'njk'
  }
}
