// Wait for the DOM to be fully loaded
document.addEventListener('DOMContentLoaded', () => {
    // Store chat history
    const chatHistory = {
      'chat-1': {
        title: 'Create electron app error',
        mode: 'programming',
        messages: [
          { type: 'user', content: 'Installing it globally for npm did not work, but using npx did. Thank you!' },
          { type: 'bot', content: 'You\'re welcome! 🎉 npx is a lifesaver for running packages without global installs. Let me know if you need any help setting up your Electron app. Happy coding! 🚀🔧' }
        ]
      },
      'chat-2': {
        title: 'Recent News Date',
        mode: 'reasoning',
        messages: []
      },
      'chat-3': {
        title: 'Software Ideas for Income',
        mode: 'reasoning',
        messages: []
      },
      'chat-4': {
        title: 'Remove Object by String',
        mode: 'programming',
        messages: []
      },
      'chat-5': {
        title: 'Crafting Cover Letter',
        mode: 'reasoning',
        messages: []
      },
      'chat-6': {
        title: 'Injecting Errors into XML',
        mode: 'programming',
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
    
    // Listen for chat history item clicks
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
    
    // Function to send a new message
    function sendMessage() {
      const messageText = messageInput.value.trim();
      if (messageText === '') return;
      
      // Add the message to the UI
      appendMessage('user', messageText);
      
      // Add the message to chat history
      chatHistory[currentChatId].messages.push({ type: 'user', content: messageText });
      
      // Clear the input field
      messageInput.value = '';
      
      // Simulate the bot response (in a real app, you'd send this to an API)
      setTimeout(() => {
        const botResponse = `This is a simulated response to: "${messageText}"`;
        appendMessage('bot', botResponse);
        chatHistory[currentChatId].messages.push({ type: 'bot', content: botResponse });
        
        // Scroll to the bottom
        chatMessages.scrollTop = chatMessages.scrollHeight;
      }, 1000);
      
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
      
      // Add click event
      newChatItem.addEventListener('click', () => loadChat(newChatId));
      
      // Add right-click event for context menu
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
          messageInput.placeholder = 'Ask a reasoning question...';
          break;
        case 'math':
          messageInput.placeholder = 'Ask a math question...';
          break;
        case 'programming':
          messageInput.placeholder = 'Ask a programming question...';
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