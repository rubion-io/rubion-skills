---
name: setup-rubion-skills
description: Rubion skill kütüphanesini yeni bir projede kullanılabilir hale getirir. Issue tracker (GitHub veya Jira) ve domain doc (CONTEXT.md / ADR) yerleşimini docs/agents/ altına yazar. to-prd, to-issues, tdd-dotnet, diagnose-dotnet skill'lerinin ilk çalıştırılmasından önce bir kerelik çalıştırılır. "skill setup", "rubion init", "issue tracker config" denildiğinde kullan.
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

### 5. Bitir

Kullanıcıya kurulumun tamamlandığını söyle. Hangi skill'lerin bu dosyalardan okuyacağını listele:

- `adapted/to-prd` — PRD'yi issue tracker'a yayınlar
- `adapted/to-issues` — bir planı issue'lara böler ve tracker'a yazar
- `adapted/diagnose-dotnet` — diagnose sırasında ADR ve CONTEXT.md'ye bakar
- `adapted/tdd-dotnet` — test isimlendirme için CONTEXT.md sözlüğünü kullanır

Daha sonra `docs/agents/*.md`'yi elle düzenleyebileceklerini, sadece tracker değişirse bu skill'i tekrar çalıştırmaları gerektiğini söyle.
