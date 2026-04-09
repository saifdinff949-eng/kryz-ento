from fastapi import FastAPI, APIRouter, HTTPException, Depends
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from starlette.middleware.sessions import SessionMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field
from typing import List, Optional
import uuid
from datetime import datetime, timedelta
import httpx

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ.get('DB_NAME', 'kryz_app')]

# API Keys from environment
OPENAI_API_KEY = os.environ.get('OPENAI_API_KEY', '')
RAPIDAPI_KEY = os.environ.get('RAPIDAPI_KEY', '')

# Create the main app
app = FastAPI()

# Add session middleware
app.add_middleware(SessionMiddleware, secret_key=str(uuid.uuid4()))

# Create a router with the /api prefix
api_router = APIRouter(prefix="/api")

# ==================== Models ====================

class User(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    phone: str
    name: str
    picture: Optional[str] = None
    gems: int = 100
    dark_mode: bool = False
    created_at: datetime = Field(default_factory=datetime.utcnow)

class PhoneAuthRequest(BaseModel):
    phone: str

class PhoneVerifyRequest(BaseModel):
    phone: str
    name: str

class UpdateGemsRequest(BaseModel):
    user_id: str
    gems_change: int

class UpdateDarkModeRequest(BaseModel):
    user_id: str
    dark_mode: bool

class TaskCompleteRequest(BaseModel):
    user_id: str
    task_id: str

class GamePlayRequest(BaseModel):
    user_id: str
    game_type: str
    won: bool

class ServiceRequestCreate(BaseModel):
    user_id: str
    service_type: str
    username_or_url: str
    quantity: int
    gems_cost: int

class AIHelpRequest(BaseModel):
    user_id: str
    message: str

class InstagramProfileRequest(BaseModel):
    username: str

class InstagramVideoRequest(BaseModel):
    url: str

class TaskCompletion(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    user_id: str
    task_id: str
    completed_at: datetime = Field(default_factory=datetime.utcnow)

class GamePlay(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    user_id: str
    game_type: str
    plays_today: int = 0
    last_played: datetime = Field(default_factory=datetime.utcnow)

class ServiceRequest(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    user_id: str
    service_type: str
    username_or_url: str
    quantity: int
    gems_cost: int
    status: str = "pending"
    created_at: datetime = Field(default_factory=datetime.utcnow)

# ==================== Auth Routes ====================

@api_router.post("/auth/check-phone")
async def check_phone(request: PhoneAuthRequest):
    """Check if phone number is already registered"""
    existing_user = await db.users.find_one({"phone": request.phone})
    if existing_user:
        return {
            "exists": True,
            "user": {
                "id": existing_user["id"],
                "phone": existing_user["phone"],
                "name": existing_user["name"],
                "picture": existing_user.get("picture"),
                "gems": existing_user.get("gems", 0),
                "dark_mode": existing_user.get("dark_mode", False)
            }
        }
    return {"exists": False}

@api_router.post("/auth/register")
async def register_user(request: PhoneVerifyRequest):
    """Register new user with phone number"""
    # Check if phone already exists
    existing_user = await db.users.find_one({"phone": request.phone})
    if existing_user:
        raise HTTPException(status_code=400, detail="رقم الهاتف مسجل مسبقاً")
    
    # Create new user with 100 welcome gems
    new_user = User(phone=request.phone, name=request.name, gems=100)
    await db.users.insert_one(new_user.dict())
    
    return {
        "user": {
            "id": new_user.id,
            "phone": new_user.phone,
            "name": new_user.name,
            "picture": new_user.picture,
            "gems": new_user.gems,
            "dark_mode": new_user.dark_mode
        }
    }

@api_router.post("/auth/login")
async def login_user(request: PhoneAuthRequest):
    """Login existing user"""
    user = await db.users.find_one({"phone": request.phone})
    if not user:
        raise HTTPException(status_code=404, detail="المستخدم غير موجود")
    
    return {
        "user": {
            "id": user["id"],
            "phone": user["phone"],
            "name": user["name"],
            "picture": user.get("picture"),
            "gems": user.get("gems", 0),
            "dark_mode": user.get("dark_mode", False)
        }
    }

# ==================== User Routes ====================

@api_router.get("/user/{user_id}")
async def get_user(user_id: str):
    user = await db.users.find_one({"id": user_id})
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return {
        "id": user["id"],
        "phone": user.get("phone", ""),
        "name": user["name"],
        "picture": user.get("picture"),
        "gems": user.get("gems", 0),
        "dark_mode": user.get("dark_mode", False)
    }

@api_router.post("/user/gems")
async def update_gems(request: UpdateGemsRequest):
    user = await db.users.find_one({"id": request.user_id})
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    new_gems = user.get("gems", 0) + request.gems_change
    if new_gems < 0:
        raise HTTPException(status_code=400, detail="Insufficient gems")
    
    await db.users.update_one(
        {"id": request.user_id},
        {"$set": {"gems": new_gems}}
    )
    return {"gems": new_gems}

@api_router.post("/user/dark-mode")
async def update_dark_mode(request: UpdateDarkModeRequest):
    await db.users.update_one(
        {"id": request.user_id},
        {"$set": {"dark_mode": request.dark_mode}}
    )
    return {"dark_mode": request.dark_mode}

# ==================== Task Routes ====================

@api_router.get("/tasks/{user_id}")
async def get_tasks_status(user_id: str):
    """Get all tasks and their completion status for a user"""
    completions = await db.task_completions.find({"user_id": user_id}).to_list(100)
    
    tasks_status = {}
    now = datetime.utcnow()
    cooldown = timedelta(hours=20)
    
    for completion in completions:
        task_id = completion["task_id"]
        completed_at = completion.get("completed_at", now - cooldown - timedelta(hours=1))
        if isinstance(completed_at, str):
            completed_at = datetime.fromisoformat(completed_at.replace('Z', '+00:00'))
        
        time_since = now - completed_at
        if time_since < cooldown:
            remaining_seconds = (cooldown - time_since).total_seconds()
            tasks_status[task_id] = {
                "available": False,
                "remaining_seconds": remaining_seconds
            }
        else:
            tasks_status[task_id] = {"available": True}
    
    return {"tasks": tasks_status}

@api_router.post("/tasks/complete")
async def complete_task(request: TaskCompleteRequest):
    """Mark a task as completed and award 30 gems"""
    existing = await db.task_completions.find_one({
        "user_id": request.user_id,
        "task_id": request.task_id
    })
    
    now = datetime.utcnow()
    cooldown = timedelta(hours=20)
    
    if existing:
        completed_at = existing.get("completed_at", now - cooldown - timedelta(hours=1))
        if isinstance(completed_at, str):
            completed_at = datetime.fromisoformat(completed_at.replace('Z', '+00:00'))
        
        if now - completed_at < cooldown:
            remaining = (cooldown - (now - completed_at)).total_seconds()
            raise HTTPException(
                status_code=400,
                detail=f"Task on cooldown. Try again in {int(remaining/3600)} hours"
            )
        
        await db.task_completions.update_one(
            {"id": existing["id"]},
            {"$set": {"completed_at": now}}
        )
    else:
        completion = TaskCompletion(user_id=request.user_id, task_id=request.task_id)
        await db.task_completions.insert_one(completion.dict())
    
    # Award 30 gems (changed from 50)
    await db.users.update_one(
        {"id": request.user_id},
        {"$inc": {"gems": 30}}
    )
    
    user = await db.users.find_one({"id": request.user_id})
    return {"success": True, "gems": user.get("gems", 0)}

# ==================== Game Routes ====================

@api_router.get("/games/{user_id}/{game_type}")
async def get_game_status(user_id: str, game_type: str):
    game = await db.game_plays.find_one({
        "user_id": user_id,
        "game_type": game_type
    })
    
    if not game:
        return {"plays_remaining": 5, "can_play": True}
    
    last_played = game.get("last_played", datetime.utcnow())
    if isinstance(last_played, str):
        last_played = datetime.fromisoformat(last_played.replace('Z', '+00:00'))
    
    now = datetime.utcnow()
    if last_played.date() < now.date():
        await db.game_plays.update_one(
            {"id": game["id"]},
            {"$set": {"plays_today": 0, "last_played": now}}
        )
        return {"plays_remaining": 5, "can_play": True}
    
    plays_today = game.get("plays_today", 0)
    return {
        "plays_remaining": max(0, 5 - plays_today),
        "can_play": plays_today < 5
    }

@api_router.post("/games/play")
async def record_game_play(request: GamePlayRequest):
    game = await db.game_plays.find_one({
        "user_id": request.user_id,
        "game_type": request.game_type
    })
    
    now = datetime.utcnow()
    
    if game:
        last_played = game.get("last_played", now)
        if isinstance(last_played, str):
            last_played = datetime.fromisoformat(last_played.replace('Z', '+00:00'))
        
        plays_today = game.get("plays_today", 0)
        
        if last_played.date() < now.date():
            plays_today = 0
        
        if plays_today >= 5:
            raise HTTPException(status_code=400, detail="No plays remaining today")
        
        await db.game_plays.update_one(
            {"id": game["id"]},
            {"$set": {"plays_today": plays_today + 1, "last_played": now}}
        )
    else:
        new_game = GamePlay(
            user_id=request.user_id,
            game_type=request.game_type,
            plays_today=1,
            last_played=now
        )
        await db.game_plays.insert_one(new_game.dict())
    
    gems_awarded = 0
    if request.won:
        gems_awarded = 50
        await db.users.update_one(
            {"id": request.user_id},
            {"$inc": {"gems": 50}}
        )
    
    user = await db.users.find_one({"id": request.user_id})
    game = await db.game_plays.find_one({
        "user_id": request.user_id,
        "game_type": request.game_type
    })
    
    return {
        "success": True,
        "gems_awarded": gems_awarded,
        "total_gems": user.get("gems", 0),
        "plays_remaining": max(0, 5 - game.get("plays_today", 0))
    }

# ==================== Services Routes ====================

@api_router.post("/services/request")
async def create_service_request(request: ServiceRequestCreate):
    user = await db.users.find_one({"id": request.user_id})
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    if user.get("gems", 0) < request.gems_cost:
        raise HTTPException(status_code=400, detail="Insufficient gems")
    
    await db.users.update_one(
        {"id": request.user_id},
        {"$inc": {"gems": -request.gems_cost}}
    )
    
    service_req = ServiceRequest(
        user_id=request.user_id,
        service_type=request.service_type,
        username_or_url=request.username_or_url,
        quantity=request.quantity,
        gems_cost=request.gems_cost
    )
    await db.service_requests.insert_one(service_req.dict())
    
    user = await db.users.find_one({"id": request.user_id})
    return {
        "success": True,
        "request_id": service_req.id,
        "remaining_gems": user.get("gems", 0)
    }

# ==================== Instagram API Routes ====================

@api_router.post("/instagram/profile")
async def get_instagram_profile(request: InstagramProfileRequest):
    """Fetch Instagram profile info with picture"""
    try:
        async with httpx.AsyncClient() as http_client:
            # Try primary API
            response = await http_client.get(
                f"https://instagram-scraper-20262.p.rapidapi.com/scrapper/api/v1/instagram/profile/{request.username}/timeline/latest",
                headers={
                    "Content-Type": "application/json",
                    "x-rapidapi-host": "instagram-scraper-20262.p.rapidapi.com",
                    "x-rapidapi-key": RAPIDAPI_KEY
                },
                timeout=30
            )
            
            if response.status_code == 200:
                data = response.json()
                profile_pic = None
                username = request.username
                followers = 0
                following = 0
                
                # Extract profile data
                if data and isinstance(data, dict):
                    user_data = data.get('user', data)
                    profile_pic = user_data.get('profile_pic_url') or user_data.get('profile_picture') or user_data.get('profilePicUrl')
                    followers = user_data.get('followers_count', user_data.get('followers', 0))
                    following = user_data.get('following_count', user_data.get('following', 0))
                
                return {
                    "success": True,
                    "profile": {
                        "username": username,
                        "profile_pic": profile_pic,
                        "followers": followers,
                        "following": following
                    }
                }
            
            # Fallback - return mock data
            return {
                "success": True,
                "profile": {
                    "username": request.username,
                    "profile_pic": f"https://ui-avatars.com/api/?name={request.username}&background=random&size=200",
                    "followers": 0,
                    "following": 0
                }
            }
    except Exception as e:
        logging.error(f"Instagram API error: {e}")
        return {
            "success": True,
            "profile": {
                "username": request.username,
                "profile_pic": f"https://ui-avatars.com/api/?name={request.username}&background=random&size=200",
                "followers": 0,
                "following": 0
            }
        }

@api_router.post("/instagram/video")
async def get_instagram_video(request: InstagramVideoRequest):
    """Fetch Instagram video info with thumbnail"""
    try:
        async with httpx.AsyncClient() as http_client:
            encoded_url = request.url
            response = await http_client.get(
                f"https://instagram-reels-downloader-api.p.rapidapi.com/download?url={encoded_url}",
                headers={
                    "Content-Type": "application/json",
                    "x-rapidapi-host": "instagram-reels-downloader-api.p.rapidapi.com",
                    "x-rapidapi-key": RAPIDAPI_KEY
                },
                timeout=30
            )
            
            if response.status_code == 200:
                data = response.json()
                thumbnail = None
                video_url = None
                
                if data and isinstance(data, dict):
                    thumbnail = data.get('thumbnail') or data.get('cover') or data.get('thumb')
                    video_url = data.get('video_url') or data.get('url') or data.get('download_url')
                
                return {
                    "success": True,
                    "video": {
                        "url": request.url,
                        "thumbnail": thumbnail,
                        "video_url": video_url
                    }
                }
            
            return {
                "success": True,
                "video": {
                    "url": request.url,
                    "thumbnail": "https://via.placeholder.com/300x400/8B5CF6/FFFFFF?text=Video",
                    "video_url": None
                }
            }
    except Exception as e:
        logging.error(f"Instagram Video API error: {e}")
        return {
            "success": True,
            "video": {
                "url": request.url,
                "thumbnail": "https://via.placeholder.com/300x400/8B5CF6/FFFFFF?text=Video",
                "video_url": None
            }
        }

# ==================== AI Help Routes ====================

@api_router.post("/ai/help")
async def ai_help(request: AIHelpRequest):
    try:
        async with httpx.AsyncClient() as http_client:
            response = await http_client.post(
                "https://api.openai.com/v1/chat/completions",
                headers={
                    "Authorization": f"Bearer {OPENAI_API_KEY}",
                    "Content-Type": "application/json"
                },
                json={
                    "model": "gpt-3.5-turbo",
                    "messages": [
                        {
                            "role": "system",
                            "content": "أنت مساعد ودود لتطبيق kryz en app. ساعد المستخدمين في استخدام التطبيق وحل مشاكلهم. إذا لم تستطع المساعدة، اقترح عليهم التواصل مع المطور."
                        },
                        {
                            "role": "user",
                            "content": request.message
                        }
                    ],
                    "max_tokens": 500
                },
                timeout=30
            )
            
            if response.status_code == 200:
                data = response.json()
                ai_response = data["choices"][0]["message"]["content"]
                return {
                    "success": True,
                    "response": ai_response,
                    "developer_link": "https://www.instagram.com/kryz.ento?igsh=OWYwM3NycWUxcDdn&utm_source=qr"
                }
            else:
                return {
                    "success": False,
                    "response": "عذراً، لم أستطع معالجة طلبك. يرجى التواصل مع المطور.",
                    "developer_link": "https://www.instagram.com/kryz.ento?igsh=OWYwM3NycWUxcDdn&utm_source=qr"
                }
    except Exception as e:
        logging.error(f"AI Help error: {e}")
        return {
            "success": False,
            "response": "عذراً، حدث خطأ. يرجى التواصل مع المطور.",
            "developer_link": "https://www.instagram.com/kryz.ento?igsh=OWYwM3NycWUxcDdn&utm_source=qr"
        }

# ==================== Root Route ====================

@api_router.get("/")
async def root():
    return {"message": "kryz en app API", "version": "2.0.0"}

# Include the router in the main app
app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()
