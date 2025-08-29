"""
Comprehensive error handling for PPT Generator
"""
import traceback
import logging
from functools import wraps
from flask import jsonify
import os

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler('ppt_generator.log'),
        logging.StreamHandler()
    ]
)

logger = logging.getLogger(__name__)

class PPTGeneratorError(Exception):
    """Base exception for PPT Generator"""
    def __init__(self, message, error_code=None, user_message=None):
        self.message = message
        self.error_code = error_code
        self.user_message = user_message or message
        super().__init__(self.message)

class FileValidationError(PPTGeneratorError):
    """File validation related errors"""
    pass

class LLMError(PPTGeneratorError):
    """LLM integration errors"""
    pass

class TemplateError(PPTGeneratorError):
    """Template processing errors"""
    pass

class APIError(PPTGeneratorError):
    """API related errors"""
    pass

# File size limits (in bytes)
MAX_FILE_SIZE = 50 * 1024 * 1024  # 50MB
MAX_TEXT_LENGTH = 100000  # 100K characters
MIN_TEXT_LENGTH = 100     # 100 characters

def validate_file_upload(file):
    """Validate uploaded file"""
    if not file:
        raise FileValidationError(
            "No file provided",
            error_code="NO_FILE",
            user_message="Please select a PowerPoint template file"
        )
    
    if not file.filename:
        raise FileValidationError(
            "No filename provided",
            error_code="NO_FILENAME", 
            user_message="The selected file appears to be invalid"
        )
    
    # Check file extension
    allowed_extensions = {'.pptx', '.potx'}
    file_ext = os.path.splitext(file.filename)[1].lower()
    if file_ext not in allowed_extensions:
        raise FileValidationError(
            f"Invalid file extension: {file_ext}",
            error_code="INVALID_EXTENSION",
            user_message=f"Please upload a PowerPoint file (.pptx or .potx). You uploaded: {file_ext}"
        )
    
    # Check file size if available
    if hasattr(file, 'content_length') and file.content_length:
        if file.content_length > MAX_FILE_SIZE:
            size_mb = file.content_length / (1024 * 1024)
            raise FileValidationError(
                f"File too large: {size_mb:.1f}MB",
                error_code="FILE_TOO_LARGE",
                user_message=f"File size ({size_mb:.1f}MB) exceeds the maximum limit of {MAX_FILE_SIZE/(1024*1024):.0f}MB"
            )

def validate_text_input(text):
    """Validate text input"""
    if not text or not text.strip():
        raise FileValidationError(
            "Empty text input",
            error_code="EMPTY_TEXT",
            user_message="Please provide text content to convert into slides"
        )
    
    text_length = len(text.strip())
    if text_length < MIN_TEXT_LENGTH:
        raise FileValidationError(
            f"Text too short: {text_length} characters",
            error_code="TEXT_TOO_SHORT",
            user_message=f"Please provide at least {MIN_TEXT_LENGTH} characters of text (current: {text_length})"
        )
    
    if text_length > MAX_TEXT_LENGTH:
        raise FileValidationError(
            f"Text too long: {text_length} characters",
            error_code="TEXT_TOO_LONG",
            user_message=f"Text exceeds maximum length of {MAX_TEXT_LENGTH:,} characters (current: {text_length:,})"
        )

def validate_api_key(api_key, provider):
    """Validate API key"""
    if not api_key or not api_key.strip():
        raise APIError(
            "Missing API key",
            error_code="MISSING_API_KEY",
            user_message=f"Please provide a valid {provider.upper()} API key"
        )
    
    # Basic format validation for different providers
    api_key = api_key.strip()
    
    if provider == 'openai':
        if not api_key.startswith('sk-'):
            raise APIError(
                "Invalid OpenAI API key format",
                error_code="INVALID_API_KEY_FORMAT",
                user_message="OpenAI API keys should start with 'sk-'. Please check your API key."
            )
    elif provider == 'anthropic':
        if not api_key.startswith('sk-ant-'):
            raise APIError(
                "Invalid Anthropic API key format", 
                error_code="INVALID_API_KEY_FORMAT",
                user_message="Anthropic API keys should start with 'sk-ant-'. Please check your API key."
            )
    elif provider == 'gemini':
        if len(api_key) < 30:  # Gemini keys are typically longer
            raise APIError(
                "Invalid Gemini API key format",
                error_code="INVALID_API_KEY_FORMAT", 
                user_message="Gemini API key appears to be too short. Please check your API key."
            )

