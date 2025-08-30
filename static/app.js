// PPT Generator Frontend JavaScript

// Configuration - Dynamic API URL for both local and deployed environments
const API_BASE_URL = window.location.hostname === 'localhost' 
    ? 'http://localhost:8080/api' 
    : `${window.location.protocol}//${window.location.host}/api`;

// DOM Elements
const pptForm = document.getElementById('pptForm');
const inputText = document.getElementById('inputText');
const charCount = document.getElementById('charCount');
const guidance = document.getElementById('guidance');
const llmProvider = document.getElementById('llmProvider');
const apiKey = document.getElementById('apiKey');
const templateFile = document.getElementById('templateFile');
const directFileInput = document.getElementById('directFileInput');
const browseButton = document.getElementById('browseButton');
const fileUploadArea = document.getElementById('fileUploadArea');
const uploadContent = document.getElementById('uploadContent');
const fileInfo = document.getElementById('fileInfo');
const fileName = document.getElementById('fileName');
const fileSize = document.getElementById('fileSize');
const generateBtn = document.getElementById('generateBtn');
const loadingState = document.getElementById('loadingState');
const loadingMessage = document.getElementById('loadingMessage');
const errorMessage = document.getElementById('errorMessage');
const errorText = document.getElementById('errorText');

// Guidance templates data
const guidanceTemplates = {
    sales: "Create a compelling sales presentation that builds trust, demonstrates value, and drives conversion. Focus on customer pain points, solution benefits, and clear call-to-action.",
    research: "Structure as a comprehensive research summary with clear methodology, key findings, data visualizations, and actionable insights. Maintain academic rigor while being accessible.",
    pitch: "Design an investor pitch deck that tells a compelling story: problem, solution, market opportunity, business model, traction, team, and funding ask. Keep it concise and impactful.",
    training: "Develop educational content that engages learners with clear objectives, step-by-step progression, practical examples, and knowledge checks. Make it interactive and memorable.",
    proposal: "Create a professional project proposal with clear scope, objectives, methodology, timeline, budget, and expected outcomes. Focus on feasibility and value proposition.",
    report: "Structure as an executive-level report with executive summary, key metrics, analysis, recommendations, and next steps. Use data-driven insights and actionable conclusions.",
    strategy: "Present strategic overview with current state analysis, strategic objectives, key initiatives, success metrics, and implementation roadmap. Focus on alignment and clarity.",
    conference: "Design an engaging conference presentation that educates and inspires. Include compelling opening, clear takeaways, audience interaction, and memorable closing."
};

// Initialize event listeners
document.addEventListener('DOMContentLoaded', function() {
    initializeEventListeners();
    updateCharCount();
    initializeGuidanceTemplates();
});

function initializeEventListeners() {
    // Text input character counting
    inputText.addEventListener('input', updateCharCount);
    
    // File upload events with debugging
    fileUploadArea.addEventListener('click', function(e) {
        console.log('📁 Upload area clicked');
        e.preventDefault();
        e.stopPropagation();
        templateFile.click();
    });
    
    fileUploadArea.addEventListener('dragover', handleDragOver);
    fileUploadArea.addEventListener('dragleave', handleDragLeave);
    fileUploadArea.addEventListener('drop', handleFileDrop);
    
    templateFile.addEventListener('change', function(e) {
        console.log('📂 File input changed:', e.target.files);
        handleFileSelect(e);
    });
    
    // Direct file input handler
    directFileInput.addEventListener('change', function(e) {
        console.log('📁 Direct file input changed:', e.target.files);
        if (e.target.files[0]) {
            // Sync with main template file input
            const dt = new DataTransfer();
            dt.items.add(e.target.files[0]);
            templateFile.files = dt.files;
            
            handleFileSelection(e.target.files[0]);
        }
    });
    
    // Browse button handler (alternative method)
    browseButton.addEventListener('click', function() {
        console.log('🔘 Browse button clicked');
        directFileInput.click();
    });
    
    // Form submission
    pptForm.addEventListener('submit', handleFormSubmit);
    
    // Provider change handler
    llmProvider.addEventListener('change', updateApiKeyPlaceholder);
    updateApiKeyPlaceholder();
}

function updateCharCount() {
    const count = inputText.value.length;
    charCount.textContent = count;
    charCount.className = count >= 100 ? 'text-green-600' : 'text-red-500';
}

