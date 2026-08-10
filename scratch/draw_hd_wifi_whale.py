from PIL import Image, ImageDraw, ImageFilter, ImageOps

# Supersampled 2048x2048 rendering for ultra-crisp Retina vector quality
render_size = 2048
img = Image.new("RGBA", (render_size, render_size), (0, 0, 0, 0))
draw = ImageDraw.Draw(img)

# Color Palette
NAVY_BODY = (22, 36, 68, 255)       # Deep Rich Navy Blue
CYAN_GLOW = (0, 229, 255, 255)      # Vibrant Electric Cyan
CYAN_OUTLINE = (0, 210, 245, 255)
WHITE = (255, 255, 255, 255)

# --- 1. Draw Glowing Wi-Fi Arcs at Top ---
cx, cy = 1024, 1180

arc_radii = [820, 620, 420]
arc_width = 76

for r in arc_radii:
  bbox = [cx - r, cy - r - 260, cx + r, cy + r - 260]
  draw.arc(bbox, start=205, end=335, fill=CYAN_GLOW, width=arc_width)

# --- 2. Draw Water Spout Spray ---
spout_drops = [
    (1024, 980, 70, 140),   # Center main stream
    (930, 1020, 56, 110),   # Left drop
    (1118, 1020, 56, 110),  # Right drop
    (860, 1070, 40, 80),    # Outer left splash
    (1188, 1070, 40, 80),   # Outer right splash
]

for dx, dy, dw, dh in spout_drops:
  draw.ellipse([dx - dw//2, dy - dh//2, dx + dw//2, dy + dh//2], fill=CYAN_GLOW)

# --- 3. Draw Whale Head at Bottom ---
whale_bbox = [280, 1060, 1768, 2200]
draw.ellipse(whale_bbox, fill=NAVY_BODY, outline=CYAN_OUTLINE, width=36)

# Blowhole notch at top of head
draw.ellipse([980, 1050, 1068, 1110], fill=NAVY_BODY)

# Cute Whale Eye
eye_cx, eye_cy = 880, 1340
draw.ellipse([eye_cx - 48, eye_cy - 56, eye_cx + 48, eye_cy + 56], fill=NAVY_BODY)
draw.ellipse([eye_cx - 32, eye_cy - 40, eye_cx + 32, eye_cy + 40], fill=WHITE)
draw.ellipse([eye_cx - 16, eye_cy - 24, eye_cx + 16, eye_cy + 24], fill=(15, 23, 42, 255))
draw.ellipse([eye_cx - 4, eye_cy - 16, eye_cx + 12, eye_cy], fill=WHITE)

# Cute Eyebrow
draw.arc([eye_cx - 60, eye_cy - 100, eye_cx + 60, eye_cy - 40], start=200, end=340, fill=CYAN_GLOW, width=16)

# Downsample 2048x2048 to 1024x1024 with LANCZOS antialiasing
final_hd = img.resize((1024, 1024), Image.Resampling.LANCZOS)

hd_output = r"C:\Users\visua\.gemini\antigravity\brain\638c3f2f-bb7d-4d9b-aa9d-c1376bce2c04\hd_wifi_whale_transparent.png"
final_hd.save(hd_output, "PNG")

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

print("Super-sampled Retina HD Transparent Wi-Fi Whale Icon Generated!")