def handle_llm_errors(func):
    """Decorator to handle LLM-related errors"""
    @wraps(func)
    def wrapper(*args, **kwargs):
        try:
            return func(*args, **kwargs)
        except Exception as e:
            error_message = str(e).lower()
            
            # API key errors
            if any(phrase in error_message for phrase in ['api key', 'unauthorized', 'authentication', 'invalid key']):
                raise LLMError(
                    f"API authentication failed: {str(e)}",
                    error_code="AUTH_FAILED",
                    user_message="API key authentication failed. Please check your API key and try again."
                )
            
            # Rate limiting
            elif any(phrase in error_message for phrase in ['rate limit', 'quota', 'too many requests']):
                raise LLMError(
                    f"Rate limit exceeded: {str(e)}",
                    error_code="RATE_LIMITED",
                    user_message="API rate limit exceeded. Please wait a moment and try again."
                )
            
            # Network/connection errors
            elif any(phrase in error_message for phrase in ['connection', 'network', 'timeout', 'unreachable']):
                raise LLMError(
                    f"Network error: {str(e)}",
                    error_code="NETWORK_ERROR",
                    user_message="Unable to connect to the AI service. Please check your internet connection and try again."
                )
            
            # Generic LLM error
            else:
                raise LLMError(
                    f"LLM processing failed: {str(e)}",
                    error_code="LLM_FAILED",
                    user_message="AI processing failed. Please try again with different content or API key."
                )
    
    return wrapper

def handle_template_errors(func):
    """Decorator to handle template processing errors"""
    @wraps(func)
    def wrapper(*args, **kwargs):
        try:
            return func(*args, **kwargs)
        except Exception as e:
            error_message = str(e).lower()
            
            # File corruption
            if any(phrase in error_message for phrase in ['corrupt', 'invalid format', 'not a valid', 'damaged']):
                raise TemplateError(
                    f"Template file corruption: {str(e)}",
                    error_code="CORRUPT_TEMPLATE",
                    user_message="The template file appears to be corrupted or invalid. Please try a different PowerPoint file."
                )
            
            # Permissions
            elif any(phrase in error_message for phrase in ['permission', 'access denied', 'forbidden']):
                raise TemplateError(
                    f"File access error: {str(e)}",
                    error_code="ACCESS_DENIED",
                    user_message="Unable to access the template file. Please check file permissions."
                )
            
            # Generic template error
            else:
                raise TemplateError(
                    f"Template processing failed: {str(e)}",
                    error_code="TEMPLATE_FAILED",
                    user_message="Unable to process the template file. Please try a different PowerPoint template."
                )
    
    return wrapper

def create_error_response(error):
    """Create standardized error response"""
    if isinstance(error, PPTGeneratorError):
        logger.error(f"PPT Generator Error: {error.error_code} - {error.message}")
        return jsonify({
            'error': error.user_message,
            'error_code': error.error_code,
            'success': False
        }), 400
    else:
        # Log full traceback for unexpected errors
        logger.error(f"Unexpected error: {str(error)}\n{traceback.format_exc()}")
        return jsonify({
            'error': 'An unexpected error occurred. Please try again.',
            'error_code': 'INTERNAL_ERROR',
            'success': False
        }), 500

def safe_api_call(func):
    """Decorator for safe API calls with comprehensive error handling"""
    @wraps(func)
    def wrapper(*args, **kwargs):
        try:
            return func(*args, **kwargs)
        except PPTGeneratorError as e:
            return create_error_response(e)
        except Exception as e:
            return create_error_response(e)
    
    return wrapper

# Progress tracking utilities
class ProgressTracker:
    def __init__(self):
        self.steps = []
        self.current_step = 0
        
    def add_step(self, name, description):
        self.steps.append({
            'name': name,
            'description': description,
            'status': 'pending',
            'error': None
        })
    
    def start_step(self, step_index):
        if 0 <= step_index < len(self.steps):
            self.current_step = step_index
            self.steps[step_index]['status'] = 'in_progress'
            logger.info(f"Started step {step_index + 1}/{len(self.steps)}: {self.steps[step_index]['name']}")
    
    def complete_step(self, step_index):
        if 0 <= step_index < len(self.steps):
            self.steps[step_index]['status'] = 'completed'
            logger.info(f"Completed step {step_index + 1}/{len(self.steps)}: {self.steps[step_index]['name']}")
    
    def fail_step(self, step_index, error_message):
        if 0 <= step_index < len(self.steps):
            self.steps[step_index]['status'] = 'failed'
            self.steps[step_index]['error'] = error_message
            logger.error(f"Failed step {step_index + 1}/{len(self.steps)}: {self.steps[step_index]['name']} - {error_message}")
    
    def get_status(self):
        completed = sum(1 for step in self.steps if step['status'] == 'completed')
        total = len(self.steps)
        return {
            'current_step': self.current_step + 1,
            'total_steps': total,
            'progress_percentage': (completed / total * 100) if total > 0 else 0,
            'steps': self.steps
        }
