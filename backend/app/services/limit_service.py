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
        return stats['prompt_count'] + 1

    # --- SCENARIO B: Guest User ---
    else:
        print(f"[DEBUG] Guest Access - Fingerprint: {fingerprint}, IP: {ip}")

        # 1. IP Abuse Check
        # Query IP table
        ip_res = supabase.table("ip_abuse_monitor").select("*").eq("ip_address", ip).execute()
        
        if ip_res.data:
            ip_record = ip_res.data[0]
            if ip_record.get('is_blocked'):
                print(f"[DEBUG] BLOCK: IP {ip} is flagged as blocked.")
                raise HTTPException(status_code=403, detail="IP_BLOCKED")
            
            # Logic: If last request was > 1 hour ago, reset count? 
            # For now, we will just simple increment to ensure data flows.
            new_count = ip_record.get('request_count_1h', 0) + 1
            
            supabase.table("ip_abuse_monitor").update({
                "request_count_1h": new_count,
                "last_request_at": "now()" 
            }).eq("ip_address", ip).execute()
            print(f"[DEBUG] IP Monitor: Updated {ip} count to {new_count}")
            
        else:
            # First time seeing IP
            supabase.table("ip_abuse_monitor").insert({
                "ip_address": ip,
                "request_count_1h": 1,
                "last_request_at": "now()"
            }).execute()
            print(f"[DEBUG] IP Monitor: Created new record for {ip}")


        # 2. Fingerprint Check
        response = supabase.table("guest_tracking").select("*").eq("fingerprint_id", fingerprint).execute()
        guest = response.data[0] if response.data else {"prompt_count": 0}

        print(f"[DEBUG] Current Guest Count: {guest['prompt_count']}")

        if guest['prompt_count'] >= GUEST_LIMIT:
            print(f"[DEBUG] Limit Reached for {fingerprint}")
            raise HTTPException(status_code=403, detail="GUEST_LIMIT_REACHED")

        # Increment
        data = {
            "fingerprint_id": fingerprint,
            "prompt_count": guest['prompt_count'] + 1,
            "last_ip": ip
        }
        res = supabase.table("guest_tracking").upsert(data).execute()
        print(f"[DEBUG] Upsert Result: {res}")
        return guest['prompt_count'] + 1
        