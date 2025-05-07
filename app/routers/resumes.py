from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File
from typing import List
from bson import ObjectId
import os
import shutil
from datetime import datetime

from ..models.resume import Resume, ResumeCreate, ResumeInDB
from ..models.user import User
from ..core.config import settings
from ..db.mongodb import get_database
from .auth import get_current_user

router = APIRouter()

@router.post("/", response_model=Resume)
async def create_resume(
    resume: ResumeCreate,
    current_user: User = Depends(get_current_user),
    db=Depends(get_database)
):
    resume_in_db = ResumeInDB(
        **resume.dict(),
        user=ObjectId(current_user.id)
    )
    
    result = await db.resumes.insert_one(resume_in_db.dict(by_alias=True))
    created_resume = await db.resumes.find_one({"_id": result.inserted_id})
    
    return Resume(**created_resume)

@router.get("/", response_model=List[Resume])
async def get_resumes(
    current_user: User = Depends(get_current_user),
    db=Depends(get_database)
):
    resumes = await db.resumes.find({"user": ObjectId(current_user.id)}).to_list(length=None)
    return [Resume(**resume) for resume in resumes]

@router.get("/{resume_id}", response_model=Resume)
async def get_resume(
    resume_id: str,
    current_user: User = Depends(get_current_user),
    db=Depends(get_database)
):
    resume = await db.resumes.find_one({
        "_id": ObjectId(resume_id),
        "user": ObjectId(current_user.id)
    })
    
    if not resume:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Resume not found"
        )
    
    return Resume(**resume)

@router.put("/{resume_id}", response_model=Resume)
async def update_resume(
    resume_id: str,
    resume_update: ResumeCreate,
    current_user: User = Depends(get_current_user),
    db=Depends(get_database)
):
    resume = await db.resumes.find_one({
        "_id": ObjectId(resume_id),
        "user": ObjectId(current_user.id)
    })
    
    if not resume:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Resume not found"
        )
    
    update_data = resume_update.dict()
    update_data["updated_at"] = datetime.utcnow()
    
    await db.resumes.update_one(
        {"_id": ObjectId(resume_id)},
        {"$set": update_data}
    )
    
    updated_resume = await db.resumes.find_one({"_id": ObjectId(resume_id)})
    return Resume(**updated_resume)

@router.delete("/{resume_id}")
async def delete_resume(
    resume_id: str,
    current_user: User = Depends(get_current_user),
    db=Depends(get_database)
):
    result = await db.resumes.delete_one({
        "_id": ObjectId(resume_id),
        "user": ObjectId(current_user.id)
    })
    
    if result.deleted_count == 0:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Resume not found"
        )
    
    return {"message": "Resume deleted successfully"}

@router.post("/{resume_id}/profile-picture")
async def upload_profile_picture(
    resume_id: str,
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_user),
    db=Depends(get_database)
):
    # Check if resume exists and belongs to user
    resume = await db.resumes.find_one({
        "_id": ObjectId(resume_id),
        "user": ObjectId(current_user.id)
    })
    
    if not resume:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Resume not found"
        )
    
    # Create uploads directory if it doesn't exist
    os.makedirs(settings.UPLOAD_DIR, exist_ok=True)
    
    # Save file
    file_path = os.path.join(settings.UPLOAD_DIR, f"{resume_id}_{file.filename}")
    with open(file_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)
    
    # Update resume with file path
    await db.resumes.update_one(
        {"_id": ObjectId(resume_id)},
        {"$set": {"personal_info.profile_picture": file_path}}
    )
    
    return {"message": "Profile picture uploaded successfully"} 