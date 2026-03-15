from __future__ import annotations

from pathlib import Path
from PIL import Image, ImageDraw, ImageEnhance, ImageFilter, ImageFont


ROOT = Path(__file__).resolve().parents[1]
SOURCE_IMAGE = ROOT.parent / "benchmark_mixed_ocr.png"
OUTPUT_DIR = ROOT / "apps" / "web" / "public" / "blog"

CREAM = "#f5efe4"
PAPER = "#fff8ef"
INK = "#162a2c"
MUTED = "#5a6d70"
LINE = "#dbcdb7"
ACCENT = "#0e7c66"
ACCENT_SOFT = "#d8ebe5"
ORANGE = "#d86a2b"
GOLD = "#d7b063"


def load_font(size: int, bold: bool = False) -> ImageFont.FreeTypeFont | ImageFont.ImageFont:
    candidates = []
    if bold:
      candidates = [
          Path("C:/Windows/Fonts/georgiab.ttf"),
          Path("C:/Windows/Fonts/segoeuib.ttf"),
      ]
    else:
      candidates = [
          Path("C:/Windows/Fonts/georgia.ttf"),
          Path("C:/Windows/Fonts/segoeui.ttf"),
      ]

    for candidate in candidates:
        if candidate.exists():
            return ImageFont.truetype(str(candidate), size=size)

    return ImageFont.load_default()


DISPLAY_64 = load_font(64, bold=True)
DISPLAY_52 = load_font(52, bold=True)
DISPLAY_38 = load_font(38, bold=True)
DISPLAY_30 = load_font(30, bold=True)
BODY_28 = load_font(28)
BODY_24 = load_font(24)
BODY_20 = load_font(20)
BODY_18 = load_font(18)


def rounded_panel(draw: ImageDraw.ImageDraw, box: tuple[int, int, int, int], fill: str = PAPER, outline: str = LINE, radius: int = 28, width: int = 2) -> None:
    draw.rounded_rectangle(box, radius=radius, fill=fill, outline=outline, width=width)


def write_wrapped(draw: ImageDraw.ImageDraw, text: str, box: tuple[int, int, int, int], font: ImageFont.ImageFont, fill: str = INK, spacing: int = 10) -> int:
    left, top, right, _ = box
    max_width = right - left
    words = text.split()
    lines: list[str] = []
    current = ""
    for word in words:
        trial = f"{current} {word}".strip()
        if draw.textbbox((0, 0), trial, font=font)[2] <= max_width:
            current = trial
        else:
            lines.append(current)
            current = word
    if current:
        lines.append(current)

    y = top
    for line in lines:
        draw.text((left, y), line, font=font, fill=fill)
        y += draw.textbbox((0, 0), line, font=font)[3] + spacing
    return y


def paste_cover(base: Image.Image, cover: Image.Image, box: tuple[int, int, int, int], radius: int = 28) -> None:
    left, top, right, bottom = box
    width = right - left
    height = bottom - top
    image = cover.copy()
    image.thumbnail((width, height))
    framed = Image.new("RGBA", (width, height), (0, 0, 0, 0))
    x = (width - image.width) // 2
    y = (height - image.height) // 2
    framed.paste(image, (x, y))
    mask = Image.new("L", (width, height), 0)
    ImageDraw.Draw(mask).rounded_rectangle((0, 0, width, height), radius=radius, fill=255)
    base.paste(framed, (left, top), mask)


def bullet_row(draw: ImageDraw.ImageDraw, y: int, text: str, color: str = ACCENT) -> int:
    draw.ellipse((80, y + 9, 98, y + 27), fill=color)
    write_wrapped(draw, text, (112, y, 1490, y + 80), BODY_24, fill=INK, spacing=6)
    return y + 52


