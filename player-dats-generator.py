import json, random
from datetime import datetime, timedelta

# ---------------- CONFIG ----------------

RAIDS = [
    "The Desert Perpetual (Epic)", "The Desert Perpetual", "Salvation's Edge", "Crota's End",
    "Root of Nightmares", "King's Fall", "Vow of the Disciple", "Vault of Glass",
    "Deep Stone Crypt", "Garden of Salvation", "Last Wish", "Crown of Sorrow",
    "Scourge of the Past", "Spire of Stars", "Eater of Worlds", "Leviathan"
]

DUNGEONS = [
    "Equilibrium", "Sundered Doctrine", "Vesper's Host", "Warlord's Ruin", "Ghosts of the Deep",
    "Spire of the Watcher", "Duality", "Grasp of Avarice", "Prophecy", "Pit of Heresy",
    "Shattered Throne", "Presage", "Harbinger", "Zero Hour", "The Whisper"
]

# ---------------- HELPERS ----------------

def rand_time(min_m, max_m):
    m = random.randint(min_m, max_m)
    s = random.randint(0, 59)
    return f"{m}:{s:02d}"

def rand_datetime():
    return (datetime.now() - timedelta(days=random.randint(0, 120))).strftime("%Y-%m-%d")

# ---------------- GENERATORS ----------------

def generate_activity(name):
    clears = random.randint(10, 200)
    fastest = rand_time(20, 120)
    avg = rand_time(30, 150)

    return {
        "activityName": name,
        "fullClearsCount": clears,
        "fastestTime": fastest,
        "averageTime": avg,
        "sherpasCount": random.randint(0, 50),
        "kills": random.randint(2000, 20000),
        "deaths": random.randint(100, 800),
        "assists": random.randint(1000, 15000),
        "totalTime": f"{random.randint(10,300)}:{random.randint(0,59):02d}:00",
        "fullClearsRank": random.randint(1, 500),
        "speedRank": random.randint(1, 200),
        "modeBreakdown": {
            "All Modes": { "clears": clears, "fastest": fastest }
        },
        "recentStats": {
            "pastDayClears": random.randint(0, 5),
            "pastWeekClears": random.randint(0, 20),
            "fastestToday": rand_time(20, 120),
            "fastestThisWeek": fastest
        },
        "totalClearsCount": clears + random.randint(0, 5)
    }

def generate_clears():
    entries = []
    count = random.randint(5, 30)

    for i in range(count):
        completed = random.choice([True, True, True, False])
        entries.append({
            "clearId": str(i+1),
            "completed": completed,
            "date": rand_datetime(),
            "time": rand_time(20, 150) if completed else None
        })

    return entries

# ---------------- BUILD FILES ----------------

raids_activities = [generate_activity(r) for r in RAIDS]
dungeons_activities = [generate_activity(d) for d in DUNGEONS]

# Calculate total full clears for raids and dungeons
raids_full_clears = sum(activity["fullClearsCount"] for activity in raids_activities)
dungeons_full_clears = sum(activity["fullClearsCount"] for activity in dungeons_activities)

player_data = {
    "playerId": "123456789",
    "name": "PlayerName",
    "clan": "Clan Name",
    "emblemUrl": "https://www.bungie.net/common/destiny2_content/icons/3f8a0920aad0c2fbad18938497635f23.jpg",
    "clearsRank": random.randint(1, 500),
    "speedRank": random.randint(1, 100),
    "raidsClearsRank": random.randint(1, 500),
    "raidsSpeedRank": random.randint(1, 200),
    "raidsSpeedTime": f"{random.randint(1, 3)}h {random.randint(0, 59)}m",
    "raidsFullClearsCount": raids_full_clears,
    "dungeonsClearsRank": random.randint(1, 500),
    "dungeonsSpeedRank": random.randint(1, 200),
    "dungeonsSpeedTime": f"{random.randint(0, 1)}h {random.randint(0, 59)}m",
    "dungeonsFullClearsCount": dungeons_full_clears,
    "activities": {
        "raids": raids_activities,
        "dungeons": dungeons_activities
    }
}

clears_data = {
    "playerId": "123456789",
    "activities": {
        "raids": { r: generate_clears() for r in RAIDS },
        "dungeons": { d: generate_clears() for d in DUNGEONS }
    }
}

# ---------------- WRITE FILES ----------------

with open("player-data.json", "w") as f:
    json.dump(player_data, f, indent=2)

with open("player-clears-data.json", "w") as f:
    json.dump(clears_data, f, indent=2)

print("✔ Test data generated!")
