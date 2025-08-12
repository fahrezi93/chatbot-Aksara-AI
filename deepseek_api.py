import requests
from typing import List, Dict, Any

class DeepSeekAPI:
    def __init__(self, api_key: str):
        self.api_key = api_key
        self.api_base = "https://api.deepseek.com/v1"
        
    def create_completion(self, 
                         messages: List[Dict[str, str]], 
                         stream: bool = True,
                         model: str = "deepseek-chat",
                         temperature: float = 0.7,
                         max_tokens: int = 2000) -> Any:
        """
        Create a chat completion using the DeepSeek API.
        
        Args:
            messages: List of message dictionaries with 'role' and 'content'
            stream: Whether to stream the response
            model: The model to use
            temperature: Sampling temperature
            max_tokens: Maximum tokens to generate
            
        Returns:
            If stream=True, returns a generator of response chunks
            If stream=False, returns the complete response
        """
        headers = {
            "Authorization": f"Bearer {self.api_key}",
            "Content-Type": "application/json"
        }
        
        data = {
            "messages": messages,
            "model": model,
            "temperature": temperature,
            "max_tokens": max_tokens,
            "stream": stream
        }
        
        response = requests.post(
            f"{self.api_base}/chat/completions",
            headers=headers,
            json=data,
            stream=stream
        )
        
        if response.status_code != 200:
            raise Exception(f"Error from DeepSeek API: {response.text}")
            
        if stream:
            return response.iter_lines()
        else:
            return response.json()
