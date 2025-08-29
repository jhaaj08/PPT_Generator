// LLM Parsing Test JavaScript
const API_BASE_URL = 'http://localhost:8080/api';

// Global variables
let currentResults = null;

// Example content
const EXAMPLES = {
    adobe: {
        text: `Adobe India Hackathon 2025: Igniting Innovation

Welcome to the Adobe India Hackathon 2025 – a national platform where creativity meets code. This year, we bring together thousands of students across India to solve real-world problems using Adobe's creative, AI, and cloud-based tools. The goal: to inspire, empower, and discover the next generation of tech and design innovators.

The Adobe Hackathon is not just a coding challenge. It's a three-phase experience where students ideate, build backend systems, and integrate front-end and AI-powered solutions using Adobe Express, Firefly, Acrobat AI Assistant, and other tools. It blends design thinking, technical depth, and strategic storytelling.

In 2025, the Hackathon saw over 130,000 student registrations across 500+ colleges. More than 12,000 teams submitted projects, with 60 finalists making it to the grand finale. It became one of the largest creator-tech hackathons in the country.

Participants were introduced to Adobe's latest technologies—ranging from Firefly for generative creativity to Acrobat Projects for document workflows. Hackers leveraged Adobe APIs, integrated OpenAI models, and developed full-stack projects addressing social impact, education, and digital productivity.

What we learned: Real-time mentoring improves success rate. Hackers who attended Adobe-led workshops were 2.5x more likely to reach the final round. Cross-functional teams (tech + design) had higher jury scores. The more intuitive the onboarding, the more submissions we received—proving that clarity drives creativity.

Winning ideas included an AI-powered rural job resume generator, an automated transcript-to-podcast converter using Adobe tools, and a collaborative portfolio builder for creators. Several teams received internship interviews and long-term mentorship offers from Adobe.

This Hackathon wasn't just about solutions—it was about experience. Students explored Adobe's ecosystem hands-on, worked closely with Adobe mentors, and showcased their ideas to industry leaders. For Adobe, it amplified our brand with Gen Z, created scalable engagement, and surfaced fresh innovation.

Looking ahead: We're launching the Adobe Creator Campus Program to sustain this energy across the year. Adobe Express will soon integrate into academic workflows via NPTEL and AICTE partnerships. And Hackathon 2.0 will bring challenge tiers, GenAI toolkits, and creator economy challenges to campuses.

Let's keep building what's next—together.`,
        guidance: "Create an engaging presentation for Adobe stakeholders about the hackathon success"
    },
    product: {
        text: `Introducing CloudSync Pro: Revolutionary File Management

CloudSync Pro transforms how teams collaborate on files across multiple platforms. Built for modern businesses, it seamlessly integrates with Google Drive, Dropbox, OneDrive, and AWS S3, providing unified file access and real-time synchronization.

Key features include intelligent file versioning, automatic conflict resolution, and enterprise-grade security with AES-256 encryption. The platform supports teams of 5 to 5000 members with scalable pricing and 99.9% uptime guarantee.

Early beta testing with 50 companies showed 40% improvement in team productivity and 60% reduction in file-related conflicts. Customer feedback highlights the intuitive interface and powerful search capabilities as game-changers.

Pricing starts at $10 per user per month for the Professional plan, with Enterprise options including custom integrations, SSO, and dedicated support. Launch date is set for Q2 2024 with marketing campaigns targeting IT directors and project managers.`,
        guidance: "Create a product launch presentation for investors and potential customers"
    },
    research: {
        text: `AI in Healthcare: Current Trends and Future Prospects

Our comprehensive study analyzed 500+ AI implementations across hospitals in North America and Europe from 2020-2024. The research reveals significant patterns in adoption rates, success metrics, and implementation challenges.

Key findings show 78% improvement in diagnostic accuracy when AI assists radiologists, 45% reduction in patient wait times through automated triage systems, and 60% decrease in administrative overhead via intelligent documentation.

However, challenges persist: 65% of implementations face data integration issues, 40% struggle with staff training, and 30% encounter regulatory compliance hurdles. Success factors include strong leadership support, comprehensive training programs, and phased implementation approaches.

Financial impact analysis shows average ROI of 240% within 18 months for successful implementations. The most effective use cases are in radiology, pathology, and predictive analytics for patient deterioration.

Future outlook suggests expansion into personalized medicine, drug discovery, and remote patient monitoring. Regulatory frameworks are evolving to support innovation while ensuring patient safety and data privacy.`,
        guidance: "Create a research presentation for medical conference audience"
    }
};

