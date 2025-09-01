# gemini_api.py
import google.generativeai as genai

def test_gemini_config(api_key: str, model: str, prompt: str, temperature: float, max_tokens: int, minimal: bool = False) -> dict:
    try:
        genai.configure(api_key=api_key)
        
        if minimal:
            test_prompt = "Hi"
            test_max_tokens = 5
            test_temperature = 0.1
        else:
            test_prompt = prompt
            test_max_tokens = max_tokens
            test_temperature = temperature
        
        model_instance = genai.GenerativeModel(model)
        
        response = model_instance.generate_content(
            test_prompt,
            generation_config=genai.types.GenerationConfig(
                temperature=test_temperature,
                max_output_tokens=test_max_tokens
            )
        )
        
        # Extract response text
        response_text = response.text if hasattr(response, 'text') else str(response)
        
        # Estimate token usage (Gemini doesn't provide exact token counts like OpenAI/Anthropic)
        estimated_tokens = len(test_prompt.split()) + len(response_text.split())
        
        return {
            "success": True,
            "response": response_text if not minimal else "API key is valid",
            "tokens_used": estimated_tokens,
            "model_used": model,
            "test_type": "minimal" if minimal else "full"
        }
    except Exception as e:
        error_message = str(e)
        
        # Handle specific Gemini API errors
        if "API_KEY_INVALID" in error_message or "invalid API key" in error_message.lower():
            return {"success": False, "error": f"Invalid API key: {error_message}"}
        elif "quota" in error_message.lower() or "limit" in error_message.lower():
            return {"success": False, "error": f"Rate limit or quota exceeded: {error_message}"}
        elif "permission" in error_message.lower() or "access" in error_message.lower():
            return {"success": False, "error": f"Permission denied: {error_message}"}
        elif "model" in error_message.lower() and "not found" in error_message.lower():
            return {"success": False, "error": f"Model not found or not available: {error_message}"}
        else:
            return {"success": False, "error": f"Gemini API Error: {error_message}"}

def get_gemini_completion(api_key: str, model: str, prompt: str, temperature: float, max_tokens: int):
    genai.configure(api_key=api_key)
    
    model_instance = genai.GenerativeModel(model)
    
    response = model_instance.generate_content(
        prompt,
        generation_config=genai.types.GenerationConfig(
            temperature=temperature,
            max_output_tokens=max_tokens
        )
    )
    
    return response
