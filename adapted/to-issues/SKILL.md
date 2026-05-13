---
adapted_from: mattpocock/skills/skills/engineering/to-issues
upstream_commit: f304057d61d3df3c9fd992ac2b6e3833cb9325fb
last_reviewed: 2026-05-13
adaptation_level: light
name: to-issues
description: Bir planı, spec'i veya PRD'yi tracer-bullet dikey dilimlere bölerek issue tracker'a (GitHub Issues veya Jira) yazar. Her issue bağımsız alınabilir. "Plan'ı issue'lara böl", "implementation ticket'ları üret", "iş paketle" denildiğinde kullan.
stack: []
---

# To Issues — Rubion

Bir planı **tracer bullet** dikey dilimlerine bölüp issue tracker'a yazar.

Issue tracker konfigürasyonu `docs/agents/issue-tracker.md`'den okunur. Yoksa önce `setup-rubion-skills` çalıştır.

---

## Süreç

### 1. Bağlamı topla

Konuşma bağlamı yeterliyse oradan al. Kullanıcı argüman olarak issue referansı verirse (numara, URL, dosya yolu), issue tracker'dan body + comment'leri çek:

**GitHub:** `gh issue view <num> --comments`
**Jira:** `curl -u "$JIRA_EMAIL:$JIRA_API_TOKEN" "$JIRA_BASE_URL/rest/api/3/issue/<KEY>?fields=summary,description,comment"`

### 2. Codebase'i incele (opsiyonel)

Daha önce incelemediysen yap. Issue başlık ve açıklamalarında domain glossary kullan; ilgili alandaki ADR'lere saygı duy.

### 3. Dikey dilimleri taslakla

Planı **tracer bullet** issue'lara böl. Her issue:
- Tüm katmanları kesen ince ama TAM bir dikey dilim (şema → API → UI → test)
- Tek başına demo edilebilir veya doğrulanabilir
- "Az ve kalın" yerine "çok ve ince"

Dilim türleri:
- **AFK:** Tam spec'li, otomat ajan alıp implementasyona başlayabilir
- **HITL (Human-in-the-loop):** İnsan etkileşimi gerekiyor (mimari karar, tasarım review)

Mümkün oldukça AFK tercih et.

### 4. Kullanıcıya göster, sorgulat

Önerilen kırılımı numaralı liste olarak sun. Her dilim için:
- **Başlık:** kısa, açıklayıcı
- **Tür:** HITL / AFK
- **Blocked by:** hangi dilim önce bitmeli (varsa)
- **Karşılanan user story'ler:** kaynakta varsa hangi user story'leri kapsıyor

Kullanıcıya sor:
- Granülerlik doğru mu? (çok kaba / çok ince)
- Bağımlılık ilişkileri doğru mu?
- Birleştirilmesi/bölünmesi gereken dilim var mı?
- HITL/AFK işaretlemesi doğru mu?

Kullanıcı onaylayana kadar tekrar et.

### 5. Issue'ları tracker'a yayınla

Her onaylanmış dilim için yeni issue oluştur. Dependency sırasıyla yayınla (önce blocker'lar) ki "Blocked by" alanında gerçek issue ID'lerine referans verebilelim.

**Issue body şablonu:**

```markdown
## Parent

[Kaynak issue varsa referans — GitHub: #<num>, Jira: RUB-<num>. Yoksa bölümü atla.]

## Ne inşa edilecek

Bu dikey dilimin kısa açıklaması. Layer-by-layer implementasyon değil, uçtan uca davranış.

Dosya yolu veya kod parçası yazma — eskir. Prototip kararı kodlayan snippet istisna.

## Kabul kriterleri

- [ ] Kriter 1
- [ ] Kriter 2
- [ ] Kriter 3

## Blocked by

- [Bağımlı olduğu issue referansı]

Veya: "Yok — hemen başlanabilir"
```

**Yayınlama komutu:**

**GitHub:**

```bash
gh issue create \
  --title "<dilim başlığı>" \
  --label "ready-for-agent" \
  --body "$(cat <<'EOF'
<issue body>
EOF
)"
# → çıktıda yeni issue URL'i: gh tarafından otomatik #N atanır
```

**Jira:**

```bash
BODY=$(cat <<'EOF'
<issue body>
EOF
)

# Parent linki varsa Subtask, yoksa Task
ISSUE_TYPE="Task"   # veya "Subtask" — parent verilirse

PAYLOAD=$(jq -n \
  --arg key "$JIRA_PROJECT_KEY" \
  --arg summary "<dilim başlığı>" \
  --argjson description "$(adf_from_markdown "$BODY")" \
  --arg type "$ISSUE_TYPE" \
  '{
    fields: {
      project: { key: $key },
      summary: $summary,
      description: $description,
      issuetype: { name: $type },
      labels: ["ready-for-agent"]
    }
  }')

NEW_KEY=$(curl -s -X POST \
  -u "$JIRA_EMAIL:$JIRA_API_TOKEN" \
  -H "Content-Type: application/json" \
  --data "$PAYLOAD" \
  "$JIRA_BASE_URL/rest/api/3/issue" | jq -r '.key')

echo "Created: $NEW_KEY"
```

**Bağımlılık linki (Jira "Blocks"):**

```bash
curl -s -X POST \
  -u "$JIRA_EMAIL:$JIRA_API_TOKEN" \
  -H "Content-Type: application/json" \
  --data '{
    "type": { "name": "Blocks" },
    "inwardIssue":  { "key": "RUB-201" },
    "outwardIssue": { "key": "RUB-200" }
  }' \
  "$JIRA_BASE_URL/rest/api/3/issueLink"
# → RUB-201 blocked by RUB-200
```

### 6. Parent'a dokunma

Parent issue'u **kapatma veya değiştirme**. Yalnızca yeni issue'lar oluştur ve aralarındaki bağımlılıkları kur.

---

## Tracer Bullet Örneği — VSA Bağlamında

Rubion projelerinde tipik bir tracer bullet, bir Vertical Slice'ın tamamı olur:

```
PRD: "Müşteri sipariş oluşturma"
  ↓
Issue 1 (AFK, ready-for-agent):
  Başlık: "CreateOrder feature — Command + Handler + Endpoint + Test"
  Acceptance:
    - [ ] POST /orders 201 dönüyor ve OrderId üretiyor
    - [ ] Geçersiz item miktarı 400 dönüyor
    - [ ] Handler test ve integration test (Testcontainers) yeşil
  Blocked by: yok

Issue 2 (HITL):
  Başlık: "Stok rezervasyonu — Inventory entegrasyonu kararı"
  Acceptance:
    - [ ] ADR: senkron HTTP vs RabbitMQ event kararı
  Blocked by: yok

Issue 3 (AFK, ready-for-agent):
  Başlık: "Order → Inventory event publish (OrderCreated)"
  Acceptance:
    - [ ] OrderCreatedEvent RabbitMQ'ya publish edilir
    - [ ] Sözleşme: payload örneği eklenmiştir
  Blocked by: Issue 1, Issue 2
```

---

## Yapma

- ✗ Layer-by-layer issue üretmek ("Backend için repository yaz", "Frontend için form yaz")
  → Bunlar dikey değil yatay dilim
- ✗ Acceptance criteria yerine "implementation steps" yazmak
- ✗ Issue body'sine dosya yolu / class adı yazmak (kod taşınınca eskir)
- ✗ Tüm issue'ları toplu yayınlamak — kullanıcı onayı olmadan
- ✗ Parent issue'u kapatmak (sadece yeni issue üret, parent'a dokunma)
