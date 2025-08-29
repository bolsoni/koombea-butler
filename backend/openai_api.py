# openai_api.py
import openai

def test_openai_config(api_key: str, model: str, prompt: str, temperature: float, max_tokens: int, minimal: bool = False) -> dict:
    try:
        client = openai.OpenAI(api_key=api_key, timeout=30.0)
        
        if minimal:
            test_prompt = "Hi"
            test_max_tokens = 5
            test_temperature = 0.1
        else:
            test_prompt = prompt
            test_max_tokens = max_tokens
            test_temperature = temperature
        
        response = client.chat.completions.create(
            model=model,
            messages=[{"role": "user", "content": test_prompt}],
            temperature=test_temperature,
            max_tokens=test_max_tokens,
            timeout=30.0
        )
        
        return {
            "success": True,
            "response": response.choices[0].message.content if not minimal else "API key is valid",
            "tokens_used": response.usage.total_tokens,
            "model_used": response.model,
            "test_type": "minimal" if minimal else "full"
        }
    except openai.APIError as e:
        return {"success": False, "error": f"OpenAI API Error: {str(e)}"}
    except openai.RateLimitError as e:
        return {"success": False, "error": f"Rate limit exceeded: {str(e)}"}
    except openai.AuthenticationError as e:
        return {"success": False, "error": f"Authentication failed: {str(e)}"}
    except Exception as e:
        return {"success": False, "error": f"Unexpected error: {str(e)}"}

def get_openai_completion(api_key: str, model: str, messages: list, temperature: float, max_tokens: int):
    client = openai.OpenAI(api_key=api_key, timeout=60.0)
    
    response = client.chat.completions.create(
        model=model,
        messages=messages,
        temperature=temperature,
        max_tokens=max_tokens
    )
    
    return response
