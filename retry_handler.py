"""
API retry logic with exponential backoff for PPT Generator
"""
import time
import random
import asyncio
import logging
from functools import wraps
from typing import Callable, Any, Optional, List

logger = logging.getLogger(__name__)

class RetryConfig:
    """Configuration for retry behavior"""
    def __init__(
        self,
        max_retries: int = 3,
        base_delay: float = 1.0,
        max_delay: float = 60.0,
        exponential_factor: float = 2.0,
        jitter: bool = True,
        retryable_errors: Optional[List[type]] = None
    ):
        self.max_retries = max_retries
        self.base_delay = base_delay
        self.max_delay = max_delay
        self.exponential_factor = exponential_factor
        self.jitter = jitter
        self.retryable_errors = retryable_errors or [
            ConnectionError,
            TimeoutError,
            Exception  # Generic exception for now, will be more specific in practice
        ]

def calculate_delay(attempt: int, config: RetryConfig) -> float:
    """Calculate delay for next retry attempt"""
    delay = config.base_delay * (config.exponential_factor ** attempt)
    delay = min(delay, config.max_delay)
    
    if config.jitter:
        # Add random jitter (±25%)
        jitter_range = delay * 0.25
        delay += random.uniform(-jitter_range, jitter_range)
    
    return max(0, delay)

def is_retryable_error(error: Exception, config: RetryConfig) -> bool:
    """Check if error is retryable"""
    error_message = str(error).lower()
    
    # Check for specific retryable conditions
    retryable_conditions = [
        'timeout',
        'connection',
        'network',
        'temporary',
        'rate limit',
        'server error',
        '503',
        '502',
        '504',
        'internal server error',
        'service unavailable',
        'too many requests'
    ]
    
    # Check if error message contains retryable conditions
    if any(condition in error_message for condition in retryable_conditions):
        return True
    
    # Check if error type is in retryable list
    return any(isinstance(error, error_type) for error_type in config.retryable_errors)

def retry_with_backoff(config: Optional[RetryConfig] = None):
    """Decorator for adding retry logic with exponential backoff"""
    if config is None:
        config = RetryConfig()
    
    def decorator(func: Callable) -> Callable:
        @wraps(func)
        def wrapper(*args, **kwargs) -> Any:
            last_exception = None
            
            for attempt in range(config.max_retries + 1):
                try:
                    result = func(*args, **kwargs)
                    if attempt > 0:
                        logger.info(f"✅ Function {func.__name__} succeeded on attempt {attempt + 1}")
                    return result
                    
                except Exception as e:
                    last_exception = e
                    
                    # Don't retry on last attempt
                    if attempt == config.max_retries:
                        logger.error(f"❌ Function {func.__name__} failed after {config.max_retries + 1} attempts: {str(e)}")
                        break
                    
                    # Check if error is retryable
                    if not is_retryable_error(e, config):
                        logger.error(f"❌ Function {func.__name__} failed with non-retryable error: {str(e)}")
                        break
                    
                    # Calculate delay and wait
                    delay = calculate_delay(attempt, config)
                    logger.warning(f"⚠️  Function {func.__name__} failed on attempt {attempt + 1}, retrying in {delay:.1f}s: {str(e)}")
                    time.sleep(delay)
            
            # Re-raise the last exception
            raise last_exception
        
        return wrapper
    return decorator

async def async_retry_with_backoff(config: Optional[RetryConfig] = None):
    """Async version of retry decorator"""
    if config is None:
        config = RetryConfig()
    
    def decorator(func: Callable) -> Callable:
        @wraps(func)
        async def wrapper(*args, **kwargs) -> Any:
            last_exception = None
            
            for attempt in range(config.max_retries + 1):
                try:
                    if asyncio.iscoroutinefunction(func):
                        result = await func(*args, **kwargs)
                    else:
                        result = func(*args, **kwargs)
                    
                    if attempt > 0:
                        logger.info(f"✅ Async function {func.__name__} succeeded on attempt {attempt + 1}")
                    return result
                    
                except Exception as e:
                    last_exception = e
                    
                    # Don't retry on last attempt
                    if attempt == config.max_retries:
                        logger.error(f"❌ Async function {func.__name__} failed after {config.max_retries + 1} attempts: {str(e)}")
                        break
                    
                    # Check if error is retryable
                    if not is_retryable_error(e, config):
                        logger.error(f"❌ Async function {func.__name__} failed with non-retryable error: {str(e)}")
                        break
                    
                    # Calculate delay and wait
                    delay = calculate_delay(attempt, config)
                    logger.warning(f"⚠️  Async function {func.__name__} failed on attempt {attempt + 1}, retrying in {delay:.1f}s: {str(e)}")
                    await asyncio.sleep(delay)
            
            # Re-raise the last exception
            raise last_exception
        
        return wrapper
    return decorator

