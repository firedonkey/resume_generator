from motor.motor_asyncio import AsyncIOMotorDatabase
from fastapi import Depends
from ..core.config import settings

async def get_database() -> AsyncIOMotorDatabase:
    from main import app
    return app.mongodb 