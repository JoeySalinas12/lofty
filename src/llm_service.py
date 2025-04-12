#!/usr/bin/env python3
# llm_service.py - A lightweight wrapper around your existing LLM query code

import sys
import os
import json
from model_queries import query_chat, query_claude, query_gemini

def query_llm(model, prompt):
    """
    Query the appropriate LLM based on the model name
    """
    try:
        # Add instructions to encourage markdown formatting in responses
        markdown_instructions = """
        Please format your response using Markdown:
        - Use **bold** or __bold__ for emphasis
        - Use *italic* or _italic_ for subtle emphasis
        - Use `code` for inline code
        - Use code blocks with language specifiers for multi-line code:
          ```python
          def example():
              return "Hello World"
          ```
        - Use # for headings (## for subheadings)
        - Use > for blockquotes
        - Use bullet lists with - or * and numbered lists with 1. 2. etc.
        - Use [link text](URL) for links
        - Use tables with | dividers when presenting tabular data
        - Use horizontal rules with --- for section dividers if needed
        - Use mathematical notation with $ symbols if needed

        Here's my question/request: {prompt}
        """

        # Include markdown instructions only for Claude and GPT which handle it well
        enhanced_prompt = prompt
        if "claude" in model.lower() or "gpt" in model.lower():
            enhanced_prompt = markdown_instructions.format(prompt=prompt)
        
        # Route to the appropriate model query function
        if "gpt" in model.lower():
            response = query_chat(enhanced_prompt)
            if isinstance(response, dict) and "error" in response:
                return response["error"]
            elif isinstance(response, dict) and "choices" in response:
                return response["choices"][0]["message"]["content"]
            else:
                return f"Error: Unexpected response format from GPT"
                
        elif "claude" in model.lower():
            response = query_claude(enhanced_prompt)
            # Claude already returns a string
            return response
            
        elif "gemini" in model.lower():
            # For Gemini, we keep the original prompt as it may not handle markdown as well
            response = query_gemini(prompt)
            if isinstance(response, dict) and "error" in response:
                return response["error"]
            elif isinstance(response, dict) and "candidates" in response:
                return response["candidates"][0]["content"]["parts"][0]["text"]
            else:
                return f"Error: Unexpected response format from Gemini"
                
        else:
            return f"Error: Unsupported model '{model}'"
            
    except Exception as e:
        return f"Error querying {model}: {str(e)}"

if __name__ == "__main__":
    # Check arguments
    if len(sys.argv) < 3:
        print("Usage: python llm_service.py <model_name> <prompt>")
        sys.exit(1)
    
    # Get model and prompt from arguments
    model_name = sys.argv[1]
    prompt_text = " ".join(sys.argv[2:])
    
    # Query the LLM and print the result
    result = query_llm(model_name, prompt_text)
    print(result)