from fastapi import APIRouter, Depends
from typing import List
from pydantic import BaseModel

from ..models.user import User
from .auth import get_current_user

router = APIRouter()

class Template(BaseModel):
    id: str
    name: str
    description: str
    thumbnail: str

@router.get("/", response_model=List[Template])
async def get_templates(current_user: User = Depends(get_current_user)):
    templates = [
        {
            "id": "modern",
            "name": "Modern",
            "description": "A clean and contemporary design with a focus on typography and spacing",
            "thumbnail": "/static/templates/modern-thumbnail.png"
        },
        {
            "id": "professional",
            "name": "Professional",
            "description": "A traditional layout perfect for corporate and business roles",
            "thumbnail": "/static/templates/professional-thumbnail.png"
        },
        {
            "id": "creative",
            "name": "Creative",
            "description": "A bold and unique design for creative professionals",
            "thumbnail": "/static/templates/creative-thumbnail.png"
        },
        {
            "id": "minimal",
            "name": "Minimal",
            "description": "A simple and elegant design that focuses on content",
            "thumbnail": "/static/templates/minimal-thumbnail.png"
        }
    ]
    return templates

@router.get("/{template_id}/preview")
async def get_template_preview(
    template_id: str,
    current_user: User = Depends(get_current_user)
):
    preview_url = f"/static/templates/{template_id}-preview.png"
    return {"preview_url": preview_url} 