// DOM Elements
const parsingForm = document.getElementById('parsingForm');
const inputText = document.getElementById('inputText');
const charCounter = document.getElementById('charCounter');
const parseBtn = document.getElementById('parseBtn');
const progressSection = document.getElementById('progressSection');
const progressBar = document.getElementById('progressBar');
const progressText = document.getElementById('progressText');
const resultsSection = document.getElementById('resultsSection');
const errorSection = document.getElementById('errorSection');
const errorMessage = document.getElementById('errorMessage');
const liveStats = document.getElementById('liveStats');
const slidesGrid = document.getElementById('slidesGrid');

// Initialize
document.addEventListener('DOMContentLoaded', function() {
    initializeEventListeners();
    updateLiveStats();
});

function initializeEventListeners() {
    // Form submission
    parsingForm.addEventListener('submit', handleFormSubmit);
    
    // Live character counter and stats
    inputText.addEventListener('input', function() {
        updateCharCounter();
        updateLiveStats();
    });
    
    // Auto-resize textarea
    inputText.addEventListener('input', autoResizeTextarea);
}

function updateCharCounter() {
    const text = inputText.value;
    const charCount = text.length;
    charCounter.textContent = `${charCount.toLocaleString()} characters`;
    
    if (charCount > 5000) {
        charCounter.classList.add('text-orange-500');
    } else {
        charCounter.classList.remove('text-orange-500');
    }
}

function updateLiveStats() {
    const text = inputText.value.trim();
    
    if (!text) {
        liveStats.innerHTML = `
            <div class="text-center text-gray-500 py-8">
                <i class="fas fa-chart-line text-4xl mb-4"></i>
                <p>Enter content to see live analysis</p>
            </div>
        `;
        return;
    }
    
    // Basic text analysis
    const words = text.split(/\s+/).length;
    const sentences = text.split(/[.!?]+/).length - 1;
    const paragraphs = text.split(/\n\s*\n/).length;
    const avgWordsPerSentence = Math.round(words / Math.max(sentences, 1));
    
    // Estimate slides based on content length
    const estimatedSlides = Math.max(3, Math.min(15, Math.ceil(words / 150)));
    
    liveStats.innerHTML = `
        <div class="space-y-4">
            <div class="grid grid-cols-2 gap-4">
                <div class="bg-gray-50 p-3 rounded-lg">
                    <div class="text-sm text-gray-600">Words</div>
                    <div class="text-xl font-bold text-gray-900">${words.toLocaleString()}</div>
                </div>
                <div class="bg-gray-50 p-3 rounded-lg">
                    <div class="text-sm text-gray-600">Sentences</div>
                    <div class="text-xl font-bold text-gray-900">${sentences}</div>
                </div>
                <div class="bg-gray-50 p-3 rounded-lg">
                    <div class="text-sm text-gray-600">Paragraphs</div>
                    <div class="text-xl font-bold text-gray-900">${paragraphs}</div>
                </div>
                <div class="bg-gray-50 p-3 rounded-lg">
                    <div class="text-sm text-gray-600">Avg Words/Sentence</div>
                    <div class="text-xl font-bold text-gray-900">${avgWordsPerSentence}</div>
                </div>
            </div>
            
            <div class="bg-blue-50 p-4 rounded-lg border border-blue-200">
                <div class="flex items-center">
                    <i class="fas fa-lightbulb text-blue-600 mr-2"></i>
                    <div class="text-sm text-blue-800">
                        <strong>Estimated slides:</strong> ${estimatedSlides}
                        <br>
                        <span class="text-xs">Based on ~150 words per slide</span>
                    </div>
                </div>
            </div>
        </div>
    `;
}

function autoResizeTextarea() {
    inputText.style.height = 'auto';
    inputText.style.height = Math.max(200, inputText.scrollHeight) + 'px';
}

function loadExample(type) {
    if (EXAMPLES[type]) {
        inputText.value = EXAMPLES[type].text;
        document.getElementById('guidance').value = EXAMPLES[type].guidance;
        updateCharCounter();
        updateLiveStats();
        autoResizeTextarea();
    }
}

async function handleFormSubmit(e) {
    e.preventDefault();
    
    const formData = {
        text: inputText.value.trim(),
        guidance: document.getElementById('guidance').value.trim(),
        api_key: document.getElementById('apiKey').value.trim(),
        llm_provider: document.getElementById('llmProvider').value
    };
    
    if (!formData.text) {
        showError('Please enter some content to parse');
        return;
    }
    
    if (!formData.api_key) {
        showError('Please enter your API key');
        return;
    }
    
    hideError();
    showProgress();
    
    try {
        updateProgress(20, 'Sending content to LLM...');
        
        const response = await fetch(`${API_BASE_URL}/test-llm-parsing`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(formData)
        });
        
        updateProgress(80, 'Processing LLM response...');
        
        const data = await response.json();
        
        if (response.ok) {
            updateProgress(100, 'Complete!');
            currentResults = data;
            showResults(data);
        } else {
            throw new Error(data.error || 'Failed to parse content');
        }
        
    } catch (error) {
        console.error('Error:', error);
        showError(`Error parsing content: ${error.message}`);
        hideProgress();
    }
}

