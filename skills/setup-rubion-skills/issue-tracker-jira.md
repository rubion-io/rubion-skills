# Issue Tracker: Jira

Bu projenin issue'ları ve PRD'leri Atlassian Jira Cloud'da yaşar. Tüm işlemler REST API + API token üzerinden `curl` ile yapılır.

## Ön Koşullar

Aşağıdaki environment variable'lar tanımlı olmalı:

```bash
JIRA_BASE_URL      # https://your-domain.atlassian.net
JIRA_EMAIL         # Jira hesabının email adresi
JIRA_API_TOKEN     # https://id.atlassian.com/manage-profile/security/api-tokens
JIRA_PROJECT_KEY   # Jira proje anahtarı, örn: RUB, INV, PROD
```

**Asla repo'ya commit'lenmemeli.** `.env` `.gitignore`'da olmalı.

Doğrulama:

```bash
curl -s -u "$JIRA_EMAIL:$JIRA_API_TOKEN" \
  "$JIRA_BASE_URL/rest/api/3/myself" | jq '.displayName'
# → Email'in sahibinin adı dönmeli
```

---

## Önemli: Jira ADF Formatı

Jira Cloud'da `description` alanı **markdown değildir** — Atlassian Document Format (ADF), JSON tabanlı yapılı bir format.

Pratik için skill'ler şu yardımcı bash function'ı kullanır:

```bash
# Markdown benzeri metni ADF doc'a sarar
adf_doc() {
  local text="$1"
  jq -n --arg t "$text" '{
    type: "doc",
    version: 1,
    content: [{
      type: "paragraph",
      content: [{ type: "text", text: $t }]
    }]
  }'
}
```

Çok satırlı / başlıklı içerik için her satırı ayrı `paragraph` yapan zenginleştirilmiş versiyon:

```bash
adf_from_markdown() {
  local md="$1"
  jq -Rs --arg md "$md" '
    $md
    | split("\n\n")
    | map({
        type: "paragraph",
        content: [{ type: "text", text: . }]
      })
    | { type: "doc", version: 1, content: . }
  ' <<< ""
}
```

---

## Komut Sözlüğü

### Issue oluştur

```bash
# Önce body'yi bir değişkene al
BODY=$(cat <<'EOF'
## What to build
Bir feature açıklaması...

## Acceptance criteria
- Kriter 1
- Kriter 2
EOF
)

# Sonra payload'ı oluşturup gönder
PAYLOAD=$(jq -n \
  --arg key "$JIRA_PROJECT_KEY" \
  --arg summary "İssue başlığı" \
  --argjson description "$(adf_from_markdown "$BODY")" \
  '{
    fields: {
      project: { key: $key },
      summary: $summary,
      description: $description,
      issuetype: { name: "Task" }
    }
  }')

curl -s -X POST \
  -u "$JIRA_EMAIL:$JIRA_API_TOKEN" \
  -H "Content-Type: application/json" \
  --data "$PAYLOAD" \
  "$JIRA_BASE_URL/rest/api/3/issue" | jq '.key'
# → "RUB-123" gibi yeni issue anahtarı döner
```

### Issue oku

```bash
curl -s -u "$JIRA_EMAIL:$JIRA_API_TOKEN" \
  "$JIRA_BASE_URL/rest/api/3/issue/RUB-123" \
  | jq '{
      key,
      summary: .fields.summary,
      status: .fields.status.name,
      labels: .fields.labels,
      description: .fields.description
    }'
```

### Issue listele (filtreli)

JQL ile sorgu:

```bash
# Açık, "ready-for-agent" etiketli, mevcut projedeki issue'lar
JQL="project=$JIRA_PROJECT_KEY AND labels=\"ready-for-agent\" AND statusCategory!=Done"
ENCODED=$(jq -nr --arg q "$JQL" '$q | @uri')

curl -s -u "$JIRA_EMAIL:$JIRA_API_TOKEN" \
  "$JIRA_BASE_URL/rest/api/3/search?jql=$ENCODED&fields=summary,status,labels" \
  | jq '.issues[] | {key, summary: .fields.summary, status: .fields.status.name}'
```

### Yorum ekle

```bash
COMMENT_BODY="Bu issue üzerinde çalışmaya başlıyorum."

PAYLOAD=$(jq -n --argjson body "$(adf_from_markdown "$COMMENT_BODY")" \
  '{ body: $body }')

curl -s -X POST \
  -u "$JIRA_EMAIL:$JIRA_API_TOKEN" \
  -H "Content-Type: application/json" \
  --data "$PAYLOAD" \
  "$JIRA_BASE_URL/rest/api/3/issue/RUB-123/comment"
```

