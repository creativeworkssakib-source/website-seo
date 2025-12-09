// Configuration
const CONFIG = {
    n8nWebhookUrl: 'https://server3.automationlearners.pro/webhook/seo-analysis',
    chatWebhookUrl: 'https://server3.automationlearners.pro/webhook/seo-chat',
};

// DOM Elements
const form = document.getElementById('seoForm');
const websiteUrlInput = document.getElementById('websiteUrl');
const analyzeBtn = document.getElementById('analyzeBtn');
const loadingContainer = document.getElementById('loadingContainer');
const errorMessage = document.getElementById('errorMessage');
const errorText = document.getElementById('errorText');
const successMessage = document.getElementById('successMessage');
const analysisSection = document.getElementById('analysisSection');
const chatSection = document.getElementById('chatSection');
const chatMessages = document.getElementById('chatMessages');
const chatForm = document.getElementById('chatForm');
const chatInput = document.getElementById('chatInput');
const sendBtn = document.getElementById('sendBtn');
const typingIndicator = document.getElementById('typingIndicator');
const newAnalysisBtn = document.getElementById('newAnalysisBtn');
const minimizeChat = document.getElementById('minimizeChat');
const floatingChatBtn = document.getElementById('floatingChatBtn');
const notificationBadge = document.getElementById('notificationBadge');

// State
let currentWebsiteUrl = '';
let sessionId = generateSessionId();
let isMinimized = false;
let analysisData = null; // Store analysis data globally

// Event Listeners
form.addEventListener('submit', handleSubmit);
chatForm.addEventListener('submit', handleChatSubmit);
newAnalysisBtn.addEventListener('click', resetForm);
minimizeChat.addEventListener('click', toggleChatMinimize);
floatingChatBtn.addEventListener('click', toggleChatMinimize);

// Quick question buttons
document.querySelectorAll('.quick-question-btn').forEach(btn => {
    btn.addEventListener('click', function() {
        const question = this.getAttribute('data-question');
        chatInput.value = question;
        handleChatSubmit(new Event('submit'));
    });
});

// Generate unique session ID
function generateSessionId() {
    return 'session_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
}

// Form Submit Handler
async function handleSubmit(e) {
    e.preventDefault();
    
    const url = websiteUrlInput.value.trim();
    if (!url) {
        showError('Please enter a valid website URL');
        return;
    }

    if (!isValidUrl(url)) {
        showError('Please enter a valid URL (e.g., https://example.com)');
        return;
    }

    currentWebsiteUrl = url;
    sessionId = generateSessionId(); // New session for new analysis

    console.log('🚀 Starting analysis...', { url, sessionId });

    // Hide messages and show loading
    hideAllMessages();
    showLoading();
    
    // Animate loading steps
    animateLoadingSteps();

    try {
        // Send to n8n webhook
        const response = await fetch(CONFIG.n8nWebhookUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                websiteUrl: url,
                sessionId: sessionId,
                timestamp: new Date().toISOString(),
                action: 'analyze'
            })
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        console.log('✅ Analysis response:', data);
        
        // Store analysis data
        analysisData = data;
        
        // Hide loading and show success
        hideLoading();
        showSuccess();
        
        // Wait a bit then show chat
        setTimeout(() => {
            showChat();
            
            // Clear previous messages
            chatMessages.innerHTML = '<div class="message-date">আজ</div>';
            
            // Add initial AI message from n8n response
            const initialMessage = data.initialMessage || 
                `✅ আপনার ওয়েবসাইট ${url} এর বিশ্লেষণ সম্পন্ন হয়েছে! আমি আপনার SEO উন্নতির জন্য প্রস্তুত। আপনি কি জানতে চান?`;
            
            addMessage('assistant', initialMessage);
            
        }, 1500);

    } catch (error) {
        console.error('❌ Error:', error);
        hideLoading();
        showError('দুঃখিত, বিশ্লেষণে একটি সমস্যা হয়েছে। অনুগ্রহ করে আবার চেষ্টা করুন।');
    }
}

// Chat Submit Handler
async function handleChatSubmit(e) {
    e.preventDefault();
    
    const message = chatInput.value.trim();
    if (!message) return;

    console.log('💬 Sending chat message:', message);

    // Add user message
    addMessage('user', message);
    chatInput.value = '';
    chatInput.style.height = 'auto';

    // Disable send button and show typing indicator
    sendBtn.disabled = true;
    showTyping();

    try {
        // Send to n8n chat webhook with session ID
        const response = await fetch(CONFIG.chatWebhookUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                message: message,
                websiteUrl: currentWebsiteUrl,
                sessionId: sessionId,
                timestamp: new Date().toISOString()
            })
        });

        console.log('📡 Chat response status:', response.status);

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        console.log('✅ Chat response:', data);
        
        // Hide typing indicator
        hideTyping();
        
        // Add AI response
        const aiMessage = data.response || 'দুঃখিত, আমি এই মুহূর্তে উত্তর দিতে পারছি না।';
        addMessage('assistant', aiMessage);

    } catch (error) {
        console.error('❌ Chat error:', error);
        hideTyping();
        addMessage('assistant', '❌ দুঃখিত, একটি সমস্যা হয়েছে। অনুগ্রহ করে আবার চেষ্টা করুন।');
    } finally {
        sendBtn.disabled = false;
    }
}

