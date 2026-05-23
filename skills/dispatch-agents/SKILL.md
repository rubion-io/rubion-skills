---
name: dispatch-agents
description: Bağımsız `ready-for-agent` issue'larını paralel subagent'lara dağıtır — worktree'de scaffold-vsa-feature + tdd-dotnet zinciriyle PR'a götürür. "Paralel implementasyon", "AFK batch" denildiğinde. Sıralı bağımlı işler için kullanma.
stack: []
---

# Dispatch Agents — Rubion

Bağımsız issue'ları paralel ajanlara dağıtarak implementasyon yaptırma orchestrator'ı. Bu skill **kod yazmaz** — yazdırır.

> **Önemli:** Bu skill bir **orchestrator**'dur — Claude Code'un Agent dispatch yeteneğini kullanır.
> Eğer kullandığın araç (Cursor, VS Code Copilot Chat, vb.) paralel subagent desteği vermiyorsa,
> sonundaki "Manuel Mod" bölümüne git.

---

## Ne Zaman Kullanılır?

- [`to-issues`](../../adapted/to-issues/SKILL.md) bir PRD'yi tracer-bullet dilimlere bölmüş, hepsi `ready-for-agent` etiketli
- 3+ bağımsız (birbirini bloklamayan) issue var
- Senin başka bir şey yapman gerek, hepsini sıraya alıp beklemek istemiyorsun

---

## Ne Zaman Kullanılmaz?

- Issue'lar birbiriyle bağlı zincir (hepsi sıralı bağımlı) — paralelizm yok, normal sıra ile yap
- 1-2 issue var — orchestrator overhead'i değmez, manuel implementasyon hızlı
- Critical-path kod (payment, auth, finansal hesaplama) — paralel ajanlardan kalite kontrolü zor, insan review zorunlu
- Aynı modülün aynı dosyalarında değişiklik gerektiren issue'lar — paralel = garantili merge conflict

---

## Ön Koşullar

