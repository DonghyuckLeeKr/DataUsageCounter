import math
from PIL import Image, ImageDraw, ImageFilter, ImageFont

# Render size (4K Supersampled canvas)
W, H = 2048, 2048
img = Image.new("RGBA", (W, H), (0, 0, 0, 0))
draw = ImageDraw.Draw(img)

# Vibrant Cute Colors
DARK_NAVY = (18, 38, 76, 255)
WHALE_BLUE = (30, 70, 140, 255)
CYAN_GLOW = (0, 225, 255, 255)
CYAN_DARK = (0, 180, 220, 255)
WHITE = (255, 255, 255, 255)

# --- 1. Draw Glowing Wi-Fi Arcs (Concentric curved arcs at top) ---
arc_center_x, arc_center_y = 1024, 1150

# Outer Arc
draw.arc([1024-750, 1150-750-320, 1024+750, 1150+750-320], start=210, end=330, fill=CYAN_GLOW, width=80)
# Middle Arc
draw.arc([1024-550, 1150-550-250, 1024+550, 1150+550-250], start=210, end=330, fill=CYAN_GLOW, width=70)
# Inner Arc
draw.arc([1024-350, 1150-350-180, 1024+350, 1150+350-180], start=210, end=330, fill=CYAN_GLOW, width=60)

# --- 2. Draw Cute Water Spout Fountain Drops ---
spout_drops = [
    (1024, 960, 65, 140),   # Center stream
    (930, 1000, 50, 110),   # Left drop
    (1118, 1000, 50, 110),  # Right drop
    (860, 1050, 36, 80),    # Outer left
    (1188, 1050, 36, 80),   # Outer right
]

for x, y, rw, rh in spout_drops:
  draw.ellipse([x - rw, y - rh, x + rw, y + rh], fill=CYAN_GLOW)

# --- 3. Draw Cartoon Blue Whale Head with Bold Dark Outline ---
# Outer Bold Outline
draw.ellipse([260, 1060, 1788, 2240], fill=DARK_NAVY)

# Inner Main Whale Body Dome
draw.ellipse([290, 1090, 1758, 2210], fill=WHALE_BLUE)

# Blowhole Notch
draw.ellipse([970, 1050, 1078, 1120], fill=DARK_NAVY)

# Cute Big Shiny Eye
eye_x, eye_y = 860, 1420
# Outer Eye Socket
draw.ellipse([eye_x - 70, eye_y - 85, eye_x + 70, eye_y + 85], fill=DARK_NAVY)
draw.ellipse([eye_x - 55, eye_y - 70, eye_x + 55, eye_y + 70], fill=WHITE)
# Pupil
draw.ellipse([eye_x - 35, eye_y - 50, eye_x + 35, eye_y + 50], fill=(12, 24, 50, 255))
# Highlights
draw.ellipse([eye_x - 10, eye_y - 40, eye_x + 22, eye_y - 8], fill=WHITE)
draw.ellipse([eye_x - 25, eye_y + 10, eye_x - 5, eye_y + 30], fill=WHITE)

# Smiling Mouth Curve
draw.arc([750, 1450, 1350, 1750], start=20, end=140, fill=DARK_NAVY, width=28)

# Downsample to 1024x1024 with antialiasing
res = img.resize((1024, 1024), Image.Resampling.LANCZOS)
output_path = r"C:\Users\visua\.gemini\antigravity\brain\638c3f2f-bb7d-4d9b-aa9d-c1376bce2c04\ai_style_cartoon_whale.png"
res.save(output_path, "PNG")

print("Generated AI Style Cartoon Wi-Fi Whale Icon!")
