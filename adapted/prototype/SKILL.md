---
adapted_from: mattpocock/skills/skills/engineering/prototype
upstream_commit: f304057d61d3df3c9fd992ac2b6e3833cb9325fb
last_reviewed: 2026-05-13
adaptation_level: medium
name: prototype
description: Throwaway prototip kurar — Backend CLI, Minimal API, Vite UI variants veya Expo modlarından biriyle. "Prototip et", "POC yap", "tasarımı dene" denildiğinde. Production kod için kullanma — çıktı silinir.
stack: [dotnet, csharp, react, vite, react-native, expo]
---

# Prototype — Rubion

Prototip = **bir soruyu yanıtlayan throwaway kod.** Soru, prototipin şeklini belirler.

---

## Modu Seç

| Soru | Mod | Şablon |
|---|---|---|
| "Bu logic / state model doğru hissettiriyor mu?" | **Backend CLI** | `dotnet new console` |
| "Bu endpoint contract'ı doğru mu?" | **Backend API** | `dotnet new web` |
| "Bu nasıl görünmeli?" (web) | **Frontend UI variants** | Vite + `?variant=a\|b\|c` |
| "Bu nasıl görünmeli?" (mobil) | **Mobile** | Expo Snack veya `create-expo-app` |

Belirsizse: çevresindeki koda bak (backend modülü → CLI/API; sayfa → UI). Varsayımı prototipin başına yaz.

**Tam kod örnekleri:**
[Backend CLI](examples/01-backend-cli-pricing.md) · [Backend API](examples/02-backend-api-orders.md) · [Frontend UI Variants](examples/03-frontend-ui-variants.md) · [Mobile Expo](examples/04-mobile-expo-variants.md)

---

## Ortak Kurallar

1. **Day 1'den throwaway, açıkça işaretlenmiş.** `_prototype/` altına koy; isimden prototip olduğu anlaşılsın. Repo routing convention'ını bozma.
2. **Tek komutla çalışsın.** `dotnet run`, `pnpm dev` — düşünmeden başlatılabilmeli.
3. **Persistence yok (varsayılan).** State bellekte. DB'yi sadece persistence sınanıyorsa kur.
4. **Cila yok.** Test yok, kapsamlı error handling yok, abstraction yok.
5. **State'i yüzeye çıkar.** Her aksiyondan sonra ilgili state'i print et / render et.
6. **Tamamlanınca sil ya da emz.** Cevap bulununca ya sil ya kararı gerçek koda al.

---

## Tamamlandığında

Prototipten saklanacak tek şey **cevaptır:**

- Commit mesajı: "Variant C seçildi — bottom action bar daha keşfedilebilir"
- ADR: karar yeniden gündeme gelebilirse
- `_prototype/NOTES.md`

Sonra prototipi sil **veya** doğrulanan kararı gerçek koda işle. Repo'da çürümeye bırakma.

---

## Yapma

- ✗ Production-quality yazmak (error handling, logging, test)
- ✗ Persistent state — bellekteki yeterli, DB prototip kapsamı dışı
- ✗ Cevap bulununca prototipi silmemek (`_prototype/` 3 ay sonra çürür)
- ✗ Variant'ları farklı route'lara yaymak (tek route + state daha hızlı karşılaştırma)
- ✗ Sorudan emin değilken modu seçip yazmaya başlamak (önce kullanıcıya sor)
