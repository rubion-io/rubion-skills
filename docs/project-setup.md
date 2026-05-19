# Mevcut Bir Projeye Rubion Baseline Ekleme

Bu döküman, `rubion-skills` global olarak kurulduktan sonra **var olan bir projeye** Karpathy/Rubion davranış baseline'ı ve hook'ları eklemek için adımları içerir.

> **Ön koşul:** `scripts/install.ps1` (veya `install.sh`) çalıştırılmış ve skill'ler `~/.claude/skills/` altında junction olarak bağlanmış olmalı.

---

## 1. CLAUDE.md Baseline Ekleme

### Yeni Proje (CLAUDE.md yok)

**PowerShell:**
```powershell
Copy-Item "C:/GitHub/rubion-skills/templates/CLAUDE.md.baseline.md" "./CLAUDE.md"
```

**Git Bash / WSL:**
```bash
cp /c/GitHub/rubion-skills/templates/CLAUDE.md.baseline.md ./CLAUDE.md
```

### Mevcut Proje (CLAUDE.md var, içeriğe dokunma)

**PowerShell (UTF-8 garantili):**
```powershell
$baseline = Get-Content "C:/GitHub/rubion-skills/templates/CLAUDE.md.baseline.md" -Raw -Encoding UTF8
Add-Content -Path "./CLAUDE.md" -Value "`n$baseline" -Encoding UTF8 -NoNewline
```

> **Uyarı:** PowerShell'in varsayılan `cat ... >>` operatörü UTF-16 yazar — mevcut UTF-8 dosyayı bozar. Yukarıdaki `Add-Content -Encoding UTF8` komutu güvenli yöntemdir.

**Git Bash:**
```bash
printf "\n" >> CLAUDE.md
cat /c/GitHub/rubion-skills/templates/CLAUDE.md.baseline.md >> CLAUDE.md
```

### Sürüm Yükselince Güncelleme

Baseline `<!-- rubion:baseline-start v1 -->` ve `<!-- rubion:baseline-end -->` marker'ları arasındadır. Yeni sürüm gelince:

1. Marker'lar arasını sil (`Ctrl+F` ile bul)
2. Yukarıdaki komutla yeniden ekle

Veya `setup-rubion-skills` skill'ini Claude Code'da çalıştır — adım 5'te idempotent merge yapar.

---

## 2. Hook'ları Kurma

### `.claude/settings.json` yoksa

**PowerShell:**
```powershell
New-Item -ItemType Directory -Force -Path ".claude" | Out-Null
Copy-Item "C:/GitHub/rubion-skills/templates/claude-settings.example.json" ".claude/settings.json"
```

**Git Bash:**
```bash
mkdir -p .claude
cp /c/GitHub/rubion-skills/templates/claude-settings.example.json .claude/settings.json
```

### `.claude/settings.json` zaten varsa

Otomatik birleştirme **yapma** — JSON birleştirmesi hata riskli. İki seçenek:

- **a)** Mevcut `settings.json`'ı aç, `claude-settings.example.json`'daki `hooks` bloğunu elle ekle.
- **b)** Mevcut dosyayı `.claude/settings.local.json` olarak yeniden adlandır (gitignore'da kalır), example'ı `settings.json` olarak yerleştir (commit'lenebilir takım baseline'ı).

### Hook'ların Commit Edilmesi

`.claude/settings.json` repo'ya **commit edilebilir** — takım paylaşımı için tercih edilir. Kişisel override'lar `.claude/settings.local.json` içinde kalmalı (otomatik `.gitignore`'a düşer).

---

## 3. Doğrulama

Proje köküne dönüp Claude Code'u başlat:

```bash
claude
```

İlk turda kontrol et:

- [ ] CLAUDE.md sonunda "Davranış Baseline (Rubion + Karpathy)" bölümü görünüyor mu?
- [ ] Bir `.cs` dosyasını edit edince hook çıktısı görünüyor mu? (`[rubion-baseline] Dosya degisti...`)
- [ ] Oturum sonunda Stop hook'u test reminder verdi mi?

Hepsi ✓ ise baseline + hook'lar aktif.

---

## 4. Sürüm Bilgisi

Bu döküman `rubion-skills` v1.x baseline marker (v1) için yazıldı. Marker sürümü yükselirse (`v2`, `v3`) yukarıdaki regenerate adımı aynı şekilde çalışır.