// Add message to chat
function addMessage(sender, text) {
    const messageDiv = document.createElement('div');
    messageDiv.className = `chat-message ${sender}`;
    
    const now = new Date();
    const timeString = now.toLocaleTimeString('bn-BD', { 
        hour: '2-digit', 
        minute: '2-digit',
        hour12: true
    });

    messageDiv.innerHTML = `
        <div class="message-avatar ${sender}">
            <i class="fas fa-${sender === 'user' ? 'user' : 'robot'}"></i>
        </div>
        <div class="message-content">
            <div class="message-text">${formatMessage(text)}</div>
            <div class="message-time">${timeString}</div>
        </div>
    `;

    chatMessages.appendChild(messageDiv);
    scrollToBottom();

    // Show notification if chat is minimized
    if (isMinimized && sender === 'assistant') {
        showNotification();
    }
}

// Format message (support for markdown-like formatting)
function formatMessage(text) {
    // Convert line breaks
    text = text.replace(/\n/g, '<br>');
    
    // Bold text
    text = text.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
    
    // Italic text
    text = text.replace(/\*(.*?)\*/g, '<em>$1</em>');
    
    // Lists with hyphens
    text = text.replace(/^- (.*?)$/gm, '<li>$1</li>');
    
    // Lists with numbers
    text = text.replace(/^(\d+)\. (.*?)$/gm, '<li>$2</li>');
    
    if (text.includes('<li>')) {
        text = '<ul style="margin: 0.5rem 0; padding-left: 1.5rem;">' + text + '</ul>';
    }
    
    // Highlight numbers
    text = text.replace(/(\d+)/g, '<span style="color: #667eea; font-weight: 600;">$1</span>');
    
    // Emojis stay as is
    return text;
}

// Show/Hide functions
function showLoading() {
    loadingContainer.style.display = 'block';
    analyzeBtn.disabled = true;
}

function hideLoading() {
    loadingContainer.style.display = 'none';
    analyzeBtn.disabled = false;
}

function showError(message) {
    errorText.textContent = message;
    errorMessage.style.display = 'flex';
    setTimeout(() => {
        errorMessage.style.display = 'none';
    }, 5000);
}

function showSuccess() {
    successMessage.style.display = 'flex';
    setTimeout(() => {
        successMessage.style.display = 'none';
    }, 3000);
}

function hideAllMessages() {
    errorMessage.style.display = 'none';
    successMessage.style.display = 'none';
}

function showChat() {
    analysisSection.style.display = 'none';
    chatSection.style.display = 'block';
}

function showTyping() {
    typingIndicator.style.display = 'flex';
    scrollToBottom();
}

function hideTyping() {
    typingIndicator.style.display = 'none';
}

function toggleChatMinimize() {
    isMinimized = !isMinimized;
    
    if (isMinimized) {
        chatSection.style.display = 'none';
        floatingChatBtn.style.display = 'flex';
    } else {
        chatSection.style.display = 'block';
        floatingChatBtn.style.display = 'none';
        notificationBadge.style.display = 'none';
        notificationBadge.textContent = '0';
        scrollToBottom();
    }
}

function showNotification() {
    if (isMinimized) {
        notificationBadge.style.display = 'flex';
        const currentCount = parseInt(notificationBadge.textContent) || 0;
        notificationBadge.textContent = currentCount + 1;
    }
}

function scrollToBottom() {
    setTimeout(() => {
        chatMessages.scrollTop = chatMessages.scrollHeight;
    }, 100);
}

// Animate loading steps
function animateLoadingSteps() {
    const steps = document.querySelectorAll('.step');
    steps.forEach(step => step.classList.remove('active'));
    
    let currentStep = 0;
    const interval = setInterval(() => {
        if (currentStep < steps.length) {
            steps[currentStep].classList.add('active');
            currentStep++;
        } else {
            clearInterval(interval);
        }
    }, 1500);
}

// Reset form
function resetForm() {
    if (confirm('নতুন বিশ্লেষণ শুরু করতে চান? বর্তমান সেশন হারিয়ে যাবে।')) {
        currentWebsiteUrl = '';
        sessionId = generateSessionId();
        analysisData = null;
        websiteUrlInput.value = '';
        chatMessages.innerHTML = '<div class="message-date">আজ</div>';
        
        chatSection.style.display = 'none';
        analysisSection.style.display = 'block';
        floatingChatBtn.style.display = 'none';
        isMinimized = false;
        
        hideAllMessages();
        
        console.log('🔄 Form reset. New session:', sessionId);
    }
}

// Validate URL
function isValidUrl(string) {
    try {
        const url = new URL(string);
        return url.protocol === 'http:' || url.protocol === 'https:';
    } catch (_) {
        // Try adding https:// if missing
        try {
            const urlWithProtocol = new URL('https://' + string);
            return true;
        } catch (_) {
            return false;
        }
    }
}

// Auto-resize chat input
chatInput.addEventListener('input', function() {
    this.style.height = 'auto';
    this.style.height = Math.min(this.scrollHeight, 120) + 'px';
});

// Enable send button only when input has text
chatInput.addEventListener('input', function() {
    sendBtn.disabled = this.value.trim() === '';
});

// Allow Enter to send, Shift+Enter for new line
chatInput.addEventListener('keydown', function(e) {
    if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        if (this.value.trim() !== '') {
            chatForm.dispatchEvent(new Event('submit'));
        }
    }
});

// Initialize
document.addEventListener('DOMContentLoaded', function() {
    console.log('✅ SEO Analyzer loaded successfully');
    console.log('📌 Session ID:', sessionId);
    console.log('🔗 Webhook URLs:', CONFIG);
    
    // Check if webhooks are configured
    if (!CONFIG.n8nWebhookUrl || CONFIG.n8nWebhookUrl.includes('YOUR_')) {
        console.warn('⚠️ N8N Webhook URL not configured!');
    }
    if (!CONFIG.chatWebhookUrl || CONFIG.chatWebhookUrl.includes('YOUR_')) {
        console.warn('⚠️ N8N Chat Webhook URL not configured!');
    }
});
