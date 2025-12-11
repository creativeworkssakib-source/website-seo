// Configuration
const WEBHOOK_URL = 'https://server3.automationlearners.pro/webhook-test/seo-chat';
let currentWebsiteUrl = '';
let sessionId = generateSessionId();

// Generate unique session ID
function generateSessionId() {
    return 'session_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
}

// DOM Elements
const websiteUrlInput = document.getElementById('websiteUrl');
const analyzeBtn = document.getElementById('analyzeBtn');
const analysisResult = document.getElementById('analysisResult');
const chatMessages = document.getElementById('chatMessages');
const chatInput = document.getElementById('chatInput');
const sendBtn = document.getElementById('sendBtn');
const clearChatBtn = document.getElementById('clearChat');

// Initialize
document.addEventListener('DOMContentLoaded', function() {
    setupEventListeners();
    loadChatHistory();
});

// Setup Event Listeners
function setupEventListeners() {
    analyzeBtn.addEventListener('click', handleAnalyze);
    sendBtn.addEventListener('click', handleSendMessage);
    clearChatBtn.addEventListener('click', handleClearChat);
    
    chatInput.addEventListener('keypress', function(e) {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSendMessage();
        }
    });

    // Auto-resize textarea
    chatInput.addEventListener('input', function() {
        this.style.height = 'auto';
        this.style.height = (this.scrollHeight) + 'px';
    });

    // Smooth scroll to analyzer
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            e.preventDefault();
            const target = document.querySelector(this.getAttribute('href'));
            if (target) {
                target.scrollIntoView({ behavior: 'smooth' });
            }
        });
    });
}

// Handle Analyze Button Click
async function handleAnalyze() {
    const url = websiteUrlInput.value.trim();
    
    if (!url) {
        showError('দয়া করে একটি ওয়েবসাইট URL দিন');
        return;
    }

    if (!isValidUrl(url)) {
        showError('দয়া করে একটি সঠিক URL দিন (http:// বা https:// সহ)');
        return;
    }

    currentWebsiteUrl = url;
    
    // Show loading state
    setAnalyzeButtonLoading(true);
    
    try {
        // Send analysis request to webhook
        const response = await sendToWebhook({
            type: 'analyze',
            url: url,
            sessionId: sessionId,
            timestamp: new Date().toISOString()
        });

        // Show analysis result section
        analysisResult.style.display = 'block';
        analysisResult.scrollIntoView({ behavior: 'smooth' });

        // Add bot message about analysis
        addBotMessage(`আমি "${url}" ওয়েবসাইটটি বিশ্লেষণ করছি... ⏳\n\nঅনুগ্রহ করে কিছুক্ষণ অপেক্ষা করুন। বিশ্লেষণ সম্পন্ন হলে আমি আপনাকে বিস্তারিত রিপোর্ট দেব।`);

        // Save to chat history
        saveChatHistory();

    } catch (error) {
        console.error('Analysis error:', error);
        showError('বিশ্লেষণ করতে সমস্যা হয়েছে। দয়া করে আবার চেষ্টা করুন।');
    } finally {
        setAnalyzeButtonLoading(false);
    }
}

// Handle Send Message
async function handleSendMessage() {
    const message = chatInput.value.trim();
    
    if (!message) return;

    // Add user message
    addUserMessage(message);
    chatInput.value = '';
    chatInput.style.height = 'auto';

    // Disable send button
    sendBtn.disabled = true;

    // Show typing indicator
    const typingId = showTypingIndicator();

    try {
        // Send message to webhook
        const response = await sendToWebhook({
            type: 'chat',
            message: message,
            url: currentWebsiteUrl,
            sessionId: sessionId,
            timestamp: new Date().toISOString()
        });

        // Remove typing indicator
        removeTypingIndicator(typingId);

        // The bot response will come from webhook
        // For now, add a placeholder response
        setTimeout(() => {
            addBotMessage('আপনার প্রশ্নের উত্তর প্রক্রিয়া করা হচ্ছে... 🔄');
        }, 500);

    } catch (error) {
        console.error('Send message error:', error);
        removeTypingIndicator(typingId);
        addBotMessage('দুঃখিত, আপনার বার্তা পাঠাতে সমস্যা হয়েছে। অনুগ্রহ করে আবার চেষ্টা করুন।');
    } finally {
        sendBtn.disabled = false;
        saveChatHistory();
    }
}

// Send data to webhook
async function sendToWebhook(data) {
    try {
        const response = await fetch(WEBHOOK_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(data)
        });

        if (!response.ok) {
            throw new Error('Webhook request failed');
        }

        return await response.json();
    } catch (error) {
        console.error('Webhook error:', error);
        throw error;
    }
}

// Add user message to chat
function addUserMessage(message) {
    const messageDiv = document.createElement('div');
    messageDiv.className = 'message user-message';
    messageDiv.innerHTML = `
        <div class="message-avatar">
            <i class="fas fa-user"></i>
        </div>
        <div class="message-content">
            <p>${escapeHtml(message)}</p>
        </div>
    `;
    chatMessages.appendChild(messageDiv);
    scrollToBottom();
}

// Add bot message to chat
function addBotMessage(message) {
    const messageDiv = document.createElement('div');
    messageDiv.className = 'message bot-message';
    messageDiv.innerHTML = `
        <div class="message-avatar">
            <i class="fas fa-robot"></i>
        </div>
        <div class="message-content">
            <p>${formatBotMessage(message)}</p>
        </div>
    `;
    chatMessages.appendChild(messageDiv);
    scrollToBottom();
}

