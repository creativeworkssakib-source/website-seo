// Configuration
const CONFIG = {
    // আপনার n8n webhook URL এখানে বসান
    n8nWebhookUrl: 'YOUR_N8N_WEBHOOK_URL_HERE', // Example: 'https://your-n8n-instance.com/webhook/seo-analysis'
};

// DOM Elements
const form = document.getElementById('seoForm');
const websiteUrlInput = document.getElementById('websiteUrl');
const analyzeBtn = document.getElementById('analyzeBtn');
const loadingContainer = document.getElementById('loadingContainer');
const errorMessage = document.getElementById('errorMessage');
const errorText = document.getElementById('errorText');
const successMessage = document.getElementById('successMessage');
const resultsSection = document.getElementById('resultsSection');
const resultsContent = document.getElementById('resultsContent');
const newAnalysisBtn = document.getElementById('newAnalysisBtn');

// Event Listeners
form.addEventListener('submit', handleSubmit);
newAnalysisBtn.addEventListener('click', resetForm);

// Form Submit Handler
async function handleSubmit(e) {
    e.preventDefault();
    
    const url = websiteUrlInput.value.trim();
    
    if (!validateUrl(url)) {
        showError('Please enter a valid URL (e.g., https://example.com)');
        return;
    }

    // Check if n8n URL is configured
    if (CONFIG.n8nWebhookUrl === 'YOUR_N8N_WEBHOOK_URL_HERE') {
        showError('Please configure your n8n webhook URL in the script.js file');
        return;
    }

    hideMessages();
    showLoading();
    
    try {
        const response = await sendToN8n(url);
        hideLoading();
        
        if (response.success) {
            showSuccess();
            displayResults(response.data);
        } else {
            showError(response.message || 'Analysis failed. Please try again.');
        }
    } catch (error) {
        hideLoading();
        showError('Network error. Please check your connection and try again.');
        console.error('Error:', error);
    }
}

// Send data to n8n webhook
async function sendToN8n(url) {
    try {
        const response = await fetch(CONFIG.n8nWebhookUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                websiteUrl: url,
                timestamp: new Date().toISOString(),
                action: 'seo-analysis'
            })
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        return data;
    } catch (error) {
        console.error('n8n request error:', error);
        throw error;
    }
}

// Validate URL
function validateUrl(string) {
    try {
        const url = new URL(string);
        return url.protocol === 'http:' || url.protocol === 'https:';
    } catch (_) {
        return false;
    }
}

// Display Results
function displayResults(data) {
    resultsSection.style.display = 'block';
    
    let html = '';
    
    if (data.url) {
        html += createResultItem('Analyzed Website', data.url);
    }
    
    if (data.title) {
        html += createResultItem('Page Title', data.title);
    }
    
    if (data.seoScore) {
        html += createResultItem('SEO Score', `${data.seoScore}/100`);
    }
    
    if (data.recommendations && Array.isArray(data.recommendations)) {
        const recommendationsList = data.recommendations.map(rec => `• ${rec}`).join('<br>');
        html += createResultItem('SEO Recommendations', recommendationsList);
    } else if (data.recommendations) {
        html += createResultItem('SEO Recommendations', data.recommendations);
    }
    
    if (data.issues && Array.isArray(data.issues)) {
        const issuesList = data.issues.map(issue => `• ${issue}`).join('<br>');
        html += createResultItem('Issues Found', issuesList);
    } else if (data.issues) {
        html += createResultItem('Issues Found', data.issues);
    }
    
    if (data.metaDescription) {
        html += createResultItem('Meta Description', data.metaDescription);
    }
    
    if (data.keywords && Array.isArray(data.keywords)) {
        html += createResultItem('Keywords', data.keywords.join(', '));
    }
    
    if (data.analysis) {
        html += createResultItem('Detailed Analysis', data.analysis);
    }
    
    // If no specific fields, show raw data
    if (!html) {
        html = '<div class="result-item"><pre>' + JSON.stringify(data, null, 2) + '</pre></div>';
    }
    
    resultsContent.innerHTML = html;
    
    // Scroll to results
    resultsSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

// Create Result Item HTML
function createResultItem(label, value) {
    return `
        <div class="result-item">
            <div class="result-label">${label}</div>
            <div class="result-value">${value}</div>
        </div>
    `;
}

// UI State Functions
function showLoading() {
    analyzeBtn.disabled = true;
    loadingContainer.style.display = 'block';
}

function hideLoading() {
    analyzeBtn.disabled = false;
    loadingContainer.style.display = 'none';
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

function hideMessages() {
    errorMessage.style.display = 'none';
    successMessage.style.display = 'none';
}

function resetForm() {
    form.reset();
    resultsSection.style.display = 'none';
    hideMessages();
    websiteUrlInput.focus();
    
    // Scroll to top
    window.scrollTo({ top: 0, behavior: 'smooth' });
}