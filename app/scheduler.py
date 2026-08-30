import time
import schedule
from agent import run_agent_worker

def patrol_the_web():
    print("Argus is initiating a scheduled scan...")
    run_agent_worker()

# Set Argus to run every 4 hours (adjust as you see fit!)
schedule.every(4).hours.do(patrol_the_web)

print(" Argus background scheduler activated. Standing by.")

# The infinite loop that keeps the script alive
while True:
    schedule.run_pending()
    time.sleep(60) # Sleep for 60 seconds before checking the clock again