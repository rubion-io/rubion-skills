# Rubion Skills

Claude Code / agent skill kütüphanesi — Rubion'un .NET + React/RN + monolith/mikroservis stack'ine adapte edilmiş.

Temel alınan kaynak: [mattpocock/skills](https://github.com/mattpocock/skills) (MIT).

## Buradan Başla

Yeni veya mevcut bir projede bu kütüphaneyi nasıl kullanacağını öğren: **[docs/getting-started.md](docs/getting-started.md)**

İki senaryo için adım adım path:
- **Sıfırdan proje + GitHub** → hangi skill, hangi sırayla
- **1 yıllık mevcut proje + Jira** → anlama, retrofit, iyileştirme

## Kurulum

Skill'ler **Claude Code** ve **Cursor**'un global skill klasörlerine junction (Windows) veya symlink (Linux/macOS) olarak bağlanır. Repo'da `git pull` yaptığında global klasörler otomatik güncellenmiş olur — manuel sync gerekmez.

### Windows (PowerShell)

```powershell
.\scripts\install.ps1                 # Claude + Cursor (varsayılan)
.\scripts\install.ps1 -Target claude  # sadece Claude Code
.\scripts\install.ps1 -Target cursor  # sadece Cursor
.\scripts\install.ps1 -Force          # mevcut klasörlerin üzerine yaz
.\scripts\install.ps1 -Uninstall      # tüm junction'ları kaldır
```

### Linux / macOS (Bash)

```bash
./scripts/install.sh                  # Claude + Cursor (varsayılan)
./scripts/install.sh --target=claude  # sadece Claude Code
./scripts/install.sh --target=cursor  # sadece Cursor
./scripts/install.sh --force          # mevcut klasörlerin üzerine yaz
./scripts/install.sh --uninstall      # tüm symlink'leri kaldır
```

### Bağlanan Yerler

| Tool | Yol |
|---|---|
| Claude Code | `~/.claude/skills/<skill-name>` |
| Cursor | `~/.cursor/skills-cursor/<skill-name>` |

(Windows'ta `~` = `%USERPROFILE%`)

Her `adapted/*` ve `skills/*` alt klasörü, isim korunarak hedef klasörde bir junction/symlink olarak görünür. `vendor/` dahil edilmez.

## Yapı

- `vendor/` — Upstream'in salt-okunur aynası (DOKUNMA)
- `adapted/` — Upstream'den uyarlanmış skill'ler
- `skills/` — Rubion'un orijinal skill'leri
- `docs/` — Süreç dokümanları + ADR'ler

## Sync Disiplini

Upstream ayda bir manuel review ile sync edilir. Detay: `docs/sync-process.md`.

## Lisans

MIT. Upstream attribution: bkz. `UPSTREAM.md`.
