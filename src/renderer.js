// Wait for the DOM to be fully loaded
document.addEventListener('DOMContentLoaded', async () => {
  // First check if user is authenticated
  const isAuthenticated = await window.electronAPI.checkAuth();
  if (!isAuthenticated) {
    window.location.href = 'login.html';
    return;
  }

  // Get current user info
  const currentUser = await window.electronAPI.getCurrentUser();
  updateUserInfo(currentUser);

  // Store chat history - will be populated from Supabase
  let chatHistory = {};
  let currentChatId = null;
  let contextMenuTargetId = null;
  
  // Store model configuration - loaded from settings
  let modelConfig = null;

  // Get UI elements
  const modeDropdown = document.getElementById('mode-dropdown');
  const chatMessages = document.getElementById('chat-messages');
  const messageInput = document.getElementById('message-input-field');
  const sendButton = document.getElementById('send-message-btn');
  const newChatButton = document.getElementById('new-chat-btn');
  const currentChatTitle = document.querySelector('.current-chat-title');
  const contextMenu = document.getElementById('context-menu');
  const deleteChat = document.getElementById('delete-chat');
  const renameChat = document.getElementById('rename-chat');
  const todayChats = document.getElementById('today-chats');
  const sidebarUser = document.querySelector('.sidebar-user');
  const loadingChat = document.getElementById('loading-chat');
  const loadingSidebar = document.getElementById('loading-sidebar');
  const userPopup = document.getElementById('user-popup');
  const logoutBtn = document.getElementById('logout-btn');
  const settingsBtn = document.getElementById('settings-btn');
  const userProfile = document.getElementById('user-profile');
  
  // Load model configuration
  await loadModelConfig();
  
  // Set up user popup toggle
  userProfile.addEventListener('click', (event) => {
    // Toggle popup visibility
    if (userPopup.style.display === 'block') {
      userPopup.style.display = 'none';
    } else {
      userPopup.style.display = 'block';
    }
    
    // Prevent the event from propagating to document
    event.stopPropagation();
  });
  
  // Close user popup when clicking elsewhere
  document.addEventListener('click', (event) => {
    if (!userProfile.contains(event.target) && userPopup.style.display === 'block') {
      userPopup.style.display = 'none';
    }
  });
  
  // Set up logout handler
  logoutBtn.addEventListener('click', async () => {
    await window.electronAPI.logout();
  });
  
  // Set up settings handler
  settingsBtn.addEventListener('click', () => {
    window.electronAPI.openSettings();
    userPopup.style.display = 'none';
  });

  // Add a small buffer before loading the chat to avoid flashing the placeholder content
  await new Promise(resolve => setTimeout(resolve, 300));
  
  // Load chat history from Supabase
  await loadChatHistoryFromSupabase();
  
  // Setup event listeners for chat items
  setupChatItemListeners();
  
  // Function to load model configuration
  async function loadModelConfig() {
    try {
      modelConfig = await window.electronAPI.getModelConfig();
      console.log('Model configuration loaded:', modelConfig);
    } catch (error) {
      console.error('Error loading model configuration:', error);
      modelConfig = {
        reasoning: 'claude',
        math: 'gemini',
        programming: 'gpt'
      };
    }
  }
  
  // Function to load chat history from Supabase
  async function loadChatHistoryFromSupabase() {
    try {
      console.log("Loading chat history from Supabase...");
      const result = await window.electronAPI.getChatHistory();
      
      if (result.success && result.conversations) {
        // Clear existing chat history
        chatHistory = {};
        
        console.log(`Loaded ${result.conversations.length} conversations`);
        
        // Process conversations
        result.conversations.forEach(conversation => {
          // Make sure each conversation gets a unique ID
          const uniqueId = conversation.id || `conv-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`;
          
          // Only add conversations that have messages
          if (conversation.messages && conversation.messages.length > 0) {
            chatHistory[uniqueId] = {
              title: conversation.title || "Untitled Chat",
              mode: determineConversationMode(conversation.messages),
              messages: conversation.messages,
              created_at: conversation.created_at
            };
            console.log(`Added conversation: ${uniqueId} with ${conversation.messages.length} messages`);
          }
        });
        
        console.log(`Processed ${Object.keys(chatHistory).length} valid conversations`);
        
        // Update sidebar with chat history - remove loading indicator first
        if (loadingSidebar && loadingSidebar.parentNode) {
          loadingSidebar.parentNode.removeChild(loadingSidebar);
        }
        updateChatSidebar();
        
        // Load the first chat or create a new one if none exists
        if (Object.keys(chatHistory).length > 0) {
          currentChatId = Object.keys(chatHistory)[0];
          loadChat(currentChatId);
          console.log(`Loaded first chat: ${currentChatId}`);
        } else {
          console.log("No existing chats, creating a new one");
          createNewChat();
        }
      } else if (result.error) {
        console.error('Error loading chat history:', result.error);
        
        // Remove loading indicators
        if (loadingSidebar && loadingSidebar.parentNode) {
          loadingSidebar.parentNode.removeChild(loadingSidebar);
        }
        if (loadingChat && loadingChat.parentNode) {
          loadingChat.parentNode.removeChild(loadingChat);
        }
        
        createNewChat();
      } else {
        console.log("No conversations returned, creating a new chat");
        
        // Remove loading indicators
        if (loadingSidebar && loadingSidebar.parentNode) {
          loadingSidebar.parentNode.removeChild(loadingSidebar);
        }
        if (loadingChat && loadingChat.parentNode) {
          loadingChat.parentNode.removeChild(loadingChat);
        }
        
        createNewChat();
      }
    } catch (error) {
      console.error('Error loading chat history:', error);
      
      // Remove loading indicators
      if (loadingSidebar && loadingSidebar.parentNode) {
        loadingSidebar.parentNode.removeChild(loadingSidebar);
      }
      if (loadingChat && loadingChat.parentNode) {
        loadingChat.parentNode.removeChild(loadingChat);
      }
      
      createNewChat();
    }
  }
  
  // Function to determine the mode of a conversation based on messages
  function determineConversationMode(messages) {
    // Look for bot messages that might have model info
    const botMessages = messages.filter(msg => msg.type === 'bot' && msg.model);
    
    if (botMessages.length > 0) {
      // Get the most commonly used model
      const modelCounts = {};
      botMessages.forEach(msg => {
        modelCounts[msg.model] = (modelCounts[msg.model] || 0) + 1;
      });
      
      // Find the most common model
      const mostCommonModel = Object.keys(modelCounts).reduce((a, b) => 
        modelCounts[a] > modelCounts[b] ? a : b
      );
      
      // Map model to mode
      if (mostCommonModel.includes('claude')) return 'reasoning';
      if (mostCommonModel.includes('gemini')) return 'math';
      if (mostCommonModel.includes('gpt')) return 'programming';
    }
    
    // Default to reasoning
    return 'reasoning';
  }
  
  // Function to update the sidebar with chat history
  function updateChatSidebar() {
    // Clear existing chats (except loading indicator)
    const existingChats = todayChats.querySelectorAll('.sidebar-item:not(#loading-sidebar)');
    existingChats.forEach(item => item.remove());
    
    // Sort chats by creation date (newest first)
    const sortedChatIds = Object.keys(chatHistory).sort((a, b) => {
      const dateA = new Date(chatHistory[a].created_at || 0);
      const dateB = new Date(chatHistory[b].created_at || 0);
      return dateB - dateA;
    });
    
    // Add each chat to sidebar
    sortedChatIds.forEach(chatId => {
      const chat = chatHistory[chatId];
      const chatItem = document.createElement('div');
      chatItem.className = 'sidebar-item';
      chatItem.classList.toggle('active', chatId === currentChatId);
      chatItem.setAttribute('data-chat-id', chatId);
      chatItem.textContent = chat.title;
      todayChats.appendChild(chatItem);
    });
    
    // Setup listeners
    setupChatItemListeners();
  }
  
  // Function to update user info in the sidebar
  function updateUserInfo(user) {
    if (!user) return;
    
    const userAvatar = document.querySelector('.user-avatar');
    const userName = document.querySelector('.user-name');
    
    // Set user name (use email if no name available)
    const displayName = user.user_metadata?.name || user.email || 'User';
    userName.textContent = displayName;
    
    // Set avatar initials
    const initials = displayName
      .split(' ')
      .map(n => n[0])
      .join('')
      .substring(0, 2)
      .toUpperCase();
    userAvatar.textContent = initials;
  }
  
  // Function to set up event listeners for chat history items
  function setupChatItemListeners() {
    const chatHistoryItems = document.querySelectorAll('.sidebar-item:not(#loading-sidebar)');
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
  deleteChat.addEventListener('click', async () => {
    if (contextMenuTargetId) {
      try {
        // Delete from Supabase
        const result = await window.electronAPI.deleteChat(contextMenuTargetId);
        
        if (result.error) {
          console.error('Error deleting chat:', result.error);
          alert(`Failed to delete chat: ${result.error}`);
          contextMenu.style.display = 'none';
          return;
        }
        
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
        
        console.log(`Chat ${contextMenuTargetId} successfully deleted from database`);
      } catch (error) {
        console.error('Error during chat deletion:', error);
        alert('An error occurred while deleting the chat');
      }
      
      // Hide context menu
      contextMenu.style.display = 'none';
    }
  });

  // Rename chat when clicking the rename option
  renameChat.addEventListener('click', () => {
    if (contextMenuTargetId) {
      showRenameInput(contextMenuTargetId);
      
      // Hide context menu
      contextMenu.style.display = 'none';
    }
  });
  
  // Function to show an input field for renaming
  function showRenameInput(chatId) {
    // Find the chat item
    const chatItem = document.querySelector(`[data-chat-id="${chatId}"]`);
    if (!chatItem) return;
    
    // Store the current title
    const currentTitle = chatHistory[chatId].title;
    
    // Replace the content with an input field
    chatItem.innerHTML = '';
    const inputField = document.createElement('input');
    inputField.type = 'text';
    inputField.value = currentTitle;
    inputField.className = 'rename-input';
    inputField.style.width = '90%';
    inputField.style.backgroundColor = '#3a3a3a';
    inputField.style.color = '#fff';
    inputField.style.border = 'none';
    inputField.style.padding = '2px 5px';
    inputField.style.borderRadius = '2px';
    
    chatItem.appendChild(inputField);
    inputField.focus();
    inputField.select();
    
    // Handle input field events
    inputField.addEventListener('blur', () => {
      finishRenaming(chatId, inputField.value);
    });
    
    inputField.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') {
        finishRenaming(chatId, inputField.value);
      }
    });
  }
  
  // Function to finish the renaming process
  function finishRenaming(chatId, newTitle) {
    if (newTitle.trim() !== '') {
      updateChatTitle(chatId, newTitle.trim());
    } else {
      // If empty, revert to previous title
      const chatItem = document.querySelector(`[data-chat-id="${chatId}"]`);
      chatItem.textContent = chatHistory[chatId].title;
    }
  }
  
  // Listen for mode changes
  modeDropdown.addEventListener('change', (event) => {
    const selectedMode = event.target.value;
    window.electronAPI.changeMode(selectedMode);
    
    if (currentChatId && chatHistory[currentChatId]) {
      chatHistory[currentChatId].mode = selectedMode;
    }
    
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
    // Remove loading indicator if it exists
    if (loadingChat && loadingChat.parentNode) {
      loadingChat.parentNode.removeChild(loadingChat);
    }
    
    // Update current chat ID
    currentChatId = chatId;
    
    // Update active chat in sidebar
    document.querySelectorAll('.sidebar-item').forEach(item => {
      item.classList.remove('active');
    });
    
    const activeChatItem = document.querySelector(`[data-chat-id="${chatId}"]`);
    if (activeChatItem) {
      activeChatItem.classList.add('active');
    }
    
    // Get chat data
    const chat = chatHistory[chatId];
    if (!chat) return;
    
    // Update title
    currentChatTitle.textContent = chat.title;
    
    // Update mode dropdown (including logo)
    modeDropdown.value = chat.mode;
    updateUIForMode(chat.mode);
    
    // Clear and update chat messages
    chatMessages.innerHTML = '';
    
    // Add the fade-in class for smooth transition
    chatMessages.classList.add('fade-in');
    
    // Populate with messages
    chat.messages.forEach(message => {
      appendMessage(message.type, message.content, message.formatted);
    });
    
    // Scroll to bottom
    chatMessages.scrollTop = chatMessages.scrollHeight;
    
    // Send IPC message to main process
    window.electronAPI.loadChat(chatId);
    
    // Remove the fade-in class after animation completes
    setTimeout(() => {
      chatMessages.classList.remove('fade-in');
    }, 500);
  }
  
  // Function to map app modes to LLM models
  async function getModeModel(mode) {
    try {
      // Get model from settings
      return await window.electronAPI.getModeModel(mode);
    } catch (error) {
      console.error('Error getting model for mode:', error);
      
      // Use local model config or fallback defaults
      if (modelConfig && modelConfig[mode]) {
        return modelConfig[mode];
      }
      
      // Fallback defaults
      const defaultModels = {
        'reasoning': 'claude',
        'math': 'gemini',
        'programming': 'gpt'
      };
      
      return defaultModels[mode] || 'claude';
    }
  }
  
  // Function to send a new message
  async function sendMessage() {
    const messageText = messageInput.value.trim();
    if (messageText === '') return;
    
    // Add the message to the UI
    appendMessage('user', messageText, false);
    
    // Make sure we have a current chat
    if (!currentChatId || !chatHistory[currentChatId]) {
      createNewChat();
    }
    
    // Add the message to chat history
    chatHistory[currentChatId].messages.push({ 
      type: 'user', 
      content: messageText,
      timestamp: new Date().toISOString(),
      formatted: false
    });
    
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
      const modelToUse = await getModeModel(currentMode);
      
      // Query the LLM through the IPC bridge
      const botResponse = await window.electronAPI.queryLLM(modelToUse, messageText, currentChatId);
      
      // Remove loading indicator
      chatMessages.removeChild(loadingMessage);
      
      // Add the response to the UI with formatting
      appendMessage('bot', botResponse, true);
      
      // Add the response to chat history
      chatHistory[currentChatId].messages.push({ 
        type: 'bot', 
        content: botResponse,
        model: modelToUse,
        timestamp: new Date().toISOString(),
        formatted: true
      });
      
      // Check if this is the first message exchange and update chat title if needed
      if (chatHistory[currentChatId].messages.length === 2 && 
          chatHistory[currentChatId].title === 'New Chat') {
        // Get the first few words for the chat title
        const words = messageText.split(' ');
        const chatTitle = words.slice(0, 5).join(' ') + (words.length > 5 ? '...' : '');
        
        // Update the chat title
        updateChatTitle(currentChatId, chatTitle);
      }
      
    } catch (error) {
      // Remove loading indicator
      chatMessages.removeChild(loadingMessage);
      
      // Show error message
      const errorMessage = `Sorry, there was an error: ${error.message}`;
      appendMessage('bot', errorMessage, false);
      chatHistory[currentChatId].messages.push({ 
        type: 'bot', 
        content: errorMessage,
        timestamp: new Date().toISOString(),
        formatted: false
      });
    }
    
    // Scroll to the bottom
    chatMessages.scrollTop = chatMessages.scrollHeight;
  }
  
  // Function to create a new chat
  function createNewChat() {
    // Generate a new chat ID
    const newChatId = `chat-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
    
    // Add to chat history
    chatHistory[newChatId] = {
      title: 'New Chat',
      mode: modeDropdown.value,
      messages: [],
      created_at: new Date().toISOString()
    };
    
    // Update sidebar - add new chat to the beginning
    const chatItem = document.createElement('div');
    chatItem.className = 'sidebar-item active';
    chatItem.setAttribute('data-chat-id', newChatId);
    chatItem.textContent = 'New Chat';
    
    // Add new chat to the top of the list
    if (todayChats.firstChild) {
      todayChats.insertBefore(chatItem, todayChats.firstChild);
    } else {
      todayChats.appendChild(chatItem);
    }
    
    // Remove active class from any other chat items
    document.querySelectorAll('.sidebar-item').forEach(item => {
      if (item !== chatItem) {
        item.classList.remove('active');
      }
    });
    
    // Setup listener for the new chat item
    chatItem.addEventListener('click', () => loadChat(newChatId));
    chatItem.addEventListener('contextmenu', (event) => {
      event.preventDefault();
      contextMenuTargetId = newChatId;
      contextMenu.style.display = 'block';
      contextMenu.style.top = `${event.pageY}px`;
      contextMenu.style.left = `${event.pageX}px`;
    });
    
    // Update current chat ID
    currentChatId = newChatId;
    
    // Update UI
    chatMessages.innerHTML = '';
    currentChatTitle.textContent = 'New Chat';
  }
  
  // Function to append a message to the chat
  function appendMessage(type, content, formatted = false) {
    const messageDiv = document.createElement('div');
    messageDiv.className = `message ${type}-message`;
    
    const contentDiv = document.createElement('div');
    
    // Check if we should format this message as markdown
    if (formatted && type === 'bot') {
      // Add markdown-content class
      contentDiv.className = 'message-content markdown-content';
      
      // Get formatted content from the main process
      window.electronAPI.formatMarkdown(content)
        .then(formattedContent => {
          contentDiv.innerHTML = formattedContent;
          
          // Add copy buttons to code blocks
          addCopyCodeButtons(contentDiv);
        })
        .catch(error => {
          console.error('Error formatting markdown:', error);
          contentDiv.textContent = content;
        });
    } else {
      // Regular message with plain text
      contentDiv.className = 'message-content';
      contentDiv.textContent = content;
    }
    
    messageDiv.appendChild(contentDiv);
    
    // Add to chat and scroll to bottom
    chatMessages.appendChild(messageDiv);
    chatMessages.scrollTop = chatMessages.scrollHeight;
  }
  
  // Function to add copy buttons to code blocks
  function addCopyCodeButtons(contentElement) {
    // Find all pre elements containing code blocks
    const codeBlocks = contentElement.querySelectorAll('pre');
    
    codeBlocks.forEach(pre => {
      // Create a container for the pre element
      const container = document.createElement('div');
      container.className = 'code-block-container';
      
      // Create copy button
      const copyButton = document.createElement('button');
      copyButton.className = 'copy-code-button';
      copyButton.textContent = 'Copy';
      
      // Add click handler to copy the code
      copyButton.addEventListener('click', () => {
        const code = pre.querySelector('code');
        if (code) {
          // Get text content without HTML tags
          const textToCopy = code.textContent;
          
          // Copy to clipboard
          navigator.clipboard.writeText(textToCopy)
            .then(() => {
              // Indicate success
              copyButton.textContent = 'Copied!';
              setTimeout(() => {
                copyButton.textContent = 'Copy';
              }, 2000);
            })
            .catch(err => {
              console.error('Failed to copy code:', err);
              copyButton.textContent = 'Failed';
              setTimeout(() => {
                copyButton.textContent = 'Copy';
              }, 2000);
            });
        }
      });
      
      // Replace the pre element with our container
      pre.parentNode.insertBefore(container, pre);
      container.appendChild(pre);
      container.appendChild(copyButton);
    });
  }
  
  // Function to update the chat title
  function updateChatTitle(chatId, newTitle) {
    chatHistory[chatId].title = newTitle;
    
    // Update the sidebar item
    const chatItem = document.querySelector(`[data-chat-id="${chatId}"]`);
    if (chatItem) {
      chatItem.textContent = newTitle;
    }
    
    // Update the current title if it's the active chat
    if (chatId === currentChatId) {
      currentChatTitle.textContent = newTitle;
    }
  }
  
  // Function to update UI based on the selected mode
  async function updateUIForMode(mode) {
    const container = document.querySelector('.container');
    const logoText = document.getElementById('logo-text');
    const modeSelectorContainer = document.querySelector('.mode-selector-container');
    
    // Reset classes
    container.classList.remove('mode-reasoning', 'mode-math', 'mode-programming');
    
    // Add class for the selected mode
    container.classList.add(`mode-${mode}`);

    // Update logo text based on the current model but keep rainbow gradient
    // Get the model for this mode from the settings
    const currentModel = await getModeModel(mode);
    
    switch (currentModel) {
      case 'claude':
        logoText.textContent = 'Claude';
        break;
      case 'gemini':
        logoText.textContent = 'Gemini';
        break;
      case 'gpt':
        logoText.textContent = 'ChatGPT';
        break;
      default:
        logoText.textContent = 'ChatGPT';
    }
    
    // Add sparkle effect to the logo and mode selector only
    // First remove any existing sparkle classes to reset animations
    logoText.classList.remove('text-sparkle-effect');
    if (modeSelectorContainer.classList.contains('sparkle-active')) {
      modeSelectorContainer.classList.remove('sparkle-active');
    }
    
    // Add the sparkle effect with a slight delay to allow for any transitions
    setTimeout(() => {
      // Force a reflow to restart animation
      void logoText.offsetWidth;
      void modeSelectorContainer.offsetWidth;
      
      // Add the sparkle effects - but NOT to the chat title
      logoText.classList.add('text-sparkle-effect');
      modeSelectorContainer.classList.add('sparkle-active');
      
      // Remove the effect after the animation completes
      setTimeout(() => {
        logoText.classList.remove('text-sparkle-effect');
        modeSelectorContainer.classList.remove('sparkle-active');
      }, 8000); // Animation visible for 8 seconds
    }, 100); // Slightly increased delay
    
    // Update input placeholder based on mode - use format from the image
    switch (currentModel) {
      case 'claude':
        messageInput.placeholder = 'Message Claude';
        break;
      case 'gemini':
        messageInput.placeholder = 'Message Gemini';
        break;
      case 'gpt':
        messageInput.placeholder = 'Message ChatGPT';
        break;
      default:
        messageInput.placeholder = 'Message ChatGPT';
    }
  }
  
  // Listen for API key changes
  // This approach allows settings changes to be reflected immediately in the current window
  window.addEventListener('storage', async (event) => {
    if (event.key === 'lofty_model_config_updated') {
      console.log('Model configuration changed, reloading...');
      await loadModelConfig();
      
      // Update UI for current mode
      if (currentChatId && chatHistory[currentChatId]) {
        updateUIForMode(chatHistory[currentChatId].mode);
      }
    }
  });
});