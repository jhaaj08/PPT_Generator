// Full Flow Test JavaScript
const API_BASE_URL = 'http://localhost:8080/api';

// Global variables
let currentResults = null;

// DOM Elements
const fullFlowForm = document.getElementById('fullFlowForm');
const fileUploadArea = document.getElementById('fileUploadArea');
const templateFile = document.getElementById('templateFile');
const uploadContent = document.getElementById('uploadContent');
const fileInfo = document.getElementById('fileInfo');
const fileName = document.getElementById('fileName');
const fileSize = document.getElementById('fileSize');
const generateBtn = document.getElementById('generateBtn');
const inputSection = document.getElementById('inputSection');
const processingSection = document.getElementById('processingSection');
const progressBar = document.getElementById('progressBar');
const processingTitle = document.getElementById('processingTitle');
const previewSection = document.getElementById('previewSection');
const errorSection = document.getElementById('errorSection');
const errorMessage = document.getElementById('errorMessage');

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

// Initialize
document.addEventListener('DOMContentLoaded', function() {
    initializeEventListeners();
    initializeGuidanceTemplates();
});

function initializeEventListeners() {
    // File upload events
    fileUploadArea.addEventListener('click', function(e) {
        e.preventDefault();
        templateFile.click();
    });

    fileUploadArea.addEventListener('dragover', handleDragOver);
    fileUploadArea.addEventListener('dragleave', handleDragLeave);
    fileUploadArea.addEventListener('drop', handleFileDrop);

    templateFile.addEventListener('change', handleFileSelect);

    // Form submission
    fullFlowForm.addEventListener('submit', handleFormSubmit);
}

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

function handleDragOver(e) {
    e.preventDefault();
    e.stopPropagation();
    fileUploadArea.classList.add('dragover');
}

function handleDragLeave(e) {
    e.preventDefault();
    e.stopPropagation();
    fileUploadArea.classList.remove('dragover');
}

function handleFileDrop(e) {
    e.preventDefault();
    e.stopPropagation();
    fileUploadArea.classList.remove('dragover');
    
    const files = e.dataTransfer.files;
    if (files.length > 0) {
        const file = files[0];
        if (isValidFile(file)) {
            const dt = new DataTransfer();
            dt.items.add(file);
            templateFile.files = dt.files;
            displayFileInfo(file);
        } else {
            showError('Please select a valid PowerPoint file (.pptx or .potx)');
        }
    }
}

function handleFileSelect(e) {
    const file = e.target.files[0];
    if (file) {
        const validation = validateFileUpload(file);
        if (validation.valid) {
            displayFileInfo(file);
        } else {
            showError(validation.message);
            clearFile();
        }
    }
}

function validateFileUpload(file) {
    // File size validation (50MB limit)
    const maxSize = 50 * 1024 * 1024; // 50MB in bytes
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
    
    // File name validation
    if (file.name.length > 255) {
        return {
            valid: false,
            message: 'File name is too long. Please rename your file to be shorter than 255 characters.'
        };
    }
    
    // Check for common file corruption indicators
    if (file.size === 0) {
        return {
            valid: false,
            message: 'The selected file appears to be empty or corrupted. Please choose a different file.'
        };
    }
    
    return { valid: true, message: '' };
}

function validateFormInputs() {
    // Validate template file
    if (!templateFile.files || !templateFile.files[0]) {
        return {
            valid: false,
            message: 'Please upload a PowerPoint template file (.pptx or .potx)'
        };
    }
    
    const fileValidation = validateFileUpload(templateFile.files[0]);
    if (!fileValidation.valid) {
        return fileValidation;
    }
    
    // Validate text input
    const inputText = document.getElementById('inputText').value.trim();
    const minLength = 100;
    const maxLength = 100000;
    
    if (!inputText) {
        return {
            valid: false,
            message: 'Please enter text content to convert into slides'
        };
    }
    
    if (inputText.length < minLength) {
        return {
            valid: false,
            message: `Text content is too short. Please provide at least ${minLength} characters (current: ${inputText.length})`
        };
    }
    
    if (inputText.length > maxLength) {
        return {
            valid: false,
            message: `Text content is too long. Maximum ${maxLength.toLocaleString()} characters allowed (current: ${inputText.length.toLocaleString()})`
        };
    }
    
    // Validate API key
    const apiKey = document.getElementById('apiKey').value.trim();
    const provider = document.getElementById('llmProvider').value;
    
    if (!apiKey) {
        return {
            valid: false,
            message: `Please provide a valid ${provider.toUpperCase()} API key`
        };
    }
    
    // Basic API key format validation
    if (provider === 'openai' && !apiKey.startsWith('sk-')) {
        return {
            valid: false,
            message: 'OpenAI API keys should start with "sk-". Please check your API key.'
        };
    }
    
    if (provider === 'anthropic' && !apiKey.startsWith('sk-ant-')) {
        return {
            valid: false,
            message: 'Anthropic API keys should start with "sk-ant-". Please check your API key.'
        };
    }
    
    if (provider === 'gemini' && apiKey.length < 30) {
        return {
            valid: false,
            message: 'Gemini API key appears to be too short. Please check your API key.'
        };
    }
    
    return { valid: true, message: '' };
}

