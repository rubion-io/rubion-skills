---
adapted_from: mattpocock/skills/skills/engineering/to-issues
upstream_commit: f304057d61d3df3c9fd992ac2b6e3833cb9325fb
last_reviewed: 2026-05-23
adaptation_level: medium
name: to-issues
description: Bir planı, spec'i veya PRD'yi tracer-bullet dikey dilimlere bölerek issue tracker'a (GitHub Issues veya Jira) yazar. Her issue bağımsız alınabilir. Stack etiketi (stack:dotnet / stack:react / stack:react-native) otomatik çıkarılır — dispatch-agents bu etiketi skill routing için kullanır. "Plan'ı issue'lara böl", "implementation ticket'ları üret", "iş paketle" denildiğinde kullan.
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

### 3.5 Her dilim için stack etiketini çıkar

Her issue taslağı için aşağıdaki kurala göre **tek bir stack etiketi** belirle.
Etiket `dispatch-agents` tarafından skill routing için kullanılır.

| Etiket | Sinyal kelimeler (başlık + body içinde ara) |
|---|---|
| `stack:dotnet` | Handler, Controller, Command, Query, MediatR, xUnit, EF Core, migration, Endpoint, Middleware, Worker, Repository, NSubstitute, FluentAssertions, Testcontainers, .NET, API (backend bağlamında) |
| `stack:react` | component, hook, React, Vitest, RTL, MSW, TanStack Query, form, page, UI, web frontend |
| `stack:react-native` | React Native, RN, Expo, screen, navigation, AsyncStorage, Maestro, mobile |

Kurallar:
- **`stack:mixed` etiketi kullanılmaz.** Hem backend hem frontend sinyali aynı anda tespit edilirse dilimi otomatik olarak **ayrı iki issue'ya böl**:
  - `<Başlık> — Backend` → `stack:dotnet`
  - `<Başlık> — Frontend` → `stack:react` veya `stack:react-native`
  - Frontend issue, backend issue'ya `blocked by` olarak bağlanır (API hazır olmadan UI yapılamaz)
- Tespit edilemezse kullanıcıya sor — varsayılan atama yapma
- HITL issue'lara da etiket ekle — dispatch-agents görmez ama filtrelemek için kullanışlı
- React Native + React aynı anda varsa da ikiye böl: `stack:react` ve `stack:react-native` ayrı issue

### 3.6 Her dilim için paralellik ve başlangıç kriterini belirle

Her issue taslağı için şu iki soruyu yanıtla:

**A) Paralel çalışabilir mi?**
Aynı anda başlanabilecek diğer issue'ları listele.
Kural: aralarında `blocked by` ilişkisi olmayan VE aynı dosya/modülü değiştirmeyen issue'lar paralel çalışabilir.
Kimseyle paralel değilse: "Yok" yaz.

**B) Başlangıç kriteri nedir?** (`blocked by` varsa zorunlu)
Blocker issue'nun hangi spesifik kabul kriterinin tamamlanması bu issue'yu başlatır?
- Issue tamamen bitmesini bekleme — sadece gerekli kriter yeterli
- Örnek: "MERP-12 → 'POST /orders 201 dönüyor' kriteri yeşil olunca"
- Birden fazla blocker varsa her biri için ayrı kriter yaz

### 4. Kullanıcıya göster, sorgulat

Önerilen kırılımı numaralı liste olarak sun. Her dilim için:
- **Başlık:** kısa, açıklayıcı
- **Tür:** HITL / AFK
- **Stack:** tespit edilen etiket (`stack:dotnet` / `stack:react` / `stack:react-native`)
- **Paralel çalışabilir:** hangi issue'larla eş zamanlı başlanabilir
- **Blocked by:** hangi dilim önce bitmeli (varsa)
- **Başlangıç kriteri:** blocker'ın hangi kriteri tamamlanınca bu başlar
- **Karşılanan user story'ler:** kaynakta varsa hangi user story'leri kapsıyor

Kullanıcıya sor:
- Granülerlik doğru mu? (çok kaba / çok ince)
- Bağımlılık ilişkileri doğru mu? (özellikle otomatik bölünen backend→frontend çiftleri)
- Birleştirilmesi/bölünmesi gereken dilim var mı?
- HITL/AFK işaretlemesi doğru mu?
- Stack etiketleri doğru mu?
- Paralel çalışabilirlik ve başlangıç kriterleri doğru mu?

Kullanıcı onaylayana kadar tekrar et.

### 5. Issue'ları tracker'a yayınla

