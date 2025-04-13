// message-formatter-math.js - Enhanced message formatter with math rendering support
const { marked } = require('marked');
const { JSDOM } = require('jsdom');
const createDOMPurify = require('dompurify');
const katex = require('katex');

class MathMessageFormatter {
  constructor() {
    // Create DOMPurify instance with JSDOM window
    const window = new JSDOM('').window;
    this.DOMPurify = createDOMPurify(window);
    
    // Configure marked options with math support
    const renderer = new marked.Renderer();
    
    // Store original paragraph renderer to wrap it with math parsing
    const originalParagraph = renderer.paragraph.bind(renderer);
    
    // Override paragraph renderer to handle math expressions
    renderer.paragraph = (text) => {
      // Process inline and block math before sending to original renderer
      const processedText = this.processMathInText(text);
      return originalParagraph(processedText);
    };
    
    marked.setOptions({
      renderer: renderer,
      gfm: true, // GitHub Flavored Markdown
      breaks: true, // Convert \n to <br>
      headerIds: false, // Don't add IDs to headers
      mangle: false, // Don't encode HTML entities
      pedantic: false, // Don't conform to original Markdown spec exactly
      silent: true, // Suppress errors
      smartLists: true, // Use smarter list behavior
      smartypants: true, // Use "smart" typographic punctuation
      highlight: this.highlightCode.bind(this) // Use syntax highlighting function
    });

    // Configure DOMPurify options - updated to allow math elements
    this.purifyConfig = {
      ALLOWED_TAGS: [
        'b', 'i', 'em', 'strong', 'a', 'p', 'ul', 'ol', 'li', 'br', 'pre', 'code',
        'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'blockquote', 'img', 'hr',
        'table', 'thead', 'tbody', 'tr', 'th', 'td', 'sup', 'sub', 'dl', 'dt', 'dd',
        'div', 'span', 'kbd', 'math', 'annotation', 'semantics', 'mrow', 'mn', 'mo', 
        'mi', 'msup', 'msub', 'mfrac', 'mtext', 'svg', 'path', 'g'
      ],
      ALLOWED_ATTR: [
        'href', 'class', 'target', 'title', 'rel', 'src', 'alt', 'data-language',
        'style', 'viewBox', 'd', 'fill', 'stroke', 'xmlns', 'width', 'height',
        'fill-rule', 'clip-rule', 'aria-hidden', 'data-math'
      ],
      FORBID_TAGS: ['script', 'iframe', 'form', 'input', 'button', 'textarea'],
      ADD_ATTR: ['target'], // Add target="_blank" to links
      FORBID_ATTR: ['onerror', 'onload', 'onclick', 'onmouseover'],
      ALLOW_DATA_ATTR: true,
      USE_PROFILES: { html: true, svg: true, mathMl: true }
    };

    // Log successful initialization
    console.log('Enhanced MessageFormatter initialized with Marked, DOMPurify, and KaTeX');
  }

  /**
   * Process math expressions in text
   * @param {string} text - The text potentially containing math expressions
   * @returns {string} - Text with math expressions rendered
   */
  processMathInText(text) {
    try {
      // Handle display mode (block) math: $$ ... $$
      text = text.replace(/\$\$(.*?)\$\$/g, (_, math) => {
        try {
          return katex.renderToString(math, { displayMode: true });
        } catch (err) {
          console.error('KaTeX error (display mode):', err);
          return `<div class="math-error">Error rendering math: ${math}</div>`;
        }
      });

      // Handle inline math: $ ... $
      // But avoid parsing currency like $50
      text = text.replace(/\$(\S.*?\S)\$/g, (_, math) => {
        try {
          return katex.renderToString(math, { displayMode: false });
        } catch (err) {
          console.error('KaTeX error (inline):', err);
          return `<span class="math-error">Error rendering math: ${math}</span>`;
        }
      });

      return text;
    } catch (error) {
      console.error('Error processing math in text:', error);
      return text;
    }
  }

  /**
   * Formats a message using Markdown and sanitizes the output
   * @param {string} message - The message to format
   * @returns {string} - The formatted and sanitized HTML
   */
  formatMessage(message) {
    try {
      if (!message || typeof message !== 'string') {
        console.warn('Invalid message received for formatting:', message);
        return message || '';
      }

      // First parse the message as Markdown
      const htmlContent = marked.parse(message);
      
      // Then sanitize the HTML to prevent XSS attacks
      const sanitizedHtml = this.DOMPurify.sanitize(htmlContent, this.purifyConfig);
      
      return sanitizedHtml;
    } catch (error) {
      console.error('Error formatting message:', error);
      // Return the original message as fallback
      return message;
    }
  }

  /**
   * Simple syntax highlighting function (can be expanded later)
   * @param {string} code - The code to highlight
   * @param {string} language - The language of the code
   * @returns {string} - The highlighted code HTML
   */
  highlightCode(code, language) {
    try {
      // Basic syntax highlighting by adding a class
      return `<code class="language-${language || 'text'}" data-language="${language || 'text'}">${code}</code>`;
    } catch (error) {
      console.error('Error highlighting code:', error);
      return code;
    }
  }

  /**
   * Render plain text safely (fallback)
   * @param {string} text - The text to render
   * @returns {string} - The text as safe HTML
   */
  renderPlainText(text) {
    try {
      if (!text || typeof text !== 'string') return '';
      
      // Convert plain text to HTML (escaping special characters and preserving line breaks)
      const escaped = text
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;')
        .replace(/\n/g, '<br>');
      
      return escaped;
    } catch (error) {
      console.error('Error rendering plain text:', error);
      return text;
    }
  }
}

module.exports = new MathMessageFormatter();