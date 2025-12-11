// ========================================
// SEO Analyzer Pro - Premium JavaScript
// ========================================

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
const mobileMenuToggle = document.getElementById('mobileMenuToggle');

// ========================================
// Initialize
// ========================================
document.addEventListener('DOMContentLoaded', function() {
    setupEventListeners();
    loadChatHistory();
    initAOS();
    initParticles();
    initCounters();
    initScrollEffects();
});

// ========================================
// AOS Animation Init
// ========================================
function initAOS() {
    if (typeof AOS !== 'undefined') {
        AOS.init({
            duration: 800,
            easing: 'ease-out-cubic',
            once: true,
            offset: 50,
            delay: 100
        });
    }
}

// ========================================
// Particles Background
// ========================================
function initParticles() {
    const particlesContainer = document.getElementById('particles');
    if (!particlesContainer) return;
    
    const particleCount = 50;
    
    for (let i = 0; i < particleCount; i++) {
        const particle = document.createElement('div');
        particle.style.position = 'absolute';
        particle.style.width = Math.random() * 4 + 1 + 'px';
        particle.style.height = particle.style.width;
        particle.style.background = 'rgba(99, 102, 241, 0.3)';
        particle.style.borderRadius = '50%';
        particle.style.left = Math.random() * 100 + '%';
        particle.style.top = Math.random() * 100 + '%';
        particle.style.animation = `float-particle ${Math.random() * 10 + 10}s infinite ease-in-out`;
        particle.style.animationDelay = Math.random() * 5 + 's';
        particlesContainer.appendChild(particle);
    }
}

// ========================================
// Counter Animation
// ========================================
function initCounters() {
    const counters = document.querySelectorAll('.stat-number');
    
    const animateCounter = (counter) => {
        const target = parseInt(counter.getAttribute('data-count'));
        const duration = 2000;
        const increment = target / (duration / 16);
        let current = 0;
        
        const updateCounter = () => {
            current += increment;
            if (current < target) {
                counter.textContent = Math.floor(current).toLocaleString();
                requestAnimationFrame(updateCounter);
            } else {
                counter.textContent = target.toLocaleString() + (counter.textContent.includes('%') ? '' : '+');
            }
        };
        
        updateCounter();
    };
    
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                animateCounter(entry.target);
                observer.unobserve(entry.target);
            }
        });
    }, { threshold: 0.5 });
    
    counters.forEach(counter => observer.observe(counter));
}

// ========================================
// Scroll Effects
// ========================================
function initScrollEffects() {
    const header = document.querySelector('.header');
    
    window.addEventListener('scroll', () => {
        if (window.scrollY > 50) {
            header.classList.add('scrolled');
        } else {
            header.classList.remove('scrolled');
        }
    });
}

// ========================================
// Setup Event Listeners
// ========================================
function setupEventListeners() {
    // Analyze button
    analyzeBtn.addEventListener('click', handleAnalyze);
    
    // Send message button
    sendBtn.addEventListener('click', handleSendMessage);
    
    // Clear chat button
    clearChatBtn.addEventListener('click', handleClearChat);
    
    // Enter key in URL input
    websiteUrlInput.addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
            handleAnalyze();
        }
    });
    
    // Enter key in chat input (without shift)
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

    // Smooth scroll to sections
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            e.preventDefault();
            const target = document.querySelector(this.getAttribute('href'));
            if (target) {
                const headerOffset = 80;
                const elementPosition = target.getBoundingClientRect().top;
                const offsetPosition = elementPosition + window.pageYOffset - headerOffset;
                
                window.scrollTo({
                    top: offsetPosition,
                    behavior: 'smooth'
                });
                
                // Close mobile menu if open
                const nav = document.querySelector('.nav');
                if (nav.classList.contains('active')) {
                    nav.classList.remove('active');
                }
            }
        });
    });
    
    // Mobile menu toggle
    if (mobileMenuToggle) {
        mobileMenuToggle.addEventListener('click', function() {
            const nav = document.querySelector('.nav');
            nav.classList.toggle('active');
        });
    }
}

