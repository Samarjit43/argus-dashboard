import json
import os
import re
from groq import Groq
from playwright.sync_api import sync_playwright
from supabase import create_client
from pywebpush import webpush, WebPushException

# --- Credentials ---
SUPABASE_URL = "https://pjpjelguamyzzwldiuhl.supabase.co"
SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBqcGplbGd1YW15enp3bGRpdWhsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODc0NTgzNTMsImV4cCI6MjEwMzAzNDM1M30.8iJVwfvbdNLS0wStint5lMBaBvkILgtzsBiAn9GQqKw"
GROQ_API_KEY = "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"

VAPID_PRIVATE_KEY = "Q4YLfRtFyjJBl5FwHIoOzcwTzN_I0WglVpOUN07SKx0="
VAPID_CLAIM_EMAIL = "mailto:raimon89056@gmail.com"
# -------------------

supabase = create_client(SUPABASE_URL, SUPABASE_KEY)
ai_client = Groq(api_key=GROQ_API_KEY)


def fetch_watched_websites():
    response = supabase.table("watched_websites").select("*").execute()
    return response.data


def send_web_push_alert(title, prize, platform, url):
    """Fetches browser subscriptions from Supabase and sends a Web Push notification."""
    print("📡 Attempting to send Web Push alert...")
    
    if not VAPID_PRIVATE_KEY:
        print("⚠️ VAPID_PRIVATE_KEY is not set! Aborting push.")
        return

    try:
        response = supabase.table("push_subscriptions").select("subscription").execute()
        subscriptions = response.data
        
        if not subscriptions:
            print("⚠️ No subscriptions found in database!")
            return

        print(f"📲 Found {len(subscriptions)} subscriber(s). Sending payload...")
        payload = json.dumps({
            "title": f"🚀 New Hackathon: {title}",
            "body": f"Platform: {platform} | Prize: {prize}",
            "url": url
        })

        for row in subscriptions:
            sub_info = row.get("subscription")
            try:
                endpoint = sub_info.get("endpoint", "")
                print(f"🎯 Target Endpoint: {endpoint[:60]}...")
                
                webpush(
                    subscription_info=sub_info,
                    data=payload,
                    vapid_private_key=VAPID_PRIVATE_KEY,
                    vapid_claims={"sub": VAPID_CLAIM_EMAIL},
                    ttl=86400,
                    headers={"Urgency":"high"}
                )
                print("✅ Web Push successfully transmitted!")
            except WebPushException as ex:
                print(f"❌ WebPushException: {repr(ex)}")

    except Exception as e:
        print(f"❌ Push Exception: {e}")


def extract_competitions_with_llm(page_text, source_url):
    prompt = f"""
    You are an AI data extractor. Analyze the text from ({source_url}).
    Extract upcoming hackathons in India. Return ONLY a valid JSON array of objects with keys: "title", "prize_pool", "deadline", "url", "platform".
    If you find nothing, return []. Do not include any conversational text.
    Text snippet: {page_text[:4000]}
    """
    try:
        print("🧠 Sending scraped text to Groq LLM...")
        response = ai_client.chat.completions.create(
            model="openai/gpt-oss-120b",
            messages=[{"role": "user", "content": prompt}],
            temperature=0.1,
        )
        raw_content = response.choices[0].message.content.strip()
        
        print(f"🤖 AI Response preview: {raw_content[:200]}...")
        
        if raw_content.startswith("```json"):
            raw_content = raw_content[7:-3].strip()
        elif raw_content.startswith("```"):
            raw_content = raw_content[3:-3].strip()
            
        return json.loads(raw_content)
    except Exception as e:
        print(f"❌ LLM Parsing Error: {e}")
        return []


def save_competitions_to_db(competitions, source_url):
    for item in competitions:
        try:
            raw_url = item.get("url")
            title = item.get("title", "competition")
            prize = item.get("prize_pool") or "Prize TBA"
            deadline = item.get("deadline") or "TBA"
            platform = item.get("platform") or "Unstop"
            
            slug = re.sub(r"[^a-zA-Z0-9]+", "-", title.lower()).strip("-")
            target_url = raw_url if raw_url and raw_url.startswith("http") else f"{source_url}#{slug}"

            supabase.table("competitions").insert({
                "title": title,
                "prize_pool": prize,
                "deadline": deadline,
                "url": target_url,
                "platform": platform,
            }).execute()
            
            print(f"✅ Saved: {title}")
            send_web_push_alert(title, prize, platform, target_url)
            
        except Exception as e:
            print(f"⚠️ Error saving competition: {e}")


def run_agent_worker():
    print("🤖 Running Autonomous Agent Worker...")
    websites = fetch_watched_websites()
    if not websites:
        print("⚠️ No watched websites found in database.")
        return

 with sync_playwright() as p:
        browser = p.chromium.launch(
            headless=True,
            args=[
                "--disable-dev-shm-usage",
                "--no-sandbox",
                "--disable-setuid-sandbox",
                "--disable-gpu",
                "--single-process"
            ]
        )   

        for site in websites:
            url = site.get("url")
            print(f"\n🔍 Scanning: {url}")
            try:
                page.goto(url, wait_until="networkidle", timeout=60000)
                page.wait_for_timeout(6000)
                
                scraped_text = page.inner_text("body")
                print(f"📄 Successfully scraped {len(scraped_text)} characters of text.")
                
                extracted = extract_competitions_with_llm(scraped_text, url)
                if extracted:
                    save_competitions_to_db(extracted, url)
                else:
                    print("⚠️ No competitions were extracted from this page.")
            except Exception as e:
                print(f"❌ Failed scanning {url}: {e}")

        browser.close()

def scan_single_target(url):
    print(f"\n🎯 Direct Target Scan Initiated for: {url}")
    with sync_playwright() as p:
        browser = p.chromium.launch(
            headless=True,
            args=[
                "--disable-dev-shm-usage",
                "--no-sandbox",
                "--disable-setuid-sandbox",
                "--disable-gpu",
                "--single-process"
            ]
        )
        page = browser.new_page()
        try:
            page.goto(url, wait_until="networkidle", timeout=60000)
            page.wait_for_timeout(6000)
            scraped_text = page.inner_text("body")
            
            # Send to Groq LLM
            extracted = extract_competitions_with_llm(scraped_text, url)
            
            if extracted:
                save_competitions_to_db(extracted, url)
                return extracted
            else:
                return []
        except Exception as e:
            print(f"❌ Target Scan Failed: {e}")
            return [{"error": str(e)}]
        finally:
            browser.close()
if __name__ == "__main__":
    print("🚀 Starting the Autonomous Hackathon Agent...")
    run_agent_worker()
    print("🏁 Agent run complete!")