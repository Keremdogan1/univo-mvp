
import re

file_path = 'src/components/views/VoiceView.tsx'

with open(file_path, 'r', encoding='utf-8') as f:
    lines = f.readlines()

print("--- voices.map ---")
for i, line in enumerate(lines):
    if 'voices.map' in line:
        print(f"{i+1}: {line.strip()[:60]}...")

print("\n--- showVotersModal ---")
for i, line in enumerate(lines):
    if 'showVotersModal' in line:
        print(f"{i+1}: {line.strip()[:60]}...")

print("\n--- VoiceStatsWidget ---")
for i, line in enumerate(lines):
    if 'VoiceStatsWidget' in line:
        print(f"{i+1}: {line.strip()[:60]}...")

print("\n--- Duplicate Sidebar Start (Haftan...Anketi) ---")
for i, line in enumerate(lines):
    if 'Haftan' in line or 'Anketi' in line:
        print(f"{i+1}: {line.strip()[:60]}...")