// ========================================
// Handle Analyze Button Click
// ========================================
async function handleAnalyze() {
    const url = websiteUrlInput.value.trim();
    
    if (!url) {
        showNotification('দয়া করে একটি ওয়েবসাইট URL দিন', 'error');
        websiteUrlInput.focus();
        return;
    }

    if (!isValidUrl(url)) {
        showNotification('দয়া করে একটি সঠিক URL দিন (http:// বা https:// সহ)', 'error');
        websiteUrlInput.focus();
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

        // Show analysis result section with animation
        analysisResult.style.display = 'block';
        setTimeout(() => {
            analysisResult.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }, 300);

        // Add bot message about analysis
        addBotMessage(`🔍 আমি "${url}" ওয়েবসাইটটি বিশ্লেষণ করছি...\n\n⏳ অনুগ্রহ করে কিছুক্ষণ অপেক্ষা করুন। বিশ্লেষণ সম্পন্ন হলে আমি আপনাকে বিস্তারিত রিপোর্ট এবং পরামর্শ দেব।\n\n✨ এই সময়ে আপনি আমাকে যেকোনো SEO সম্পর্কিত প্রশ্ন করতে পারেন!`);

        // Save to chat history
        saveChatHistory();
        
        // Show success notification
        showNotification('বিশ্লেষণ শুরু হয়েছে!', 'success');

    } catch (error) {
        console.error('Analysis error:', error);
        showNotification('বিশ্লেষণ করতে সমস্যা হয়েছে। দয়া করে আবার চেষ্টা করুন।', 'error');
        addBotMessage('❌ দুঃখিত, বিশ্লেষণ শুরু করতে সমস্যা হয়েছে। অনুগ্রহ করে আবার চেষ্টা করুন।');
    } finally {
        setAnalyzeButtonLoading(false);
    }
}

// ========================================
// Handle Send Message
// ========================================
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

        // Add placeholder response
        setTimeout(() => {
            addBotMessage('💬 আপনার প্রশ্নের উত্তর প্রক্রিয়া করা হচ্ছে...\n\n🤖 আমি খুব শীঘ্রই আপনাকে বিস্তারিত উত্তর দেব।');
        }, 800);

    } catch (error) {
        console.error('Send message error:', error);
        removeTypingIndicator(typingId);
        addBotMessage('❌ দুঃখিত, আপনার বার্তা পাঠাতে সমস্যা হয়েছে। অনুগ্রহ করে আবার চেষ্টা করুন।');
    } finally {
        sendBtn.disabled = false;
        saveChatHistory();
    }
}

// ========================================
// Send data to webhook
// ========================================
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

// ========================================
// Chat Message Functions
// ========================================
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

function removeTypingIndicator(typingId) {
    const element = document.getElementById(typingId);
    if (element) {
        element.style.animation = 'fadeOut 0.3s ease';
        setTimeout(() => element.remove(), 300);
    }
}

// ========================================
// Handle Clear Chat
// ========================================
function handleClearChat() {
    if (confirm('আপনি কি নিশ্চিত যে চ্যাট ইতিহাস মুছে ফেলতে চান?')) {
        // Keep only the welcome message
        chatMessages.innerHTML = `
            <div class="message bot-message">
                <div class="message-avatar">
                    <i class="fas fa-robot"></i>
                </div>
                <div class="message-content">
                    <p>নমস্কার! আমি আপনার AI-Powered SEO সহকারী। 👋<br><br>আপনার ওয়েবসাইটের URL উপরের সার্চ বক্সে দিন, আমি সম্পূর্ণ বিশ্লেষণ করে আপনাকে বিস্তারিত রিপোর্ট এবং পরামর্শ দেব। 🚀</p>
                </div>
            </div>
        `;
        currentWebsiteUrl = '';
        websiteUrlInput.value = '';
        analysisResult.style.display = 'none';
        sessionId = generateSessionId();
        clearChatHistory();
        showNotification('চ্যাট ক্লিয়ার হয়ে গেছে', 'success');
    }
}

// ========================================
// Message Formatting
// ========================================
function formatBotMessage(message) {
    // Convert newlines to <br>
    message = message.replace(/\n/g, '<br>');
    
    // Convert URLs to links
    message = message.replace(
        /(https?:\/\/[^\s]+)/g,
        '<a href="$1" target="_blank" style="color: #6366f1; text-decoration: underline; font-weight: 600;">$1</a>'
    );
    
    // Convert **bold** to <strong>
    message = message.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
    
    // Convert *italic* to <em>
    message = message.replace(/\*(.+?)\*/g, '<em>$1</em>');
    
    return message;
}

// ========================================
// Validation Functions
// ========================================
function isValidUrl(string) {
    try {
        const url = new URL(string);
        return url.protocol === 'http:' || url.protocol === 'https:';
    } catch (_) {
        return false;
    }
}

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// ========================================
// UI State Functions
// ========================================
function setAnalyzeButtonLoading(loading) {
    analyzeBtn.disabled = loading;
    const btnText = analyzeBtn.querySelector('.btn-text');
    const btnLoading = analyzeBtn.querySelector('.btn-loading');
    
    if (loading) {
        btnText.style.display = 'none';
        btnLoading.style.display = 'flex';
    } else {
        btnText.style.display = 'flex';
        btnLoading.style.display = 'none';
    }
}

