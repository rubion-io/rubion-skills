---
name: setup-rubion-skills
description: Rubion skill kütüphanesini bir projede bootstrap eder — issue tracker (GitHub/Jira) ve domain doc yerleşimini `docs/agents/` altına yazar. "skill setup", "rubion init" denildiğinde. Sadece bir kez, proje başlangıcında çalıştır.
stack: []
---

# Setup Rubion Skills — Bootstrap

Diğer skill'lerin "issue tracker'a yaz" veya "ADR'ye bak" dediği durumlarda nereye bakacaklarını bu skill tek bir kerelik kurar.

> **Not:** Bu prompt'a göre yürüyen bir skill — deterministik script değil. Mevcut durumu keşfet, kullanıcıya göster, onay al, yaz.

---

## Süreç

### 1. Keşfet

Repo'nun mevcut durumuna bak. Varsa oku, yoksa varsayma:

- `git remote -v` → GitHub remote var mı?
- `CLAUDE.md` veya `AGENTS.md` repo kökünde var mı? İçinde `## Agent skills` bloğu var mı?
- `CONTEXT.md` ve `CONTEXT-MAP.md` repo kökünde var mı?
- `docs/adr/` dizini var mı?
- `docs/agents/` zaten oluşturulmuş mu? (varsa skill'i daha önce çalıştırılmış demektir)

### 2. Bulguları göster ve sor

Mevcut durumu özetle. Sonra **tek tek** iki kararı kullanıcıya götür — bir kerede hepsini dökme.

Kullanıcı bu terimleri bilmiyor varsay. Her bölüm kısa bir açıklama ile başlasın.

#### Bölüm A — Issue Tracker

> Açıklama: Issue tracker, bu projenin task ve issue'larının nerede yaşadığıdır. `to-prd`, `to-issues`, `diagnose-dotnet` gibi skill'ler buradan okur ve buraya yazar. Hangi araç kullanılacağını bilmeleri gerekir.

İki seçenek:

- **GitHub** — issue'lar repo'nun GitHub Issues sekmesinde, `gh` CLI ile yönetilir
- **Jira** — issue'lar Atlassian Jira Cloud'da, REST API + API token ile yönetilir

`git remote -v` GitHub adresi gösteriyorsa **GitHub** öner. Müşteri projesinde Jira kullanılıyorsa **Jira** seçilir.

#### Bölüm B — Domain Doc Yerleşimi

> Açıklama: `tdd-dotnet`, `diagnose-dotnet`, `grill-with-docs` gibi skill'ler projenin domain dilini öğrenmek için `CONTEXT.md`, geçmiş kararları için `docs/adr/` okur. Bu dosyalar tek mi yoksa monorepo'da modüllere mi dağılmış belli olmalı.

İki seçenek:

- **Single-context** — `CONTEXT.md` + `docs/adr/` repo kökünde (çoğu Rubion projesi)
- **Multi-context** — `CONTEXT-MAP.md` repo kökünde, her modülün kendi `CONTEXT.md`'si (monorepo / büyük mikroservis kümeleri)

### 3. Onay al ve yaz

Kullanıcıya iki dosyanın taslağını göster:

- `CLAUDE.md` veya `AGENTS.md`'ye eklenecek `## Agent skills` bloğu
- `docs/agents/issue-tracker.md` ve `docs/agents/domain.md` içerikleri

Yazmadan önce kullanıcıya düzenleme şansı ver.

### 4. Dosyaları yaz

**Hangi dosyayı düzenle:**

- `CLAUDE.md` varsa onu düzenle
- Yoksa `AGENTS.md` varsa onu düzenle
- Hiçbiri yoksa kullanıcıya sor — kendin seçme

`## Agent skills` bloğu zaten varsa, üzerine ekleme — içeriğini yerinde güncelle.

Eklenecek blok:

```markdown
## Agent skills

### Issue tracker

[Tek cümleyle: GitHub veya Jira]. Detay: `docs/agents/issue-tracker.md`.

### Domain docs

[Tek cümleyle: single-context veya multi-context]. Detay: `docs/agents/domain.md`.
```

Sonra şu dosyaları yaz (bu skill klasöründeki şablonları başlangıç olarak kullan):

- [issue-tracker-github.md](./issue-tracker-github.md) — GitHub seçildi ise
- [issue-tracker-jira.md](./issue-tracker-jira.md) — Jira seçildi ise
- [domain.md](./domain.md) — her durumda

Jira seçildiyse kullanıcıya **environment variable kurulumunu** hatırlat:

```bash
# .env veya ~/.bashrc / ~/.zshrc / ~/.config/powershell/profile.ps1
export JIRA_BASE_URL="https://<your-domain>.atlassian.net"
export JIRA_EMAIL="you@rubion.io"
export JIRA_API_TOKEN="<api-token>"
export JIRA_PROJECT_KEY="<PROJ>"   # Jira proje anahtarı, örn: RUB
```

API token şuradan alınır: https://id.atlassian.com/manage-profile/security/api-tokens

> **Güvenlik:** API token'ı asla repo'ya commit'leme. `.env` `.gitignore`'da olmalı.

### 5. Karpathy/Rubion Baseline'ı Yerleştir (Opsiyonel ama Önerilen)

> **Açıklama:** Rubion baseline = 4 davranış kuralı (Think Before Coding, Simplicity First, Surgical Changes, Goal-Driven Execution) + Rubion-specific somut tetikleyiciler. Skill'lerden bağımsız, her oturumda yüklenir.

Kullanıcıya sor: "Karpathy/Rubion baseline'ı CLAUDE.md'ye yerleştireyim mi?"

**Evet derse:**

1. `<rubion-skills>/templates/CLAUDE.md.baseline.md` içeriğini al.
2. Proje kökündeki `CLAUDE.md`'yi oku.
3. `<!-- rubion:baseline-start v1 -->` marker'ı zaten var mı?
   - **Varsa:** Marker'lar arasını yeni içerikle değiştir (regenerate).
   - **Yoksa:** Dosyanın **sonuna** ekle (override section'ları üstte kalsın).
4. `CLAUDE.md` yoksa: önce ana içerik için kullanıcıya sor, sonra baseline'ı ekle.

**Hooks (Claude Code v2 kullanıcısı için):**

`.claude/settings.json` dosyası proje kökünde yoksa, `<rubion-skills>/templates/claude-settings.example.json` içeriğini oraya kopyala. Varsa kullanıcıya birleştirme planı sun.

> `.claude/settings.json` repo'ya commit edilebilir (takım paylaşımı için) **veya** `.claude/settings.local.json` (kişisel, .gitignore'da).

### 6. Bitir

Kullanıcıya kurulumun tamamlandığını söyle. Hangi skill'lerin bu dosyalardan okuyacağını listele:

- `adapted/to-prd` — PRD'yi issue tracker'a yayınlar
- `adapted/to-issues` — bir planı issue'lara böler ve tracker'a yazar
- `adapted/diagnose-dotnet` — diagnose sırasında ADR ve CONTEXT.md'ye bakar
- `adapted/tdd-dotnet` — test isimlendirme için CONTEXT.md sözlüğünü kullanır

Baseline yerleştirildiyse şunu da söyle: "CLAUDE.md baseline (4 davranış kuralı) artık her oturumda aktif. Override gerekirse marker dışında yeni section aç."

Daha sonra `docs/agents/*.md`'yi elle düzenleyebileceklerini, sadece tracker değişirse bu skill'i tekrar çalıştırmaları gerektiğini söyle.
