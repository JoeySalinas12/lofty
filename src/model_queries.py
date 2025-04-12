import requests
import json
import os
from dotenv import load_dotenv
import sys

# Try importing the libraries, with helpful error messages if they're missing
try:
    import anthropic
except ImportError:
    print("Error: Anthropic library not found. Please install it with 'pip install anthropic'.", file=sys.stderr)
    anthropic = None

# Load environment variables from .env
load_dotenv()

# Access the API keys from environment variables
GPT_API_KEY = os.getenv("GPT_API_KEY")
CLAUDE_API_KEY = os.getenv("CLAUDE_API_KEY")
GEMENI_API_KEY = os.getenv("GEMENI_API_KEY")  # Note: Typo is maintained for backward compatibility

# Update API configurations to use environment variables
API_CONFIG = {
    "gpt_4": {"url": "https://api.openai.com/v1/chat/completions", "key": GPT_API_KEY},
    "claude_3_5": {"url": "https://api.anthropic.com/v1/complete", "key": CLAUDE_API_KEY},
    "gemini_2": {"url": "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent", "key": GEMENI_API_KEY},
}

# Costs money
def query_chat(prompt:str) -> dict:
    """Query ChatGPT's openAI model gpt-4-turbo

    Args:
        prompt (str): User prompt

    Returns:
        dict: Response json
    """
    config = API_CONFIG["gpt_4"]
    
    # Check if API key is available
    if not config["key"]:
        return {"error": "OpenAI API key not found. Please configure it in the settings."}
    
    headers = {"Authorization": f"Bearer {config['key']}", "Content-Type": "application/json"}

    data = {
        "model": "gpt-4-turbo",  # Replace with the correct model name
        "messages": [{"role": "user", "content": prompt}],
        "max_tokens": 1000  # Increased token count for more detailed responses
    }
    
    try:
        response = requests.post(config["url"], headers=headers, json=data)
        response.raise_for_status()
        return response.json()
    except requests.exceptions.RequestException as e:
        if "401" in str(e):
            return {"error": "Invalid OpenAI API key. Please check your settings."}
        elif "429" in str(e):
            return {"error": "OpenAI API rate limit exceeded. Please try again later."}
        else:
            return {"error": f"OpenAI API error: {str(e)}"}

# Free
# Modified query_claude function to support markdown formatting
def query_claude(prompt:str) -> str:
    """Query Anthropic's Claude 3.7

    Args:
        prompt (str): User prompt

    Returns:
        dict: Response json
    """
    # Check if anthropic library is available
    if anthropic is None:
        return "Error: Anthropic library not installed. Please run 'pip install anthropic'."
        
    # Check if API key is available
    if not API_CONFIG["claude_3_5"]["key"]:
        return "Anthropic API key not found. Please configure it in the settings."

    try:
        client = anthropic.Anthropic(api_key=API_CONFIG["claude_3_5"]["key"])

        # Updated system prompt to encourage formatting 
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
- Use mathematical notation when appropriate
"""

        message = client.messages.create(
            # model="claude-3-7-sonnet-20250219",
            model= "claude-3-5-sonnet-20241022",
            max_tokens=1000,
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

    except anthropic.APIError as e:
        return f"API Error: {e.message} (Status Code: {e.status_code})"
    except anthropic.RateLimitError:
        return "Error: You have exceeded the rate limit. Try again later."
    except anthropic.AuthenticationError:
        return "Error: Invalid API key. Please check your API key in the settings."
    except anthropic.BadRequestError as e:
        return f"Bad Request Error: {e.message}"
    except Exception as e:
        return f"Unexpected Error: {str(e)}"

# Costs money
def query_gemini(prompt:str) -> dict:
    """Query Google's Gemini API

    Args:
        prompt (str): User prompt

    Returns:
        dict: Response json
    """
    config = API_CONFIG["gemini_2"]
    
    # Check if API key is available
    if not config["key"]:
        return {"error": "Gemini API key not found. Please configure it in the settings."}

    # Set headers
    headers = {
        "Content-Type": "application/json"
    }

    # Create the request payload
    data = {
        "contents": [{"parts": [{"text": prompt}]}]
    }

    try:
        # Make the request
        response = requests.post(
            f"{config['url']}?key={config['key']}",  # API key in the URL
            headers=headers,
            json=data
        )
        
        response.raise_for_status()
        return response.json()
    except requests.exceptions.RequestException as e:
        if "403" in str(e):
            return {"error": "Invalid Gemini API key. Please check your settings."}
        else:
            return {"error": f"Gemini API error: {str(e)}"}