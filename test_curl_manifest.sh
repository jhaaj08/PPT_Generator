#!/bin/bash
# Test manifest generation with curl
# Usage: ./test_curl_manifest.sh template.pptx api-key provider

if [ $# -lt 2 ]; then
    echo "Usage: $0 <template.pptx> <api-key> [provider]"
    echo "Example: $0 ~/Downloads/template.pptx sk-your-api-key openai"
    exit 1
fi

TEMPLATE_PATH="$1"
API_KEY="$2"
PROVIDER="${3:-openai}"

echo "🧪 Testing manifest generation with curl"
echo "Template: $TEMPLATE_PATH"
echo "Provider: $PROVIDER"
echo "=================================="

curl -X POST \
  -F "template=@$TEMPLATE_PATH" \
  -F "api_key=$API_KEY" \
  -F "llm_provider=$PROVIDER" \
  http://localhost:8080/api/generate-manifest \
  | python -m json.tool 2>/dev/null || echo "Response received (check server logs)"

echo ""
echo "✅ Test completed"
