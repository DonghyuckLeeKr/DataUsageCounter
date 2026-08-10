from PIL import Image, ImageOps

input_path = r"C:\Users\visua\.gemini\antigravity\brain\638c3f2f-bb7d-4d9b-aa9d-c1376bce2c04\.user_uploaded\media_1786067734239.png"
output_path = r"C:\Users\visua\.gemini\antigravity\brain\638c3f2f-bb7d-4d9b-aa9d-c1376bce2c04\transparent_cropped_whale.png"

# Load image
img = Image.open(input_path).convert("RGBA")

# Flood-fill or threshold remove white background pixels
datas = img.getdata()
newData = []

for item in datas:
  # Change pure white or near-white background to transparent
  if item[0] > 230 and item[1] > 230 and item[2] > 230:
    newData.append((255, 255, 255, 0))
  else:
    newData.append(item)

img.putdata(newData)

# Create a square 512x512 transparent canvas and center the cropped whale icon in it
canvas_size = 512
canvas = Image.new("RGBA", (canvas_size, canvas_size), (0, 0, 0, 0))

# Resize whale image to fit within canvas with margin
max_size = 460
w, h = img.size
scale = max_size / max(w, h)
new_w, new_h = int(w * scale), int(h * scale)
resized_img = img.resize((new_w, new_h), Image.Resampling.LANCZOS)

# Center on canvas
offset_x = (canvas_size - new_w) // 2
offset_y = (canvas_size - new_h) // 2
canvas.paste(resized_img, (offset_x, offset_y), resized_img)

# Save processed high-res transparent PNG
canvas.save(output_path, "PNG")
print("Successfully generated transparent icon at:", output_path)

# Also save to public directory and tauri icons
public_path = r"c:\Users\visua\Documents\Dev\DataUsageCounter\public\icon.png"
canvas.save(public_path, "PNG")

# Generate Tauri icon sizes
tauri_icons_dir = r"c:\Users\visua\Documents\Dev\DataUsageCounter\src-tauri\icons"
canvas.resize((32, 32), Image.Resampling.LANCZOS).save(f"{tauri_icons_dir}\\32x32.png")
canvas.resize((128, 128), Image.Resampling.LANCZOS).save(f"{tauri_icons_dir}\\128x128.png")
canvas.resize((256, 256), Image.Resampling.LANCZOS).save(f"{tauri_icons_dir}\\128x128@2x.png")
canvas.resize((256, 256), Image.Resampling.LANCZOS).save(f"{tauri_icons_dir}\\icon.png")

# Save .ico format for Windows
icon_sizes = [(16, 16), (32, 32), (48, 48), (64, 64), (128, 128), (256, 256)]
canvas.save(f"{tauri_icons_dir}\\icon.ico", format="ICO", sizes=icon_sizes)

print("All Tauri icons successfully updated!")
