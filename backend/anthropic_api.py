# anthropic_api.py
import anthropic

def test_anthropic_config(api_key: str, model: str, prompt: str, temperature: float, max_tokens: int, minimal: bool = False) -> dict:
    try:
        client = anthropic.Anthropic(api_key=api_key)
        
        if minimal:
            test_prompt = "Hi"
            test_max_tokens = 5
            test_temperature = 0.1
        else:
            test_prompt = prompt
            test_max_tokens = max_tokens
            test_temperature = temperature
        
        response = client.messages.create(
            model=model,
            max_tokens=test_max_tokens,
            temperature=test_temperature,
            messages=[
                {"role": "user", "content": test_prompt}
            ]
        )
        
        # Extract response text
        response_text = ""
        if response.content and len(response.content) > 0:
            response_text = response.content[0].text if hasattr(response.content[0], 'text') else str(response.content[0])
        
        return {
            "success": True,
            "response": response_text if not minimal else "API key is valid",
            "tokens_used": response.usage.input_tokens + response.usage.output_tokens if hasattr(response, 'usage') else 0,
            "model_used": response.model if hasattr(response, 'model') else model,
            "test_type": "minimal" if minimal else "full"
        }
    except anthropic.APIError as e:
        return {"success": False, "error": f"Anthropic API Error: {str(e)}"}
    except anthropic.AuthenticationError as e:
        return {"success": False, "error": f"Authentication failed: {str(e)}"}
    except anthropic.BadRequestError as e:
        return {"success": False, "error": f"Bad request: {str(e)}"}
    except Exception as e:
        return {"success": False, "error": f"Unexpected error: {str(e)}"}

def get_anthropic_completion(api_key: str, model: str, messages: list, temperature: float, max_tokens: int):
    client = anthropic.Anthropic(api_key=api_key)
    
    response = client.messages.create(
        model=model,
        max_tokens=max_tokens,
        temperature=temperature,
        messages=messages
    )
    
    return response
