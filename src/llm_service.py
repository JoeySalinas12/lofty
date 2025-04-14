#!/usr/bin/env python3
# llm_service.py - Enhanced to support multiple models

import sys
import os
import json
import requests
from dotenv import load_dotenv

# Try importing necessary libraries
try:
    import anthropic
except ImportError:
    print("Error: Anthropic library not found. Please install it with 'pip install anthropic'.", file=sys.stderr)
    anthropic = None

# Load environment variables from .env
load_dotenv()

# Define model-specific API functions
def query_openai_model(prompt, model_id="gpt-4-turbo", api_key=None):
    """Query OpenAI models like GPT-4 Turbo"""
    api_key = api_key or os.getenv("GPT_API_KEY")
    if not api_key:
        return {"error": "OpenAI API key not found. Please configure it in settings."}
    
    headers = {"Authorization": f"Bearer {api_key}", "Content-Type": "application/json"}
    url = "https://api.openai.com/v1/chat/completions"
    
    data = {
        "model": model_id,  # This can be gpt-4-turbo or other OpenAI models
        "messages": [{"role": "user", "content": prompt}],
        "max_tokens": 2000
    }
    
    try:
        response = requests.post(url, headers=headers, json=data)
        response.raise_for_status()
        result = response.json()
        return result["choices"][0]["message"]["content"]
    except requests.exceptions.RequestException as e:
        error_msg = str(e)
        if "401" in error_msg:
            return f"Error: Invalid OpenAI API key. Please check your settings."
        elif "429" in error_msg:
            return f"Error: OpenAI API rate limit exceeded. Please try again later."
        else:
            return f"Error querying OpenAI: {error_msg}"

def query_anthropic_model(prompt, model_id="claude-3.5-sonnet", api_key=None):
    """Query Anthropic Claude models"""
    if anthropic is None:
        return "Error: Anthropic library not installed. Please run 'pip install anthropic'."
    
    api_key = api_key or os.getenv("CLAUDE_API_KEY")
    if not api_key:
        return "Anthropic API key not found. Please configure it in settings."
    
    # Convert simple model IDs to actual Anthropic model IDs if needed
    model_mapping = {
        "claude-3.5-sonnet": "claude-3-5-sonnet-20241022", 
        "claude-3-opus": "claude-3-opus-20240229",
        "claude-3-sonnet": "claude-3-sonnet-20240229"
    }
    
    actual_model_id = model_mapping.get(model_id, model_id)
    
    try:
        client = anthropic.Anthropic(api_key=api_key)
        
        # System prompt to encourage proper formatting
        system_prompt = """You are an expert in every subject known to man. You are a world renowned instructor and maestro.
You are humble and love to help with any and all inquiries.

Always format your responses using Markdown syntax for better readability:
- Use headings (# and ##) for section titles
- Use **bold** for emphasis and important points
- Use *italics* for definitions or subtle emphasis
- Use `code` for inline code, commands, or short examples
- Use ```language``` code blocks with appropriate language specifiers for multi-line code or examples
- Use bullet points or numbered lists when listing items
- Use > blockquotes for important notes or quotes
- Use tables with | dividers when presenting tabular data

For mathematical expressions, use LaTeX syntax:
- Use single dollar signs for inline math: $x^2 + y^2 = r^2$
- Use double dollar signs for block/display math: 
  $$\\int_{-\\pi}^{\\pi} \\sin(x) dx = 0$$
"""

        message = client.messages.create(
            model=actual_model_id,
            max_tokens=2000,
            temperature=1,
            system=system_prompt,
            messages=[
                {
                    "role": "user",
                    "content": [
                        {
                            "type": "text",
                            "text": prompt
                        }
                    ]
                }
            ]
        )
        
        return message.content[0].text

    except Exception as e:
        return f"Error querying Anthropic: {str(e)}"

def query_gemini_model(prompt, model_id="gemini-2-pro", api_key=None):
    """Query Google Gemini Pro models"""
    api_key = api_key or os.getenv("GEMINI_API_KEY")
    if not api_key:
        return {"error": "Gemini API key not found. Please configure it in settings."}
    
    # Set headers
    headers = {"Content-Type": "application/json"}
    
    # Map simple model names to API endpoints
    model_mapping = {
        "gemini-2-pro": "gemini-2.0-pro",
        "gemini-1.5-pro": "gemini-1.5-pro-latest"
    }
    
    actual_model_id = model_mapping.get(model_id, model_id)
    
    # Create the request payload
    data = {
        "contents": [{"parts": [{"text": prompt}]}]
    }

    try:
        # Make the request
        url = f"https://generativelanguage.googleapis.com/v1beta/models/{actual_model_id}:generateContent?key={api_key}"
        response = requests.post(url, headers=headers, json=data)
        response.raise_for_status()
        result = response.json()
        
        # Extract the text from the response
        return result["candidates"][0]["content"]["parts"][0]["text"]
    except Exception as e:
        return f"Error querying Gemini: {str(e)}"

