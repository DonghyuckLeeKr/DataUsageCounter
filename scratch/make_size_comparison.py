from PIL import Image, ImageDraw, ImageFont
import os

brain_dir = r"C:\Users\visua\.gemini\antigravity\brain\638c3f2f-bb7d-4d9b-aa9d-c1376bce2c04"

opt1 = Image.open(os.path.join(brain_dir, "bold_dolphin_opt1_transparent.png"))
opt2 = Image.open(os.path.join(brain_dir, "bold_dolphin_opt2_transparent.png"))

# Create comparison grid image (600x400) on soft dark background
W, H = 700, 360
canvas = Image.new("RGBA", (W, H), (24, 28, 38, 255))
draw = ImageDraw.Draw(canvas)

draw.text((30, 20), "심플 볼드 아이콘 - 작업표시줄/트레이 실제 크기(24px~64px) 가독성 비교", fill=(255, 255, 255, 255))

# Row 1: Option 1
draw.text((30, 65), "[시안 1: 볼드 서클 돌고래]", fill=(56, 189, 248, 255))
canvas.paste(opt1.resize((100, 100), Image.Resampling.LANCZOS), (30, 95), opt1.resize((100, 100), Image.Resampling.LANCZOS))
canvas.paste(opt1.resize((48, 48), Image.Resampling.LANCZOS), (150, 120), opt1.resize((48, 48), Image.Resampling.LANCZOS))
canvas.paste(opt1.resize((32, 32), Image.Resampling.LANCZOS), (220, 128), opt1.resize((32, 32), Image.Resampling.LANCZOS))
canvas.paste(opt1.resize((20, 20), Image.Resampling.LANCZOS), (275, 134), opt1.resize((20, 20), Image.Resampling.LANCZOS))

# Row 2: Option 2
draw.text((360, 65), "[시안 2: 볼드 웨이브 고래]", fill=(167, 139, 250, 255))
canvas.paste(opt2.resize((100, 100), Image.Resampling.LANCZOS), (360, 95), opt2.resize((100, 100), Image.Resampling.LANCZOS))
canvas.paste(opt2.resize((48, 48), Image.Resampling.LANCZOS), (480, 120), opt2.resize((48, 48), Image.Resampling.LANCZOS))
canvas.paste(opt2.resize((32, 32), Image.Resampling.LANCZOS), (550, 128), opt2.resize((32, 32), Image.Resampling.LANCZOS))
canvas.paste(opt2.resize((20, 20), Image.Resampling.LANCZOS), (605, 134), opt2.resize((20, 20), Image.Resampling.LANCZOS))

draw.text((30, 220), "100px (앱 내부)        48px (바탕화면)   32px (작업표시줄)  20px (트레이)", fill=(148, 163, 184, 255))

comparison_path = os.path.join(brain_dir, "bold_icon_size_comparison.png")
canvas.save(comparison_path, "PNG")
print("Saved size comparison image:", comparison_path)
