#!/usr/bin/env python3
"""
Generate placeholder theme assets for Mobiliar Arena.
Creates background images and ball textures for each theme.
"""

from PIL import Image, ImageDraw
import os

THEMES_DIR = os.path.join(os.path.dirname(__file__), '..', 'public', 'assets', 'themes')

# Theme colors
THEME_COLORS = {
    'basketball': {'primary': (255, 120, 50), 'secondary': (200, 80, 30), 'ball': (255, 140, 60)},
    'handball': {'primary': (220, 60, 60), 'secondary': (180, 40, 40), 'ball': (255, 255, 255)},
    'volleyball': {'primary': (255, 220, 100), 'secondary': (200, 170, 60), 'ball': (255, 255, 230)},
    'floorball': {'primary': (50, 150, 200), 'secondary': (30, 100, 150), 'ball': (255, 255, 255)},
    'corporate': {'primary': (200, 30, 50), 'secondary': (150, 20, 40), 'ball': (255, 255, 255)},
}

def create_background(theme_name, colors):
    """Create a 1920x1080 background with dark arena area."""
    img = Image.new('RGBA', (1920, 1080), (20, 20, 35, 255))
    draw = ImageDraw.Draw(img)

    # Draw subtle radial gradient (simulated with circles)
    center = (960, 540)
    for r in range(500, 0, -10):
        alpha = int(30 * (r / 500))
        color = (*colors['secondary'], alpha)
        draw.ellipse([center[0]-r, center[1]-r, center[0]+r, center[1]+r], fill=color)

    # Draw arena border ring
    for width in range(15, 0, -1):
        alpha = int(100 * (width / 15))
        draw.ellipse(
            [center[0]-450-width, center[1]-450-width, center[0]+450+width, center[1]+450+width],
            outline=(*colors['primary'], alpha),
            width=2
        )

    # Inner guide circle
    draw.ellipse(
        [center[0]-400, center[1]-400, center[0]+400, center[1]+400],
        outline=(50, 50, 70, 100),
        width=2
    )

    return img

def create_ball(theme_name, colors):
    """Create a 64x64 ball texture with sport-appropriate design."""
    img = Image.new('RGBA', (64, 64), (0, 0, 0, 0))
    draw = ImageDraw.Draw(img)

    ball_color = colors['ball']

    # Draw main ball circle with gradient effect
    for r in range(28, 0, -1):
        brightness = 1.0 - (28 - r) * 0.02
        c = tuple(int(v * brightness) for v in ball_color)
        draw.ellipse([32-r, 32-r, 32+r, 32+r], fill=(*c, 255))

    # Add sport-specific markings
    if theme_name == 'basketball':
        # Orange ball with black lines
        draw.arc([8, 8, 56, 56], 0, 360, fill=(0, 0, 0, 200), width=2)
        draw.line([32, 4, 32, 60], fill=(0, 0, 0, 180), width=2)
        draw.arc([20, 8, 44, 56], 90, 270, fill=(0, 0, 0, 180), width=2)
    elif theme_name == 'volleyball':
        # White ball with curved panel lines
        draw.arc([8, 8, 56, 56], 0, 360, fill=(100, 100, 100, 150), width=2)
        draw.arc([10, 20, 54, 44], 30, 150, fill=(80, 80, 80, 150), width=2)
        draw.arc([10, 20, 54, 44], 210, 330, fill=(80, 80, 80, 150), width=2)
    elif theme_name == 'handball':
        # White/red ball
        draw.arc([8, 8, 56, 56], 0, 360, fill=(200, 50, 50, 200), width=3)
        draw.line([12, 32, 52, 32], fill=(200, 50, 50, 150), width=2)
    elif theme_name == 'floorball':
        # White ball with holes pattern
        for angle in range(0, 360, 45):
            import math
            x = 32 + int(15 * math.cos(math.radians(angle)))
            y = 32 + int(15 * math.sin(math.radians(angle)))
            draw.ellipse([x-4, y-4, x+4, y+4], fill=(150, 150, 150, 200))
    elif theme_name == 'corporate':
        # Red/white Mobiliar style
        draw.arc([8, 8, 56, 56], 0, 360, fill=(200, 30, 50, 200), width=3)

    # Add highlight
    draw.ellipse([18, 14, 28, 24], fill=(255, 255, 255, 100))

    return img

def main():
    os.makedirs(THEMES_DIR, exist_ok=True)

    for theme_name, colors in THEME_COLORS.items():
        theme_dir = os.path.join(THEMES_DIR, theme_name)
        os.makedirs(theme_dir, exist_ok=True)

        # Create background
        bg = create_background(theme_name, colors)
        bg_path = os.path.join(theme_dir, 'background.png')
        bg.save(bg_path, 'PNG')
        print(f"Created: {bg_path}")

        # Create ball
        ball = create_ball(theme_name, colors)
        ball_path = os.path.join(theme_dir, 'ball.png')
        ball.save(ball_path, 'PNG')
        print(f"Created: {ball_path}")

if __name__ == '__main__':
    main()
