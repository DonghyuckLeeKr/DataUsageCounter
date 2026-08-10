from PIL import Image, ImageOps, ImageFilter
import os

brain_dir = r"C:\Users\visua\.gemini\antigravity\brain\638c3f2f-bb7d-4d9b-aa9d-c1376bce2c04"

files = [
    ("pro_wifi_dolphin_icon_1786321530286.jpg", "pro_wifi_dolphin_option1_transparent.png"),
    ("pro_wifi_dolphin_v2_1786321543271.jpg", "pro_wifi_dolphin_option2_transparent.png"),
]

for src_name, out_name in files:
    src_path = os.path.join(brain_dir, src_name)
    out_path = os.path.join(brain_dir, out_name)
    
    img = Image.open(src_path).convert("RGBA")
    
    # Remove pure/near-white background
    datas = img.getdata()
    newData = []
    for item in datas:
        if item[0] > 235 and item[1] > 235 and item[2] > 235:
            newData.append((255, 255, 255, 0))
        else:
            newData.append(item)
    img.putdata(newData)
    
    # Crop to bounding box
    bbox = img.getbbox()
    if bbox:
        img = img.crop(bbox)
        
    # Center on a 512x512 transparent canvas with clean padding
    canvas = Image.new("RGBA", (512, 512), (0, 0, 0, 0))
    target_max = 460
    w, h = img.size
    scale = target_max / max(w, h)
    new_w, new_h = int(w * scale), int(h * scale)
    resized = img.resize((new_w, new_h), Image.Resampling.LANCZOS)
    
    pos_x = (512 - new_w) // 2
    pos_y = (512 - new_h) // 2
    canvas.paste(resized, (pos_x, pos_y), resized)
    
    canvas.save(out_path, "PNG")
    print("Saved transparent icon:", out_path)

# Automatically set Option 1 as default project icons
default_icon = Image.open(os.path.join(brain_dir, "pro_wifi_dolphin_option1_transparent.png"))
public_path = r"c:\Users\visua\Documents\Dev\DataUsageCounter\public\icon.png"
default_icon.save(public_path, "PNG")

tauri_icons_dir = r"c:\Users\visua\Documents\Dev\DataUsageCounter\src-tauri\icons"
default_icon.resize((32, 32), Image.Resampling.LANCZOS).save(f"{tauri_icons_dir}\\32x32.png")
default_icon.resize((128, 128), Image.Resampling.LANCZOS).save(f"{tauri_icons_dir}\\128x128.png")
default_icon.resize((256, 256), Image.Resampling.LANCZOS).save(f"{tauri_icons_dir}\\128x128@2x.png")
default_icon.resize((256, 256), Image.Resampling.LANCZOS).save(f"{tauri_icons_dir}\\icon.png")

icon_sizes = [(16, 16), (32, 32), (48, 48), (64, 64), (128, 128), (256, 256)]
default_icon.save(f"{tauri_icons_dir}\\icon.ico", format="ICO", sizes=icon_sizes)

print("Project icons updated with Option 1!")
