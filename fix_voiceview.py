
import os

file_path = 'src/components/views/VoiceView.tsx'

replacements = {
    '├ğ': 'ğ',
    '─ş': 'ğ', # Corrected based on 'Öğrenci' context likely, or need verification
    '─▒': 'ı',
    '├Â': 'ö',
    '┼ş': 'ş',
    '├╝': 'ü',
    '├ç': 'ç',
    '─Ş': 'Ş',
    '─░': 'İ',
    '├û': 'Ö',
    '┼Ş': 'Ş',
    '├£': 'Ü',
    'ÔÇó': '•'
}

# Special check for 'Rumuzlu ...'
# Rumuzlu ├û─şrenci -> Öğrenci. ├û=Ö. ─ş=ğ? 
# Let's check other contexts for ─ş.
# If ─ş maps to g, then it is ğ.
# usage: ba─şar─▒s─▒z (ba┼şar─▒s─▒z -> başarısız, ┼ş=ş).
# If text has ─ş, where else?
# We will do a safe pass.

with open(file_path, 'r', encoding='utf-8') as f:
    content = f.read()

# Fix common ones first
final_content = content
for bad, good in replacements.items():
    final_content = final_content.replace(bad, good)

# Regex Fix
# Old: /#[\w├ğ─ş─▒├Â┼ş├╝├ç─Ş─░├û┼Ş├£]+/g
# New: /#[\wğüşöçİĞÜŞÖÇ]+/g
final_content = final_content.replace(r'/#[\wğüşöçİĞÜŞÖÇ]+/g', r'/#[\wğüşöçİĞÜŞÖÇ]+/g') # Normal regex
# Actually, let's just replace the specific broken regex string if found
final_content = final_content.replace('wğüşöçİĞÜŞÖÇ', 'wğüşöçİĞÜŞÖÇ') # If already replaced by char map

# Let's just rewrite the regex explicitly to be safe
import re
final_content = re.sub(r'/#\[\\w.*?\]\+/g', r'/#[\wğüşöçİĞÜŞÖÇ]+/g', final_content)

with open(file_path, 'w', encoding='utf-8') as f:
    f.write(final_content)

print(f"Fixed encoding in {file_path}")

# Check for duplicates
lines = final_content.split('\n')
print("\n--- Map Loops ---")
for i, line in enumerate(lines):
    if 'voices.map' in line:
        print(f"Line {i+1}: {line.strip()[:50]}...")

print("\n--- VoiceStatsWidget ---")
for i, line in enumerate(lines):
    if 'VoiceStatsWidget' in line:
        print(f"Line {i+1}: {line.strip()[:50]}...")

print("\n--- Sidebar Duplication Check ---")
for i, line in enumerate(lines):
    if 'Haftanın Anketi' in line:
        print(f"Line {i+1}: {line.strip()[:50]}...")
