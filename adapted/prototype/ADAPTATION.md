# Adaptation Notes — prototype

**Upstream:** mattpocock/skills/skills/engineering/prototype
**Commit:** f304057d61d3df3c9fd992ac2b6e3833cb9325fb
**Adaptation Level:** medium

## Ne Değişmedi

- "Throwaway kod = bir soruyu yanıtlar" felsefesi
- İki mod (logic vs UI) için dallanma kararı
- "Day 1'den throwaway, açıkça işaretli" disiplini
- Tek komutla çalışma, persistence yok, cila yok kuralları
- State'i her aksiyondan sonra yüzeye çıkarma
- "Bittiğinde sil ya da absorbe et" disiplini
- "Cevap" tek saklanması gereken çıktı

## Ne Değişti

### 1. Mod Sayısı 2 → 4

Upstream iki dallanma sunar (LOGIC, UI). Bu adaptasyon Rubion stack'ine göre dört somut mod tanımlar:
- **Mod 1: Backend CLI** — `dotnet new console` (logic POC)
- **Mod 2: Backend API** — `dotnet new web` Minimal API (endpoint contract POC)
- **Mod 3: Frontend UI variants** — Vite + `?variant=a|b|c` (web)
- **Mod 4: Mobile** — Expo Snack veya `create-expo-app` (mobil)

### 2. Stack-Spesifik Şablonlar

Her mod için çalışır kod örneği:
- Pricing state machine (CLI)
- İki POST contract variant'ı (API)
- Order card 3 görsel variant (Vite)
- Variant switcher (Expo)

### 3. Routing Convention

`?variant=a|b|c` query param + floating bottom bar pattern'i upstream'den korundu ama Rubion'un React Router setup'ına uyarlandı.

### 4. Dil

Türkçe.

## Adaptation Level Neden Medium?

Felsefi yapı korundu ama mod sayısı iki katına çıktı (2 → 4) ve her mod için stack-spesifik şablon yazıldı. "Heavy" değil çünkü temel akış değişmedi; "light" değil çünkü içerik iki katından fazla.
