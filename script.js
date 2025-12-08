// Configuration
const CONFIG = {
    // আপনার n8n webhook URL এখানে বসান
    n8nWebhookUrl: 'YOUR_N8N_WEBHOOK_URL_HERE', // Example: 'https://your-n8n-instance.com/webhook/seo-analysis'
    chatWebhookUrl: 'YOUR_N8N_CHAT_WEBHOOK_URL_HERE', // Example: 'https://your-n8n-instance.com/webhook/seo-chat'
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
        
        // Hide loading and show success
        hideLoading();
        showSuccess();
        
        // Wait a bit then show chat
        setTimeout(() => {
            showChat();
            
            // Add initial AI message
            const initialMessage = data.initialMessage || 
                `আপনার ওয়েবসাইট ${url} এর বিশ্লেষণ সম্পন্ন হয়েছে! আমি আপনার SEO উন্নতির জন্য প্রস্তুত। আপনি কি জানতে চান?`;
            
            addMessage('assistant', initialMessage);
            
            // If there are immediate findings, add them
            if (data.findings && data.findings.length > 0) {
                setTimeout(() => {
                    const findingsMessage = formatFindings(data.findings);
                    addMessage('assistant', findingsMessage);
                }, 1000);
            }
        }, 1500);

    } catch (error) {
        console.error('Error:', error);
        hideLoading();
        showError('দুঃখিত, বিশ্লেষণে একটি সমস্যা হয়েছে। অনুগ্রহ করে আবার চেষ্টা করুন।');
    }
}

// Chat Submit Handler
async function handleChatSubmit(e) {
    e.preventDefault();
    
    const message = chatInput.value.trim();
    if (!message) return;

    // Add user message
    addMessage('user', message);
    chatInput.value = '';

    // Show typing indicator
    showTyping();

    try {
        // Send to n8n chat webhook
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

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        
        // Hide typing indicator
        hideTyping();
        
        // Add AI response
        const aiMessage = data.response || 'দুঃখিত, আমি এই মুহূর্তে উত্তর দিতে পারছি না।';
        addMessage('assistant', aiMessage);

    } catch (error) {
        console.error('Error:', error);
        hideTyping();
        addMessage('assistant', 'দুঃখিত, একটি সমস্যা হয়েছে। অনুগ্রহ করে আবার চেষ্টা করুন।');
    }
}

// Add message to chat
function addMessage(sender, text) {
    const messageDiv = document.createElement('div');
    messageDiv.className = `chat-message ${sender}`;
    
    const now = new Date();
    const timeString = now.toLocaleTimeString('en-US', { 
        hour: '2-digit', 
        minute: '2-digit' 
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
    
    // Lists
    text = text.replace(/^- (.*?)$/gm, '<li>$1</li>');
    if (text.includes('<li>')) {
        text = '<ul>' + text + '</ul>';
    }
    
    // Numbers
    text = text.replace(/(\d+)/g, '<span style="color: #667eea; font-weight: 600;">$1</span>');
    
    return text;
}

// Format findings
function formatFindings(findings) {
    let message = '📊 **প্রাথমিক বিশ্লেষণ:**\n\n';
    findings.forEach((finding, index) => {
        message += `${index + 1}. ${finding}\n`;
    });
    message += '\n\nকোন নির্দিষ্ট বিষয়ে জানতে চান?';
    return message;
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
    }, 1000);
}

// Reset form
function resetForm() {
    currentWebsiteUrl = '';
    sessionId = generateSessionId();
    websiteUrlInput.value = '';
    chatMessages.innerHTML = '<div class="message-date">Today</div>';
    
    chatSection.style.display = 'none';
    analysisSection.style.display = 'block';
    floatingChatBtn.style.display = 'none';
    isMinimized = false;
    
    hideAllMessages();
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

// Auto-resize chat input
chatInput.addEventListener('input', function() {
    this.style.height = 'auto';
    this.style.height = (this.scrollHeight) + 'px';
});

// Enable send button only when input has text
chatInput.addEventListener('input', function() {
    sendBtn.disabled = this.value.trim() === '';
});

// Initialize
document.addEventListener('DOMContentLoaded', function() {
    // Add some initial animations
    console.log('SEO Analyzer loaded successfully');
    console.log('Session ID:', sessionId);
    
    // Check if webhooks are configured
    if (CONFIG.n8nWebhookUrl === 'YOUR_N8N_WEBHOOK_URL_HERE') {
        console.warn('⚠️ N8N Webhook URL not configured! Please update CONFIG.n8nWebhookUrl in script.js');
    }
    if (CONFIG.chatWebhookUrl === 'YOUR_N8N_CHAT_WEBHOOK_URL_HERE') {
        console.warn('⚠️ N8N Chat Webhook URL not configured! Please update CONFIG.chatWebhookUrl in script.js');
    }
});