# Predefined retry configurations for different scenarios
class RetryConfigs:
    # For LLM API calls - reduced retries for production timeout limits
    LLM_API = RetryConfig(
        max_retries=2,  # Reduced from 5 to avoid 30s timeout
        base_delay=1.0,  # Reduced from 2.0
        max_delay=15.0,  # Reduced from 30.0
        exponential_factor=1.5
    )
    
    # For file operations - less aggressive
    FILE_OPERATIONS = RetryConfig(
        max_retries=3,
        base_delay=0.5,
        max_delay=10.0,
        exponential_factor=2.0
    )
    
    # For network requests - balanced approach
    NETWORK_REQUESTS = RetryConfig(
        max_retries=4,
        base_delay=1.0,
        max_delay=20.0,
        exponential_factor=1.8
    )
    
    # For quick operations - minimal retry
    QUICK_OPERATIONS = RetryConfig(
        max_retries=2,
        base_delay=0.2,
        max_delay=2.0,
        exponential_factor=2.0
    )

class RetryableOperation:
    """Context manager for retryable operations with progress tracking"""
    
    def __init__(self, operation_name: str, config: Optional[RetryConfig] = None):
        self.operation_name = operation_name
        self.config = config or RetryConfig()
        self.attempt = 0
        self.start_time = None
        
    def __enter__(self):
        self.start_time = time.time()
        logger.info(f"🚀 Starting retryable operation: {self.operation_name}")
        return self
    
    def __exit__(self, exc_type, exc_val, exc_tb):
        elapsed = time.time() - self.start_time
        if exc_type is None:
            logger.info(f"✅ Operation {self.operation_name} completed successfully in {elapsed:.1f}s after {self.attempt + 1} attempt(s)")
        else:
            logger.error(f"❌ Operation {self.operation_name} failed after {elapsed:.1f}s and {self.attempt + 1} attempt(s): {exc_val}")
    
    def execute(self, func: Callable, *args, **kwargs) -> Any:
        """Execute function with retry logic"""
        last_exception = None
        
        for attempt in range(self.config.max_retries + 1):
            self.attempt = attempt
            try:
                result = func(*args, **kwargs)
                if attempt > 0:
                    logger.info(f"✅ Operation {self.operation_name} succeeded on attempt {attempt + 1}")
                return result
                
            except Exception as e:
                last_exception = e
                
                # Don't retry on last attempt
                if attempt == self.config.max_retries:
                    break
                
                # Check if error is retryable
                if not is_retryable_error(e, self.config):
                    logger.error(f"❌ Operation {self.operation_name} failed with non-retryable error: {str(e)}")
                    break
                
                # Calculate delay and wait
                delay = calculate_delay(attempt, self.config)
                logger.warning(f"⚠️  Operation {self.operation_name} failed on attempt {attempt + 1}, retrying in {delay:.1f}s: {str(e)}")
                time.sleep(delay)
        
        # Re-raise the last exception
        raise last_exception

# Utility functions for common retry scenarios
def retry_llm_call(func: Callable) -> Callable:
    """Decorator specifically for LLM API calls"""
    return retry_with_backoff(RetryConfigs.LLM_API)(func)

def retry_file_operation(func: Callable) -> Callable:
    """Decorator specifically for file operations"""
    return retry_with_backoff(RetryConfigs.FILE_OPERATIONS)(func)

def retry_network_request(func: Callable) -> Callable:
    """Decorator specifically for network requests"""
    return retry_with_backoff(RetryConfigs.NETWORK_REQUESTS)(func)

# Circuit breaker pattern for critical operations
class CircuitBreaker:
    """Circuit breaker to prevent cascading failures"""
    
    def __init__(self, failure_threshold: int = 5, recovery_timeout: float = 60.0):
        self.failure_threshold = failure_threshold
        self.recovery_timeout = recovery_timeout
        self.failure_count = 0
        self.last_failure_time = None
        self.state = 'CLOSED'  # CLOSED, OPEN, HALF_OPEN
    
    def is_available(self) -> bool:
        """Check if circuit breaker allows requests"""
        if self.state == 'CLOSED':
            return True
        elif self.state == 'OPEN':
            if self.last_failure_time and time.time() - self.last_failure_time > self.recovery_timeout:
                self.state = 'HALF_OPEN'
                logger.info("🔄 Circuit breaker entering HALF_OPEN state")
                return True
            return False
        elif self.state == 'HALF_OPEN':
            return True
        return False
    
    def record_success(self):
        """Record successful operation"""
        if self.state == 'HALF_OPEN':
            self.state = 'CLOSED'
            self.failure_count = 0
            logger.info("✅ Circuit breaker reset to CLOSED state")
    
    def record_failure(self):
        """Record failed operation"""
        self.failure_count += 1
        self.last_failure_time = time.time()
        
        if self.failure_count >= self.failure_threshold and self.state == 'CLOSED':
            self.state = 'OPEN'
            logger.warning(f"🚫 Circuit breaker OPENED after {self.failure_count} failures")
        elif self.state == 'HALF_OPEN':
            self.state = 'OPEN'
            logger.warning("🚫 Circuit breaker returned to OPEN state from HALF_OPEN")
    
    def __call__(self, func: Callable) -> Callable:
        """Decorator to apply circuit breaker pattern"""
        @wraps(func)
        def wrapper(*args, **kwargs):
            if not self.is_available():
                raise Exception(f"Circuit breaker is OPEN for {func.__name__}")
            
            try:
                result = func(*args, **kwargs)
                self.record_success()
                return result
            except Exception as e:
                self.record_failure()
                raise e
        
        return wrapper
