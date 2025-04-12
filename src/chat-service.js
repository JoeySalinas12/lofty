// chat-service.js - Handle chat storage with Supabase
const { supabase } = require('./client');
const authService = require('./auth-service');
const messageFormatter = require('./message-formatter');

class ChatService {
  /**
   * Save a chat message exchange to Supabase
   * @param {string} modelName - Name of the LLM model used
   * @param {string} prompt - User's prompt
   * @param {string} response - AI response
   * @param {string} chatId - The ID of the current chat
   * @returns {Promise<object>} Result of the save operation
   */
  async saveMessage(modelName, prompt, response, chatId) {
    try {
      const user = authService.getCurrentUser();
      
      if (!user) {
        throw new Error('User not authenticated');
      }

      // Store the raw response which includes the markdown
      const { data, error } = await supabase
        .from('queries')
        .insert({
          user_id: user.id,
          model_name: modelName,
          prompt,
          response,
          chat_id: chatId,
        });

      if (error) throw error;
      return { success: true, data };
    } catch (error) {
      console.error('Error saving message:', error);
      return { error: error.message };
    }
  }

  /**
   * Delete all messages associated with a specific chat ID
   * @param {string} chatId - The ID of the chat to delete
   * @returns {Promise<object>} Result of the delete operation
   */
  async deleteChat(chatId) {
    try {
      const user = authService.getCurrentUser();
      
      if (!user) {
        throw new Error('User not authenticated');
      }

      // Delete all messages associated with this chat_id for the current user
      const { data, error } = await supabase
        .from('queries')
        .delete()
        .eq('user_id', user.id)
        .eq('chat_id', chatId);

      if (error) throw error;
      return { success: true, data };
    } catch (error) {
      console.error('Error deleting chat:', error);
      return { error: error.message };
    }
  }

  /**
   * Get chat history for the current user
   * @param {number} limit - Maximum number of records to return
   * @returns {Promise<object>} Chat history data
   */
  async getChatHistory(limit = 100) {
    try {
      const user = authService.getCurrentUser();
      
      if (!user) {
        throw new Error('User not authenticated');
      }

      // First get distinct chat_ids to know what conversations exist
      const { data: distinctChats, error: distinctError } = await supabase
        .from('queries')
        .select('chat_id')
        .eq('user_id', user.id)
        .not('chat_id', 'is', null)
        .order('created_at', { ascending: false })
        .limit(limit);
        
      if (distinctError) throw distinctError;
      
      // Get unique chat_ids (filter out nulls and duplicates)
      const uniqueChatIds = [...new Set(distinctChats
        .map(item => item.chat_id)
        .filter(id => id !== null))];
        
      console.log(`Found ${uniqueChatIds.length} unique chat conversations`);
      
      // Now get all messages for these chats
      const { data, error } = await supabase
        .from('queries')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: true })
        .limit(limit);

      if (error) throw error;
      
      // Log the results for debugging
      console.log(`Retrieved ${data.length} total message records`);
      
      return { success: true, data, uniqueChatIds };
    } catch (error) {
      console.error('Error fetching chat history:', error);
      return { error: error.message };
    }
  }

  /**
   * Group chat history by conversation
   * This function groups messages by their chat_id 
   * @param {Array} messages - Array of message objects
   * @param {Array} uniqueChatIds - List of unique chat IDs
   * @returns {Array} Grouped chat history
   */
  groupChatHistory(messages, uniqueChatIds = []) {
    if (!messages || messages.length === 0) return [];
    
    // Create a map to hold conversations by chat_id
    const chatGroups = {};
    
    // Initialize empty conversations for each unique chat_id
    uniqueChatIds.forEach(chatId => {
      chatGroups[chatId] = {
        id: chatId,
        title: '',  // Will be set from first message
        messages: [],
        created_at: null  // Will be set from first message
      };
    });
    
    // Group messages by chat_id and organize them by prompt/response pairs
    // First sort messages by chat_id and created_at
    const sortedMessages = [...messages].sort((a, b) => {
      // First sort by chat_id
      if (a.chat_id && b.chat_id) {
        if (a.chat_id !== b.chat_id) {
          return a.chat_id.localeCompare(b.chat_id);
        }
      } else if (a.chat_id) {
        return -1;
      } else if (b.chat_id) {
        return 1;
      }
      
      // Then sort by created_at
      return new Date(a.created_at) - new Date(b.created_at);
    });
    
    // Process messages in pairs
    for (let i = 0; i < sortedMessages.length; i++) {
      const message = sortedMessages[i];
      const chatId = message.chat_id;
      
      // Skip messages without chat_id
      if (!chatId) continue;
      
      // If this is a new chat_id we haven't seen before, initialize it
      if (!chatGroups[chatId]) {
        chatGroups[chatId] = {
          id: chatId,
          title: '',
          messages: [],
          created_at: null
        };
      }
      
      // Set the title from the first prompt if not set yet
      if (!chatGroups[chatId].title && message.prompt) {
        chatGroups[chatId].title = this.generateChatTitle(message.prompt);
      }
      
      // Set created_at from the earliest message if not set yet
      if (!chatGroups[chatId].created_at || 
          new Date(message.created_at) < new Date(chatGroups[chatId].created_at)) {
        chatGroups[chatId].created_at = message.created_at;
      }
      
      // Add user message
      chatGroups[chatId].messages.push({
        type: 'user',
        content: message.prompt,
        timestamp: message.created_at,
        formatted: false // User messages are typically not formatted as markdown
      });
      
      // Add bot message if this is a complete pair
      if (message.response) {
        chatGroups[chatId].messages.push({
          type: 'bot',
          content: message.response,
          model: message.model_name,
          timestamp: message.created_at,
          formatted: true // Bot messages should be formatted as markdown
        });
      }
    }
    
    // Convert the map to an array
    const conversations = Object.values(chatGroups);
    
    // Remove any empty conversations or those without titles
    const nonEmptyConversations = conversations.filter(conv => 
      conv.messages.length > 0 && conv.title !== '');
    
    // Sort conversations by created_at (newest first)
    return nonEmptyConversations.sort((a, b) => 
      new Date(b.created_at) - new Date(a.created_at));
  }

  /**
   * Generate a title for a chat based on the first message
   * @param {string} firstMessage - The first message in the chat
   * @returns {string} Generated title
   */
  generateChatTitle(firstMessage) {
    if (!firstMessage) return "Untitled Chat";
    
    // Limit to first 5 words with ellipsis if longer
    const words = firstMessage.split(' ');
    return words.slice(0, 5).join(' ') + (words.length > 5 ? '...' : '');
  }
}

module.exports = new ChatService();