function scrollToBottom() {
    setTimeout(() => {
        chatMessages.scrollTo({
            top: chatMessages.scrollHeight,
            behavior: 'smooth'
        });
    }, 100);
}

// ========================================
// Notification System
// ========================================
function showNotification(message, type = 'info') {
    // Create notification element
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    
    const icon = type === 'success' ? 'check-circle' : 
                 type === 'error' ? 'exclamation-circle' : 'info-circle';
    
    notification.innerHTML = `
        <i class="fas fa-${icon}"></i>
        <span>${message}</span>
    `;
    
    // Add styles
    notification.style.cssText = `
        position: fixed;
        top: 100px;
        right: 24px;
        background: ${type === 'success' ? '#10b981' : type === 'error' ? '#ef4444' : '#6366f1'};
        color: white;
        padding: 16px 24px;
        border-radius: 12px;
        box-shadow: 0 10px 25px rgba(0, 0, 0, 0.2);
        display: flex;
        align-items: center;
        gap: 12px;
        font-weight: 600;
        z-index: 10000;
        animation: slideInRight 0.4s ease;
    `;
    
    document.body.appendChild(notification);
    
    // Remove after 3 seconds
    setTimeout(() => {
        notification.style.animation = 'slideOutRight 0.4s ease';
        setTimeout(() => notification.remove(), 400);
    }, 3000);
}

// Add animation styles
const style = document.createElement('style');
style.textContent = `
    @keyframes slideInRight {
        from {
            transform: translateX(400px);
            opacity: 0;
        }
        to {
            transform: translateX(0);
            opacity: 1;
        }
    }
    
    @keyframes slideOutRight {
        from {
            transform: translateX(0);
            opacity: 1;
        }
        to {
            transform: translateX(400px);
            opacity: 0;
        }
    }
    
    @keyframes fadeOut {
        from {
            opacity: 1;
            transform: translateY(0);
        }
        to {
            opacity: 0;
            transform: translateY(-10px);
        }
    }
    
    @keyframes float-particle {
        0%, 100% {
            transform: translate(0, 0);
            opacity: 0.3;
        }
        50% {
            transform: translate(var(--tx, 20px), var(--ty, 20px));
            opacity: 0.7;
        }
    }
`;
document.head.appendChild(style);

// ========================================
// Chat History Management
// ========================================
function saveChatHistory() {
    const messages = Array.from(chatMessages.querySelectorAll('.message')).map(msg => ({
        isBot: msg.classList.contains('bot-message'),
        content: msg.querySelector('.message-content p').innerHTML
    }));
    
    localStorage.setItem('seo_chat_history', JSON.stringify({
        messages: messages,
        currentUrl: currentWebsiteUrl,
        sessionId: sessionId,
        timestamp: Date.now()
    }));
}

function loadChatHistory() {
    const history = localStorage.getItem('seo_chat_history');
    if (history) {
        try {
            const data = JSON.parse(history);
            
            // Check if history is older than 24 hours
            if (data.timestamp && (Date.now() - data.timestamp) > 86400000) {
                clearChatHistory();
                return;
            }
            
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
            clearChatHistory();
        }
    }
}

function clearChatHistory() {
    localStorage.removeItem('seo_chat_history');
}

// ========================================
// External Message Handler
// ========================================
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

// ========================================
// Performance Optimization
// ========================================
// Lazy load images
if ('IntersectionObserver' in window) {
    const imageObserver = new IntersectionObserver((entries, observer) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const img = entry.target;
                img.src = img.dataset.src;
                img.classList.remove('lazy');
                observer.unobserve(img);
            }
        });
    });

    document.querySelectorAll('img[data-src]').forEach(img => {
        imageObserver.observe(img);
    });
}

// Debounce function for performance
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

// ========================================
// Console Welcome Message
// ========================================
console.log('%c🚀 SEO Analyzer Pro', 'color: #6366f1; font-size: 24px; font-weight: bold;');
console.log('%cBuilt with ❤️ by Professional Web Developers', 'color: #8b5cf6; font-size: 14px;');
console.log('%c© 2025 SEO Analyzer Pro. All rights reserved.', 'color: #64748b; font-size: 12px;');

// ========================================
// Service Worker Registration (Optional)
// ========================================
if ('serviceWorker' in navigator) {
    // Uncomment to enable service worker
    // window.addEventListener('load', () => {
    //     navigator.serviceWorker.register('/sw.js')
    //         .then(reg => console.log('Service Worker registered'))
    //         .catch(err => console.log('Service Worker registration failed'));
    // });
}
