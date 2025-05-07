from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field
from typing import List, Optional
import json
import logging
import os
import requests

# Configure logging with more detailed format
logging.basicConfig(
    level=logging.DEBUG,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# Debug: Print all environment variables
logger.info("Current environment variables:")
for key, value in os.environ.items():
    logger.info(f"{key}={value}")
    if 'proxy' in key.lower():
        logger.info(f"Found proxy setting: {key}={value}")
        del os.environ[key]
    elif 'http' in key.lower():
        logger.info(f"Found HTTP setting: {key}={value}")

router = APIRouter()

class ProfileRequest(BaseModel):
    profile_text: str

class ProfileResponse(BaseModel):
    name: str = Field(default="Not provided")
    title: str = Field(default="Not provided")
    summary: str = Field(default="Not provided")
    skills: List[str] = Field(default_factory=list)
    experience: List[dict] = Field(default_factory=list)
    education: List[dict] = Field(default_factory=list)
    certifications: Optional[List[str]] = Field(default_factory=list)
    languages: Optional[List[str]] = Field(default_factory=list)

def create_default_response() -> dict:
    """Create a default response with placeholder values."""
    return {
        "name": "Not provided",
        "title": "Not provided",
        "summary": "Not provided",
        "skills": [],
        "experience": [],
        "education": [],
        "certifications": [],
        "languages": []
    }

@router.post("/parse-profile", response_model=ProfileResponse)
async def parse_profile(request: ProfileRequest):
    try:
        # Get API key
        api_key = os.getenv("OPENAI_API_KEY")
        if not api_key:
            raise HTTPException(status_code=500, detail="OpenAI API key not found")
        
        logger.debug(f"API Key length: {len(api_key)}")
        logger.debug(f"API Key prefix: {api_key[:8]}")

        # Prepare the prompt
        prompt = f"""Parse the following profile text into structured data. Return a JSON object with these fields:
        - name: Full name (required)
        - title: Current job title (required)
        - summary: Professional summary (required)
        - skills: List of technical and soft skills
        - experience: List of work experience objects with fields: company, title, duration, description
        - education: List of education objects with fields: institution, degree, year
        - certifications: List of certifications (if any)
        - languages: List of languages spoken (if any)

        Important: Please provide values for name, title, and summary. If you cannot determine these from the text, use "Not provided" as the value.

        Profile text:
        {request.profile_text}
        """
        
        logger.debug(f"Request prompt: {prompt[:200]}...")  # Log first 200 chars of prompt

        # Prepare the API request
        headers = {
            "Authorization": f"Bearer {api_key}",
            "Content-Type": "application/json"
        }
        
        data = {
            "model": "gpt-3.5-turbo",
            "messages": [
                {"role": "system", "content": "You are a professional resume parser. Extract structured information from profile text. Always provide values for required fields."},
                {"role": "user", "content": prompt}
            ],
            "temperature": 0.3
        }
        
        logger.debug(f"Request headers: {headers}")
        logger.debug(f"Request data: {json.dumps(data, indent=2)}")

        # Make the API call
        logger.debug("Making API request to OpenAI...")
        response = requests.post(
            "https://api.openai.com/v1/chat/completions",
            headers=headers,
            json=data
        )
        
        logger.debug(f"Response status code: {response.status_code}")
        logger.debug(f"Response headers: {dict(response.headers)}")
        
        if response.status_code != 200:
            logger.error(f"OpenAI API error response: {response.text}")
            # Return default response instead of raising an error
            return ProfileResponse(**create_default_response())

        try:
            # Extract and parse the response
            response_json = response.json()
            logger.debug(f"Response JSON: {json.dumps(response_json, indent=2)}")
            
            content = response_json["choices"][0]["message"]["content"]
            logger.debug(f"Raw response content: {content[:200]}...")  # Log first 200 chars
            
            # Find JSON content between triple backticks if present
            if "```json" in content:
                content = content.split("```json")[1].split("```")[0].strip()
                logger.debug("Found JSON content between ```json markers")
            elif "```" in content:
                content = content.split("```")[1].split("```")[0].strip()
                logger.debug("Found JSON content between ``` markers")
            
            logger.debug(f"Extracted JSON content: {content[:200]}...")  # Log first 200 chars
            
            # Parse the JSON response
            parsed_data = json.loads(content)
            logger.debug(f"Parsed data: {json.dumps(parsed_data, indent=2)}")
            
            # Ensure required fields have values
            if not parsed_data.get("name"):
                parsed_data["name"] = "Not provided"
            if not parsed_data.get("title"):
                parsed_data["title"] = "Not provided"
            if not parsed_data.get("summary"):
                parsed_data["summary"] = "Not provided"
                
            return ProfileResponse(**parsed_data)
            
        except (json.JSONDecodeError, KeyError, IndexError) as e:
            logger.error(f"Error processing response: {str(e)}")
            logger.error(f"Raw content that failed to parse: {content if 'content' in locals() else 'No content'}")
            # Return default response instead of raising an error
            return ProfileResponse(**create_default_response())

    except Exception as e:
        logger.error(f"Error in parse_profile: {str(e)}")
        logger.error(f"Error type: {type(e)}")
        logger.error(f"Error args: {e.args}")
        # Return default response instead of raising an error
        return ProfileResponse(**create_default_response()) 