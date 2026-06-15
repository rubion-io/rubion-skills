# Proje Boyutu Rehberi

> Rubion-skills'in **her projeye uygun olmadığı**nı kabul ediyoruz. Bu rehber projenin boyutuna göre **hangi skill subset'inin, hangi memory politikasının, hangi otomasyonun** doğru olduğunu tanımlar.

İlke: **araçlar problemden büyük olmamalı.**

---

## Tier Sistemi

| Tier | Boyut | Tipik proje | Yaklaşım |
|------|-------|-------------|----------|
| **T1 — Stratejik** | 200+ dosya, çoklu modül, takım | Collecsi, Milagro ERP, ana ürünler | Tam stack |
| **T2 — Aktif** | 50-200 dosya, tek servis | Müşteri projeleri | Core + memory |
| **T3 — Bakım** | < 50 dosya, az dokunulan | Eski projeler, internal tool | Baseline only |
| **T4 — Throwaway** | POC, prototip, deneme | Hackathon, spike | Kapalı |

---

## T1 — Stratejik (Tam Stack)

**Profil:**
- 200+ kod dosyası
- 10+ modül
- Birden fazla geliştirici
- Aktif geliştirme (haftada 5+ PR)
- 1+ yıl ömür beklentisi

**Kurulum:**

```
✅ Tüm 28 skill (junction)
✅ CLAUDE.md baseline + Karpathy 4 prensip
✅ .claude/settings.json (3 hook aktif)
✅ docs/memory/ + aktif memorize-module disiplini
✅ Aylik memory-review CI
✅ Haftalik eval CI (description bozulması yakalama)
✅ Sprint başı setup-rubion-skills (wizard) re-entry
```

**Beklenen maliyet (1 dev/yıl):**
- Anthropic API: ~$200-400 (input+output)
- Memory bakım: ayda 1 saat
- Skill güncellemesi: `git pull` (otomatik via junction)

**Örnek projeler:** Collecsi, Milagro ERP

---

## T2 — Aktif (Core + Memory)

**Profil:**
- 50-200 kod dosyası
- 3-10 modül
- 1-2 geliştirici
- Düzenli geliştirme (haftada 1-3 PR)
- 6+ ay ömür

**Kurulum:**

```
✅ Core 12 skill:
   - setup-rubion-skills (wizard)
   - setup-memory
   - setup-precommit-dotnet
   - scaffold-vsa-feature
   - scaffold-microservice
   - scaffold-adr
   - tdd-dotnet / tdd-react / tdd-react-native
   - diagnose-dotnet
   - improve-codebase-architecture
   - memorize-module
   - migrate-legacy-to-vsa
   - ef-core-migration-review
✅ CLAUDE.md baseline
✅ Hook'lar (opsiyonel — istersen)
✅ docs/memory/ — sadece **top 5 modül** memorize edilir
⚠️ tubitak-1507-document, dispatch-agents, prototype yüklü ama nadir kullanım

⏸ memory-review CI — opsiyonel, manuel tetikle
⏸ Eval CI — opsiyonel
```

**Niş skill'leri uninstall:**
```powershell
.\scripts\install.ps1 -ExcludeNiche
# tubitak-1507-document, dispatch-agents, prototype kurulmaz
```

---

## T3 — Bakım (Baseline Only)

**Profil:**
- <50 kod dosyası
- Az dokunulan (ayda 1-2 PR)
- Bug fix + minor feature

**Kurulum:**

```
✅ CLAUDE.md baseline (sadece 4 prensip)
✅ Hook'lar (Surgical Changes hatırlatıcı + destructive uyarı)
⚠️ Tüm skill'ler global junction olarak yüklü (sorun değil — sadece description açıkken yer kaplar)

❌ docs/memory/ — yapma, bayatlar
❌ setup-memory — gerek yok
❌ Skill chain'leri — manuel ilerle
```

**Token maliyeti:** Her oturum ~7-9K (sadece always-on + minimal kod okuma)

---

## T4 — Throwaway (Kapalı)

**Profil:**
- POC, prototip, spike
- <1 hafta ömür
- "Çalışsa yeter"

**Kurulum:**

```
❌ rubion-skills kapalı
✅ Sadece `prototype` skill'i (zaten baseline'dan muaf)
❌ Hook yok, memory yok, baseline yok
```

