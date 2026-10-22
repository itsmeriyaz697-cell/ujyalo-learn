from PIL import Image, ImageDraw, ImageFont
import math

W, H = 1200, 630
img = Image.new("RGB", (W, H), "#0E1C3D")
d = ImageDraw.Draw(img)

# radial glow
glow = Image.new("RGB", (W, H), "#0E1C3D")
gd = ImageDraw.Draw(glow)
for r in range(900, 0, -12):
    a = max(0.0, 1 - r / 900) ** 2 * 0.55
    col = tuple(int(b + (s - b) * a) for b, s in zip((14, 28, 61), (49, 87, 201)))
    gd.ellipse([1300 - r, -300 - r, 1300 + r, -300 + r], fill=col)
img = Image.blend(img, glow, 0.9)
d = ImageDraw.Draw(img)

# subtle rays
for i, y in enumerate((498, 558, 618)):
    d.line([(0, y), (W, y - 138)], fill=(24, 42, 88), width=1)

F = "/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf"
FR = "/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf"
f_logo = ImageFont.truetype(F, 40)
f_sub = ImageFont.truetype(FR, 22)
f_h1 = ImageFont.truetype(F, 64)
f_body = ImageFont.truetype(FR, 26)
f_small = ImageFont.truetype(FR, 23)
f_tiny = ImageFont.truetype(FR, 19)

# logo tile with mark drawn
tile = Image.new("RGBA", (104, 104), (0, 0, 0, 0))
td = ImageDraw.Draw(tile)
td.rounded_rectangle([0, 0, 103, 103], radius=24, fill=(22, 41, 92, 255), outline=(59, 97, 240, 140), width=1)
cx, cy = 52, 45
for ang in (-90, -50, -130, -12, -168):
    a = math.radians(ang)
    td.line([(cx + 22 * math.cos(a), cy + 22 * math.sin(a)), (cx + 30 * math.cos(a), cy + 30 * math.sin(a))],
            fill=(247, 183, 51, 255), width=4)
td.ellipse([cx - 13, cy - 13, cx + 13, cy + 13], fill=(247, 183, 51, 255))
td.polygon([(18, 68), (52, 80), (52, 95), (18, 84)], fill=(255, 255, 255, 255))
td.polygon([(86, 68), (52, 80), (52, 95), (86, 84)], fill=(216, 227, 255, 255))
td.line([(52, 80), (52, 95)], fill=(41, 71, 214, 255), width=2)
img.paste(tile, (80, 70), tile)

d.text((210, 84), "Ujyalo Learn", font=f_logo, fill="#FFFFFF")
d.text((212, 136), "Learn smarter. Shine brighter.", font=f_sub, fill="#92B0FF")

# ── Hero art on the right, in the same rounded card as the home page ─────────
hero = Image.open("public/hero-student.png").convert("RGB")
card_w, card_h = 330, 442
scale = max(card_w / hero.width, card_h / hero.height)
hero = hero.resize((round(hero.width * scale), round(hero.height * scale)), Image.LANCZOS)
hero = hero.crop(((hero.width - card_w) // 2, 0, (hero.width - card_w) // 2 + card_w, card_h)).convert("RGBA")

mask = Image.new("L", (card_w, card_h), 0)
ImageDraw.Draw(mask).rounded_rectangle([0, 0, card_w - 1, card_h - 1], radius=26, fill=255)
card_x, card_y = W - card_w - 54, 96
img.paste(hero, (card_x, card_y), mask)

overlay = Image.new("RGBA", (card_w, card_h), (0, 0, 0, 0))
od = ImageDraw.Draw(overlay)
od.rounded_rectangle([0, 0, card_w - 1, card_h - 1], radius=26, outline=(255, 255, 255, 46), width=2)
img.paste(overlay, (card_x, card_y), overlay)

d = ImageDraw.Draw(img)
pill = "AI-powered learning"
pw = d.textlength(pill, font=f_tiny)
px, py = card_x + card_w - pw - 46, card_y + 22
d.rounded_rectangle([px, py, px + pw + 28, py + 34], radius=17, fill="#F7B733")
d.text((px + 14, py + 9), pill, font=f_tiny, fill="#3B2A00")

# ── Headline ────────────────────────────────────────────────────────────────
d.text((80, 236), "Smart learning.", font=f_h1, fill="#FFFFFF")
d.text((80, 316), "Brighter future.", font=f_h1, fill="#F7B733")
d.rounded_rectangle([80, 396, 396, 403], radius=3, fill="#F7B733")

d.text((80, 428), "An AI tutor, practice quizzes and a study plan —", font=f_body, fill="#B8C4E0")
d.text((80, 464), "free for Grades 1–12 and SEE in Nepal.", font=f_body, fill="#B8C4E0")

items = ["AI tutoring", "Quizzes", "Notes & flashcards", "Study planner"]
x = 80
y = 532
for i, it in enumerate(items):
    d.text((x, y), it, font=f_small, fill="#A9BCEA")
    w = d.textlength(it, font=f_small)
    x += w + 22
    if i < len(items) - 1:
        d.ellipse([x - 13, y + 11, x - 7, y + 17], fill="#F7B733")
        x += 20
d.rounded_rectangle([80, 586, 156, 591], radius=2, fill="#F7B733")

right = "ujyalo-learn.vercel.app"
d.text((1120 - d.textlength(right, font=f_tiny), 580), right, font=f_tiny, fill="#7C8DB5")
img.save("public/og-image.png", optimize=True)
print("saved")
