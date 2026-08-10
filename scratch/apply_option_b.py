from PIL import Image
import os

brain_dir = r"C:\Users\visua\.gemini\antigravity\brain\638c3f2f-bb7d-4d9b-aa9d-c1376bce2c04"
optB_path = os.path.join(brain_dir, "water_wifi_dolphin_optB_transparent.png")

icon_img = Image.open(optB_path).convert("RGBA")

# 1. Update public/icon.png
public_icon_path = r"c:\Users\visua\Documents\Dev\DataUsageCounter\public\icon.png"
icon_img.save(public_icon_path, "PNG")

# 2. Update all src-tauri/icons/
tauri_icons_dir = r"c:\Users\visua\Documents\Dev\DataUsageCounter\src-tauri\icons"
icon_img.resize((32, 32), Image.Resampling.LANCZOS).save(f"{tauri_icons_dir}\\32x32.png")
icon_img.resize((128, 128), Image.Resampling.LANCZOS).save(f"{tauri_icons_dir}\\128x128.png")
icon_img.resize((256, 256), Image.Resampling.LANCZOS).save(f"{tauri_icons_dir}\\128x128@2x.png")
icon_img.resize((256, 256), Image.Resampling.LANCZOS).save(f"{tauri_icons_dir}\\icon.png")

# Save multi-resolution Windows .ico
icon_sizes = [(16, 16), (32, 32), (48, 48), (64, 64), (128, 128), (256, 256)]
icon_img.save(f"{tauri_icons_dir}\\icon.ico", format="ICO", sizes=icon_sizes)

print("Option B successfully applied to all app and Tauri icons!")