function updateApiKeyPlaceholder() {
    const provider = llmProvider.value;
    const placeholders = {
        'openai': 'sk-...',
        'anthropic': 'sk-ant-...',
        'gemini': 'AIza...'
    };
    apiKey.placeholder = `Enter your ${provider.toUpperCase()} API key (${placeholders[provider] || 'API key'})`;
}

// File upload handlers
function handleDragOver(e) {
    e.preventDefault();
    fileUploadArea.classList.add('dragover');
}

function handleDragLeave(e) {
    e.preventDefault();
    fileUploadArea.classList.remove('dragover');
}

function handleFileDrop(e) {
    e.preventDefault();
    fileUploadArea.classList.remove('dragover');
    
    const files = e.dataTransfer.files;
    if (files.length > 0) {
        // Create a new FileList-like object and assign to input
        const dt = new DataTransfer();
        dt.items.add(files[0]);
        templateFile.files = dt.files;
        
        handleFileSelection(files[0]);
    }
}

function handleFileSelect(e) {
    const file = e.target.files[0];
    if (file) {
        handleFileSelection(file);
    }
}

function handleFileSelection(file) {
    console.log('🔍 Processing file:', {
        name: file.name,
        type: file.type,
        size: file.size
    });
    
    // Validate file type
    const allowedTypes = [
        'application/vnd.openxmlformats-officedocument.presentationml.presentation',
        'application/vnd.openxmlformats-officedocument.presentationml.template'
    ];
    
    const isValidType = allowedTypes.includes(file.type) || 
                       file.name.toLowerCase().endsWith('.pptx') || 
                       file.name.toLowerCase().endsWith('.potx');
    
    if (!isValidType) {
        console.error('❌ Invalid file type:', file.type, file.name);
        showError('Please select a valid PowerPoint file (.pptx or .potx)');
        return;
    }
    
    // Validate file size (50MB limit)
    const maxSize = 50 * 1024 * 1024;
    if (file.size > maxSize) {
        console.error('❌ File too large:', file.size);
        showError('File size exceeds 50MB limit. Please choose a smaller file.');
        return;
    }
    
    console.log('✅ File validation passed');
    
    // Update UI
    fileName.textContent = file.name;
    fileSize.textContent = formatFileSize(file.size);
    uploadContent.classList.add('hidden');
    fileInfo.classList.remove('hidden');
    
    // Verify the file input has the file
    console.log('📂 Template file input files:', templateFile.files.length);
    
    // Show success feedback
    showSuccessMessage(`✅ File uploaded: ${file.name}`);
    
    hideError();
}

function clearFile() {
    templateFile.value = '';
    directFileInput.value = '';
    uploadContent.classList.remove('hidden');
    fileInfo.classList.add('hidden');
}

function formatFileSize(bytes) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

// Form submission handler
async function handleFormSubmit(e) {
    e.preventDefault();
    
    // Validate form
    if (!validateForm()) {
        return;
    }
    
    // Show loading state
    showLoadingState();
    resetMainProcessingSteps();
    setMainStep(1);
    
    try {
        // Prepare form data
        const formData = new FormData();
        formData.append('text', inputText.value.trim());
        formData.append('guidance', guidance.value.trim());
        formData.append('api_key', apiKey.value.trim());
        formData.append('llm_provider', llmProvider.value);
        formData.append('include_speaker_notes', document.getElementById('includeSpeakerNotes').checked);
        formData.append('template', templateFile.files[0]);
        
        // Send request to preview endpoint to get slide previews
        // Step 1 shown during request start
        const response = await fetch(`${API_BASE_URL}/generate-presentation-with-preview`, {
            method: 'POST',
            body: formData
        });
        // Steps 2-4 visually progress while awaiting response
        setMainStep(2);
        setTimeout(() => setMainStep(3), 800);
        setTimeout(() => setMainStep(4), 1600);
        
        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || 'Failed to generate presentation');
        }
        
        // Handle successful response - should be JSON with preview data
        const data = await response.json();
        
        if (data.success) {
            // Show slide previews
            showSlidePreview(data);
        } else {
            throw new Error(data.error || 'Failed to generate presentation');
        }
        
        completeMainProcessingSteps();
        
    } catch (error) {
        console.error('Error generating presentation:', error);
        showError(error.message || 'Failed to generate presentation. Please try again.');
    } finally {
        hideLoadingState();
    }
}