- **Claude Code v2.x+** ve `Agent` tool'unun subagent dispatch desteği — `isolation: "worktree"` ve `run_in_background: true` parametreleri gerekli. **Cursor'da native çalışmaz** (Manuel Mod bölümünü kullan).
- [`setup-rubion-skills`](../setup-rubion-skills/SKILL.md) çalıştırılmış (`docs/agents/issue-tracker.md` var)
- Git worktree desteği aktif (`git --version` ≥ 2.5)
- Branch koruması: `main` doğrudan push reddediyor (agent'lar feature branch açacak)
- Issue'lar `ready-for-agent` etiketli ve acceptance criteria net yazılı
- CONTEXT.md ve docs/adr/ mevcut (agent'lar oradan referans alır)

---

## Süreç

### 1. Issue'ları Çek

`docs/agents/issue-tracker.md` GitHub mı Jira mı diye okur, uygun komutu çalıştırır.

**GitHub:**

```bash
gh issue list --state open --label "ready-for-agent" \
  --json number,title,body,labels,assignees \
  --jq '[.[] |
    {
      id: ("#" + (.number | tostring)),
      number,
      title,
      body,
      assigned: (.assignees | length > 0),
      stack: ([.labels[].name | select(startswith("stack:"))] | first // "unknown"),
      blockedBy: [.body | scan("(?i)blocked by #([0-9]+)") | .[0] | tonumber]
    }
  ]'
```

**Jira (Atlassian MCP bağlıysa — tercih edilen):**

```
searchJiraIssuesUsingJql({
  cloudId: "<CLOUD_ID>",
  jql: "project=<KEY> AND labels=\"ready-for-agent\" AND statusCategory!=Done AND assignee is EMPTY",
  fields: ["summary", "status", "labels", "issuelinks", "description"]
})
```

`stack` alanı için: her issue'nun `labels` dizisinde `stack:` ile başlayan etiketi bul.

**Jira (curl fallback):**

```bash
JQL="project=$JIRA_PROJECT_KEY AND labels=\"ready-for-agent\" AND statusCategory!=Done AND assignee is EMPTY"
ENCODED=$(jq -nr --arg q "$JQL" '$q | @uri')

curl -s -u "$JIRA_EMAIL:$JIRA_API_TOKEN" \
  "$JIRA_BASE_URL/rest/api/3/search?jql=$ENCODED&fields=summary,status,labels,issuelinks,description" \
  | jq '[.issues[] |
    {
      id: .key,
      key,
      title: .fields.summary,
      body: .fields.description,
      stack: ([.fields.labels[] | select(startswith("stack:"))] | first // "unknown"),
      blockedBy: [
        .fields.issuelinks[]
        | select(.type.name == "Blocks" and .inwardIssue != null)
        | .inwardIssue.key
      ]
    }
  ]'
```

### 2. Bağımlılık Grafiğini Hesapla

Her issue için `blockedBy` listesi var. **Çalışılabilir** olanları belirle:

```
Bir issue çalışılabilirse:
  - Tüm blockedBy'ları kapanmış (closed / Done)
  - VE kendisi assigned değil
  - VE kendisi açık (open / not Done)
```

Devre tespiti: bağımlılık döngüsü varsa (`A blocked by B` AND `B blocked by A`) — durup kullanıcıya raporla.

### 3. Kullanıcıya Planı Sun

Önce **dağıtım planı** olarak göster, dispatch etme:

```
Hazır (paralel başlanacak):                              Bloke (bekliyor):
  #142 [stack:dotnet] — Müşteri kredi limiti kontrolü    #145 — Email bildirimi (blocked by #142)
  #143 [stack:dotnet] — Sipariş PDF üretimi              #146 — Audit log (blocked by #143)
  #144 [stack:react]  — Sipariş özeti sayfası

Skill routing:
  #142 → scaffold-vsa-feature + tdd-dotnet
  #143 → scaffold-vsa-feature + tdd-dotnet
  #144 → tdd-react

Eşzamanlı limit: 3 (varsayılan)
Tahmini token kullanımı: ~150K × 3 = ~450K total
Tahmini süre: 30-60 dk (paralel)

Devam edilsin mi? [evet/hayır/limiti değiştir]
```

Kullanıcı onayı **zorunlu**. Otomatik dispatch yapma.

### 4. Per-Agent Prompt Hazırla

Her seçilen issue için **standart şablon** doldurulur — issue body + acceptance criteria + ortak kısıtlar (sadece scope, main'e dokunma, draft PR fallback, vb.).

Tam şablon + slug türetme kuralları → **[examples/02-per-agent-prompt-template.md](examples/02-per-agent-prompt-template.md)**

### 5. Subagent'ları Dispatch Et

Claude Code'un `Agent` aracını **paralel** çağır. Her biri için:

```
Agent({
  description: "Implement <ISSUE-ID>",
  subagent_type: "general-purpose",
  isolation: "worktree",
  run_in_background: true,
  prompt: "<yukarıdaki şablon, doldurulmuş>"
})
```

**Eşzamanlı limit:** Varsayılan **3**. Kullanıcı limiti değiştirebilir (1-5 arası mantıklı). Daha fazla = token maliyeti hızlı tırmanır + Docker spin-up çakışmaları.

**Paralel çalıştırma:** Aynı mesajda birden fazla `Agent` çağrısı yap. Background mode'da çalışırlar, sen başka iş görebilirsin.

### 6. Sonuçları Topla ve Raporla

Subagent'lar bitince her birinden bir özet dönecek. Şu formatta birleştir:

```
Dispatch Raporu (4 agent, 47 dk)

Tamamlandı (2):
  ✓ #142 — Müşteri kredi limiti kontrolü
      PR: https://github.com/rubion-io/.../pull/89 (Closes #142)
      5 test eklendi, 2 dosya değişti
  ✓ #143 — Sipariş PDF üretimi
      PR: https://github.com/rubion-io/.../pull/90 (Closes #143)
      Migration: 20260513_AddPdfTemplate.cs, ef-core-migration-review GEÇTİ

Draft PR (1, yarım kaldı):
  ⚠ #144 — Stok rezervasyon servisi
      PR: https://github.com/rubion-io/.../pull/91 (Draft)
      Neden: Inventory context'inde IReservationStore interface'i yok
              — bu önce kararlaştırılmalı (ADR gerekebilir)

Hala blokeli (2):
  #145 (blocked by #142) — şimdi unblock oldu, yeniden dispatch edilebilir
  #146 (blocked by #143) — şimdi unblock oldu, yeniden dispatch edilebilir

Sonraki adım:
  - Draft PR #91 — kullanıcı kararı bekliyor
  - dispatch-agents tekrar çalıştırılırsa #145 + #146 alınır
```

---

## Eşzamanlı Limit ve Kontroller

| Kontrol | Varsayılan | Neden |
|---|---|---|
| Max concurrent agent | 3 | Token maliyeti + Docker/build çakışması |
| Per-agent zaman aşımı | 60 dk | Sonsuz loop riski |
| Critical-path tespiti | Otomatik | `auth/`, `payment/`, `billing/` klasörleri içeren issue'lar manuel onay ister |
| Aynı modülde paralel agent | Engelle | Aynı `<Module>/<Feature>/` altında değişiklik yapacak iki agent serileştir |

Critical-path tespiti basit heuristic: issue body'sinde veya değişeceği tahmin edilen modül adlarında şu kelimeler var mı: `auth`, `authn`, `authz`, `payment`, `billing`, `pricing`, `gdpr`, `kvkk`, `security`. Varsa kullanıcıdan açık onay iste.

---

## Hata Senaryoları ve Çözümleri

| Hata | Çözüm |
|---|---|
| Agent worktree'de stuck | Zaman aşımı 60 dk → process kapat, branch'i `_abandoned/<slug>` olarak rename'le, kullanıcıya raporla |
| Agent test başarısız bırakıyor | PR'ı Draft'ta aç, açıklamayı body'ye koy, etiket: `needs-human` |
| İki agent merge conflict üretti | Toplama aşamasında `git fetch` yap, conflict'i raporla. **Otomatik çözmeye çalışma.** |
| Issue tracker erişim hatası (Jira 401) | Hemen dur, kullanıcıya bildir — token süresi dolmuş olabilir |
| Bağımlılık döngüsü tespit edildi | Dispatch'i başlatma; etkilenen issue'ların listesini sun, manuel müdahale iste |

---

## Yapma

- ✗ Onay almadan dispatch et — her zaman planı önce göster
- ✗ Critical-path issue'ları sessizce paralel ata — manuel onay iste
- ✗ Çakışacağı belli olan iki issue'u (aynı dosya/modül) paralel başlat — serileştir veya kullanıcıya sor
- ✗ Başarısız agent'ın branch'ini sil — debug için kalsın, `_abandoned/` prefix'iyle ayır
- ✗ Aynı issue'u iki agent'a aynı anda gönder (assignee kontrolü zorunlu)
- ✗ `main` veya `develop`'a doğrudan push etmesine izin ver — daima feature branch + PR
- ✗ Otomatik PR merge — sadece açar, merge insan kararı

---

## Karşı Pattern: Manuel Mod

Bazı durumlarda `dispatch-agents` overkill olur. Manuel yol:

1. `to-issues` ile 5 issue oluştur
2. Sen 3 Claude Code penceresi aç (ayrı terminal/tab)
3. Her birine: "`gh issue view #142` ile bağlamı al, sonra scaffold-vsa-feature + tdd-dotnet ile implementasyonu yap"
4. Sen aralarında geçiş yap, takıldıklarında müdahale et

Bu daha düşük ceiling, daha yüksek kontrol. İlk birkaç sefer **manuel başla**, pattern'i öğren, sonra `dispatch-agents` kullan.

