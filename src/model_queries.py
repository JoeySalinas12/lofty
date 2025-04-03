import requests
import json
import os
from dotenv import load_dotenv
import anthropic
from llamaapi import LlamaAPI


# Load environment variables from .env
load_dotenv()

# Access the API keys
GPT_API_KEY = os.getenv("GPT_API_KEY")
CLAUDE_API_KEY = os.getenv("CLAUDE_API_KEY")
GEMENI_API_KEY = os.getenv("GEMENI_API_KEY")

# API configurations (Replace with actual API keys and endpoints)
API_CONFIG = {
    "gpt_4": {"url": "https://api.openai.com/v1/chat/completions", "key": GPT_API_KEY},
    "claude_3_5": {"url": "https://api.anthropic.com/v1/complete", "key": CLAUDE_API_KEY},
    "gemini_2": {"url": "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent", "key": GEMENI_API_KEY},
    # "llama_3": {"url": "https://api.meta.com/llama/v1/query", "key": "5f673b30-4e19-410f-94be-4929e8f28254"},
    # "mistral_large": {"url": "https://api.mistral.ai/v1/generate", "key": "your_mistral_api_key"},
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
    headers = {"Authorization": f"Bearer {config['key']}", "Content-Type": "application/json"}

    data = {
        "model": "gpt-4-turbo",  # Replace with the correct model name
        "messages": [{"role": "user", "content": prompt}],
        "max_tokens": 100
    }
    response = requests.post(config["url"], headers=headers, json=data)

    if response.status_code == 200:
        return response.json() #["choices"][0]["message"]["content"]
    else:
        print(f"Error: {response.status_code}, {response.text}")

# Free
def query_claude(prompt:str) -> str:
    """Query Anthropic's Claude 3.7

    Args:
        prompt (str): User prompt

    Returns:
        dict: Response json
    """

    try:
        client = anthropic.Anthropic(api_key=API_CONFIG["claude_3_5"]["key"])

        message = client.messages.create(
            # model="claude-3-7-sonnet-20250219",
            model= "claude-3-5-sonnet-20241022",
            max_tokens=1000,
            temperature=1,
            system="You are an expert in every subject known to man. You are a world renowned instructure and maestro. You are humble and love to help with any and all inqueries.",
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

    except anthropic.APIError as e:
        return f"API Error: {e.message} (Status Code: {e.status_code})"
    except anthropic.RateLimitError:
        return "Error: You have exceeded the rate limit. Try again later."
    except anthropic.AuthenticationError:
        return "Error: Invalid API key. Please check your API key."
    except anthropic.BadRequestError as e:
        return f"Bad Request Error: {e.message}"
    except Exception as e:
        return f"Unexpected Error: {str(e)}"
    return message.content[0].text

# Costs money
def query_gemini(prompt:str) -> dict:
    """_summary_

    Args:
        prompt (str): _description_

    Returns:
        dict: _description_
    """

    config = API_CONFIG["gemini_2"]

    # Set headers
    headers = {
        "Content-Type": "application/json"
    }

    # Create the request payload
    data = {
        "contents": [{"parts": [{"text": prompt}]}]
    }

    # Make the request
    response = requests.post(
        f"{config['url']}?key={config['key']}",  # API key in the URL
        headers=headers,
        json=data
    )

    # Handle the response
    if response.status_code == 200:
        return response.json()
        # return json.dumps(response_data, indent=2)
    else:
        print(f"Error: {response.status_code}, {response.text}")

# Does not work
# def query_llama(prompt:str) -> dict:
#     """Query llama 3.3

#     Args:
#         prompt (str): _description_

#     Returns:
#         dict: _description_
#     """

#     config = API_CONFIG["llama_3"]
#     # llama = LlamaAPI(config["key"])

#     # Build the API request
#     try:
#         # Initialize the SDK
#         llama = LlamaAPI(config["key"])

#         # Build the API request dynamically
#         api_request_json = {
#             "model": "llama3.1-70b",
#             "messages": [{"role": "user", "content": prompt}],
#             "stream": False  # Disable streaming to get a full response at once
#         }

#         # Execute the Request
#         response = llama.run(api_request_json)

#         # Parse response JSON
#         response_json = response.json()

#         # Extract and return the message content
#         return response_json.get("choices", [{}])[0].get("message", {}).get("content", "No response received.")

#     except Exception as e:
#             return f"Error: {str(e)}"

# # Example usage
# response = query_llama("what is the world record for the fastest marathon race?")
# print(response)