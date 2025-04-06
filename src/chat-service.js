// chat-service.js - Handle chat storage with Supabase
const { supabase } = require('./client');
const authService = require('./auth-service');

class ChatService {
  /**
   * Save a chat message exchange to Supabase
   * @param {string} modelName - Name of the LLM model used
   * @param {string} prompt - User's prompt
   * @param {string} response - AI response
   * @returns {Promise<object>} Result of the save operation
   */
  async saveMessage(modelName, prompt, response) {
    try {
      const user = authService.getCurrentUser();
      
      if (!user) {
        throw new Error('User not authenticated');
      }

      const { data, error } = await supabase
        .from('queries')
        .insert({
          user_id: user.id,
          model_name: modelName,
          prompt,
          response,
        });

      if (error) throw error;
      return { success: true, data };
    } catch (error) {
      console.error('Error saving message:', error);
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

      const { data, error } = await supabase
        .from('queries')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) throw error;
      return { success: true, data };
    } catch (error) {
      console.error('Error fetching chat history:', error);
      return { error: error.message };
    }
  }

  /**
   * Group chat history by conversation
   * This is a utility function that groups messages by their timestamp proximity
   * to create conversation groups (adjust time threshold as needed)
   * @param {Array} messages - Array of message objects
   * @returns {Array} Grouped chat history
   */
  groupChatHistory(messages) {
    if (!messages || messages.length === 0) return [];
    
    // Sort messages by created_at
    const sortedMessages = [...messages].sort((a, b) => 
      new Date(a.created_at) - new Date(b.created_at)
    );

    const conversations = [];
    let currentConversation = {
      id: `conv-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
      title: this.generateChatTitle(sortedMessages[0].prompt),
      messages: [],
      created_at: sortedMessages[0].created_at,
    };

    // Time threshold for grouping (30 minutes in milliseconds)
    const timeThreshold = 30 * 60 * 1000;
    let lastTimestamp = new Date(sortedMessages[0].created_at).getTime();

    for (let i = 0; i < sortedMessages.length; i += 2) {
      const promptMsg = sortedMessages[i];
      const responseMsg = sortedMessages[i + 1];
      
      // Skip if we don't have a complete prompt-response pair
      if (!responseMsg) continue;
      
      const currentTimestamp = new Date(promptMsg.created_at).getTime();
      
      // If time gap is too large, start a new conversation
      if (currentTimestamp - lastTimestamp > timeThreshold) {
        // Save the current conversation if it has messages
        if (currentConversation.messages.length > 0) {
          conversations.push(currentConversation);
        }
        
        // Create a new conversation
        currentConversation = {
          id: `conv-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
          title: this.generateChatTitle(promptMsg.prompt),
          messages: [],
          created_at: promptMsg.created_at,
        };
      }

      // Add message pair to current conversation
      currentConversation.messages.push({
        type: 'user',
        content: promptMsg.prompt,
        timestamp: promptMsg.created_at,
      });
      
      currentConversation.messages.push({
        type: 'bot',
        content: responseMsg.response,
        model: responseMsg.model_name,
        timestamp: responseMsg.created_at,
      });

      lastTimestamp = currentTimestamp;
    }

    // Add the last conversation if it has messages
    if (currentConversation.messages.length > 0) {
      conversations.push(currentConversation);
    }
    
    return conversations;
  }

  /**
   * Generate a title for a chat based on the first message
   * @param {string} firstMessage - The first message in the chat
   * @returns {string} Generated title
   */
  generateChatTitle(firstMessage) {
    // Limit to first 5 words with ellipsis if longer
    const words = firstMessage.split(' ');
    return words.slice(0, 5).join(' ') + (words.length > 5 ? '...' : '');
  }
}

module.exports = new ChatService();