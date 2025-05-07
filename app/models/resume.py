from pydantic import BaseModel, Field, ConfigDict
from typing import List, Optional
from datetime import datetime
from bson import ObjectId
from .user import PyObjectId

class Experience(BaseModel):
    company: str
    position: str
    start_date: datetime
    end_date: Optional[datetime] = None
    description: str
    achievements: List[str] = []

class Education(BaseModel):
    institution: str
    degree: str
    field: str
    start_date: datetime
    end_date: Optional[datetime] = None
    gpa: Optional[float] = None
    achievements: List[str] = []

class SkillCategory(BaseModel):
    category: str
    items: List[str]

class Project(BaseModel):
    name: str
    description: str
    technologies: List[str]
    link: Optional[str] = None

class Certification(BaseModel):
    name: str
    issuer: str
    date: datetime
    link: Optional[str] = None

class Language(BaseModel):
    language: str
    proficiency: str

class PersonalInfo(BaseModel):
    name: str
    email: str
    phone: str
    location: str
    summary: str
    profile_picture: Optional[str] = None

class ResumeBase(BaseModel):
    title: str
    template: str = Field(..., pattern="^(modern|professional|creative|minimal)$")
    personal_info: PersonalInfo
    experience: List[Experience] = []
    education: List[Education] = []
    skills: List[SkillCategory] = []
    projects: List[Project] = []
    certifications: List[Certification] = []
    languages: List[Language] = []

class ResumeCreate(ResumeBase):
    pass

class ResumeInDB(ResumeBase):
    id: PyObjectId = Field(default_factory=PyObjectId, alias="_id")
    user: PyObjectId
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)

    model_config = ConfigDict(
        json_encoders={ObjectId: str},
        populate_by_name=True
    )

class Resume(ResumeBase):
    id: PyObjectId = Field(default_factory=PyObjectId, alias="_id")
    user: PyObjectId
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(
        json_encoders={ObjectId: str},
        populate_by_name=True
    ) 