def create_benchmark_board(source: Image.Image) -> None:
    canvas = Image.new("RGB", (1600, 1200), CREAM)
    draw = ImageDraw.Draw(canvas)
    rounded_panel(draw, (36, 36, 1564, 1164), fill="#fbf4e8", radius=38)

    draw.text((78, 86), "Teste real de OCR em portugues", font=BODY_24, fill=ACCENT)
    write_wrapped(draw, "Benchmark com layout misto: heading, CTA, chips e microcopy", (78, 132, 1496, 252), DISPLAY_52, fill=INK, spacing=4)
    write_wrapped(draw, "Usamos a imagem abaixo para avaliar leitura, ordem visual e utilidade do texto exportado.", (78, 256, 1496, 330), BODY_28, fill=MUTED, spacing=8)

    rounded_panel(draw, (78, 300, 1012, 982))
    paste_cover(canvas, source, (116, 338, 974, 944), radius=24)

    rounded_panel(draw, (1050, 300, 1522, 520), fill=ACCENT_SOFT)
    draw.text((1088, 340), "O que a imagem estressa", font=DISPLAY_30, fill=INK)
    write_wrapped(
        draw,
        "Mistura de portugues + ingles, labels curtas, botoes coloridos e cards laterais que precisam respeitar contexto.",
        (1088, 392, 1478, 492),
        BODY_24,
        fill=MUTED,
        spacing=8,
    )

    rounded_panel(draw, (1050, 548, 1522, 798))
    draw.text((1088, 588), "Sinais bons para o OCR", font=DISPLAY_30, fill=INK)
    write_wrapped(draw, "Titulos grandes", (1088, 642, 1460, 680), BODY_24, fill=ORANGE, spacing=6)
    write_wrapped(draw, "CTAs com alto contraste", (1088, 684, 1460, 722), BODY_24, fill=ACCENT, spacing=6)
    write_wrapped(draw, "Cards com leitura previsivel", (1088, 726, 1460, 764), BODY_24, fill=GOLD, spacing=6)

    rounded_panel(draw, (1050, 826, 1522, 982), fill="#fffaf0")
    draw.text((1088, 866), "Revisar manualmente", font=DISPLAY_30, fill=INK)
    write_wrapped(draw, "Chips pequenos, notas de rodape e palavras muito curtas ainda pedem olho humano antes de publicar.", (1088, 916, 1474, 970), BODY_20, fill=MUTED, spacing=6)

    rounded_panel(draw, (78, 1024, 1522, 1110), fill="#fffaf0")
    draw.text((114, 1052), "Insight editorial: o melhor artigo de OCR nao promete perfeicao; ele mostra onde a ferramenta economiza tempo e onde a revisao ainda faz parte do fluxo.", font=BODY_24, fill=INK)

    canvas.save(OUTPUT_DIR / "ocr-portuguese-benchmark-board.png", quality=95)


def create_format_comparison(source: Image.Image) -> None:
    canvas = Image.new("RGB", (1600, 1200), CREAM)
    draw = ImageDraw.Draw(canvas)
    rounded_panel(draw, (36, 36, 1564, 1164), fill="#fbf4e8", radius=38)

    draw.text((78, 86), "Comparativo de entrada", font=BODY_24, fill=ACCENT)
    write_wrapped(draw, "JPG, PNG e screenshot: onde o OCR sai mais limpo", (78, 132, 1496, 220), DISPLAY_52, fill=INK, spacing=4)
    write_wrapped(draw, "Mesmo quando o texto parece igual para o olho, compressao e origem do arquivo mudam o retrabalho depois da extracao.", (78, 224, 1496, 300), BODY_28, fill=MUTED, spacing=8)

    jpg_variant = ImageEnhance.Sharpness(source.filter(ImageFilter.GaussianBlur(1.1))).enhance(0.72)
    png_variant = source.copy()
    screenshot_variant = source.crop((100, 120, 1300, 860)).resize((1200, 740))

    panels = [
        (
            "JPG de camera",
            "Funciona para fotos, recibos e cartazes quando a captura vem do celular.",
            "Revise letras pequenas e bordas comprimidas.",
            jpg_variant,
            ORANGE,
        ),
        (
            "PNG exportado",
            "Melhor para cards, interfaces e criativos que nasceram digitalmente.",
            "Preserva bordas e labels com menos ruido.",
            png_variant,
            ACCENT,
        ),
        (
            "Screenshot nativa",
            "Caso mais forte para OCR em landing pages, dashboards e app screens.",
            "Menos limpeza depois da extracao.",
            screenshot_variant,
            GOLD,
        ),
    ]

    x = 78
    for title, lead, note, image, color in panels:
        rounded_panel(draw, (x, 300, x + 448, 1038))
        draw.rounded_rectangle((x + 28, 328, x + 420, 374), radius=20, fill=color)
        draw.text((x + 48, 336), title, font=DISPLAY_30, fill="#fffaf0" if color != GOLD else INK)
        paste_cover(canvas, image, (x + 28, 404, x + 420, 682), radius=22)
        write_wrapped(draw, lead, (x + 28, 724, x + 404, 812), BODY_24, fill=INK, spacing=8)
        write_wrapped(draw, note, (x + 28, 836, x + 404, 932), BODY_20, fill=MUTED, spacing=6)
        x += 486

    rounded_panel(draw, (78, 1068, 1522, 1110), fill="#fffaf0")
    draw.text((112, 1078), "Regra pratica: se nasceu digital, mantenha screenshot ou PNG. Se veio da camera, aceite JPG, mas melhore enquadramento, luz e contraste antes do OCR.", font=BODY_20, fill=INK)

    canvas.save(OUTPUT_DIR / "ocr-format-comparison.png", quality=95)