def query_free_model(prompt, model_id, endpoint=None):
    """Query free models through their APIs or hosted endpoints"""
    try:
        # For demonstration purposes, we'll use a proxy API for free models
        # In a real implementation, you would integrate with open-source APIs
        proxy_api_url = endpoint or "https://api.openrouter.ai/api/v1/chat/completions"
        
        # Create a mapping of free models to their actual implementation
        free_model_mapping = {
            "deepseek-v3": "deepseek-ai/deepseek-v3",
            "deepseek-coder": "deepseek-ai/deepseek-coder-v2",
            "openchat-3.5": "openchat/openchat-3.5-1226",
            "yi-1.5-34b": "01-ai/yi-34b",
            "gecko-3": "mistralai/mistral-medium"  # Gecko is a stand-in for another free model
        }
        
        # Get actual model ID for the API
        mapped_model = free_model_mapping.get(model_id, model_id)
        
        # For open-source models, we'll use a common API format
        headers = {
            "Content-Type": "application/json"
        }
        
        # Add API key if provided in environment (some free model APIs still need keys)
        model_key_env = f"{model_id.upper().replace('-', '_')}_API_KEY"
        api_key = os.getenv(model_key_env)
        if api_key:
            headers["Authorization"] = f"Bearer {api_key}"
        
        # Generic payload for most LLM APIs
        data = {
            "model": mapped_model,
            "messages": [{"role": "user", "content": prompt}],
            "temperature": 0.7,
            "max_tokens": 2000
        }
        
        # Attempt to call the API
        response = requests.post(proxy_api_url, headers=headers, json=data)
        response.raise_for_status()
        
        # Basic response parsing - adjust based on the actual API response format
        result = response.json()
        if "choices" in result and len(result["choices"]) > 0:
            return result["choices"][0]["message"]["content"]
        elif "output" in result:
            return result["output"]
        elif "response" in result:
            return result["response"]
        else:
            return f"Received response from {model_id} but couldn't parse it. Please check API documentation."
            
    except Exception as e:
        # For demonstration, fallback to a mock response for free models
        return f"""I'm simulating a response from {model_id} since we don't have full integration yet.

Here's what I would respond to your query:

# Response to: {prompt}

This is a simulated response for demonstration purposes. In a production environment, 
this would connect to the actual API endpoint for {model_id}.

To fully implement this functionality:
1. Install the specific libraries for {model_id}
2. Create the appropriate API calls
3. Parse the responses correctly

For now, you can use the paid models that are fully implemented or check back for updates.

(Error details: {str(e)})"""

def query_llm(model_id, prompt):
    """
    Route to the appropriate model query function based on model ID
    """
    try:
        # Add instructions for markdown formatting
        markdown_instructions = """
        Please format your response using Markdown:
        - Use **bold** or __bold__ for emphasis
        - Use *italic* or _italic_ for subtle emphasis
        - Use `code` for inline code
        - Use code blocks with language specifiers for multi-line code
        - Use # for headings (## for subheadings)
        - Use > for blockquotes
        - Use bullet lists with - or * and numbered lists with 1. 2. etc.
        - Use [link text](URL) for links
        - Use tables with | dividers for tabular data
        - Use mathematical notation with $ symbols if needed

        Here's my question/request: {prompt}
        """
        
        # Group models by their provider/type
        openai_models = ["gpt-4-turbo", "gpt-4", "gpt-3.5-turbo"]
        anthropic_models = ["claude-3.5-sonnet", "claude-3-opus", "claude-3-sonnet"]
        gemini_models = ["gemini-2-pro", "gemini-1.5-pro", "gemini-1.0-pro"]
        free_models = ["deepseek-v3", "deepseek-coder", "openchat-3.5", "yi-1.5-34b", "gecko-3"]
        
        # Convert legacy model names
        legacy_mapping = {
            "claude": "claude-3.5-sonnet",
            "gpt": "gpt-4-turbo",
            "gemini": "gemini-2-pro"
        }
        
        if model_id in legacy_mapping:
            model_id = legacy_mapping[model_id]
            print(f"Using legacy model mapping: {model_id}")
        
        # Include markdown instructions for models that handle it well
        enhanced_prompt = prompt
        if model_id in openai_models or model_id in anthropic_models:
            enhanced_prompt = markdown_instructions.format(prompt=prompt)
            
        # Route to the appropriate provider's function
        if model_id in openai_models or model_id.startswith("gpt"):
            return query_openai_model(enhanced_prompt, model_id)
            
        elif model_id in anthropic_models or model_id.startswith("claude"):
            return query_anthropic_model(enhanced_prompt, model_id)
            
        elif model_id in gemini_models or model_id.startswith("gemini"):
            return query_gemini_model(enhanced_prompt, model_id)
            
        elif model_id in free_models:
            # For free models, determine the appropriate endpoint
            # This would be expanded in a full implementation
            return query_free_model(enhanced_prompt, model_id)
            
        else:
            return f"Error: Unsupported model '{model_id}'"
            
    except Exception as e:
        return f"Error querying {model_id}: {str(e)}"

if __name__ == "__main__":
    # Check arguments
    if len(sys.argv) < 3:
        print("Usage: python llm_service.py <model_id> <prompt>")
        sys.exit(1)
    
    # Get model and prompt from arguments
    model_id = sys.argv[1]
    prompt_text = " ".join(sys.argv[2:])
    
    # Query the LLM and print the result
    result = query_llm(model_id, prompt_text)
    print(result)