function isValidFile(file) {
    const allowedTypes = [
        'application/vnd.openxmlformats-officedocument.presentationml.presentation',
        'application/vnd.openxmlformats-officedocument.presentationml.template'
    ];
    const allowedExtensions = ['.pptx', '.potx'];
    
    return allowedTypes.includes(file.type) || 
           allowedExtensions.some(ext => file.name.toLowerCase().endsWith(ext));
}

function displayFileInfo(file) {
    fileName.textContent = file.name;
    fileSize.textContent = formatFileSize(file.size);
    uploadContent.classList.add('hidden');
    fileInfo.classList.remove('hidden');
    hideError();
}

function clearFile() {
    templateFile.value = '';
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

async function handleFormSubmit(e) {
    e.preventDefault();
    
    // Validate form inputs before proceeding
    const validation = validateFormInputs();
    if (!validation.valid) {
        showError(validation.message);
        return;
    }
    
    const formData = new FormData();
    formData.append('template', templateFile.files[0]);
    formData.append('text', document.getElementById('inputText').value.trim());
    formData.append('guidance', document.getElementById('guidance').value.trim());
    formData.append('api_key', document.getElementById('apiKey').value.trim());
    formData.append('llm_provider', document.getElementById('llmProvider').value);
    formData.append('include_speaker_notes', document.getElementById('includeSpeakerNotes').checked);
    
    if (!formData.get('text')) {
        showError('Please enter presentation content');
        return;
    }
    
    if (!formData.get('api_key')) {
        showError('Please enter your API key');
        return;
    }
    
    hideError();
    showProcessing();
    
    try {
        updateProgressStep(1, 'Extracting template data...', 10);
        
        const response = await fetch(`${API_BASE_URL}/generate-presentation-with-preview`, {
            method: 'POST',
            body: formData
        });
        
        updateProgressStep(4, 'Finalizing presentation...', 95);
        
        const data = await response.json();
        
        if (response.ok) {
            updateProgressStep(4, 'Complete!', 100);
            currentResults = data;
            showPreview(data);
        } else {
            throw new Error(data.error || 'Failed to generate presentation');
        }
        
    } catch (error) {
        console.error('Error:', error);
        
        // Enhanced error handling with user-friendly messages
        let errorMessage = 'Failed to generate presentation';
        
        if (error.name === 'TypeError' && error.message.includes('fetch')) {
            errorMessage = 'Unable to connect to the server. Please check your internet connection and try again.';
        } else if (error.message.includes('API key')) {
            errorMessage = 'API key authentication failed. Please check your API key and try again.';
        } else if (error.message.includes('timeout')) {
            errorMessage = 'Request timed out. The server is taking too long to respond. Please try again.';
        } else if (error.message.includes('429') || error.message.includes('rate limit')) {
            errorMessage = 'API rate limit exceeded. Please wait a moment and try again.';
        } else if (error.message.includes('500') || error.message.includes('internal server')) {
            errorMessage = 'Server error occurred. Please try again in a few minutes.';
        } else if (error.message.includes('network')) {
            errorMessage = 'Network error. Please check your internet connection and try again.';
        } else if (error.message) {
            errorMessage = error.message;
        }
        
        showError(errorMessage);
        hideProcessing();
    }
}

function showProcessing() {
    generateBtn.disabled = true;
    updateProgressTimeline(2);
    inputSection.classList.add('hidden');
    processingSection.classList.remove('hidden');
    previewSection.classList.add('hidden');
}

function updateProgressStep(step, text, percent) {
    progressBar.style.width = `${percent}%`;
    processingTitle.textContent = text;
    
    // Update step indicators
    for (let i = 1; i <= 4; i++) {
        const stepEl = document.getElementById(`processStep${i}`);
        if (i <= step) {
            stepEl.classList.remove('hidden');
            if (i < step) {
                stepEl.innerHTML = stepEl.innerHTML.replace('fa-circle-notch fa-spin', 'fa-check text-green-600');
            }
        }
    }
    
    // Update progress steps for different stages
    const progressTexts = {
        1: 'Extracting template data...',
        2: 'Generating manifest with LLM...',
        3: 'Structuring content into slides...',
        4: 'Creating presentation with template styling...'
    };
    
    if (step >= 2) updateProgressStep2(20, progressTexts[2]);
    if (step >= 3) updateProgressStep3(50, progressTexts[3]);
    if (step >= 4) updateProgressStep4(80, progressTexts[4]);
}

function updateProgressStep2(percent, text) {
    document.getElementById('processStep2').classList.remove('hidden');
    if (percent >= 50) {
        document.getElementById('processStep2').innerHTML = document.getElementById('processStep2').innerHTML.replace('fa-circle-notch fa-spin', 'fa-check text-green-600');
    }
}

function updateProgressStep3(percent, text) {
    document.getElementById('processStep3').classList.remove('hidden');
    if (percent >= 80) {
        document.getElementById('processStep3').innerHTML = document.getElementById('processStep3').innerHTML.replace('fa-circle-notch fa-spin', 'fa-check text-green-600');
    }
}

function updateProgressStep4(percent, text) {
    document.getElementById('processStep4').classList.remove('hidden');
    if (percent >= 95) {
        document.getElementById('processStep4').innerHTML = document.getElementById('processStep4').innerHTML.replace('fa-circle-notch fa-spin', 'fa-check text-green-600');
    }
}

function hideProcessing() {
    generateBtn.disabled = false;
    processingSection.classList.add('hidden');
    inputSection.classList.remove('hidden');
    updateProgressTimeline(1);
}

function showPreview(data) {
    hideProcessing();
    updateProgressTimeline(3);
    
    // Update presentation header
    document.getElementById('presentationTitle').textContent = data.presentation_title || 'Generated Presentation';
    document.getElementById('slideCount').textContent = data.total_slides || 0;
    document.getElementById('templateUsed').textContent = data.template_filename || 'Template';
    document.getElementById('generationTime').textContent = new Date().toLocaleTimeString();
    
    // Generate slide previews
    generateSlidePreviews(data.slides || []);
    
    // Show generation details
    showGenerationDetails(data);
    
    previewSection.classList.remove('hidden');
    previewSection.scrollIntoView({ behavior: 'smooth' });
}

function generateSlidePreviews(slides) {
    const slidePreviews = document.getElementById('slidePreviews');
    
    if (!slides || slides.length === 0) {
        slidePreviews.innerHTML = '<p class="text-gray-500 col-span-full text-center py-8">No slides to preview</p>';
        return;
    }
    
    slidePreviews.innerHTML = slides.map((slide, index) => {
        let contentHtml = '';
        
        if (Array.isArray(slide.content)) {
            contentHtml = slide.content.slice(0, 3).map(item => 
                `<div class="mb-1">• ${item.length > 40 ? item.substring(0, 40) + '...' : item}</div>`
            ).join('');
            if (slide.content.length > 3) {
                contentHtml += `<div class="text-xs opacity-75">...and ${slide.content.length - 3} more</div>`;
            }
        } else {
            const text = slide.content || '';
            contentHtml = text.length > 120 ? text.substring(0, 120) + '...' : text;
        }
        
        // Generate different background gradients for visual variety
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

function showGenerationDetails(data) {
    const generationDetails = document.getElementById('generationDetails');
    
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

function updateProgressTimeline(currentStep) {
    for (let i = 1; i <= 4; i++) {
        const stepEl = document.getElementById(`step${i}`);
        if (i < currentStep) {
            stepEl.classList.remove('active');
            stepEl.classList.add('completed');
        } else if (i === currentStep) {
            stepEl.classList.remove('completed');
            stepEl.classList.add('active');
        } else {
            stepEl.classList.remove('active', 'completed');
        }
    }
}

function downloadPresentation() {
    if (currentResults && currentResults.download_url) {
        // Create a temporary link and click it
        const link = document.createElement('a');
        link.href = currentResults.download_url;
        link.download = currentResults.filename || 'presentation.pptx';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        // Update timeline to show download completed
        updateProgressTimeline(4);
    } else {
        showError('No presentation available for download');
    }
}

function regeneratePresentation() {
    if (confirm('Are you sure you want to regenerate the presentation? This will create a new version.')) {
        previewSection.classList.add('hidden');
        updateProgressTimeline(1);
        inputSection.classList.remove('hidden');
        currentResults = null;
    }
}

function showError(message) {
    errorMessage.textContent = message;
    errorSection.classList.remove('hidden');
    errorSection.scrollIntoView({ behavior: 'smooth' });
}

function hideError() {
    errorSection.classList.add('hidden');
}
