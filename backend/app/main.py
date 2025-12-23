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
        check_and_increment_limit(req.fingerprint, client_ip, user_id)

        # 3. Ensure Session Exists
        existing_session = supabase.table("chat_sessions").select("session_id").eq("session_id", req.session_id).execute()
        
        if not existing_session.data:
            supabase.table("chat_sessions").insert({
                "session_id": req.session_id,
                "fingerprint_id": req.fingerprint,
                "user_id": user_id,
                "title": "New Chat" 
            }).execute()

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
        
        return {"reply": ai_reply}

    except HTTPException as he:
        raise he
    except Exception as e:
        import traceback
        return {"error": str(e), "traceback": traceback.format_exc()}