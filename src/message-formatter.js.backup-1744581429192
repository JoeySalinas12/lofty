// message-formatter.js - Handle message formatting and sanitization
const { marked } = require('marked');
const { JSDOM } = require('jsdom');
const createDOMPurify = require('dompurify');

class MessageFormatter {
  constructor() {
    // Create DOMPurify instance with JSDOM window
    const window = new JSDOM('').window;
    this.DOMPurify = createDOMPurify(window);
    
    // Configure marked options
    marked.setOptions({
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

    // Configure DOMPurify options
    this.purifyConfig = {
      ALLOWED_TAGS: [
        'b', 'i', 'em', 'strong', 'a', 'p', 'ul', 'ol', 'li', 'br', 'pre', 'code',
        'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'blockquote', 'img', 'hr',
        'table', 'thead', 'tbody', 'tr', 'th', 'td', 'sup', 'sub', 'dl', 'dt', 'dd',
        'div', 'span', 'kbd'
      ],
      ALLOWED_ATTR: [
        'href', 'class', 'target', 'title', 'rel', 'src', 'alt', 'data-language'
      ],
      FORBID_TAGS: ['style', 'script', 'iframe', 'form', 'input', 'button', 'textarea'],
      ADD_ATTR: ['target'], // Add target="_blank" to links
      FORBID_ATTR: ['onerror', 'onload', 'onclick', 'onmouseover'],
      ALLOW_DATA_ATTR: false,
      USE_PROFILES: { html: true }
    };

    // Log successful initialization
    console.log('MessageFormatter initialized with Marked and DOMPurify');
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
      // Later you could add a more sophisticated library like highlight.js
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

module.exports = new MessageFormatter();