// Show typing indicator
function showTypingIndicator() {
    const typingId = 'typing_' + Date.now();
    const typingDiv = document.createElement('div');
    typingDiv.id = typingId;
    typingDiv.className = 'message bot-message';
    typingDiv.innerHTML = `
        <div class="message-avatar">
            <i class="fas fa-robot"></i>
        </div>
        <div class="message-content">
            <div class="typing-indicator">
                <span></span>
                <span></span>
                <span></span>
            </div>
        </div>
    `;
    chatMessages.appendChild(typingDiv);
    scrollToBottom();
    return typingId;
}

// Remove typing indicator
function removeTypingIndicator(typingId) {
    const element = document.getElementById(typingId);
    if (element) {
        element.remove();
    }
}

// Handle clear chat
function handleClearChat() {
    if (confirm('আপনি কি চ্যাট ইতিহাস মুছে ফেলতে চান?')) {
        // Keep only the welcome message
        chatMessages.innerHTML = `
            <div class="message bot-message">
                <div class="message-avatar">
                    <i class="fas fa-robot"></i>
                </div>
                <div class="message-content">
                    <p>নমস্কার! আমি আপনার SEO সহকারী। আপনার ওয়েবসাইটের URL উপরের সার্চ বক্সে দিন, আমি বিশ্লেষণ করে আপনাকে সাহায্য করব। 🚀</p>
                </div>
            </div>
        `;
        currentWebsiteUrl = '';
        analysisResult.style.display = 'none';
        sessionId = generateSessionId();
        clearChatHistory();
    }
}

// Format bot message (convert links, bold, etc.)
function formatBotMessage(message) {
    // Convert newlines to <br>
    message = message.replace(/\n/g, '<br>');
    
    // Convert URLs to links
    message = message.replace(
        /(https?:\/\/[^\s]+)/g,
        '<a href="$1" target="_blank" style="color: #6366f1; text-decoration: underline;">$1</a>'
    );
    
    // Convert **bold** to <strong>
    message = message.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
    
    return message;
}

// Validate URL
function isValidUrl(string) {
    try {
        const url = new URL(string);
        return url.protocol === 'http:' || url.protocol === 'https:';
    } catch (_) {
        return false;
    }
}

// Escape HTML
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// Show error message
function showError(message) {
    addBotMessage(`❌ ${message}`);
}

// Set analyze button loading state
function setAnalyzeButtonLoading(loading) {
    analyzeBtn.disabled = loading;
    const btnText = analyzeBtn.querySelector('.btn-text');
    const btnLoading = analyzeBtn.querySelector('.btn-loading');
    
    if (loading) {
        btnText.style.display = 'none';
        btnLoading.style.display = 'inline-block';
    } else {
        btnText.style.display = 'inline-block';
        btnLoading.style.display = 'none';
    }
}

// Scroll to bottom of chat
function scrollToBottom() {
    chatMessages.scrollTop = chatMessages.scrollHeight;
}

// Save chat history to localStorage
function saveChatHistory() {
    const messages = Array.from(chatMessages.querySelectorAll('.message')).map(msg => ({
        isBot: msg.classList.contains('bot-message'),
        content: msg.querySelector('.message-content p').innerHTML
    }));
    
    localStorage.setItem('seo_chat_history', JSON.stringify({
        messages: messages,
        currentUrl: currentWebsiteUrl,
        sessionId: sessionId
    }));
}

// Load chat history from localStorage
function loadChatHistory() {
    const history = localStorage.getItem('seo_chat_history');
    if (history) {
        try {
            const data = JSON.parse(history);
            if (data.messages && data.messages.length > 1) {
                // Clear default message
                chatMessages.innerHTML = '';
                
                // Restore messages
                data.messages.forEach(msg => {
                    if (msg.isBot) {
                        const messageDiv = document.createElement('div');
                        messageDiv.className = 'message bot-message';
                        messageDiv.innerHTML = `
                            <div class="message-avatar">
                                <i class="fas fa-robot"></i>
                            </div>
                            <div class="message-content">
                                <p>${msg.content}</p>
                            </div>
                        `;
                        chatMessages.appendChild(messageDiv);
                    } else {
                        const messageDiv = document.createElement('div');
                        messageDiv.className = 'message user-message';
                        messageDiv.innerHTML = `
                            <div class="message-avatar">
                                <i class="fas fa-user"></i>
                            </div>
                            <div class="message-content">
                                <p>${msg.content}</p>
                            </div>
                        `;
                        chatMessages.appendChild(messageDiv);
                    }
                });
                
                currentWebsiteUrl = data.currentUrl || '';
                sessionId = data.sessionId || generateSessionId();
                
                if (currentWebsiteUrl) {
                    websiteUrlInput.value = currentWebsiteUrl;
                    analysisResult.style.display = 'block';
                }
            }
        } catch (e) {
            console.error('Failed to load chat history:', e);
        }
    }
}

// Clear chat history
function clearChatHistory() {
    localStorage.removeItem('seo_chat_history');
}

// Listen for webhook responses (if using polling or WebSocket)
// This is a placeholder - you'll need to implement based on your N8N setup
window.addEventListener('message', function(event) {
    // Handle webhook responses if sent via postMessage
    if (event.data && event.data.type === 'webhook_response') {
        if (event.data.message) {
            addBotMessage(event.data.message);
            saveChatHistory();
        }
    }
});

// Export function for external scripts to add bot messages
window.addBotResponse = function(message) {
    addBotMessage(message);
    saveChatHistory();
};
