// markdown-renderer.js - Handles markdown parsing and rendering for rich text
const { marked } = require('marked');
const DOMPurify = require('dompurify');
const hljs = require('highlight.js');

// Configure marked options
marked.setOptions({
  renderer: new marked.Renderer(),
  highlight: function(code, lang) {
    const language = hljs.getLanguage(lang) ? lang : 'plaintext';
    return hljs.highlight(code, { language }).value;
  },
  langPrefix: 'hljs language-', // highlight.js css expects a top-level 'hljs' class
  pedantic: false,
  gfm: true,
  breaks: true,  // Convert line breaks to <br>
  sanitize: false, // We'll use DOMPurify for sanitization
  smartypants: true, // Use smart quotes and other typographic enhancements
  xhtml: false
});

class MarkdownRenderer {
  /**
   * Convert markdown text to sanitized HTML
   * @param {string} markdownText - The markdown text to render
   * @returns {string} - Sanitized HTML
   */
  static render(markdownText) {
    if (!markdownText) return '';
    
    try {
      // Convert markdown to HTML
      const rawHtml = marked.parse(markdownText);
      
      // Sanitize HTML to prevent XSS attacks
      const sanitizedHtml = DOMPurify.sanitize(rawHtml, {
        ADD_ATTR: ['target'], // Allow target attribute for links
        FORBID_TAGS: ['style', 'iframe', 'script'], // Forbid potentially dangerous tags
        FORBID_ATTR: ['style'], // Forbid style attributes (use CSS classes instead)
      });
      
      return sanitizedHtml;
    } catch (error) {
      console.error('Error rendering markdown:', error);
      // Fallback to plain text if there's an error
      return markdownText.replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/\n/g, '<br>');
    }
  }
  
  /**
   * Check if text contains markdown formatting
   * @param {string} text - The text to check
   * @returns {boolean} - True if the text contains markdown
   */
  static containsMarkdown(text) {
    if (!text) return false;
    
    // Simple patterns to detect common markdown elements
    const markdownPatterns = [
      /[*_~`].*[*_~`]/,       // Inline formatting (*bold*, _italic_, etc.)
      /^#{1,6}\s/m,            // Headers
      /^>\s/m,                 // Blockquotes
      /^-\s/m,                 // Unordered lists
      /^[0-9]+\.\s/m,          // Ordered lists
      /\[.*?\]\(.*?\)/,        // Links
      /!\[.*?\]\(.*?\)/,       // Images
      /^```[a-z]*$/m,          // Code blocks
      /^\|.*\|.*\|/m,          // Tables
      /^---$/m,                // Horizontal rules
    ];
    
    return markdownPatterns.some(pattern => pattern.test(text));
  }
}

module.exports = MarkdownRenderer;