// --- Processing steps helpers for main page ---
function resetMainProcessingSteps() {
    for (let i = 1; i <= 4; i++) {
        const el = document.getElementById(`mainProcessStep${i}`);
        if (!el) continue;
        el.innerHTML = el.innerHTML
            .replace('fa-check text-green-600', 'fa-circle-notch fa-spin')
            .replace('text-gray-500', 'text-gray-700');
    }
}

function setMainStep(step) {
    for (let i = 1; i <= step; i++) {
        const el = document.getElementById(`mainProcessStep${i}`);
        if (!el) continue;
        el.innerHTML = el.innerHTML.replace('fa-circle-notch fa-spin', 'fa-check text-green-600');
    }
}

function completeMainProcessingSteps() {
    setMainStep(4);
}

function validateForm() {
    console.log('🔍 Validating form...');
    
    // Check text length
    const textLength = inputText.value.trim().length;
    console.log('📝 Text length:', textLength);
    if (textLength < 100) {
        console.log('❌ Text too short');
        showError('Input text must be at least 100 characters long.');
        inputText.focus();
        return false;
    }
    
    // Check API key
    const hasApiKey = !!apiKey.value.trim();
    console.log('🔑 Has API key:', hasApiKey);
    if (!hasApiKey) {
        console.log('❌ No API key');
        showError('API key is required.');
        apiKey.focus();
        return false;
    }
    
    // Check file upload
    const hasFile = !!templateFile.files[0];
    console.log('📂 Has file:', hasFile);
    console.log('📂 File details:', templateFile.files[0]);
    if (!hasFile) {
        console.log('❌ No file uploaded');
        showError('Please upload a PowerPoint template file.');
        return false;
    }
    
    console.log('✅ Form validation passed');
    return true;
}

function showLoadingState() {
    pptForm.classList.add('hidden');
    loadingState.classList.remove('hidden');
    
    // Update loading messages
    const messages = [
        'Analyzing your text and template...',
        'Structuring content into slides...',
        'Applying template styles...',
        'Generating PowerPoint presentation...',
        'Finalizing your presentation...'
    ];
    
    let messageIndex = 0;
    const messageInterval = setInterval(() => {
        if (messageIndex < messages.length) {
            loadingMessage.textContent = messages[messageIndex];
            messageIndex++;
        } else {
            clearInterval(messageInterval);
        }
    }, 3000);
    
    // Store interval for cleanup
    window.loadingMessageInterval = messageInterval;
}

function hideLoadingState() {
    if (window.loadingMessageInterval) {
        clearInterval(window.loadingMessageInterval);
    }
    
    loadingState.classList.add('hidden');
    pptForm.classList.remove('hidden');
}

function showError(message) {
    errorText.textContent = message;
    errorMessage.classList.remove('hidden');
    errorMessage.scrollIntoView({ behavior: 'smooth', block: 'center' });
}

function hideError() {
    errorMessage.classList.add('hidden');
}

function showSuccessMessage(message) {
    // Remove any existing success messages
    const existingSuccess = document.querySelector('.success-message');
    if (existingSuccess) {
        existingSuccess.remove();
    }
    
    // Create success message
    const successDiv = document.createElement('div');
    successDiv.className = 'success-message bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded mb-4';
    successDiv.innerHTML = `
        <div class="flex items-center">
            <i class="fas fa-check-circle mr-2"></i>
            <span>${message}</span>
        </div>
    `;
    
    // Insert after error message
    errorMessage.parentNode.insertBefore(successDiv, errorMessage.nextSibling);
    
    // Remove success message after 3 seconds
    setTimeout(() => {
        successDiv.remove();
    }, 3000);
}

function showSuccess() {
    // Create success message
    const successDiv = document.createElement('div');
    successDiv.className = 'bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded mb-4';
    successDiv.innerHTML = `
        <div class="flex items-center">
            <i class="fas fa-check-circle mr-2"></i>
            <span>Presentation generated successfully! Your download should start automatically.</span>
        </div>
    `;
    
    // Insert after error message
    errorMessage.parentNode.insertBefore(successDiv, errorMessage.nextSibling);
    
    // Remove success message after 5 seconds
    setTimeout(() => {
        successDiv.remove();
    }, 5000);
    
    // Reset form
    setTimeout(() => {
        resetForm();
    }, 2000);
}

