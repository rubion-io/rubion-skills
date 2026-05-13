# Örnek: 5 Issue, 3 Bağımsız, Paralel Dispatch

Senaryo: Bir önceki sprint'te `to-issues` bir PRD'yi 5 alt task'a böldü. Hepsi `ready-for-agent` etiketli, Jira'da `RUB-142` ile `RUB-146` arası.

## Başlangıç Durumu

```
RUB-142 — Müşteri kredi limiti kontrolü        Blocked by: -
RUB-143 — Sipariş PDF üretimi                  Blocked by: -
RUB-144 — Stok rezervasyon servisi             Blocked by: -
RUB-145 — Email bildirimi                      Blocked by: RUB-142
RUB-146 — Audit log entegrasyonu               Blocked by: RUB-143
```

---

## Kullanıcı promptu

> _"`dispatch-agents` skill'ini çalıştır. Hepsi ready-for-agent etiketli."_

---

## 1. İssue Çekme

Skill `docs/agents/issue-tracker.md`'yi okur → "Jira" görür → JQL sorgusu yapar:

```bash
JQL='project=RUB AND labels="ready-for-agent" AND statusCategory!=Done AND assignee is EMPTY'
```

5 issue döner, hepsinin `issuelinks.Blocks` alanları parse edilir.

---

## 2. Dispatch Planı (kullanıcıya sunulur)

```
Hazır (paralel başlanacak):              Bloke (bekliyor):
  RUB-142 — Müşteri kredi limiti          RUB-145 — Email bildirimi
                                            (blocked by RUB-142)
  RUB-143 — Sipariş PDF üretimi           RUB-146 — Audit log
                                            (blocked by RUB-143)
  RUB-144 — Stok rezervasyon servisi

Eşzamanlı limit: 3
Critical-path uyarısı: yok
Tahmini token: ~150K × 3 = ~450K total
Tahmini süre: 30-60 dk

Devam? [evet]
```

Kullanıcı: `evet`

---

## 3. Paralel Dispatch

Üç `Agent` çağrısı **tek mesajda** yapılır (paralel başlasın):

```
Agent({
  description: "Implement RUB-142",
  isolation: "worktree",
  run_in_background: true,
  prompt: "<RUB-142 için tam prompt — issue body, AC'ler, talimat>"
})
Agent({
  description: "Implement RUB-143",
  isolation: "worktree",
  run_in_background: true,
  prompt: "<RUB-143 için tam prompt>"
})
Agent({
  description: "Implement RUB-144",
  isolation: "worktree",
  run_in_background: true,
  prompt: "<RUB-144 için tam prompt>"
})
```

---

## 4. Agent'ların İçinde Ne Olur

Her agent kendi worktree'sinde:

**RUB-142 agent:**
```
git checkout -b feature/rub-142-customer-credit-limit
# scaffold-vsa-feature → CustomerCreditCheck Command + Handler + Validator + Endpoint
# tdd-dotnet → 5 test, sırayla red-green-refactor
# git commit + push
gh pr create --title "RUB-142: Müşteri kredi limiti kontrolü" --body "Closes #142..."
# Jira yorum: "Branch: feature/rub-142-..., PR: ...pull/89"
# ÇIKTI: "RUB-142 tamamlandı"
```

**RUB-143 agent:**
```
git checkout -b feature/rub-143-order-pdf-generation
# Yeni paket eklemiş: QuestPDF
# Migration üretmiş: PdfTemplate tablosu
# ef-core-migration-review → "GEÇTİ"
# 3 test eklemiş
# PR açık
# ÇIKTI: "RUB-143 tamamlandı"
```

**RUB-144 agent:**
```
git checkout -b feature/rub-144-stock-reservation
# Yeni service'e başlamış ama: IReservationStore interface'i için
# ADR gerekiyor (event-sourced mu, snapshot mu?)
# Branch'i push'ladı, PR'ı Draft olarak açtı
# ÇIKTI: "RUB-144 yarım kaldı (IReservationStore mimari kararı gerekli)"
```

---

## 5. Final Rapor

```
Dispatch Raporu (3 agent, 47 dk)

Tamamlandı (2):
  ✓ RUB-142 — Müşteri kredi limiti kontrolü
      PR: https://github.com/rubion-io/.../pull/89
      Closes #142, 5 test, 2 dosya
  ✓ RUB-143 — Sipariş PDF üretimi
      PR: https://github.com/rubion-io/.../pull/90
      Closes #143, migration: 20260513_AddPdfTemplate.cs

Draft PR (1, yarım kaldı):
  ⚠ RUB-144 — Stok rezervasyon servisi
      PR: https://github.com/rubion-io/.../pull/91 (Draft)
      Neden: IReservationStore interface kararı gerekli — ADR önerisi:
              "Stok rezervasyonu event-sourced mı, snapshot tabloda mı tutulacak?"

Şimdi unblock (2 — bir sonraki dispatch'te alınabilir):
  RUB-145 — Email bildirimi (RUB-142 tamamlandı)
  RUB-146 — Audit log (RUB-143 tamamlandı)

Önerilen sonraki adım:
  1. PR #89 ve #90 review et + merge
  2. RUB-144 için ADR konuşmasına gir (grill-with-docs)
  3. RUB-145 ve RUB-146 için dispatch-agents tekrar çalıştır
```

---

## Maliyet Analizi (Gerçekleşen)

| Agent | Süre | Token (in/out) | Sonuç |
|---|---|---|---|
| RUB-142 | 18 dk | 145K / 38K | ✓ |
| RUB-143 | 22 dk | 168K / 45K | ✓ |
| RUB-144 | 31 dk | 195K / 28K | Draft (ADR gerekli) |

**Toplam:** ~620K token, ~47 dk wall-clock (paralel olduğu için ≈ en uzun agent süresi).
Manuel (sıralı) yapılsaydı: ~71 dk wall-clock + benzer token.

Paralelizm kazancı: %35 zaman tasarrufu. Token maliyeti aynı.

---

## Ders Çıkarımı

- **RUB-144'ün yarım kalması beklenebilirdi:** Issue body'sinde "Event sourcing kullanılacak mı?" sorusu vardı ama AC'lerde açık yazılmamıştı. Bu tür belirsiz issue'lar `ready-for-agent` etiketine konmadan önce HITL fazından geçmeli.
- **Migration otomatik review geçti:** `ef-core-migration-review` skill'i destructive operation içermeyen migration'ları onaylıyor.
- **Tekrar dispatch hızlı:** İlk run'dan kalan unblock issue'lar için ikinci dispatch ~20 dk içinde çalışır.
