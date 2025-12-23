from fastapi import HTTPException
from app.database import supabase

# Rules
GUEST_LIMIT = 5
USER_BONUS_LIMIT = 3  # Additional prompts after login (Total 8 approx)

def check_and_increment_limit(fingerprint: str, ip: str, user_id: str = None):
    """
    Decides if a user can chat based on Guest or Logged-in status.
    """
    
    # --- SCENARIO A: Logged In User ---
    if user_id:
        # Check User Table
        response = supabase.table("user_stats").select("*").eq("user_id", user_id).execute()
        
        if not response.data:
            # First time seeing this User ID.
            # Try to inherit usage from their device fingerprint (if they were a guest before)
            guest_res = supabase.table("guest_tracking").select("prompt_count").eq("fingerprint_id", fingerprint).execute()
            current_count = guest_res.data[0]['prompt_count'] if guest_res.data else 0
            
            # Create the record with inherited count
            supabase.table("user_stats").insert({
                "user_id": user_id,
                "prompt_count": current_count
            }).execute()
            stats = {"prompt_count": current_count}
        else:
            stats = response.data[0]
        
        # Hard cap: 8 prompts total explicitly requested
        TOTAL_LIMIT = 8 
        
        if stats['prompt_count'] >= TOTAL_LIMIT:
             raise HTTPException(status_code=403, detail="USER_LIMIT_REACHED")
        
        # Increment
        supabase.table("user_stats").update({
            "prompt_count": stats['prompt_count'] + 1,
            "updated_at": "now()" 
        }).eq("user_id", user_id).execute()
        return True

    # --- SCENARIO B: Guest User ---
    else:
        # 1. IP Abuse Check (Optional: Block if IP has > 50 prompts/hour globally)
        # (Skipped for brevity, but you'd query a separate IP table here)

        # 2. Fingerprint Check
        response = supabase.table("guest_tracking").select("*").eq("fingerprint_id", fingerprint).execute()
        guest = response.data[0] if response.data else {"prompt_count": 0}

        if guest['prompt_count'] >= GUEST_LIMIT:
            raise HTTPException(status_code=403, detail="GUEST_LIMIT_REACHED")

        # Increment
        supabase.table("guest_tracking").upsert({
            "fingerprint_id": fingerprint,
            "prompt_count": guest['prompt_count'] + 1,
            "last_ip": ip
        }).execute()
        return True
        