from PIL import Image, ImageOps, ImageFilter
import os

brain_dir = r"C:\Users\visua\.gemini\antigravity\brain\638c3f2f-bb7d-4d9b-aa9d-c1376bce2c04"

files = [
    ("bold_mini_dolphin_v1_1786446795800.jpg", "bold_dolphin_opt1_transparent.png", True),
    ("bold_mini_dolphin_v2_1786446812949.jpg", "bold_dolphin_opt2_transparent.png", False),
]

for src_name, out_name, is_circular in files:
    src_path = os.path.join(brain_dir, src_name)
    out_path = os.path.join(brain_dir, out_name)
    
    img = Image.open(src_path).convert("RGBA")
    
    # Remove white/near-white background
    datas = img.getdata()
    newData = []
    for item in datas:
        if item[0] > 235 and item[1] > 235 and item[2] > 235:
            newData.append((255, 255, 255, 0))
        else:
            newData.append(item)
    img.putdata(newData)
    
    # Crop tightly to non-transparent content
    bbox = img.getbbox()
    if bbox:
        img = img.crop(bbox)
        
    # Center on a 512x512 canvas, filling ~92% of the canvas so it's BIG and BOLD at small sizes
    canvas = Image.new("RGBA", (512, 512), (0, 0, 0, 0))
    target_max = 485
    w, h = img.size
    scale = target_max / max(w, h)
    new_w, new_h = int(w * scale), int(h * scale)
    resized = img.resize((new_w, new_h), Image.Resampling.LANCZOS)
    
    pos_x = (512 - new_w) // 2
    pos_y = (512 - new_h) // 2
    canvas.paste(resized, (pos_x, pos_y), resized)
    
    canvas.save(out_path, "PNG")
    print("Saved bold transparent icon:", out_path)

print("Bold icon processing complete!")