function resetForm() {
    inputText.value = '';
    guidance.value = '';
    apiKey.value = '';
    clearFile();
    updateCharCount();
    hideError();
}

function downloadFile(blob, filename) {
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.style.display = 'none';
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);
}

// Health check on page load
async function checkApiHealth() {
    try {
        const response = await fetch(`${API_BASE_URL}/health`);
        if (!response.ok) {
            throw new Error('API not available');
        }
    } catch (error) {
        console.warn('API health check failed:', error);
        showError('Backend service is not available. Please try again later.');
    }
}

// Check API health when page loads
setTimeout(checkApiHealth, 1000);

function initializeGuidanceTemplates() {
    // Add click handlers for guidance template buttons
    const templateButtons = document.querySelectorAll('.guidance-template');
    const guidanceInput = document.getElementById('guidance');
    
    templateButtons.forEach(button => {
        button.addEventListener('click', function() {
            const template = this.getAttribute('data-template');
            const guidance = guidanceTemplates[template];
            
            if (guidance) {
                guidanceInput.value = guidance;
                
                // Visual feedback
                templateButtons.forEach(btn => btn.classList.remove('ring-2', 'ring-offset-1'));
                this.classList.add('ring-2', 'ring-offset-1');
                
                // Auto-focus on the input to show the change
                guidanceInput.focus();
                guidanceInput.select();
                
                console.log(`Applied ${template} template`);
            }
        });
    });
}

function validateAllInputs() {
    // Validate template file
    if (!templateFile.files || !templateFile.files[0]) {
        return {
            valid: false,
            message: 'Please upload a PowerPoint template file (.pptx or .potx)'
        };
    }
    
    const file = templateFile.files[0];
    
    // File size validation (50MB limit)
    const maxSize = 50 * 1024 * 1024;
    if (file.size > maxSize) {
        const sizeMB = (file.size / (1024 * 1024)).toFixed(1);
        return {
            valid: false,
            message: `File size (${sizeMB}MB) exceeds the maximum limit of 50MB. Please choose a smaller file.`
        };
    }
    
    // File type validation
    const allowedTypes = ['.pptx', '.potx'];
    const fileExt = '.' + file.name.split('.').pop().toLowerCase();
    if (!allowedTypes.includes(fileExt)) {
        return {
            valid: false,
            message: `Invalid file type "${fileExt}". Please upload a PowerPoint file (.pptx or .potx).`
        };
    }
    
    // Validate text input
    const text = inputText.value.trim();
    const minLength = 100;
    const maxLength = 100000;
    
    if (!text) {
        return {
            valid: false,
            message: 'Please enter text content to convert into slides'
        };
    }
    
    if (text.length < minLength) {
        return {
            valid: false,
            message: `Text content is too short. Please provide at least ${minLength} characters (current: ${text.length})`
        };
    }
    
    if (text.length > maxLength) {
        return {
            valid: false,
            message: `Text content is too long. Maximum ${maxLength.toLocaleString()} characters allowed (current: ${text.length.toLocaleString()})`
        };
    }
    
    // Validate API key
    const key = apiKey.value.trim();
    const provider = llmProvider.value;
    
    if (!key) {
        return {
            valid: false,
            message: `Please provide a valid ${provider.toUpperCase()} API key`
        };
    }
    
    // Basic API key format validation
    if (provider === 'openai' && !key.startsWith('sk-')) {
        return {
            valid: false,
            message: 'OpenAI API keys should start with "sk-". Please check your API key.'
        };
    }
    
    if (provider === 'anthropic' && !key.startsWith('sk-ant-')) {
        return {
            valid: false,
            message: 'Anthropic API keys should start with "sk-ant-". Please check your API key.'
        };
    }
    
    if (provider === 'gemini' && key.length < 30) {
        return {
            valid: false,
            message: 'Gemini API key appears to be too short. Please check your API key.'
        };
    }
    
    return { valid: true, message: '' };
}

// Global variable to store current preview data
let currentPreviewData = null;