**Pratik:** Projenin `.claude/settings.json` dosyasını şuna ayarla:

```json
{
  "skills": {
    "enabled": false
  }
}
```

Veya `~/.claude/skills/` junction'larını geçici olarak kaldır:

```powershell
cd C:/GitHub/rubion-skills
.\scripts\install.ps1 -Uninstall
# İş bitince: .\scripts\install.ps1
```

---

## Karar Ağacı

```
Bu projede çalışacağım. Tier ne?

Proje ömrü < 1 hafta? ────→ T4 (kapalı)
                       │
        Hayır ─────────┤
                       │
                       ▼
  Aktif geliştirme var mı?
                       │
       Hayır → T3 (baseline only)
                       │
        Evet ──────────┤
                       │
                       ▼
       Dosya sayısı > 200?
                       │
        Evet → T1 (tam stack)
                       │
       Hayır → T2 (core + memory top 5)
```

---

## Token Maliyeti Karşılaştırması

Bir tipik "bir feature ekle" sessionu için:

| Tier | Always-on | Skill body | Memory | Kod | **Toplam** |
|------|-----------|-----------|--------|-----|-----------|
| T1   | 7K        | 2K        | 1.6K   | 5K  | **~16K**  |
| T2   | 7K        | 2K        | 1K     | 4K  | **~14K**  |
| T3   | 7K        | 0         | 0      | 1K  | **~8K**   |
| T4   | 0.5K      | 0         | 0      | 1K  | **~1.5K** |

T1 maliyeti yüksek görünür ama **memory olmasaydı 25-30K** olurdu. Net kazanç var.

T3'te skill'ler always-on yüklü ama tetiklenmiyor → boş yere 1.4K token/oturum. Bu fiyatı ödemek istemiyorsan T4'e in.

---

## Migrasyon Path'leri

### Yeni proje başlatma

Default tier: **T2** (core + memory).

```
Yeni proje → T2 başla
         ↓
       6 ay sonra büyürse → T1'e yükselt (memory genişlet, dispatch-agents aç)
       Küçük kaldıysa     → T3'e in (memory'yi kapat)
```

### Var olan projeye uygulama

```
Var olan proje → setup-rubion-skills (wizard)
              ↓
       Wizard "zero/legacy?" + "stack?" sorar
              ↓
       İlk değerlendirmede T2 kur, 1 ay sonra tier'i doğrula
```

### Tier düşürme

T1 → T2: `memory-review` ile düşük değerli modülleri arşive at.
T2 → T3: `docs/memory/` klasörünü kaldır veya arşive al.
T3 → T4: `install.ps1 -Uninstall` çalıştır.

---

## Anti-Pattern'lar

### ❌ "Her projeye T1"

Küçük projeye T1 = problemden büyük araç. Geliştirici memory'yi günceller, kullanmaz, bayatlar. Negatif değer.

### ❌ "Her şeyi memory'ye"

T1'de bile memory **seçici** olmalı. 35 modül varsa 35 doc değil; en sık dokunulan 15.

### ❌ "Tier'ı asla değiştirmeme"

Proje büyür/küçülür. Tier de değişir. 6 ayda bir yeniden değerlendir.

### ❌ "Niş skill'leri herkese kur"

`tubitak-1507-document` müşteri projesinde gereksiz. `dispatch-agents` küçük takımlarda gereksiz. T2'den itibaren `-ExcludeNiche` flag'i ile filtrele.

---

## Pratik Test: "Bu proje hangi tier'de?"

3 soru:

1. **Bu projede çalışıyor olduğum tüm dosyaları okusam, kafamda tutabilir miyim?**
   - Evet → T3 veya T4
   - Hayır, ama modüller net → T2
   - Hayır, dağınık ve büyük → T1

2. **Yeni biri katılsa, onboarding kaç gün sürer?**
   - Yarım gün → T3/T4
   - 1-2 gün → T2
   - 1 hafta+ → T1

3. **Son 1 ayda kaç PR açıldı?**
   - 0-1 → T3
   - 2-5 → T2
   - 5+ → T1

Üç soruda da aynı tier çıkarsa karar net. Karışıksa **bir aşağı tier'i seç** (Karpathy: Simplicity First).
