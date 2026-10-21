"""Generiše privremene (placeholder) slike malterisanih površina.

Slike su proceduralne – nisu fotografije stvarnih radova. Zamenite ih
stvarnim fotografijama POWER MONT 023 (vidi README.md, odeljak "Fotografije").

Pokretanje:  python3 scripts/generate-placeholders.py
"""
from pathlib import Path

import numpy as np
from PIL import Image

OUT = Path(__file__).resolve().parent.parent / "assets" / "img"
rng = np.random.default_rng(23)


def noise(w, h, scales):
    acc = np.zeros((h, w), np.float32)
    for cell, amp in scales:
        gw, gh = max(2, w // cell + 2), max(2, h // cell + 2)
        g = rng.random((gh, gw), dtype=np.float32)
        img = Image.fromarray((g * 255).astype(np.uint8)).resize((w, h), Image.BICUBIC)
        acc += (np.asarray(img, np.float32) / 255 - 0.5) * amp
    return acc


def shade(height, light, strength):
    gy, gx = np.gradient(height * strength)
    n = np.dstack([-gx, -gy, np.ones_like(height)])
    n /= np.linalg.norm(n, axis=2, keepdims=True)
    l = np.array(light, np.float32)
    l /= np.linalg.norm(l)
    return np.clip(n @ l, 0, 1)


def tint(lum, dark, light):
    dark, light = np.array(dark, np.float32), np.array(light, np.float32)
    rgb = dark + (light - dark) * lum[..., None]
    return Image.fromarray(np.clip(rgb, 0, 255).astype(np.uint8))


def plaster(w, h, fine=1.0):
    # krupni talasi gletovanja + sitna zrnca maltera
    return (
        noise(w, h, [(420, 2.2), (160, 1.0)])
        + noise(w, h, [(28, 0.55 * fine), (9, 0.35 * fine), (3, 0.22 * fine)])
    )


def hero(w=2000, h=2400):
    hgt = plaster(w, h)
    lit = shade(hgt, (-1.0, -0.35, 0.55), 6.0)
    x = np.linspace(0, 1, w, dtype=np.float32)[None, :]
    y = np.linspace(0, 1, h, dtype=np.float32)[:, None]
    edge = 0.62  # unutrašnji ugao dva zida
    left = 0.62 + 0.30 * lit - 0.10 * y
    right = 0.40 + 0.22 * lit - 0.18 * (x - edge) - 0.06 * y
    soft = np.clip((x - edge) * w / 3.0, 0, 1)  # oštra, ali ne aliasirana ivica
    lum = left * (1 - soft) + right * soft
    # meka senka od ugla preko desnog zida
    lum -= 0.08 * np.exp(-np.clip(x - edge, 0, None) * 18) * soft
    # podna linija
    floor = y > 0.9
    lum = np.where(floor, 0.30 + 0.06 * lit, lum)
    lum -= 0.05 * np.exp(-np.abs(y - 0.9) * 140)
    return tint(np.clip(lum, 0, 1), (38, 44, 52), (236, 238, 240))


def detail(w=1600, h=2000):
    hgt = plaster(w, h, fine=1.5)
    # glatka, gletovana zona sa jasnom granicom (ivica sveže nanetog sloja)
    x = np.linspace(0, 1, w, dtype=np.float32)[None, :]
    y = np.linspace(0, 1, h, dtype=np.float32)[:, None]
    boundary = 0.40 + 0.14 * y + 0.006 * np.sin(y * 23.0) + 0.02 * noise(1, h, [(40, 0.12)])
    smooth = np.clip((x - boundary) * w / 6.0, 0, 1)
    hgt = hgt * (1 - 0.8 * smooth) + noise(w, h, [(520, 1.6)]) * smooth
    lit = shade(hgt, (-1.0, -0.6, 0.45), 7.0)
    lum = 0.48 + 0.36 * lit - 0.08 * y + 0.04 * smooth
    return tint(np.clip(lum, 0, 1), (40, 47, 56), (232, 235, 238))


def save(img, name, widths):
    for wdt in widths:
        hgt = round(img.height * wdt / img.width)
        img.resize((wdt, hgt), Image.LANCZOS).save(OUT / f"{name}-{wdt}.webp", quality=72, method=6)
    img.resize((widths[1], round(img.height * widths[1] / img.width)), Image.LANCZOS).convert("RGB").save(
        OUT / f"{name}.jpg", quality=78, optimize=True, progressive=True
    )


if __name__ == "__main__":
    OUT.mkdir(parents=True, exist_ok=True)
    save(hero(), "hero", [640, 1000, 1400])
    save(detail(), "o-nama", [600, 900, 1200])
    print("OK:", sorted(p.name for p in OUT.iterdir()))
