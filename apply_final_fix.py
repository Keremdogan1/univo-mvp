
import os

path = 'src/components/views/VoiceView.tsx'

with open(path, 'rb') as f:
    raw = f.read()

# Decode leniently
try:
    content = raw.decode('utf-8')
except:
    content = raw.decode('latin-1') # Fallback if messed up

# 1. Fix Encoding
# Mappings: '├ğ' -> 'ğ', '─ş' -> 'ş', etc.
replacements = {
    '├ğ': 'ğ', 
    '─ş': 'ş', 
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

for bad, good in replacements.items():
    content = content.replace(bad, good)

# Fix double-encoded cases if any? e.g. Ã¼ -> ü. But user saw minecraft chars (Extended ASCII/UTF-8 mismatch).
# The current replacements match what I saw in view_file.

# 2. Duplicate Removal
lines = content.split('\n')
new_lines = []
skip = False
start_marker = 'div className="hidden lg:flex lg:flex-col lg:gap-8 lg:pr-2"'
# Note: I removed the leading < just to be safe on indentation match, checking substring
end_marker = 'div className="p-6 max-h-[50vh]'

deleted_count = 0
for line in lines:
    if start_marker in line:
        skip = True
        print(f"Started skipping at: {line.strip()[:40]}")
    
    if skip and end_marker in line:
        skip = False
        print(f"Ended skipping at: {line.strip()[:40]}")
    
    if not skip:
        new_lines.append(line)
    else:
        deleted_count += 1

print(f"Deleted {deleted_count} lines of duplicates.")

final_content = '\n'.join(new_lines)

# 3. Regex Fix (Normalize)
# Just ensure the regex for hashtags is correct Turkish
import re
# The regex likely looks like /#[\wğüşöçİĞÜŞÖÇ]+/g after replacement
# Let's verify and maybe clean it up if it has duplicate chars
# But replacing it blindly is safer.
# Pattern: hash followed by word+turkish chars
# Original line likely: const parts = content.split(/(#[\w...]+)/g);
# We will use string replace for the whole potential regex line to be safe
# Search for .split(/(#[
# This is hard to match exactly if whitespace differs
# But I can rely on the fact that I replaced the Bad Chars, so the regex is likely currently:
# /#[\wğşıöşüçŞİÖŞÜ]+/g  (based on map)
# which is ugly but valid.
# I'll leave it unless I see it broken.

with open(path, 'w', encoding='utf-8') as f:
    f.write(final_content)
