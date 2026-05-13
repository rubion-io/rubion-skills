---
adapted_from: mattpocock/skills/skills/engineering/to-prd
upstream_commit: f304057d61d3df3c9fd992ac2b6e3833cb9325fb
last_reviewed: 2026-05-13
adaptation_level: light
name: to-prd
description: Mevcut konuşma bağlamını bir PRD'ye dönüştürür ve issue tracker'a (GitHub Issues veya Jira) yayınlar. Kullanıcıyı sorgulamaz — zaten bildiği şeyi sentezler. "PRD üret", "bunu PRD yap", "feature dokümanı oluştur" denildiğinde kullan.
stack: []
---

# To PRD — Rubion

Mevcut konuşma bağlamı + codebase anlayışını alıp bir PRD üretir. **Kullanıcıyla röportaj yapma** — bilinenleri sentezle.

Issue tracker konfigürasyonu `docs/agents/issue-tracker.md`'den okunur. Yoksa önce `setup-rubion-skills` çalıştır.

---

## Süreç

### 1. Codebase'i incele

Daha önce yapmadıysan codebase'i keşfet. PRD boyunca projenin domain glossary'sini kullan; dokunduğun alandaki ADR'lere saygı duy. Multi-context projede ilgili modülün `CONTEXT.md`'sini de oku.

### 2. Modüller eskizini çıkar

Implementasyon için inşa edilecek veya değiştirilecek başlıca modülleri belirt. Aktif olarak **deep module** fırsatları ara — basit, test edilebilir, nadiren değişen interface arkasına kapsüllenmiş işlevsellik.

Modülleri kullanıcıya doğrulat: "Bu modüller doğru mu? Hangileri için test bekliyorsun?"

### 3. PRD'yi yaz

Aşağıdaki şablonu kullan. Sonra issue tracker'a yayınla ve `ready-for-agent` etiketini uygula — ek triage gerekmez.

```markdown
## Problem Tanımı

Kullanıcının yaşadığı problem, kullanıcı perspektifinden.

## Çözüm

Problemin çözümü, kullanıcı perspektifinden.

## Kullanıcı Hikâyeleri

Numaralı, uzun bir liste. Format:

1. <Aktör> olarak, <özellik>'i istiyorum, çünkü <fayda>.

Örnek:
1. Sevkiyat planlamacısı olarak, açık siparişlerin önceliklendirilmiş listesini görmek istiyorum, böylece günlük üretim planlamamı doğru sırayla yapabilirim.

Hikâye listesi feature'ın tüm yönlerini kapsamalı.

## Implementasyon Kararları

- İnşa edilecek/değiştirilecek modüller
- Bu modüllerin interface'lerinde değişen kısımlar
- Geliştiriciden gelen teknik netleştirmeler
- Mimari kararlar (yeni ADR gerekirse not düş)
- Şema değişiklikleri
- API contract'ları
- Spesifik etkileşimler

Spesifik dosya yolu veya kod parçacığı YAZMA — bunlar hızla eskir.

İstisna: Bir prototip kararı net ifade eden bir snippet (state machine, reducer, şema, type shape) ürettiyse — inline yaz, "prototipten geldi" notu düş. Sadece karar bilgisi taşıyan kısımlar.

## Test Kararları

- İyi testin tanımı (yalnızca dış davranışı test et, implementasyon detayını değil)
- Hangi modüller test edilecek
- Test'lerin prior art'ı (codebase'de benzer test örnekleri)
- xUnit + FluentAssertions + NSubstitute zaten varsayılan stack
- Integration için Testcontainers (bkz. tdd-dotnet)

## Kapsam Dışı

PRD kapsamı dışında olan şeyler.

## Ek Notlar

Feature ile ilgili ek notlar.
```

### 4. Issue tracker'a yayınla

`docs/agents/issue-tracker.md` GitHub veya Jira tarif ediyor. İlgili komutu kullan:

**GitHub:**

```bash
gh issue create \
  --title "PRD: <feature-adı>" \
  --label "ready-for-agent" \
  --body "$(cat <<'EOF'
<PRD içeriği>
EOF
)"
```

**Jira:**

```bash
BODY=$(cat <<'EOF'
<PRD içeriği — markdown>
EOF
)

PAYLOAD=$(jq -n \
  --arg key "$JIRA_PROJECT_KEY" \
  --arg summary "PRD: <feature-adı>" \
  --argjson description "$(adf_from_markdown "$BODY")" \
  '{
    fields: {
      project: { key: $key },
      summary: $summary,
      description: $description,
      issuetype: { name: "Story" },
      labels: ["ready-for-agent"]
    }
  }')

curl -s -X POST \
  -u "$JIRA_EMAIL:$JIRA_API_TOKEN" \
  -H "Content-Type: application/json" \
  --data "$PAYLOAD" \
  "$JIRA_BASE_URL/rest/api/3/issue" | jq '.key'
```

Yayın sonrası kullanıcıya issue numarasını (`#42` veya `RUB-123`) raporla.

---

## PRD Repo'da da Tutulmalı mı?

İsteğe bağlı ama önerilen: büyük feature'lar için `docs/prd/<feature-kebab>.md` olarak repo'ya da kaydet. PR description'ları "Implements PRD `docs/prd/create-order.md` — Jira RUB-123" şeklinde her ikisini referanslar.

Trade-off:
- **Repo'da tutmak:** PR review sırasında PRD'ye erişim kolay, git geçmişiyle değişiklikler izlenebilir
- **Sadece tracker'da tutmak:** Tek doğru kaynak, senkron kalma derdi yok

---

## Yapma

- ✗ Implementasyon detayı PRD'ye koyma — onlar issue'lara (`to-issues` skill'i) gider
- ✗ "Tüm sistem nasıl çalışmalı" yazmaya çalışma — tek feature'a odaklan
- ✗ Domain glossary dışında terim kullanma — kafa karıştırır
- ✗ Issue tracker'a yayınlamadan önce kullanıcı onayı atlamak — özellikle "ready-for-agent" etiketi otomatik ajan tetikler
