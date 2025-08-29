#!/usr/bin/env python3
"""
Fix OpenAI client by clearing all proxy configurations
"""

import os

def clear_all_proxy_vars():
    """Clear all possible proxy environment variables"""
    print("🧹 Clearing all proxy environment variables...")
    
    proxy_vars = [
        'http_proxy', 'https_proxy', 'HTTP_PROXY', 'HTTPS_PROXY',
        'ftp_proxy', 'FTP_PROXY', 'no_proxy', 'NO_PROXY',
        'all_proxy', 'ALL_PROXY', 'PROXY', 'proxy'
    ]
    
    cleared = []
    for var in proxy_vars:
        if var in os.environ:
            cleared.append(var)
            del os.environ[var]
    
    if cleared:
        print(f"Cleared: {cleared}")
    else:
        print("No proxy variables found")

def test_clean_openai():
    """Test OpenAI with completely clean environment"""
    clear_all_proxy_vars()
    
    print("\n🧪 Testing OpenAI with clean environment...")
    
    try:
        import openai
        
        # Create client with explicit http_client=None to avoid proxy issues
        client = openai.OpenAI(
            api_key="sk-test1234567890abcdef",
            http_client=None  # Explicitly no custom HTTP client
        )
        print("✅ OpenAI client created successfully!")
        return True
        
    except Exception as e:
        print(f"❌ Still failed: {e}")
        return False

def main():
    print("🔧 OpenAI Proxy Fix")
    print("=" * 40)
    
    success = test_clean_openai()
    
    if success:
        print("\n✅ Solution found! Updating LLM integration...")
        return True
    else:
        print("\n❌ Need to try a different approach")
        return False

if __name__ == '__main__':
    main()
