// Single Slide Generation Test JavaScript
const API_BASE_URL = 'http://localhost:8080/api';

// Global variables
let currentResults = null;

// DOM Elements
const singleSlideForm = document.getElementById('singleSlideForm');
const fileUploadArea = document.getElementById('fileUploadArea');
const templateFile = document.getElementById('templateFile');
const uploadContent = document.getElementById('uploadContent');
const fileInfo = document.getElementById('fileInfo');
const fileName = document.getElementById('fileName');
const fileSize = document.getElementById('fileSize');
const generateBtn = document.getElementById('generateBtn');
const progressSection = document.getElementById('progressSection');
const progressBar = document.getElementById('progressBar');
const progressText = document.getElementById('progressText');
const progressTitle = document.getElementById('progressTitle');
const resultsSection = document.getElementById('resultsSection');
const errorSection = document.getElementById('errorSection');
const errorMessage = document.getElementById('errorMessage');

// Initialize
document.addEventListener('DOMContentLoaded', function() {
    initializeEventListeners();
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
    singleSlideForm.addEventListener('submit', handleFormSubmit);
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
        if (isValidFile(file)) {
            displayFileInfo(file);
        } else {
            showError('Please select a valid PowerPoint file (.pptx or .potx)');
            clearFile();
        }
    }
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
    
    const formData = new FormData();
    formData.append('template', templateFile.files[0]);
    formData.append('text', document.getElementById('inputText').value.trim());
    formData.append('api_key', document.getElementById('apiKey').value.trim());
    formData.append('llm_provider', document.getElementById('llmProvider').value);
    
    if (!formData.get('template')) {
        showError('Please upload a PowerPoint template file');
        return;
    }
    
    if (!formData.get('text')) {
        showError('Please enter some test content');
        return;
    }
    
    if (!formData.get('api_key')) {
        showError('Please enter your API key');
        return;
    }
    
    hideError();
    showProgress();
    
    try {
        updateProgress(10, 'Uploading template and content...', 1);
        
        const response = await fetch(`${API_BASE_URL}/test-single-slide`, {
            method: 'POST',
            body: formData
        });
        
        updateProgress(90, 'Processing results...', 4);
        
        const data = await response.json();
        
        if (response.ok) {
            updateProgress(100, 'Complete!', 4);
            currentResults = data;
            showResults(data);
        } else {
            throw new Error(data.error || 'Failed to generate single slide');
        }
        
    } catch (error) {
        console.error('Error:', error);
        showError(`Error generating slide: ${error.message}`);
        hideProgress();
    }
}

function showProgress() {
    generateBtn.disabled = true;
    progressSection.classList.remove('hidden');
    resultsSection.classList.add('hidden');
    
    // Reset progress indicators
    updateProgressSteps(1);
}

function updateProgress(percent, text, step) {
    progressBar.style.width = `${percent}%`;
    if (text) {
        progressText.textContent = text;
    }
    if (step) {
        updateProgressSteps(step);
        
        const stepTitles = {
            1: 'Processing Input',
            2: 'Generating LLM Content', 
            3: 'Matching Template Layout',
            4: 'Creating Slide'
        };
        
        progressTitle.textContent = stepTitles[step] || 'Processing...';
    }
}

function updateProgressSteps(currentStep) {
    for (let i = 1; i <= 4; i++) {
        const stepEl = document.getElementById(`step${i}`);
        const progressEl = document.getElementById(`progress${i}`);
        
        if (i < currentStep) {
            stepEl.classList.remove('active');
            stepEl.classList.add('completed');
            if (progressEl) progressEl.style.backgroundColor = '#10b981';
        } else if (i === currentStep) {
            stepEl.classList.remove('completed');
            stepEl.classList.add('active');
        } else {
            stepEl.classList.remove('active', 'completed');
            if (progressEl) progressEl.style.backgroundColor = '#d1d5db';
        }
    }
}

function hideProgress() {
    generateBtn.disabled = false;
    progressSection.classList.add('hidden');
}