def create_export_workflow(source: Image.Image) -> None:
    canvas = Image.new("RGB", (1600, 1200), CREAM)
    draw = ImageDraw.Draw(canvas)
    rounded_panel(draw, (36, 36, 1564, 1164), fill="#fbf4e8", radius=38)

    draw.text((78, 86), "Fluxo de saida", font=BODY_24, fill=ACCENT)
    write_wrapped(draw, "Como levar OCR para Word, Markdown e HTML sem perder contexto", (78, 132, 1496, 252), DISPLAY_52, fill=INK, spacing=4)
    write_wrapped(draw, "A extracao so entrega valor total quando o texto chega no proximo sistema com uma estrutura que ainda faz sentido.", (78, 256, 1496, 324), BODY_24, fill=MUTED, spacing=6)

    rounded_panel(draw, (78, 312, 430, 920))
    draw.text((112, 352), "Entrada", font=DISPLAY_30, fill=INK)
    paste_cover(canvas, source, (112, 410, 396, 700), radius=20)
    write_wrapped(draw, "Use o arquivo original sempre que possivel. Menos recompressao significa menos limpeza depois.", (112, 744, 396, 864), BODY_20, fill=MUTED, spacing=6)

    rounded_panel(draw, (492, 408, 856, 826), fill=ACCENT_SOFT)
    draw.text((528, 454), "OCR Scanlume", font=DISPLAY_38, fill=INK)
    write_wrapped(draw, "Simple OCR para captura rapida. Formatted Text para preservar titulos, paragrafos e listas.", (528, 526, 820, 642), BODY_24, fill=INK, spacing=8)
    draw.rounded_rectangle((544, 704, 804, 760), radius=22, fill=ACCENT)
    draw.text((594, 714), "Escolha o destino final", font=BODY_24, fill="#fffaf0")

    outputs = [
        ("Word", "Revisao, comentarios e entrega interna.", ORANGE),
        ("Markdown", "Docs, IA, versionamento e base de conhecimento.", ACCENT),
        ("HTML", "Ponte rapida para colar em editores ricos.", GOLD),
    ]

    y = 320
    for title, body, color in outputs:
        rounded_panel(draw, (940, y, 1522, y + 176))
        draw.rounded_rectangle((972, y + 32, 1114, y + 84), radius=18, fill=color)
        draw.text((1008, y + 42), title, font=DISPLAY_30, fill="#fffaf0" if color != GOLD else INK)
        write_wrapped(draw, body, (972, y + 108, 1474, y + 156), BODY_20, fill=MUTED, spacing=6)
        y += 206

    draw.line((430, 616, 492, 616), fill=LINE, width=8)
    draw.line((856, 616, 940, 408), fill=LINE, width=6)
    draw.line((856, 616, 940, 614), fill=LINE, width=6)
    draw.line((856, 616, 940, 820), fill=LINE, width=6)

    rounded_panel(draw, (78, 980, 1522, 1110), fill="#fffaf0")
    y = 1010
    for line in [
        "Word: melhor quando o time vai revisar, aprovar e editar.",
        "Markdown: melhor quando o texto vira insumo para wiki, AI e automacao.",
        "HTML: melhor quando voce quer preservar hierarquia ao colar em Word ou outros editores ricos.",
    ]:
        y = bullet_row(draw, y, line, color=ACCENT)

    canvas.save(OUTPUT_DIR / "ocr-export-workflow.png", quality=95)


def main() -> None:
    OUTPUT_DIR.mkdir(parents=True, exist_ok=True)
    source = Image.open(SOURCE_IMAGE).convert("RGB")
    create_benchmark_board(source)
    create_format_comparison(source)
    create_export_workflow(source)


if __name__ == "__main__":
    main()