// Slide preview functions
function showSlidePreview(data) {
    currentPreviewData = data;
    
    // Hide form and loading, show preview
    pptForm.classList.add('hidden');
    loadingState.classList.add('hidden');
    document.getElementById('slidePreviewSection').classList.remove('hidden');
    
    // Update preview header
    document.getElementById('previewTitle').textContent = data.presentation_title || 'Generated Presentation';
    document.getElementById('previewSlideCount').textContent = data.total_slides || 0;
    document.getElementById('previewTemplate').textContent = data.template_filename || 'Template';
    document.getElementById('previewSpeakerNotes').textContent = data.slides_with_notes || 0;
    
    // Generate slide previews
    generateMainSlidePreviews(data.slides || []);
    
    // Show generation details
    showMainGenerationDetails(data);
}

function generateMainSlidePreviews(slides) {
    const slidePreviews = document.getElementById('mainSlidePreviews');
    
    if (!slides || slides.length === 0) {
        slidePreviews.innerHTML = '<p class="text-gray-500 col-span-full text-center py-8">No slides to preview</p>';
        return;
    }
    
    slidePreviews.innerHTML = slides.map((slide, index) => {
        // Create content HTML
        let contentHtml = '';
        if (Array.isArray(slide.content)) {
            contentHtml = slide.content.map(item => `• ${item}`).join('<br>');
        } else if (slide.content) {
            contentHtml = slide.content.replace(/\n/g, '<br>');
        }
        
        // Gradient backgrounds for visual variety
        const gradients = [
            'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
            'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
            'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)',
            'linear-gradient(135deg, #fa709a 0%, #fee140 100%)',
            'linear-gradient(135deg, #a8edea 0%, #fed6e3 100%)'
        ];
        
        const gradient = gradients[index % gradients.length];
        
        const speakerNotesPreview = slide.speaker_notes ? 
            `<div class="mt-3 pt-2 border-t border-white border-opacity-30">
                <div class="text-xs opacity-75 mb-1">📝 Speaker Notes:</div>
                <div class="text-xs opacity-85">${slide.speaker_notes.length > 60 ? slide.speaker_notes.substring(0, 60) + '...' : slide.speaker_notes}</div>
            </div>` : '';

        return `
            <div class="slide-preview" style="background: ${gradient}">
                <div class="slide-preview-content">
                    <div class="slide-number">${index + 1}</div>
                    <div class="slide-title">${slide.title || 'Untitled Slide'}</div>
                    <div class="slide-content">${contentHtml}</div>
                    ${speakerNotesPreview}
                </div>
            </div>
        `;
    }).join('');
}

function showMainGenerationDetails(data) {
    const generationDetails = document.getElementById('mainGenerationDetails');
    
    generationDetails.innerHTML = `
        <div class="text-center">
            <div class="text-2xl font-bold text-blue-600 mb-1">${data.total_slides || 0}</div>
            <div class="text-sm text-gray-600">Slides Generated</div>
        </div>
        
        <div class="text-center">
            <div class="text-2xl font-bold text-green-600 mb-1">${data.layouts_used || 0}</div>
            <div class="text-sm text-gray-600">Layouts Applied</div>
        </div>
        
        <div class="text-center">
            <div class="text-2xl font-bold text-purple-600 mb-1">${data.template_images || 0}</div>
            <div class="text-sm text-gray-600">Template Assets</div>
        </div>
        
        <div class="text-center">
            <div class="text-2xl font-bold text-orange-600 mb-1">${data.slides_with_notes || 0}</div>
            <div class="text-sm text-gray-600">Speaker Notes</div>
        </div>
    `;
}

function downloadFromPreview() {
    if (currentPreviewData && currentPreviewData.download_url) {
        // Create download link
        const link = document.createElement('a');
        link.href = currentPreviewData.download_url;
        link.download = currentPreviewData.filename || 'presentation.pptx';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        showSuccess();
    } else {
        showError('Download link not available. Please regenerate the presentation.');
    }
}

function regenerateFromPreview() {
    // Hide preview and show form again
    document.getElementById('slidePreviewSection').classList.add('hidden');
    pptForm.classList.remove('hidden');
    currentPreviewData = null;
}

// Test function for debugging
window.testFileUpload = function() {
    console.log('🧪 Testing file upload elements...');
    console.log('templateFile:', templateFile);
    console.log('directFileInput:', directFileInput);
    console.log('browseButton:', browseButton);
    console.log('fileUploadArea:', fileUploadArea);
    
    // Test direct file input click
    console.log('🧪 Testing directFileInput.click()...');
    directFileInput.click();
};

