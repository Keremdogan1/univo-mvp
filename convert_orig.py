
import codecs
import os

files = ["original_VoiceView.tsx", "original_VoiceStatsWidget.tsx"]
for f in files:
    try:
        if not os.path.exists(f):
            print(f"{f} not found.")
            continue
        with codecs.open(f, "r", "utf-16") as source:
            content = source.read()
        target_name = f.replace(".tsx", "_utf8.tsx")
        with codecs.open(target_name, "w", "utf-8") as target:
            target.write(content)
        print(f"Converted {f} to {target_name}")
    except Exception as e:
        print(f"Error converting {f}: {e}")