Her onaylanmış dilim için yeni issue oluştur. Dependency sırasıyla yayınla (önce blocker'lar) ki "Blocked by" alanında gerçek issue ID'lerine referans verebilelim.

**Issue body şablonu:**

```markdown
## Parent

[Kaynak issue varsa referans — GitHub: #<num>, Jira: MERP-<num>. Yoksa bölümü atla.]

## Ne inşa edilecek

Bu dikey dilimin kısa açıklaması. Layer-by-layer implementasyon değil, uçtan uca davranış.

Dosya yolu veya kod parçası yazma — eskir. Prototip kararı kodlayan snippet istisna.

## Kabul kriterleri

- [ ] Kriter 1
- [ ] Kriter 2
- [ ] Kriter 3

## Paralel çalışabilir

- [Aynı anda başlanabilecek issue referansları]

Veya: "Yok"

## Blocked by

- [Bağımlı olduğu issue referansı]

Veya: "Yok — hemen başlanabilir"

## Başlangıç kriteri

[Sadece "Blocked by" dolu ise yaz. Her blocker için hangi kabul kriteri tamamlanınca bu issue başlayabilir.]

- <BLOCKER-ID> → "<spesifik kabul kriteri>"

Veya: bölümü atla (blocked by yok ise)
```

**Yayınlama komutu:**

**GitHub:**

```bash
# STACK_LABEL = "stack:dotnet" | "stack:react" | "stack:react-native" | "stack:mixed"
gh issue create \
  --title "<dilim başlığı>" \
  --label "ready-for-agent" \
  --label "<STACK_LABEL>" \
  --body "$(cat <<'EOF'
<issue body>
EOF
)"
# → çıktıda yeni issue URL'i: gh tarafından otomatik #N atanır
```

**Jira:**

Atlassian MCP bağlıysa (tercih edilen):

```
createJiraIssue({
  cloudId: "<CLOUD_ID>",
  projectKey: "<JIRA_PROJECT_KEY>",
  summary: "<dilim başlığı>",
  issueType: "Task",          // parent varsa "Subtask"
  description: "<issue body>",
  labels: ["ready-for-agent", "<STACK_LABEL>"]
})
```

Atlassian MCP yoksa curl ile:

```bash
BODY=$(cat <<'EOF'
<issue body>
EOF
)

# STACK_LABEL = "stack:dotnet" | "stack:react" | "stack:react-native" | "stack:mixed"
# Parent linki varsa Subtask, yoksa Task
ISSUE_TYPE="Task"   # veya "Subtask" — parent verilirse

PAYLOAD=$(jq -n \
  --arg key "$JIRA_PROJECT_KEY" \
  --arg summary "<dilim başlığı>" \
  --argjson description "$(adf_from_markdown "$BODY")" \
  --arg type "$ISSUE_TYPE" \
  --arg stack "<STACK_LABEL>" \
  '{
    fields: {
      project: { key: $key },
      summary: $summary,
      description: $description,
      issuetype: { name: $type },
      labels: ["ready-for-agent", $stack]
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

Rubion projelerinde tipik bir tracer bullet, bir Vertical Slice'ın tamamı olur.
Backend + Frontend sinyali aynı anda tespit edilince **otomatik bölünür**:

```
PRD: "Müşteri sipariş oluşturma"
  ↓
Issue 1 (AFK, ready-for-agent) [stack:dotnet]:
  Başlık: "CreateOrder — Backend: Command + Handler + Endpoint + Test"
  Acceptance:
    - [ ] POST /orders 201 dönüyor ve OrderId üretiyor
    - [ ] Geçersiz item miktarı 400 dönüyor
    - [ ] Handler test ve integration test (Testcontainers) yeşil
  Paralel çalışabilir: Issue 3 ile
  Blocked by: yok
  Başlangıç kriteri: —

Issue 2 (AFK, ready-for-agent) [stack:react]:
  Başlık: "CreateOrder — Frontend: Sipariş formu UI + TanStack Query entegrasyonu"
  Acceptance:
    - [ ] Form POST /orders endpoint'ini çağırıyor
    - [ ] Başarılı siparişte onay ekranı açılıyor
    - [ ] Hata durumunda inline validation mesajı gösteriliyor
    - [ ] RTL testleri yeşil
  Paralel çalışabilir: yok
  Blocked by: Issue 1
  Başlangıç kriteri: Issue 1 → "POST /orders 201 dönüyor ve OrderId üretiyor" ✅ olunca
                     (Issue 1 tamamen bitmesini beklemeye gerek yok)

Issue 3 (HITL) [stack:dotnet]:
  Başlık: "Stok rezervasyonu — Inventory entegrasyonu kararı"
  Acceptance:
    - [ ] ADR: senkron HTTP vs RabbitMQ event kararı
  Paralel çalışabilir: Issue 1 ile
  Blocked by: yok
  Başlangıç kriteri: —

Issue 4 (AFK, ready-for-agent) [stack:dotnet]:
  Başlık: "Order → Inventory event publish (OrderCreated)"
  Acceptance:
    - [ ] OrderCreatedEvent RabbitMQ'ya publish edilir
    - [ ] Sözleşme: payload örneği eklenmiştir
  Paralel çalışabilir: yok
  Blocked by: Issue 1, Issue 3
  Başlangıç kriteri: Issue 1 → "POST /orders 201 dönüyor" ✅ olunca
                     Issue 3 → ADR kararı kapandıktan sonra (Issue 3 tamamen Done)
```

---

## Yapma

- ✗ Layer-by-layer issue üretmek ("Backend için repository yaz", "Frontend için form yaz")
  → Bunlar dikey değil yatay dilim
- ✗ Acceptance criteria yerine "implementation steps" yazmak
- ✗ Issue body'sine dosya yolu / class adı yazmak (kod taşınınca eskir)
- ✗ Tüm issue'ları toplu yayınlamak — kullanıcı onayı olmadan
- ✗ Parent issue'u kapatmak (sadece yeni issue üret, parent'a dokunma)
