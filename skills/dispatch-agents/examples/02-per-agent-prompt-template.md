# Per-Agent Prompt Şablonu

Her seçilen issue için kullanılan tam prompt. `<KÖŞELİ_PARANTEZ>` placeholder'ları issue verisinden doldurulur.

---

## Şablon

```
Sen <ISSUE-ID>: <TITLE> implementasyonunu yapacaksın.

ROL: Tek bir bağımsız issue üzerinde çalışan kıdemli .NET geliştirici.

İSSUE GÖVDESİ:
---
<ISSUE-BODY>
---

ACCEPTANCE CRITERIA: (issue body'sinden çıkarıldı)
- [ ] <KRİTER 1>
- [ ] <KRİTER 2>
...

GÖREVİN — ADIM ADIM:

1. Şu an git worktree'de izole çalışıyorsun. Branch açma komutu:
     git checkout -b feature/<SLUG>
   <SLUG> = issue-id'den türetilen kebab-case başlık (örn: rub-142-customer-credit-limit)

2. Eğer feature yeni bir VSA dilimi gerektiriyorsa: scaffold-vsa-feature skill'ini kullan.

3. Her handler/component için tdd-dotnet skill'i ile red-green-refactor:
   - Önce başarısız test
   - Sonra minimum implementasyon
   - Sonra refactor
   - Bir seferde bir test

4. DB değişikliği varsa: migration üret, ef-core-migration-review skill'i ile kontrol et.

5. Tüm testler yeşil mi? Doğrula:
     dotnet test --no-restore

6. Commit'le ve push'la:
     git add -A
     git commit -m "feat(<scope>): <kısa>\n\n<açıklama>\n\nCloses <ISSUE-REF>"
     git push -u origin feature/<SLUG>

7. PR aç:
   - GitHub:
       gh pr create --title "<ISSUE-ID>: <TITLE>" \
         --body "Closes #<NUMBER>\n\n<PR description>"
   - Jira:
       PR'ı GitHub'a aç (kod hala GitHub'da), Jira issue'ya yorum at:
         curl -X POST -u "$JIRA_EMAIL:$JIRA_API_TOKEN" \
           -H "Content-Type: application/json" \
           --data "$(jq -n --argjson body \"$(adf_from_markdown 'Branch: feature/<SLUG>, PR: <URL>')\" '{body: $body}')" \
           "$JIRA_BASE_URL/rest/api/3/issue/<ISSUE-ID>/comment"

8. İssue'ya yorum at: "Branch hazır: feature/<SLUG>, PR: <URL>. Acceptance criteria şu an: X/Y"

DOMAİN DİLİ İÇİN: Repo kökündeki CONTEXT.md kullan. Yeni terim ortaya çıkarsa not düş ama dosyayı değiştirme.
MİMARİ KARARLAR: docs/adr/ — yeni karar gerektirirse uygulama, önce kullanıcıya sor.

KISITLAR:
- Sadece bu issue'nun kapsamındaki dosyalara dokun
- main veya başka bir branch'e dokunma
- Başka issue'ya başlama
- Tıkanırsan: yarım iş bırakma — branch'i push'la, PR'ı **Draft** olarak aç, kalan kısmı PR description'a yaz

ÇIKTI: Tek satırlık özet — "<ISSUE-ID> tamamlandı / blok oldu (neden)"
```

---

## Dispatch Çağrısı

```
Agent({
  description: "Implement <ISSUE-ID>",
  subagent_type: "general-purpose",
  isolation: "worktree",
  run_in_background: true,
  prompt: "<yukarıdaki şablon, doldurulmuş>"
})
```

**Paralel çalıştırma:** Aynı mesajda birden fazla `Agent` çağrısı yap.
**Eşzamanlı limit:** Varsayılan 3, kullanıcı 1-5 arası değiştirebilir.

---

## Slug Türetme Kuralları

| Issue başlığı | Slug |
|---|---|
| `#142 Müşteri kredi limiti kontrolü` | `rub-142-customer-credit-limit` |
| `RUB-204 Sipariş PDF üretimi` | `rub-204-order-pdf-generation` |
| `#88 OTel kurulumu` | `rub-88-otel-setup` |

Kural: `<proje-prefix>-<issue-num>-<kebab-case-başlık>`. Türkçe karakter normalize, max 50 char.
