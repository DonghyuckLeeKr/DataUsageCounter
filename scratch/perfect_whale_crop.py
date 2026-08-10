from PIL import Image, ImageOps, ImageFilter

input_path = r"C:\Users\visua\.gemini\antigravity\brain\638c3f2f-bb7d-4d9b-aa9d-c1376bce2c04\.user_uploaded\media_1786067734239.png"
output_path = r"C:\Users\visua\.gemini\antigravity\brain\638c3f2f-bb7d-4d9b-aa9d-c1376bce2c04\centered_perfect_wifi_whale.png"

# Load cropped image
img = Image.open(input_path).convert("RGBA")
w, h = img.size

# Remove white/near-white background
datas = img.getdata()
newData = []
for item in datas:
  # Check if white/near-white background
  if item[0] > 225 and item[1] > 225 and item[2] > 225:
    newData.append((0, 0, 0, 0))
  else:
    newData.append(item)
img.putdata(newData)

# Get bounding box of non-transparent content
bbox = img.getbbox()
if bbox:
  img = img.crop(bbox)

# Create 512x512 transparent canvas
canvas_size = 512
canvas = Image.new("RGBA", (canvas_size, canvas_size), (0, 0, 0, 0))

# Resize cropped whale content to fit 440px with aspect ratio preserved
target_max = 440
w, h = img.size
scale = target_max / max(w, h)
new_w, new_h = int(w * scale), int(h * scale)

resized = img.resize((new_w, new_h), Image.Resampling.LANCZOS)

# Center inside 512x512 canvas
pos_x = (canvas_size - new_w) // 2
pos_y = (canvas_size - new_h) // 2
canvas.paste(resized, (pos_x, pos_y), resized)

# Save transparent PNG
canvas.save(output_path, "PNG")

# Update public and tauri icons
public_path = r"c:\Users\visua\Documents\Dev\DataUsageCounter\public\icon.png"
canvas.save(public_path, "PNG")

tauri_icons_dir = r"c:\Users\visua\Documents\Dev\DataUsageCounter\src-tauri\icons"
canvas.resize((32, 32), Image.Resampling.LANCZOS).save(f"{tauri_icons_dir}\\32x32.png")
canvas.resize((128, 128), Image.Resampling.LANCZOS).save(f"{tauri_icons_dir}\\128x128.png")
canvas.resize((256, 256), Image.Resampling.LANCZOS).save(f"{tauri_icons_dir}\\128x128@2x.png")
canvas.resize((256, 256), Image.Resampling.LANCZOS).save(f"{tauri_icons_dir}\\icon.png")

icon_sizes = [(16, 16), (32, 32), (48, 48), (64, 64), (128, 128), (256, 256)]
canvas.save(f"{tauri_icons_dir}\\icon.ico", format="ICO", sizes=icon_sizes)

print("Perfect Centered Transparent Wi-Fi Whale Icon Generated!")
