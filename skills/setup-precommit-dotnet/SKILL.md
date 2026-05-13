---
name: setup-precommit-dotnet
description: .NET projesine Husky.Net tabanlı pre-commit hook kurar. dotnet format (kod formatı) ve dotnet test (testler) her commit öncesi otomatik çalışır. "pre-commit kur", "Husky ekle", "commit öncesi format/test" denildiğinde kullan.
stack: [dotnet, csharp, husky]
---

# Setup Pre-Commit — .NET / Rubion

## Neden?

Pre-commit hook olmadan: format bozuk kod commit'lenir, kırık test main'e gider.
Pre-commit hook ile: CI'a ulaşmadan önce format ve test garantilenir.

## Ön Koşullar

Konuşmadan önce doğrula:

- [ ] Repo kökünde en az bir `.csproj` veya `.sln` dosyası var mı?
- [ ] `dotnet` CLI erişilebilir mi? (`dotnet --version`)
- [ ] Mevcut bir `.husky/` klasörü var mı? (çakışma riski)

---

## Kurulum Adımları

### 1. Husky.Net ve lint-staged benzeri araç ekle

```bash
# Tool manifest yoksa oluştur
dotnet new tool-manifest --force

# Husky.Net'i tool olarak ekle
dotnet tool install Husky

# Husky'yi başlat (repo kökünde .husky/ klasörü oluşturur)
dotnet husky install
```

### 2. Pre-commit hook oluştur

`.husky/pre-commit` dosyasını yaz:

```bash
#!/bin/sh
. "$(dirname "$0")/_/husky.sh"

echo "⏳ dotnet format çalışıyor..."
dotnet format --verify-no-changes --verbosity diagnostic
FORMAT_EXIT=$?

if [ $FORMAT_EXIT -ne 0 ]; then
  echo "❌ Format hataları var. 'dotnet format' çalıştır ve tekrar commit et."
  exit 1
fi

echo "⏳ dotnet test çalışıyor..."
dotnet test --no-build --verbosity quiet
TEST_EXIT=$?

if [ $TEST_EXIT -ne 0 ]; then
  echo "❌ Testler başarısız. Düzelt ve tekrar commit et."
  exit 1
fi

echo "✅ Format ve testler geçti."
```

```bash
chmod +x .husky/pre-commit
```

### 3. `.editorconfig` yoksa oluştur

```bash
dotnet new editorconfig
```

Minimum `.editorconfig` içeriği (zaten varsa atla):

```ini
root = true

[*.cs]
indent_style = space
indent_size = 4
end_of_line = lf
charset = utf-8
trim_trailing_whitespace = true
insert_final_newline = true
dotnet_sort_system_directives_first = true
```

### 4. `.gitignore`'a Husky tool ekle (henüz yoksa)

```gitignore
# Husky
.husky/_/
```

`dotnet tool` için `.config/dotnet-tools.json` **commit edilmeli** — `.gitignore`'a ekleme.

### 5. Ekip için README notu ekle

`README.md`'ye şu bölümü ekle (varsa güncelle, yoksa oluştur):

```markdown
## Geliştirme Ortamı Kurulumu

Repo'yu klonladıktan sonra:

```bash
dotnet tool restore   # Husky.Net dahil tüm tool'ları yükler
dotnet husky install  # pre-commit hook'u etkinleştirir
```
```

---

## Doğrulama

```bash
# Sahte bir commit ile hook'u test et
git add .
git commit --allow-empty -m "test: hook çalışıyor mu?"
# → dotnet format ve dotnet test çıktısını görmeli
```

---

## Yapılandırma Seçenekleri

### Sadece değişen dosyaları formatla (büyük monorepo)

`.husky/pre-commit` içinde `dotnet format` komutunu şöyle değiştir:

```bash
# Staged dosyaları al, .cs olanları filtrele
STAGED_CS=$(git diff --cached --name-only --diff-filter=ACM | grep '\.cs$')

if [ -n "$STAGED_CS" ]; then
  dotnet format --include $STAGED_CS --verify-no-changes
fi
```

### Test süitini filtrele (yavaş integration testleri atla)

```bash
# Yalnızca unit testleri çalıştır (integration testleri CI'da çalışsın)
dotnet test --no-build --filter "Category!=Integration" --verbosity quiet
```

Test sınıflarına `[Trait("Category", "Integration")]` ekleyerek filtrele.

---

## Sorun Giderme

| Sorun | Çözüm |
|---|---|
| `hook not found: pre-commit` | `dotnet husky install` tekrar çalıştır |
| `dotnet format` her seferinde değişiklik buluyor | `.editorconfig` eksik veya IDE ayarlarıyla çelişiyor |
| Hook CI'da çalışmıyor | CI'da `dotnet tool restore && dotnet husky install` adımı ekle |
| Windows'ta `chmod` yok | Git Bash ile çalıştır veya `core.fileMode=false` ayarla |
