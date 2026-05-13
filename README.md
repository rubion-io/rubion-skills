# Rubion Skills

Claude Code / agent skill kütüphanesi — Rubion'un .NET + React/RN + monolith/mikroservis stack'ine adapte edilmiş.

Temel alınan kaynak: [mattpocock/skills](https://github.com/mattpocock/skills) (MIT).

## Buradan Başla

Yeni veya mevcut bir projede bu kütüphaneyi nasıl kullanacağını öğren: **[docs/getting-started.md](docs/getting-started.md)**

İki senaryo için adım adım path:
- **Sıfırdan proje + GitHub** → hangi skill, hangi sırayla
- **1 yıllık mevcut proje + Jira** → anlama, retrofit, iyileştirme

## Kurulum

```bash
# Tek bir projede kullanmak için
cp -r adapted/* /path/to/your/project/.claude/skills/
cp -r skills/* /path/to/your/project/.claude/skills/

# veya symlink
ln -s $(pwd)/adapted /path/to/your/project/.claude/skills-adapted
```

## Yapı

- `vendor/` — Upstream'in salt-okunur aynası (DOKUNMA)
- `adapted/` — Upstream'den uyarlanmış skill'ler
- `skills/` — Rubion'un orijinal skill'leri
- `docs/` — Süreç dokümanları + ADR'ler

## Sync Disiplini

Upstream ayda bir manuel review ile sync edilir. Detay: `docs/sync-process.md`.

## Lisans

MIT. Upstream attribution: bkz. `UPSTREAM.md`.
