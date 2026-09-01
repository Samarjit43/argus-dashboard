import json
from playwright.sync_api import sync_playwright

# ==========================================
# 1. HELPER / DATABASE FUNCTIONS
# ==========================================
# (Note: I have put safe placeholders here. If you had custom 
# database logic for Supabase/PostgreSQL in the first 100 lines, 
# you can safely paste just those functions back in here later!)

def fetch_watched_websites():
    # Placeholder: Returns a default target if DB is missing
    return [{"url": "https://unstop.com/"}]

def save_competitions_to_db(competitions, source_url):
    try:
        print(f"💾 Saving {len(competitions)} items to DB from {source_url}")
    except Exception as e:
        print(f"⚠️ Error saving competition: {e}")


# ==========================================
# 2. CORE SCRAPING AGENTS (Perfectly Indented)
# ==========================================

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
        page = browser.new_page()

        for site in websites:
            url = site.get("url")
            print(f"\n🔗 Scanning: {url}")
            try:
                page.goto(url, wait_until="networkidle", timeout=60000)
                page.wait_for_timeout(6000)
                
                scraped_text = page.inner_text("body")
                print(f"📄 Successfully scraped {len(scraped_text)} characters of text.")
                
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
            
            # Format the output so the FastAPI backend can read it
            intel_data = [
                {
                    "title": "Target Scraped Successfully", 
                    "prize_pool": f"{len(scraped_text)} characters of raw intel found"
                }
            ]
            return intel_data
            
        except Exception as e:
            print(f"❌ Failed scanning {url}: {e}")
            return [{"error": str(e)}]
            
        finally:
            browser.close()