### Etiket ekle / kaldır

```bash
# Ekle
curl -s -X PUT \
  -u "$JIRA_EMAIL:$JIRA_API_TOKEN" \
  -H "Content-Type: application/json" \
  --data '{
    "update": {
      "labels": [{ "add": "ready-for-agent" }]
    }
  }' \
  "$JIRA_BASE_URL/rest/api/3/issue/RUB-123"

# Kaldır
curl -s -X PUT \
  -u "$JIRA_EMAIL:$JIRA_API_TOKEN" \
  -H "Content-Type: application/json" \
  --data '{
    "update": {
      "labels": [{ "remove": "needs-triage" }]
    }
  }' \
  "$JIRA_BASE_URL/rest/api/3/issue/RUB-123"
```

### Issue'u parent ile bağla (Story → Subtask veya Epic Link)

```bash
# Subtask bağı (parent field)
curl -s -X POST \
  -u "$JIRA_EMAIL:$JIRA_API_TOKEN" \
  -H "Content-Type: application/json" \
  --data "$(jq -n \
    --arg key "$JIRA_PROJECT_KEY" \
    --arg parent "RUB-100" \
    --arg summary "Subtask başlığı" \
    '{
      fields: {
        project: { key: $key },
        parent: { key: $parent },
        summary: $summary,
        issuetype: { name: "Subtask" }
      }
    }')" \
  "$JIRA_BASE_URL/rest/api/3/issue"

# "Blocks" linki
curl -s -X POST \
  -u "$JIRA_EMAIL:$JIRA_API_TOKEN" \
  -H "Content-Type: application/json" \
  --data '{
    "type": { "name": "Blocks" },
    "inwardIssue":  { "key": "RUB-200" },
    "outwardIssue": { "key": "RUB-201" }
  }' \
  "$JIRA_BASE_URL/rest/api/3/issueLink"
# → RUB-200 is blocked by RUB-201
```

### Durum (status) değiştir

Status değişimi `transition` API'sı üzerinden. Önce mevcut transition'ları öğren:

```bash
curl -s -u "$JIRA_EMAIL:$JIRA_API_TOKEN" \
  "$JIRA_BASE_URL/rest/api/3/issue/RUB-123/transitions" \
  | jq '.transitions[] | {id, name}'
```

Sonra uygun ID ile uygula:

```bash
curl -s -X POST \
  -u "$JIRA_EMAIL:$JIRA_API_TOKEN" \
  -H "Content-Type: application/json" \
  --data '{ "transition": { "id": "31" } }' \
  "$JIRA_BASE_URL/rest/api/3/issue/RUB-123/transitions"
```

---

## Skill Yönlendirmeleri

| Skill der ki | Yapılacak |
|---|---|
| "issue tracker'a yayınla" | `POST /rest/api/3/issue` |
| "ilgili ticket'ı çek" | `GET /rest/api/3/issue/<key>` |
| "etiket uygula" | `PUT /rest/api/3/issue/<key>` with `update.labels` |
| "parent issue'a referans" | `parent.key` field veya issueLink |

---

## Etiket Sözlüğü

Rubion projelerinde standart Jira label'ları (custom field olarak değil, native `labels`):

- `ready-for-agent` — tam spec, AFK ajan alabilir
- `ready-for-human` — insan implementasyonu gerekiyor
- `needs-triage` — değerlendirme bekliyor
- `needs-info` — reporter'dan bilgi bekliyor
- `wontfix` — yapılmayacak

> Jira label'ları boşluk içeremez — `-` ile ayır.

Etiketlerin Jira projesinde varlığı `issuetype` veya `status` gibi metadata gerektirmez; ilk kullanıldığında otomatik oluşur.

---

## Sorun Giderme

| Hata | Sebep / Çözüm |
|---|---|
| `401 Unauthorized` | API token süresi dolmuş veya yanlış. Yeniden üret. |
| `403 Forbidden` | Hesabın projeye erişim yetkisi yok. Admin'e sor. |
| `400 Bad Request — description not ADF` | Description ham string olarak gönderilmiş. `adf_from_markdown` yardımcısını kullan. |
| `400 — issuetype required` | Payload'da `issuetype.name` eksik. `Task`, `Story`, `Bug`, `Subtask` yaygın değerler. |
| `404 — project not found` | `JIRA_PROJECT_KEY` yanlış veya hesabın projeye erişimi yok. |
| Türkçe karakterler bozuk | `-H "Content-Type: application/json; charset=utf-8"` ekle. |
