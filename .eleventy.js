const { DateTime } = require("luxon");
const fs = require("fs");
const path = require("path");
const markdownIt = require("markdown-it");
const markdownItAnchor = require("markdown-it-anchor");

module.exports = function(eleventyConfig) {
  // Copy static files
  eleventyConfig.addPassthroughCopy("src/css");
  eleventyConfig.addPassthroughCopy("src/js");
  eleventyConfig.addPassthroughCopy("content/**/images");
  eleventyConfig.addPassthroughCopy("public");

  // Set up Markdown
  const md = markdownIt({
    html: true,
    breaks: true,
    linkify: true
  }).use(markdownItAnchor, {
    permalink: markdownItAnchor.permalink.ariaHidden({
      placement: "after"
    })
  });

  eleventyConfig.setLibrary("md", md);

  // Add markdown filter
  eleventyConfig.addFilter("markdown", function(content) {
    return md.render(content);
  });

  // Date filters
  eleventyConfig.addFilter("readableDate", dateObj => {
    return DateTime.fromJSDate(dateObj, {zone: 'utc'}).toFormat("dd LLL yyyy");
  });

  eleventyConfig.addFilter("htmlDateString", (dateObj) => {
    return DateTime.fromJSDate(dateObj, {zone: 'utc'}).toFormat('yyyy-LL-dd');
  });

  // Slug filter
  eleventyConfig.addFilter("slug", (str) => {
    return str.toLowerCase().replace(/[^\w\s-]/g, '').replace(/[\s_-]+/g, '-').replace(/^-+|-+$/g, '');
  });

  // Collection for tabs (main categories)
  eleventyConfig.addCollection("tabs", function(collection) {
    const contentDir = "./content";
    const tabs = [];
    
    try {
      const tabDirs = fs.readdirSync(contentDir, { withFileTypes: true })
        .filter(dirent => dirent.isDirectory())
        .map(dirent => dirent.name);

      tabDirs.forEach(tabName => {
        const tabPath = path.join(contentDir, tabName);
        const items = [];
        
        try {
          const itemDirs = fs.readdirSync(tabPath, { withFileTypes: true })
            .filter(dirent => dirent.isDirectory())
            .map(dirent => dirent.name);

          itemDirs.forEach(itemName => {
            const itemPath = path.join(tabPath, itemName);
            const indexPath = path.join(itemPath, "index.md");
            
            if (fs.existsSync(indexPath)) {
              const content = fs.readFileSync(indexPath, "utf-8");
              const frontMatterMatch = content.match(/^---\s*\n(.*?)\n---\s*\n(.*)$/s);
              
              if (frontMatterMatch) {
                const frontMatter = frontMatterMatch[1];
                const body = frontMatterMatch[2];
                
                const item = {
                  name: itemName,
                  slug: itemName.toLowerCase().replace(/[^\w\s-]/g, '').replace(/[\s_-]+/g, '-').replace(/^-+|-+$/g, ''),
                  content: body,
                  tabSlug: tabName.toLowerCase().replace(/[^\w\s-]/g, '').replace(/[\s_-]+/g, '-').replace(/^-+|-+$/g, '')
                };
                
                // Parse front matter
                frontMatter.split('\n').forEach(line => {
                  const match = line.match(/^([^:]+):\s*"?([^"]*)"?$/);
                  if (match) {
                    item[match[1].trim()] = match[2].trim();
                  }
                });
                
                items.push(item);
              }
            }
          });
        } catch (err) {
          console.log(`Error reading items in ${tabName}:`, err.message);
        }
        
        tabs.push({
          name: tabName,
          slug: tabName.toLowerCase().replace(/[^\w\s-]/g, '').replace(/[\s_-]+/g, '-').replace(/^-+|-+$/g, ''),
          items: items
        });
      });
    } catch (err) {
      console.log("Error reading content directory:", err.message);
    }
    
    return tabs;
  });

  // Collection for all items
  eleventyConfig.addCollection("allItems", function(collection) {
    const contentDir = "./content";
    const allItems = [];
    
    try {
      const tabDirs = fs.readdirSync(contentDir, { withFileTypes: true })
        .filter(dirent => dirent.isDirectory())
        .map(dirent => dirent.name);

      tabDirs.forEach(tabName => {
        const tabPath = path.join(contentDir, tabName);
        
        try {
          const itemDirs = fs.readdirSync(tabPath, { withFileTypes: true })
            .filter(dirent => dirent.isDirectory())
            .map(dirent => dirent.name);

          itemDirs.forEach(itemName => {
            const itemPath = path.join(tabPath, itemName);
            const indexPath = path.join(itemPath, "index.md");
            
            if (fs.existsSync(indexPath)) {
              const content = fs.readFileSync(indexPath, "utf-8");
              const frontMatterMatch = content.match(/^---\s*\n(.*?)\n---\s*\n(.*)$/s);
              
              if (frontMatterMatch) {
                const frontMatter = frontMatterMatch[1];
                const body = frontMatterMatch[2];
                
                const item = {
                  name: itemName,
                  slug: itemName.toLowerCase().replace(/[^\w\s-]/g, '').replace(/[\s_-]+/g, '-').replace(/^-+|-+$/g, ''),
                  content: body,
                  tab: tabName,
                  tabSlug: tabName.toLowerCase().replace(/[^\w\s-]/g, '').replace(/[\s_-]+/g, '-').replace(/^-+|-+$/g, '')
                };
                
                // Parse front matter
                frontMatter.split('\n').forEach(line => {
                  const match = line.match(/^([^:]+):\s*"?([^"]*)"?$/);
                  if (match) {
                    item[match[1].trim()] = match[2].trim();
                  }
                });
                
                allItems.push(item);
              }
            }
          });
        } catch (err) {
          console.log(`Error reading items in ${tabName}:`, err.message);
        }
      });
    } catch (err) {
      console.log("Error reading content directory:", err.message);
    }
    
    return allItems;
  });

  return {
    dir: {
      input: "src",
      includes: "_includes",
      data: "_data",
      output: "docs"
    },
    markdownTemplateEngine: "njk",
    htmlTemplateEngine: "njk",
    dataTemplateEngine: "njk"
  };
};