function showResults(data) {
    hideProgress();
    
    // Update results summary
    const summary = document.getElementById('resultsSummary');
    summary.innerHTML = `
        <div class="text-center">
            <div class="w-12 h-12 mx-auto mb-2 rounded-full flex items-center justify-center ${data.success ? 'bg-green-100' : 'bg-red-100'}">
                <i class="fas ${data.success ? 'fa-check text-green-600' : 'fa-times text-red-600'} text-xl"></i>
            </div>
            <p class="text-sm font-medium text-gray-500">Overall</p>
            <p class="text-lg font-bold ${data.success ? 'text-green-600' : 'text-red-600'}">${data.success ? 'Success' : 'Failed'}</p>
        </div>
        
        <div class="text-center">
            <div class="w-12 h-12 mx-auto mb-2 rounded-full flex items-center justify-center ${data.llm_success ? 'bg-green-100' : 'bg-red-100'}">
                <i class="fas fa-brain ${data.llm_success ? 'text-green-600' : 'text-red-600'} text-xl"></i>
            </div>
            <p class="text-sm font-medium text-gray-500">LLM Content</p>
            <p class="text-lg font-bold ${data.llm_success ? 'text-green-600' : 'text-red-600'}">${data.llm_success ? 'Generated' : 'Failed'}</p>
        </div>
        
        <div class="text-center">
            <div class="w-12 h-12 mx-auto mb-2 rounded-full flex items-center justify-center ${data.layout_matched ? 'bg-green-100' : 'bg-yellow-100'}">
                <i class="fas fa-th-large ${data.layout_matched ? 'text-green-600' : 'text-yellow-600'} text-xl"></i>
            </div>
            <p class="text-sm font-medium text-gray-500">Layout</p>
            <p class="text-lg font-bold ${data.layout_matched ? 'text-green-600' : 'text-yellow-600'}">${data.layout_matched ? 'Matched' : 'Default'}</p>
        </div>
        
        <div class="text-center">
            <div class="w-12 h-12 mx-auto mb-2 rounded-full flex items-center justify-center ${data.content_applied ? 'bg-green-100' : 'bg-red-100'}">
                <i class="fas fa-file-alt ${data.content_applied ? 'text-green-600' : 'text-red-600'} text-xl"></i>
            </div>
            <p class="text-sm font-medium text-gray-500">Content</p>
            <p class="text-lg font-bold ${data.content_applied ? 'text-green-600' : 'text-red-600'}">${data.content_applied ? 'Applied' : 'Missing'}</p>
        </div>
    `;
    
    // Show LLM generated content
    const llmContent = document.getElementById('llmContent');
    if (data.generated_slide) {
        const slide = data.generated_slide;
        let contentHtml = '';
        
        if (Array.isArray(slide.content)) {
            contentHtml = slide.content.map(bullet => `<li class="ml-4">${bullet}</li>`).join('');
            contentHtml = `<ul class="list-disc space-y-1">${contentHtml}</ul>`;
        } else {
            contentHtml = `<p class="text-gray-700">${slide.content}</p>`;
        }
        
        llmContent.innerHTML = `
            <div class="space-y-4">
                <div>
                    <h5 class="font-semibold text-gray-800 mb-2">Title:</h5>
                    <p class="text-lg font-medium text-blue-600">"${slide.title}"</p>
                </div>
                <div>
                    <h5 class="font-semibold text-gray-800 mb-2">Content:</h5>
                    ${contentHtml}
                </div>
                <div class="text-sm text-gray-500">
                    Type: ${slide.type || 'Not specified'} | 
                    Content Length: ${Array.isArray(slide.content) ? slide.content.length + ' items' : slide.content.length + ' chars'}
                </div>
            </div>
        `;
    } else {
        llmContent.innerHTML = '<p class="text-red-500">No content generated</p>';
    }
    
    // Show layout matching info
    const layoutMatching = document.getElementById('layoutMatching');
    layoutMatching.innerHTML = `
        <div class="space-y-4">
            <div>
                <h5 class="font-semibold text-gray-800 mb-2">Available Layouts:</h5>
                <p class="text-gray-700">${data.available_layouts || 0} layouts found in template</p>
            </div>
            <div>
                <h5 class="font-semibold text-gray-800 mb-2">Layout Selected:</h5>
                <p class="text-lg font-medium ${data.layout_matched ? 'text-green-600' : 'text-yellow-600'}">
                    ${data.layout_used || 'Unknown'}
                    ${data.layout_matched ? '' : ' (fallback)'}
                </p>
            </div>
            <div>
                <h5 class="font-semibold text-gray-800 mb-2">Matching Logic:</h5>
                <p class="text-sm text-gray-600">${data.layout_reason || 'Layout selection based on content analysis'}</p>
            </div>
        </div>
    `;
    
    // Show final slide result
    const slideResult = document.getElementById('slideResult');
    slideResult.innerHTML = `
        <div class="space-y-4">
            <div class="grid md:grid-cols-2 gap-4">
                <div>
                    <h5 class="font-semibold text-gray-800 mb-2">Title Applied:</h5>
                    <p class="text-${data.title_applied ? 'green' : 'red'}-600 font-medium">
                        <i class="fas fa-${data.title_applied ? 'check' : 'times'} mr-1"></i>
                        ${data.title_applied ? 'Success' : 'Failed'}
                    </p>
                    ${data.final_title ? `<p class="text-sm text-gray-600 mt-1">"${data.final_title}"</p>` : ''}
                </div>
                <div>
                    <h5 class="font-semibold text-gray-800 mb-2">Content Applied:</h5>
                    <p class="text-${data.content_applied ? 'green' : 'red'}-600 font-medium">
                        <i class="fas fa-${data.content_applied ? 'check' : 'times'} mr-1"></i>
                        ${data.content_applied ? 'Success' : 'Failed'}
                    </p>
                    ${data.final_content ? `<p class="text-sm text-gray-600 mt-1">"${data.final_content.substring(0, 50)}..."</p>` : ''}
                </div>
            </div>
            
            <div class="bg-gray-50 p-4 rounded-lg">
                <h5 class="font-semibold text-gray-800 mb-2">Slide Info:</h5>
                <div class="grid grid-cols-2 gap-4 text-sm">
                    <div>Layout: ${data.layout_used || 'Unknown'}</div>
                    <div>Content Shapes: ${data.content_shapes || 0}</div>
                    <div>Template: ${data.template_filename || 'Unknown'}</div>
                    <div>File Size: ${data.file_size ? formatFileSize(data.file_size) : 'Unknown'}</div>
                </div>
            </div>
            
            ${data.download_url ? `
                <div class="text-center">
                    <a href="${data.download_url}" download class="inline-flex items-center bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-lg transition duration-200">
                        <i class="fas fa-download mr-2"></i>Download Generated Slide
                    </a>
                </div>
            ` : ''}
        </div>
    `;
    
    resultsSection.classList.remove('hidden');
    resultsSection.scrollIntoView({ behavior: 'smooth' });
}

function showError(message) {
    errorMessage.textContent = message;
    errorSection.classList.remove('hidden');
    errorSection.scrollIntoView({ behavior: 'smooth' });
}

function hideError() {
    errorSection.classList.add('hidden');
}

function downloadSlide() {
    if (currentResults && currentResults.download_url) {
        window.open(currentResults.download_url, '_blank');
    } else {
        showError('No slide available for download');
    }
}

function downloadDebug() {
    if (!currentResults) return;
    
    const dataStr = JSON.stringify(currentResults, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    
    const link = document.createElement('a');
    link.href = URL.createObjectURL(dataBlob);
    link.download = `single-slide-debug-${Date.now()}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}

function resetTest() {
    singleSlideForm.reset();
    clearFile();
    hideError();
    hideProgress();
    resultsSection.classList.add('hidden');
    currentResults = null;
    
    // Reset progress steps
    updateProgressSteps(1);
    
    // Scroll to top
    window.scrollTo({ top: 0, behavior: 'smooth' });
}
