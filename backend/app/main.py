from fastapi import FastAPI, Request, HTTPException, Header
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Optional

from app.database import supabase
from utils import get_real_ip
from app.services.limit_service import check_and_increment_limit
from app.services.ai_service import generate_gemini_response

app = FastAPI()

# --- CONFIGURATION ---
# Allow React Frontend (localhost:5173 is standard Vite port)
origins = [
    "http://localhost:5173",
    "http://localhost:3000",
    "http://localhost:5174",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# --- MODELS ---
class ChatRequest(BaseModel):
    message: str
    session_id: str
    fingerprint: str
    
# --- ROUTES ---
@app.get("/api/user/stats")
def get_user_stats(authorization: str = Header(None)):
    """
    Returns user stats including premium status
    """
    if not authorization:
        raise HTTPException(status_code=401, detail="Not authenticated")
    
    try:
        token = authorization.split(" ")[1]
        user = supabase.auth.get_user(token)
        if not user:
            raise HTTPException(status_code=401, detail="Invalid token")
        
        user_id = user.user.id
        
        # Fetch user stats
        response = supabase.table("user_stats").select("*").eq("user_id", user_id).execute()
        
        if not response.data:
            # User has no stats yet, return default
            return {
                "is_premium": False,
                "prompt_count": 0
            }
        
        stats = response.data[0]
        return {
            "is_premium": stats.get("is_premium", False),
            "prompt_count": stats.get("prompt_count", 0)
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/chat/history/{session_id}")
def get_chat_history(session_id: str):
    """
    Returns the chat history for a specific session
    """
    try:
        response = supabase.table("chat_messages").select("role, content").eq("session_id", session_id).order("created_at").execute()
        return response.data
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/chat")
def chat_endpoint(
    req: ChatRequest, 
    request: Request,
    authorization: str = Header(None) # Expected format: "Bearer <token>"
):
    try:
        # 1. Identify User
        client_ip = get_real_ip(request)
        user_id = None
        
        # Check if user provided a Supabase Auth Token
        if authorization:
            try:
                token = authorization.split(" ")[1]
                user = supabase.auth.get_user(token)
                if user:
                    user_id = user.user.id
            except Exception as e:
                print(f"Auth Error: {e}") 
                # We don't block the request if auth fails, we just treat them as guest
                # or you can raise 401 if you prefer strict security.

        # 2. Check Limits (Bouncer)
        # This will raise HTTP 403 if limit exceeded
        current_usage = check_and_increment_limit(req.fingerprint, client_ip, user_id)

        # 3. Ensure Session Exists
        existing_session = supabase.table("chat_sessions").select("session_id").eq("session_id", req.session_id).execute()
        
        if not existing_session.data:
            supabase.table("chat_sessions").insert({
                "session_id": req.session_id,
                "fingerprint_id": req.fingerprint,
                "user_id": user_id,
                "title": "New Chat" 
            }).execute()
        else:
            # Check if this session needs to be claimed by the user
            session_data = existing_session.data[0]
            if user_id and session_data.get('user_id') is None:
                print(f"[DEBUG] Merging Guest Session {req.session_id} to User {user_id}")
                supabase.table("chat_sessions").update({
                    "user_id": user_id
                }).eq("session_id", req.session_id).execute()

        # 4. Save USER message to DB
        supabase.table("chat_messages").insert({
            "session_id": req.session_id,
            "role": "user",
            "content": req.message
        }).execute()

        # 5. Generate AI Response
        ai_reply = generate_gemini_response(req.session_id, req.message)
        
        # 6. Save AI message to DB
        supabase.table("chat_messages").insert({
            "session_id": req.session_id,
            "role": "ai",
            "content": ai_reply
        }).execute()
        
        return {
            "reply": ai_reply,
            "prompt_count": current_usage,
            "is_guest": user_id is None
        }

    except HTTPException as he:
        raise he
    except Exception as e:
        import traceback
        return {"error": str(e), "traceback": traceback.format_exc()}