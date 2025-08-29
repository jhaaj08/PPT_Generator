// Template Extraction Test JavaScript
const API_BASE_URL = 'http://localhost:8080/api';

// Global variables
let currentResults = null;

// DOM Elements
const extractionForm = document.getElementById('extractionForm');
const fileUploadArea = document.getElementById('fileUploadArea');
const templateFile = document.getElementById('templateFile');
const uploadContent = document.getElementById('uploadContent');
const fileInfo = document.getElementById('fileInfo');
const fileName = document.getElementById('fileName');
const fileSize = document.getElementById('fileSize');
const extractBtn = document.getElementById('extractBtn');
const progressSection = document.getElementById('progressSection');
const progressBar = document.getElementById('progressBar');
const progressText = document.getElementById('progressText');
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
    extractionForm.addEventListener('submit', handleFormSubmit);
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
    
    const file = templateFile.files[0];
    if (!file) {
        showError('Please upload a PowerPoint template file');
        return;
    }
    
    hideError();
    showProgress();
    
    const formData = new FormData();
    formData.append('template', file);
    
    try {
        updateProgress(30, 'Uploading template...');
        
        const response = await fetch(`${API_BASE_URL}/test-template-extraction`, {
            method: 'POST',
            body: formData
        });
        
        updateProgress(80, 'Extracting template data...');
        
        const data = await response.json();
        
        if (response.ok) {
            updateProgress(100, 'Complete!');
            currentResults = data;
            showResults(data);
        } else {
            throw new Error(data.error || 'Failed to extract template data');
        }
        
    } catch (error) {
        console.error('Error:', error);
        showError(`Error extracting template: ${error.message}`);
        hideProgress();
    }
}

function showProgress() {
    extractBtn.disabled = true;
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
    extractBtn.disabled = false;
    progressSection.classList.add('hidden');
}

function showResults(data) {
    hideProgress();
    
    const layouts = data.layouts || [];
    const colors = Object.keys(data.theme?.colors || {});
    const images = data.images || [];
    const fonts = Object.keys(data.theme?.fonts || {});
    
    // Update summary cards
    document.getElementById('layoutCount').textContent = layouts.length;
    document.getElementById('colorCount').textContent = colors.length;
    document.getElementById('imageCount').textContent = images.length;
    document.getElementById('fontCount').textContent = fonts.length;
    
    // Populate layouts
    const layoutsList = document.getElementById('layoutsList');
    layoutsList.innerHTML = layouts.map((layout, index) => `
        <div class="layout-card bg-gray-50 p-4 rounded-lg border">
            <div class="flex items-center justify-between mb-2">
                <h4 class="font-semibold text-gray-800">${layout.name}</h4>
                <span class="text-sm text-gray-500">Layout ${index}</span>
            </div>
            <p class="text-sm text-gray-600">${layout.placeholders.length} placeholders</p>
            <div class="mt-2 space-y-1">
                ${layout.placeholders.map(ph => `
                    <div class="text-xs text-gray-500">
                        ${ph.type.replace('PP_PLACEHOLDER.', '')} - ${Math.round(ph.width/914400)}×${Math.round(ph.height/914400)}"
                    </div>
                `).join('')}
            </div>
        </div>
    `).join('') || '<p class="text-gray-500 italic">No layouts found</p>';
    
    // Populate colors
    const colorsList = document.getElementById('colorsList');
    colorsList.innerHTML = colors.map(colorName => {
        const colorValue = data.theme.colors[colorName];
        return `
            <div class="flex items-center">
                <div class="color-swatch" style="background-color: ${colorValue}"></div>
                <div>
                    <div class="font-medium text-gray-800">${colorName}</div>
                    <div class="text-sm text-gray-500">${colorValue}</div>
                </div>
            </div>
        `;
    }).join('') || '<p class="text-gray-500 italic">No theme colors found</p>';
    
    // Populate images
    const imagesList = document.getElementById('imagesList');
    imagesList.innerHTML = images.map((img, index) => `
        <div class="bg-gray-50 p-4 rounded-lg border">
            <div class="flex items-center justify-between mb-2">
                <h4 class="font-semibold text-gray-800">Image ${index + 1}</h4>
                <span class="text-sm text-gray-500">Slide ${img.slide}</span>
            </div>
            <div class="grid grid-cols-2 gap-2 text-sm">
                <div>
                    <span class="text-gray-600">Size:</span> 
                    ${Math.round(img.width/914400)}×${Math.round(img.height/914400)}"
                </div>
                <div>
                    <span class="text-gray-600">File size:</span> 
                    ${formatFileSize(img.size_bytes)}
                </div>
                <div>
                    <span class="text-gray-600">Position:</span> 
                    (${Math.round(img.left/914400)}, ${Math.round(img.top/914400)})
                </div>
                <div>
                    <span class="text-gray-600">Type:</span> 
                    ${img.content_type || 'unknown'}
                </div>
            </div>
            ${img.filename ? `<div class="text-xs text-gray-500 mt-2">${img.filename}</div>` : ''}
        </div>
    `).join('') || '<p class="text-gray-500 italic">No embedded images found</p>';
    
    // Populate fonts
    const fontsList = document.getElementById('fontsList');
    fontsList.innerHTML = fonts.map(fontType => {
        const fontName = data.theme.fonts[fontType];
        return `
            <div class="flex items-center justify-between">
                <div>
                    <div class="font-medium text-gray-800">${fontType} font</div>
                    <div class="text-sm text-gray-500" style="font-family: '${fontName}', sans-serif">${fontName}</div>
                </div>
            </div>
        `;
    }).join('') || '<p class="text-gray-500 italic">No theme fonts found</p>';
    
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

function downloadResults() {
    if (!currentResults) return;
    
    const dataStr = JSON.stringify(currentResults, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    
    const link = document.createElement('a');
    link.href = URL.createObjectURL(dataBlob);
    link.download = `template-extraction-${Date.now()}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}

function resetTest() {
    extractionForm.reset();
    clearFile();
    hideError();
    hideProgress();
    resultsSection.classList.add('hidden');
    currentResults = null;
    
    // Scroll to top
    window.scrollTo({ top: 0, behavior: 'smooth' });
}
