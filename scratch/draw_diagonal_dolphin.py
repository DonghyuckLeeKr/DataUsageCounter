import math
from PIL import Image, ImageDraw, ImageFilter

# 2048x2048 supersampled Retina HD rendering canvas
W, H = 2048, 2048
img = Image.new("RGBA", (W, H), (0, 0, 0, 0))
draw = ImageDraw.Draw(img)

# Color Palette
DARK_NAVY = (18, 36, 72, 255)
DOLPHIN_BLUE = (28, 75, 155, 255)
CYAN_GLOW = (0, 225, 255, 255)
CYAN_LINE = (0, 210, 245, 255)
WHITE = (255, 255, 255, 255)

# --- 1. Diagonal Wi-Fi Signal Arcs at Top-Right (Radiating up-right) ---
# Origin of diagonal Wi-Fi signal from Dolphin's blowhole
origin_x, origin_y = 650, 1350

radii = [1150, 900, 650, 400]
stroke_w = 68

for r in radii:
  # Arc bounding box centered at origin
  bbox = [origin_x - r, origin_y - r, origin_x + r, origin_y + r]
  # Diagonal arc: angle from 280deg to 360deg (upwards & rightwards)
  draw.arc(bbox, start=280, end=355, fill=CYAN_GLOW, width=stroke_w)

# --- 2. Water Spout Spray (Diagonal Burst towards top-right) ---
spout_drops = [
    (750, 1220, 60, 120),
    (840, 1140, 48, 96),
    (930, 1060, 36, 72),
    (700, 1180, 40, 80),
    (810, 1250, 40, 80)
]

for dx, dy, dw, dh in spout_drops:
  draw.ellipse([dx - dw//2, dy - dh//2, dx + dw//2, dy + dh//2], fill=CYAN_GLOW)

# --- 3. Cute Dolphin / Whale Head at Bottom-Left ---
head_bbox = [140, 1150, 1150, 2050]

# Outer Dark Navy Outline
draw.ellipse(head_bbox, fill=DARK_NAVY)

# Inner Main Dolphin Body Dome
draw.ellipse([170, 1180, 1120, 2020], fill=DOLPHIN_BLUE)

# Cute Big Shiny Eye (looking up-right towards top-right)
eye_x, eye_y = 620, 1460
draw.ellipse([eye_x - 65, eye_y - 75, eye_x + 65, eye_y + 75], fill=DARK_NAVY)
draw.ellipse([eye_x - 50, eye_y - 60, eye_x + 50, eye_y + 60], fill=WHITE)
draw.ellipse([eye_x - 30, eye_y - 45, eye_x + 35, eye_y + 45], fill=(12, 24, 50, 255))
draw.ellipse([eye_x - 8, eye_y - 35, eye_x + 22, eye_y - 5], fill=WHITE)
draw.ellipse([eye_x - 22, eye_y + 10, eye_x - 4, eye_y + 28], fill=WHITE)

# Cute Smiling Mouth Curve
draw.arc([520, 1500, 950, 1780], start=10, end=130, fill=DARK_NAVY, width=24)

# Downsample to 1024x1024 with antialiasing
final_hd = img.resize((1024, 1024), Image.Resampling.LANCZOS)

output_path = r"C:\Users\visua\.gemini\antigravity\brain\638c3f2f-bb7d-4d9b-aa9d-c1376bce2c04\diagonal_dolphin_wifi.png"
final_hd.save(output_path, "PNG")

# Update public and tauri icons
public_path = r"c:\Users\visua\Documents\Dev\DataUsageCounter\public\icon.png"
final_hd.save(public_path, "PNG")

tauri_icons_dir = r"c:\Users\visua\Documents\Dev\DataUsageCounter\src-tauri\icons"
final_hd.resize((32, 32), Image.Resampling.LANCZOS).save(f"{tauri_icons_dir}\\32x32.png")
final_hd.resize((128, 128), Image.Resampling.LANCZOS).save(f"{tauri_icons_dir}\\128x128.png")
final_hd.resize((256, 256), Image.Resampling.LANCZOS).save(f"{tauri_icons_dir}\\128x128@2x.png")
final_hd.resize((256, 256), Image.Resampling.LANCZOS).save(f"{tauri_icons_dir}\\icon.png")

icon_sizes = [(16, 16), (32, 32), (48, 48), (64, 64), (128, 128), (256, 256)]
final_hd.save(f"{tauri_icons_dir}\\icon.ico", format="ICO", sizes=icon_sizes)

print("Diagonal Wi-Fi Dolphin Head Icon Generated Successfully!")
