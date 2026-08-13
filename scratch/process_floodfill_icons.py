from PIL import Image, ImageDraw
from collections import deque
import os

brain_dir = r"C:\Users\visua\.gemini\antigravity\brain\638c3f2f-bb7d-4d9b-aa9d-c1376bce2c04"

files = [
    ("calm_dolphin_v1_1786447138341.jpg", "calm_dolphin_opt1_transparent.png", True),
    ("calm_dolphin_v2_1786447233522.jpg", "calm_dolphin_opt2_transparent.png", False),
]

def flood_fill_outer_background(img, tolerance=30):
    img = img.convert("RGBA")
    w, h = img.size
    pixels = img.load()
    
    # Visited grid
    visited = [[False for _ in range(h)] for _ in range(w)]
    queue = deque()
    
    # Add all 4 border edges to queue
    for x in range(w):
        queue.append((x, 0))
        queue.append((x, h - 1))
        visited[x][0] = True
        visited[x][h - 1] = True
        
    for y in range(h):
        queue.append((0, y))
        queue.append((w - 1, y))
        visited[0][y] = True
        visited[w - 1][y] = True

    while queue:
        cx, cy = queue.popleft()
        r, g, b, a = pixels[cx, cy]
        
        # If it's near-white / background color, make it transparent and expand
        if r > 220 and g > 220 and b > 220:
            pixels[cx, cy] = (255, 255, 255, 0)
            
            for nx, ny in [(cx+1, cy), (cx-1, cy), (cx, cy+1), (cx, cy-1)]:
                if 0 <= nx < w and 0 <= ny < h and not visited[nx][ny]:
                    visited[nx][ny] = True
                    nr, ng, nb, _ = pixels[nx, ny]
                    if nr > 220 and ng > 220 and nb > 220:
                        queue.append((nx, ny))
                        
    return img

for src_name, out_name, is_frame in files:
    src_path = os.path.join(brain_dir, src_name)
    out_path = os.path.join(brain_dir, out_name)
    
    raw_img = Image.open(src_path)
    
    # If opt1 has rounded outer square border, crop inward first or process
    if is_frame:
        # crop out the outer rounded card border
        w, h = raw_img.size
        raw_img = raw_img.crop((int(w * 0.08), int(h * 0.08), int(w * 0.92), int(h * 0.92)))
        
    transparent_img = flood_fill_outer_background(raw_img)
    
    # Crop to non-transparent bbox
    bbox = transparent_img.getbbox()
    if bbox:
        transparent_img = transparent_img.crop(bbox)
        
    # Center on 512x512 canvas filling 92%
    canvas = Image.new("RGBA", (512, 512), (0, 0, 0, 0))
    target_max = 485
    tw, th = transparent_img.size
    scale = target_max / max(tw, th)
    new_w, new_h = int(tw * scale), int(th * scale)
    resized = transparent_img.resize((new_w, new_h), Image.Resampling.LANCZOS)
    
    pos_x = (512 - new_w) // 2
    pos_y = (512 - new_h) // 2
    canvas.paste(resized, (pos_x, pos_y), resized)
    
    canvas.save(out_path, "PNG")
    print("Saved flood-fill preserved white belly icon:", out_path)

# Create real-size preview comparison
opt1 = Image.open(os.path.join(brain_dir, "calm_dolphin_opt1_transparent.png"))
opt2 = Image.open(os.path.join(brain_dir, "calm_dolphin_opt2_transparent.png"))

W, H = 700, 360
comp = Image.new("RGBA", (W, H), (24, 28, 38, 255))
from PIL import ImageDraw
draw = ImageDraw.Draw(comp)

draw.text((30, 20), "돌고래 배(흰색) 보존 & 차분한 스카이블루 - 실제 크기(20px~100px) 가독성", fill=(255, 255, 255, 255))

draw.text((30, 65), "[시안 1: 젠틀 네이비 돌고래]", fill=(56, 189, 248, 255))
comp.paste(opt1.resize((100, 100), Image.Resampling.LANCZOS), (30, 95), opt1.resize((100, 100), Image.Resampling.LANCZOS))
comp.paste(opt1.resize((48, 48), Image.Resampling.LANCZOS), (150, 120), opt1.resize((48, 48), Image.Resampling.LANCZOS))
comp.paste(opt1.resize((32, 32), Image.Resampling.LANCZOS), (220, 128), opt1.resize((32, 32), Image.Resampling.LANCZOS))
comp.paste(opt1.resize((20, 20), Image.Resampling.LANCZOS), (275, 134), opt1.resize((20, 20), Image.Resampling.LANCZOS))

draw.text((360, 65), "[시안 2: 미니멀 스카이 돌고래]", fill=(167, 139, 250, 255))
comp.paste(opt2.resize((100, 100), Image.Resampling.LANCZOS), (360, 95), opt2.resize((100, 100), Image.Resampling.LANCZOS))
comp.paste(opt2.resize((48, 48), Image.Resampling.LANCZOS), (480, 120), opt2.resize((48, 48), Image.Resampling.LANCZOS))
comp.paste(opt2.resize((32, 32), Image.Resampling.LANCZOS), (550, 128), opt2.resize((32, 32), Image.Resampling.LANCZOS))
comp.paste(opt2.resize((20, 20), Image.Resampling.LANCZOS), (605, 134), opt2.resize((20, 20), Image.Resampling.LANCZOS))

draw.text((30, 220), "100px (앱 내부)        48px (바탕화면)   32px (작업표시줄)  20px (트레이)", fill=(148, 163, 184, 255))

comp_path = os.path.join(brain_dir, "calm_icon_size_comparison.png")
comp.save(comp_path, "PNG")
print("Saved comparison:", comp_path)
