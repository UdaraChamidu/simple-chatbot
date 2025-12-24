import os
from app.database import supabase
import google.generativeai as genai

# Initialize Gemini with native SDK
genai.configure(api_key=os.getenv("GOOGLE_API_KEY"))

def get_chat_history(session_id: str):
    """
    Fetches the last 10 messages from Supabase for context.
    """
    response = supabase.table("chat_messages")\
        .select("role, content")\
        .eq("session_id", session_id)\
        .order("created_at", desc=True)\
        .limit(10)\
        .execute()
    
    # Supabase returns newest first due to desc=True, we need oldest first for LLM
    messages_data = response.data[::-1] if response.data else []
    
    history = []
    for msg in messages_data:
        role = "user" if msg['role'] == 'user' else "model"
        history.append({
            "role": role,
            "parts": [msg['content']]
        })
            
    return history

def generate_gemini_response(session_id: str, user_message: str, system_instruction: str = None) -> str:
    # 1. Get History
    history = get_chat_history(session_id)
    
    # 2. Initialize model with System Instruction if provided
    try:
         model = genai.GenerativeModel('gemini-2.5-flash-lite', system_instruction=system_instruction)
    except Exception as e:
         print(f"Model Init Warning: {e}")
         model = genai.GenerativeModel('gemini-2.5-flash-lite')
    
    # 3. Start chat with history
    chat = model.start_chat(history=history)
    
    # 4. Send message and get response
    response = chat.send_message(user_message)
    
    return response.text