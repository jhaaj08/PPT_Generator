// Test Manifest JavaScript
const API_BASE_URL = 'http://localhost:8080/api';

// Global variables
let currentManifestData = null;

// DOM Elements
const manifestForm = document.getElementById('manifestForm');
const fileUploadArea = document.getElementById('fileUploadArea');
const templateFile = document.getElementById('templateFile');
const uploadContent = document.getElementById('uploadContent');
const fileInfo = document.getElementById('fileInfo');
const fileName = document.getElementById('fileName');
const fileSize = document.getElementById('fileSize');
const generateBtn = document.getElementById('generateBtn');
const progressSection = document.getElementById('progressSection');
const progressBar = document.getElementById('progressBar');
const resultsSection = document.getElementById('resultsSection');
const errorSection = document.getElementById('errorSection');
const errorMessage = document.getElementById('errorMessage');
const rawDataDisplay = document.getElementById('rawDataDisplay');
const manifestDisplay = document.getElementById('manifestDisplay');
const summaryCards = document.getElementById('summaryCards');

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
    manifestForm.addEventListener('submit', handleFormSubmit);
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
            // Set the file to the input
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

function validateForm() {
    const apiKey = document.getElementById('apiKey').value.trim();
    const file = templateFile.files[0];
    
    if (!apiKey) {
        showError('Please enter your API key');
        return false;
    }
    
    if (!file) {
        showError('Please upload a PowerPoint template file');
        return false;
    }
    
    return true;
}

async function handleFormSubmit(e) {
    e.preventDefault();
    
    if (!validateForm()) {
        return;
    }
    
    hideError();
    showProgress();
    
    const apiKey = document.getElementById('apiKey').value.trim();
    const llmProvider = document.getElementById('llmProvider').value;
    const file = templateFile.files[0];
    
    const formData = new FormData();
    formData.append('template', file);
    formData.append('api_key', apiKey);
    formData.append('llm_provider', llmProvider);
    
    try {
        updateProgress(30, 'step2');
        
        const response = await fetch(`${API_BASE_URL}/generate-manifest`, {
            method: 'POST',
            body: formData
        });
        
        updateProgress(70, 'step3');
        
        const data = await response.json();
        
        if (response.ok) {
            updateProgress(100, null);
            currentManifestData = data;
            showResults(data);
        } else {
            throw new Error(data.error || 'Failed to generate manifest');
        }
        
    } catch (error) {
        console.error('Error:', error);
        showError(`Error generating manifest: ${error.message}`);
        hideProgress();
    }
}

function showProgress() {
    generateBtn.disabled = true;
    progressSection.classList.remove('hidden');
    resultsSection.classList.add('hidden');
    
    // Reset progress
    updateProgress(10, 'step1');
}

function updateProgress(percent, currentStep) {
    progressBar.style.width = `${percent}%`;
    
    // Update step indicators
    const steps = ['step1', 'step2', 'step3'];
    steps.forEach((step, index) => {
        const stepEl = document.getElementById(step);
        if (step === currentStep) {
            stepEl.classList.remove('hidden');
            stepEl.innerHTML = stepEl.innerHTML.replace('fa-circle-notch fa-spin', 'fa-circle-notch fa-spin');
        } else if (steps.indexOf(step) < steps.indexOf(currentStep)) {
            stepEl.classList.remove('hidden');
            stepEl.innerHTML = stepEl.innerHTML.replace('fa-circle-notch fa-spin', 'fa-check text-green-600');
        }
    });
}

function hideProgress() {
    generateBtn.disabled = false;
    progressSection.classList.add('hidden');
}

function showResults(data) {
    hideProgress();
    
    // Create summary cards
    createSummaryCards(data);
    
    // Display raw data and manifest
    rawDataDisplay.textContent = JSON.stringify(data.raw_template_data, null, 2);
    manifestDisplay.textContent = JSON.stringify(data.llm_manifest, null, 2);
    
    // Apply syntax highlighting
    syntaxHighlight(rawDataDisplay);
    syntaxHighlight(manifestDisplay);
    
    resultsSection.classList.remove('hidden');
    
    // Scroll to results
    resultsSection.scrollIntoView({ behavior: 'smooth' });
}

function createSummaryCards(data) {
    const rawData = data.raw_template_data;
    const manifest = data.llm_manifest;
    
    const cards = [
        {
            title: 'Slide Layouts',
            value: rawData.layouts ? rawData.layouts.length : 0,
            icon: 'fas fa-th-large',
            color: 'blue'
        },
        {
            title: 'Theme Colors',
            value: rawData.theme?.colors ? Object.keys(rawData.theme.colors).length : 0,
            icon: 'fas fa-palette',
            color: 'purple'
        },
        {
            title: 'Template Images',
            value: rawData.images ? rawData.images.length : 0,
            icon: 'fas fa-images',
            color: 'green'
        },
        {
            title: 'LLM Archetypes',
            value: manifest.layouts ? manifest.layouts.length : 0,
            icon: 'fas fa-brain',
            color: 'orange'
        }
    ];
    
    summaryCards.innerHTML = cards.map(card => `
        <div class="bg-white rounded-lg shadow p-6">
            <div class="flex items-center">
                <div class="flex-shrink-0">
                    <div class="w-12 h-12 bg-${card.color}-100 rounded-lg flex items-center justify-center">
                        <i class="${card.icon} text-${card.color}-600 text-xl"></i>
                    </div>
                </div>
                <div class="ml-4">
                    <p class="text-sm font-medium text-gray-500">${card.title}</p>
                    <p class="text-2xl font-bold text-gray-900">${card.value}</p>
                </div>
            </div>
        </div>
    `).join('');
}

function syntaxHighlight(element) {
    const text = element.textContent;
    element.innerHTML = text
        .replace(/(".*?")/g, '<span class="json-string">$1</span>')
        .replace(/([{,]\s*)(".*?")(\s*:)/g, '$1<span class="json-key">$2</span>$3')
        .replace(/:\s*(-?\d+\.?\d*)/g, ': <span class="json-number">$1</span>')
        .replace(/:\s*(true|false)/g, ': <span class="json-boolean">$1</span>')
        .replace(/:\s*(null)/g, ': <span class="json-null">$1</span>');
}

function showError(message) {
    errorMessage.textContent = message;
    errorSection.classList.remove('hidden');
    
    // Scroll to error
    errorSection.scrollIntoView({ behavior: 'smooth' });
}

function hideError() {
    errorSection.classList.add('hidden');
}

function downloadManifest() {
    if (!currentManifestData) return;
    
    const dataStr = JSON.stringify(currentManifestData, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    
    const link = document.createElement('a');
    link.href = URL.createObjectURL(dataBlob);
    link.download = `template-manifest-${Date.now()}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}

function resetForm() {
    manifestForm.reset();
    clearFile();
    hideError();
    hideProgress();
    resultsSection.classList.add('hidden');
    currentManifestData = null;
    
    // Scroll to top
    window.scrollTo({ top: 0, behavior: 'smooth' });
}
