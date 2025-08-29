import json
import requests
import openai
from anthropic import Anthropic
import google.generativeai as genai
from error_handler import handle_llm_errors, validate_api_key, LLMError, logger
from retry_handler import retry_llm_call, RetryableOperation, RetryConfigs

class LLMIntegration:
    def __init__(self, api_key, provider='openai'):
        self.api_key = api_key
        self.provider = provider.lower()
        # Validate API key before setup
        validate_api_key(api_key, self.provider)
        self._setup_client()
    
    def _setup_client(self):
        """Initialize the appropriate LLM client"""
        try:
            if self.provider == 'openai':
                # Clean initialization for OpenAI client
                import os
                # Clear any existing OpenAI environment variables that might interfere
                os.environ.pop('OPENAI_API_KEY', None)
                os.environ.pop('OPENAI_API_BASE', None)
                
                # Initialize client with minimal parameters
                self.client = openai.OpenAI(
                    api_key=self.api_key,
                    timeout=60,  # 60 second timeout
                )
            elif self.provider == 'anthropic':
                self.client = Anthropic(api_key=self.api_key)
            elif self.provider == 'gemini':
                genai.configure(api_key=self.api_key)
                self.client = genai.GenerativeModel('gemini-pro')
            else:
                raise ValueError(f"Unsupported provider: {self.provider}")
        except Exception as e:
            raise Exception(f"Failed to setup {self.provider} client: {str(e)}")
    
    @handle_llm_errors
    def structure_text_to_slides(self, input_text, guidance=""):
        """
        Use LLM to analyze and structure input text into presentation slides
        Returns a structured format that can be used to generate PowerPoint
        """
        with RetryableOperation("LLM Text Structuring", RetryConfigs.LLM_API) as operation:
            prompt = self._create_structuring_prompt(input_text, guidance)
            
            def make_llm_call():
                if self.provider == 'openai':
                    response = self._call_openai(prompt)
                elif self.provider == 'anthropic':
                    response = self._call_anthropic(prompt)
                elif self.provider == 'gemini':
                    response = self._call_gemini(prompt)
                else:
                    raise LLMError(f"Unsupported provider: {self.provider}", error_code="INVALID_PROVIDER")
                
                return self._parse_llm_response(response)
            
            return operation.execute(make_llm_call)
    
    def _create_structuring_prompt(self, input_text, guidance):
        """Create a comprehensive prompt for the LLM to structure the text"""
        base_prompt = f"""
You are an expert presentation designer. Your task is to analyze the provided text and structure it into an effective PowerPoint presentation.

Input Text:
{input_text}

Additional Guidance: {guidance if guidance else "Create a professional, well-structured presentation"}

Please analyze this text and create a presentation structure with the following requirements:

1. Determine the optimal number of slides (typically 5-15 slides)
2. Create a logical flow and narrative
3. Extract key points and organize them hierarchically
4. Suggest appropriate slide titles
5. Identify content that works best as bullet points vs. paragraphs
6. Consider the audience and purpose based on the content

Return your response as a JSON object with this exact structure:
{{
    "presentation_title": "Main title for the presentation",
    "total_slides": number_of_slides,
    "slides": [
        {{
            "slide_number": 1,
            "title": "Slide Title",
            "type": "content|bullet_points|conclusion",
            "content": "Main content text or list of bullet points",
            "speaker_notes": "Detailed speaker notes for this slide"
        }}
    ]
}}

CRITICAL formatting rules:
- EVERY slide MUST have content - never leave "content" empty
- For bullet points, use "content" as an array of strings (recommended for most slides)
- For paragraph content, use "content" as a single string
- Always include substantial content - aim for 2-5 bullet points or 50-200 words of text
- EVERY slide MUST have speaker_notes - provide 2-4 sentences that expand on the slide content
- Speaker notes should provide additional context, talking points, or presentation tips
- Keep titles concise (max 8 words)
- Ensure content is engaging and well-organized
- Make sure the JSON is valid and properly formatted
- DO NOT create title-only slides - every slide needs meaningful content and speaker notes

Begin your analysis and structure the presentation:
"""
        return base_prompt
    
    def _call_openai(self, prompt):
        """Call OpenAI API"""
        try:
            print(f"Calling OpenAI API with model: gpt-4")
            response = self.client.chat.completions.create(
                model="gpt-4",
                messages=[
                    {"role": "system", "content": "You are an expert presentation designer who creates well-structured, engaging presentations."},
                    {"role": "user", "content": prompt}
                ],
                temperature=0.7,
                max_tokens=2000
            )
            print(f"OpenAI API call successful")
            return response.choices[0].message.content
        except Exception as e:
            print(f"OpenAI API error details: {type(e).__name__}: {str(e)}")
            # Try with gpt-3.5-turbo as fallback
            if "gpt-4" in str(e).lower():
                try:
                    print("Trying fallback to gpt-3.5-turbo")
                    response = self.client.chat.completions.create(
                        model="gpt-3.5-turbo",
                        messages=[
                            {"role": "system", "content": "You are an expert presentation designer who creates well-structured, engaging presentations."},
                            {"role": "user", "content": prompt}
                        ],
                        temperature=0.7,
                        max_tokens=2000
                    )
                    print(f"Fallback API call successful")
                    return response.choices[0].message.content
                except Exception as fallback_e:
                    print(f"Fallback also failed: {str(fallback_e)}")
                    raise e
            else:
                raise e
    
    def _call_anthropic(self, prompt):
        """Call Anthropic Claude API"""
        try:
            response = self.client.messages.create(
                model="claude-3-sonnet-20240229",
                max_tokens=2000,
                temperature=0.7,
                messages=[
                    {"role": "user", "content": prompt}
                ]
            )
            return response.content[0].text
        except Exception as e:
            print(f"Anthropic API error: {str(e)}")
            raise e
    
    def _call_gemini(self, prompt):
        """Call Google Gemini API"""
        try:
            response = self.client.generate_content(prompt)
            return response.text
        except Exception as e:
            print(f"Gemini API error: {str(e)}")
            raise e
    
    def _parse_llm_response(self, response):
        """Parse LLM response and extract structured data"""
        try:
            # Try to find JSON in the response
            response = response.strip()
            
            # Look for JSON block
            start_idx = response.find('{')
            end_idx = response.rfind('}') + 1
            
            if start_idx != -1 and end_idx != -1:
                json_str = response[start_idx:end_idx]
                parsed = json.loads(json_str)
                
                # Validate structure
                if self._validate_structure(parsed):
                    return parsed
            
            # If JSON parsing fails, try to extract key information
            return self._extract_fallback_structure(response)
            
        except Exception as e:
            print(f"Error parsing LLM response: {str(e)}")
            return self._create_fallback_structure(response)
    
    def _validate_structure(self, parsed):
        """Validate the parsed JSON structure"""
        required_keys = ['presentation_title', 'slides']
        if not all(key in parsed for key in required_keys):
            return False
        
        if not isinstance(parsed['slides'], list) or len(parsed['slides']) == 0:
            return False
        
        for slide in parsed['slides']:
            if not all(key in slide for key in ['title', 'content']):
                return False
        
        return True
    
    def _extract_fallback_structure(self, response):
        """Extract structure when JSON parsing fails"""
        lines = response.split('\n')
        slides = []
        current_slide = None
        
        for line in lines:
            line = line.strip()
            if not line:
                continue
            
            # Look for slide indicators
            if any(indicator in line.lower() for indicator in ['slide', 'title:', 'section']):
                if current_slide:
                    slides.append(current_slide)
                current_slide = {
                    'title': line.replace('Slide', '').replace(':', '').strip(),
                    'content': []
                }
            elif current_slide and line:
                current_slide['content'].append(line)
        
        if current_slide:
            slides.append(current_slide)
        
        return {
            'presentation_title': 'Generated Presentation',
            'total_slides': len(slides),
            'slides': slides
        }
    
    def _create_fallback_structure(self, input_text):
        """Create a basic structure when LLM processing fails"""
        # Split text into chunks
        sentences = input_text.split('. ')
        chunk_size = max(3, len(sentences) // 5)  # Aim for ~5 slides
        
        slides = []
        
        # Title slide
        slides.append({
            'slide_number': 1,
            'title': 'Presentation Overview',
            'type': 'title_slide',
            'content': 'Generated from provided text content'
        })
        
        # Content slides
        for i in range(0, len(sentences), chunk_size):
            chunk = sentences[i:i+chunk_size]
            slide_num = len(slides) + 1
            
            slides.append({
                'slide_number': slide_num,
                'title': f'Key Points {slide_num - 1}',
                'type': 'bullet_points',
                'content': [sentence.strip() + '.' for sentence in chunk if sentence.strip()]
            })
        
        return {
            'presentation_title': 'Generated Presentation',
            'total_slides': len(slides),
            'slides': slides
        }
    
    @handle_llm_errors
    def generate_template_manifest(self, raw_template_data):
        """Generate a structured template manifest using LLM analysis"""
        with RetryableOperation("Template Manifest Generation", RetryConfigs.LLM_API) as operation:
            prompt = self._create_manifest_prompt(raw_template_data)
            
            def make_manifest_call():
                if self.provider == 'openai':
                    response = self._call_openai(prompt)
                elif self.provider == 'anthropic':
                    response = self._call_anthropic(prompt)
                elif self.provider == 'gemini':
                    response = self._call_gemini(prompt)
                else:
                    raise LLMError(f"Unsupported provider: {self.provider}", error_code="INVALID_PROVIDER")
                
                return self._parse_manifest_response(response)
            
            try:
                return operation.execute(make_manifest_call)
            except Exception as e:
                logger.warning(f"Manifest generation failed, using fallback: {str(e)}")
                return self._create_fallback_manifest(raw_template_data)
    
    def _create_manifest_prompt(self, raw_data):
        """Create a prompt for template manifest generation"""
        return f"""
You are a presentation theme analyst. Convert raw PowerPoint template metadata into a clean manifest without inventing measurements. Preserve numeric geometry exactly.

RAW_TEMPLATE:
{json.dumps(raw_data, indent=2)}

Produce JSON exactly matching this schema:
{{
  "slide_size": {{"width_emu": number, "height_emu": number}},
  "theme": {{
    "palette": {{"primary":"hex","secondary":"hex","accent":["hex"], "text":"hex","background":"hex"}},
    "fonts": {{"title_family":"string","body_family":"string"}}
  }},
  "layouts": [
    {{
      "id":"string_slug",
      "name":"string", 
      "archetype":"title_only|title_content|two_content|section_header|other",
      "placeholders":[{{"kind":"TITLE|BODY|PICTURE|FOOTER","left":num,"top":num,"width":num,"height":num}}]
    }}
  ],
  "text_defaults": {{
    "title":{{"family":"string","size_pt":number,"bold":true,"color":"palette_key"}},
    "body":[{{"level":0,"family":"string","size_pt":number,"color":"palette_key"}}]
  }},
  "assets": [
    {{"id":"logo_main","left":num,"top":num,"width":num,"height":num,"apply_on":"all|title_only|none"}}
  ],
  "rules": {{
    "title_color":"palette_key",
    "body_color":"palette_key", 
    "logo_policy":"string description"
  }}
}}

Constraints:
- Do not change numeric geometry values
- Map theme colors into palette keys but keep original hexes  
- Infer layout archetypes from placeholder sets and names
- For text_defaults, suggest reasonable font sizes (title: 28-36pt, body: 16-20pt)
- If images exist, classify as logos vs decorative and set apply_on appropriately
- Return only valid JSON, no explanatory text

Begin analysis:
"""
    
    def _parse_manifest_response(self, response):
        """Parse LLM manifest response"""
        try:
            # Extract JSON from response
            response = response.strip()
            start_idx = response.find('{')
            end_idx = response.rfind('}') + 1
            
            if start_idx != -1 and end_idx != -1:
                json_str = response[start_idx:end_idx]
                parsed = json.loads(json_str)
                return parsed
            
            raise ValueError("No valid JSON found in response")
            
        except Exception as e:
            print(f"Error parsing manifest response: {str(e)}")
            raise e
    
    def _create_fallback_manifest(self, raw_data):
        """Create fallback manifest if LLM processing fails"""
        return {
            "slide_size": raw_data.get("slide_size", {"width_emu": 9144000, "height_emu": 6858000}),
            "theme": {
                "palette": {
                    "primary": "#1f4e79",
                    "secondary": "#4472c4", 
                    "accent": ["#4472c4", "#ed7d31"],
                    "text": "#000000",
                    "background": "#ffffff"
                },
                "fonts": {
                    "title_family": "Calibri",
                    "body_family": "Calibri"
                }
            },
            "layouts": raw_data.get("layouts", []),
            "text_defaults": {
                "title": {"family": "Calibri", "size_pt": 32, "bold": True, "color": "primary"},
                "body": [{"level": 0, "family": "Calibri", "size_pt": 18, "color": "text"}]
            },
            "assets": raw_data.get("images", []),
            "rules": {
                "title_color": "primary",
                "body_color": "text",
                "logo_policy": "Apply logos as found in template"
            }
        }

    def generate_speaker_notes(self, slide_content):
        """Optional: Generate speaker notes for slides"""
        try:
            prompt = f"""
Generate concise speaker notes for this slide content:
Title: {slide_content.get('title', '')}
Content: {slide_content.get('content', '')}

Provide 2-3 sentences of speaking points that expand on the slide content.
"""
            
            if self.provider == 'openai':
                response = self._call_openai(prompt)
            elif self.provider == 'anthropic':
                response = self._call_anthropic(prompt)
            elif self.provider == 'gemini':
                response = self._call_gemini(prompt)
            
            return response.strip()
            
        except Exception as e:
            print(f"Error generating speaker notes: {str(e)}")
            return "Speaker notes could not be generated."