function showProgress() {
    parseBtn.disabled = true;
    progressSection.classList.remove('hidden');
    resultsSection.classList.add('hidden');
}

function updateProgress(percent, text) {
    progressBar.style.width = `${percent}%`;
    if (text) {
        progressText.textContent = text;
    }
}

function hideProgress() {
    parseBtn.disabled = false;
    progressSection.classList.add('hidden');
}

function showResults(data) {
    hideProgress();
    
    const slides = data.slides || [];
    const slidesWithContent = slides.filter(s => s.content && s.content.length > 0).length;
    const totalContentLength = slides.reduce((total, slide) => {
        if (Array.isArray(slide.content)) {
            return total + slide.content.join(' ').length;
        }
        return total + (slide.content || '').length;
    }, 0);
    const avgContentLength = slides.length > 0 ? Math.round(totalContentLength / slides.length) : 0;
    const qualityScore = slides.length > 0 ? Math.round((slidesWithContent / slides.length) * 100) : 0;
    
    // Update summary cards
    document.getElementById('totalSlides').textContent = slides.length;
    document.getElementById('slidesWithContent').textContent = slidesWithContent;
    document.getElementById('avgContent').textContent = `${avgContentLength}ch`;
    document.getElementById('qualityScore').textContent = `${qualityScore}%`;
    
    // Create slides grid
    slidesGrid.innerHTML = slides.map((slide, index) => createSlideCard(slide, index + 1)).join('');
    
    resultsSection.classList.remove('hidden');
    resultsSection.scrollIntoView({ behavior: 'smooth' });
}

function createSlideCard(slide, slideNumber) {
    const hasContent = slide.content && slide.content.length > 0;
    const contentType = Array.isArray(slide.content) ? 'bullets' : 'text';
    
    let contentHtml = '';
    if (hasContent) {
        if (Array.isArray(slide.content)) {
            contentHtml = slide.content.map(bullet => 
                `<div class="bullet-point">${bullet}</div>`
            ).join('');
        } else {
            const preview = slide.content.length > 200 ? 
                slide.content.substring(0, 200) + '...' : 
                slide.content;
            contentHtml = `<div class="text-gray-700">${preview}</div>`;
        }
    } else {
        contentHtml = '<div class="text-red-500 italic">No content generated</div>';
    }
    
    const statusColor = hasContent ? 'green' : 'red';
    const typeIcon = contentType === 'bullets' ? 'fa-list-ul' : 'fa-align-left';
    
    return `
        <div class="slide-card bg-white rounded-lg shadow-lg p-6 border-l-4 border-${statusColor}-500">
            <div class="flex items-start justify-between mb-4">
                <div class="flex items-center">
                    <div class="w-8 h-8 bg-blue-500 text-white rounded-full flex items-center justify-center text-sm font-bold mr-3">
                        ${slideNumber}
                    </div>
                    <div>
                        <h3 class="font-bold text-gray-800">${slide.title || 'Untitled'}</h3>
                        <div class="flex items-center text-xs text-gray-500 mt-1">
                            <i class="fas ${typeIcon} mr-1"></i>
                            <span class="mr-3">${contentType}</span>
                            <span class="px-2 py-1 bg-${statusColor}-100 text-${statusColor}-700 rounded">
                                ${hasContent ? 'Has Content' : 'Empty'}
                            </span>
                        </div>
                    </div>
                </div>
            </div>
            
            <div class="content-preview">
                ${contentHtml}
            </div>
            
            ${slide.type ? `
                <div class="mt-4 pt-4 border-t border-gray-200">
                    <span class="text-xs text-gray-500">Type: ${slide.type}</span>
                </div>
            ` : ''}
        </div>
    `;
}

function showError(message) {
    errorMessage.textContent = message;
    errorSection.classList.remove('hidden');
    errorSection.scrollIntoView({ behavior: 'smooth' });
}

function hideError() {
    errorSection.classList.add('hidden');
}

function downloadResults() {
    if (!currentResults) return;
    
    const dataStr = JSON.stringify(currentResults, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    
    const link = document.createElement('a');
    link.href = URL.createObjectURL(dataBlob);
    link.download = `llm-parsing-results-${Date.now()}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}

function resetTest() {
    parsingForm.reset();
    hideError();
    hideProgress();
    resultsSection.classList.add('hidden');
    currentResults = null;
    updateCharCounter();
    updateLiveStats();
    
    // Scroll to top
    window.scrollTo({ top: 0, behavior: 'smooth' });
}
