// Wait for the DOM to be fully loaded
document.addEventListener('DOMContentLoaded', () => {
    // Store chat history - start with just one empty chat
    const chatHistory = {
      'chat-1': {
        title: 'New Chat',
        mode: 'reasoning',
        messages: []
      }
    };
  
    let currentChatId = 'chat-1';
    let contextMenuTargetId = null;
  
    // Get UI elements
    const modeDropdown = document.getElementById('mode-dropdown');
    const chatMessages = document.getElementById('chat-messages');
    const messageInput = document.getElementById('message-input-field');
    const sendButton = document.getElementById('send-message-btn');
    const newChatButton = document.getElementById('new-chat-btn');
    const currentChatTitle = document.querySelector('.current-chat-title');
    const contextMenu = document.getElementById('context-menu');
    const deleteChat = document.getElementById('delete-chat');
    
    // Set up event listeners for initial chat item
    setupChatItemListeners();
    
    // Function to set up event listeners for chat history items
    function setupChatItemListeners() {
      const chatHistoryItems = document.querySelectorAll('.sidebar-item');
      chatHistoryItems.forEach(item => {
        item.addEventListener('click', (event) => {
          const chatId = event.currentTarget.dataset.chatId;
          loadChat(chatId);
        });
        
        // Add right-click context menu
        item.addEventListener('contextmenu', (event) => {
          event.preventDefault();
          const chatId = event.currentTarget.dataset.chatId;
          contextMenuTargetId = chatId;
          
          // Position context menu at mouse pointer
          contextMenu.style.display = 'block';
          contextMenu.style.top = `${event.pageY}px`;
          contextMenu.style.left = `${event.pageX}px`;
        });
      });
    }
    
    // Close context menu when clicking elsewhere
    document.addEventListener('click', () => {
      contextMenu.style.display = 'none';
    });
    
    // Delete chat when clicking the delete option
    deleteChat.addEventListener('click', () => {
      if (contextMenuTargetId) {
        // Find section containing this chat
        const chatItem = document.querySelector(`[data-chat-id="${contextMenuTargetId}"]`);
        if (chatItem) {
          chatItem.parentNode.removeChild(chatItem);
          
          // Delete from object
          delete chatHistory[contextMenuTargetId];
          
          // If current chat is deleted, load first available chat or create new one
          if (contextMenuTargetId === currentChatId) {
            const firstChatId = Object.keys(chatHistory)[0];
            if (firstChatId) {
              loadChat(firstChatId);
            } else {
              createNewChat();
            }
          }
        }
        
        // Hide context menu
        contextMenu.style.display = 'none';
      }
    });
    
    // Listen for mode changes
    modeDropdown.addEventListener('change', (event) => {
      const selectedMode = event.target.value;
      window.electronAPI.changeMode(selectedMode);
      chatHistory[currentChatId].mode = selectedMode;
      updateUIForMode(selectedMode);
    });
    
    // Listen for new message submission
    sendButton.addEventListener('click', sendMessage);
    messageInput.addEventListener('keypress', (event) => {
      if (event.key === 'Enter') {
        sendMessage();
      }
    });
    
    // Listen for new chat button click
    newChatButton.addEventListener('click', createNewChat);
    
    // Function to load a specific chat
    function loadChat(chatId) {
      // Update current chat ID
      currentChatId = chatId;
      
      // Update active chat in sidebar
      document.querySelectorAll('.sidebar-item').forEach(item => {
        item.classList.remove('active');
      });
      document.querySelector(`[data-chat-id="${chatId}"]`).classList.add('active');
      
      // Get chat data
      const chat = chatHistory[chatId];
      
      // Update title
      currentChatTitle.textContent = chat.title;
      
      // Update mode dropdown
      modeDropdown.value = chat.mode;
      updateUIForMode(chat.mode);
      
      // Clear and update chat messages
      chatMessages.innerHTML = '';
      chat.messages.forEach(message => {
        appendMessage(message.type, message.content);
      });
      
      // Scroll to bottom
      chatMessages.scrollTop = chatMessages.scrollHeight;
      
      // Send IPC message to main process
      window.electronAPI.loadChat(chatId);
    }
    
    // Function to map app modes to LLM models
    function getModeModel(mode) {
      // Map the app mode to specific LLM models
      const modeToModel = {
        'reasoning': 'claude', // Use Claude for reasoning
        'math': 'gemini',      // Use Gemini for math
        'programming': 'gpt'   // Use GPT for programming
      };
      
      return modeToModel[mode] || 'claude'; // Default to Claude if mode not found
    }
    
    // Function to send a new message
    async function sendMessage() {
      const messageText = messageInput.value.trim();
      if (messageText === '') return;
      
      // Add the message to the UI
      appendMessage('user', messageText);
      
      // Add the message to chat history
      chatHistory[currentChatId].messages.push({ type: 'user', content: messageText });
      
      // Clear the input field
      messageInput.value = '';
      
      // Show loading indicator
      const loadingMessage = document.createElement('div');
      loadingMessage.className = 'message bot-message loading';
      loadingMessage.innerHTML = '<div class="message-content">Thinking...</div>';
      chatMessages.appendChild(loadingMessage);
      chatMessages.scrollTop = chatMessages.scrollHeight;
      
      try {
        // Get the appropriate model based on the current mode
        const currentMode = chatHistory[currentChatId].mode;
        const modelToUse = getModeModel(currentMode);
        
        // Query the LLM through the IPC bridge
        const botResponse = await window.electronAPI.queryLLM(modelToUse, messageText);
        
        // Remove loading indicator
        chatMessages.removeChild(loadingMessage);
        
        // Add the response to the UI
        appendMessage('bot', botResponse);
        
        // Add the response to chat history
        chatHistory[currentChatId].messages.push({ type: 'bot', content: botResponse });
        
      } catch (error) {
        // Remove loading indicator
        chatMessages.removeChild(loadingMessage);
        
        // Show error message
        const errorMessage = `Sorry, there was an error: ${error.message}`;
        appendMessage('bot', errorMessage);
        chatHistory[currentChatId].messages.push({ type: 'bot', content: errorMessage });
      }
      
      // Scroll to the bottom
      chatMessages.scrollTop = chatMessages.scrollHeight;
      
      // Create a new item in the sidebar for this chat if it's the first message
      if (chatHistory[currentChatId].messages.length === 1) {
        // Update the chat title to be based on the first message
        updateChatTitle(currentChatId, truncateText(messageText, 30));
      }
    }
    
    // Function to create a new chat
    function createNewChat() {
      // Generate a new chat ID
      const newChatId = `chat-${Object.keys(chatHistory).length + 1}`;
      
      // Add to chat history
      chatHistory[newChatId] = {
        title: 'New Chat',
        mode: modeDropdown.value,
        messages: []
      };
      
      // Add to sidebar
      const todayChats = document.getElementById('today-chats');
      const newChatItem = document.createElement('div');
      newChatItem.className = 'sidebar-item';
      newChatItem.setAttribute('data-chat-id', newChatId);
      newChatItem.textContent = 'New Chat';
      
      // Add click event and context menu event
      newChatItem.addEventListener('click', () => loadChat(newChatId));
      newChatItem.addEventListener('contextmenu', (event) => {
        event.preventDefault();
        contextMenuTargetId = newChatId;
        
        // Position context menu at mouse pointer
        contextMenu.style.display = 'block';
        contextMenu.style.top = `${event.pageY}px`;
        contextMenu.style.left = `${event.pageX}px`;
      });
      
      todayChats.appendChild(newChatItem);
      
      // Load the new chat
      loadChat(newChatId);
    }
    
    // Function to append a message to the chat
    function appendMessage(type, content) {
      const messageDiv = document.createElement('div');
      messageDiv.className = `message ${type}-message`;
      
      const contentDiv = document.createElement('div');
      contentDiv.className = 'message-content';
      contentDiv.textContent = content;
      messageDiv.appendChild(contentDiv);
      
      chatMessages.appendChild(messageDiv);
      chatMessages.scrollTop = chatMessages.scrollHeight;
    }
    
    // Function to update the chat title
    function updateChatTitle(chatId, newTitle) {
      chatHistory[chatId].title = newTitle;
      document.querySelector(`[data-chat-id="${chatId}"]`).textContent = newTitle;
      if (chatId === currentChatId) {
        currentChatTitle.textContent = newTitle;
      }
    }
    
    // Function to update UI based on the selected mode
    function updateUIForMode(mode) {
      const container = document.querySelector('.container');
      
      // Reset classes
      container.classList.remove('mode-reasoning', 'mode-math', 'mode-programming');
      
      // Add class for the selected mode
      container.classList.add(`mode-${mode}`);
      
      // Update input placeholder based on mode
      switch (mode) {
        case 'reasoning':
          messageInput.placeholder = 'Ask a reasoning question (Claude)...';
          break;
        case 'math':
          messageInput.placeholder = 'Ask a math question (Gemini)...';
          break;
        case 'programming':
          messageInput.placeholder = 'Ask a programming question (GPT)...';
          break;
        default:
          messageInput.placeholder = 'Message ChatGPT';
      }
    }
    
    // Helper function to truncate text
    function truncateText(text, maxLength) {
      if (text.length <= maxLength) return text;
      return text.substring(0, maxLength) + '...';
    }
    
    // Initialize with the first chat
    loadChat(currentChatId);
  });