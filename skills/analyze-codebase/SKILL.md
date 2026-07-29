---
name: analyze-codebase
description: Mevcut projenin teknik röntgeni — envanter (endpoint/tablo/modül) + mimari/test/bağımlılık/güvenlik/performans taraması, dosya:satır kanıtlı. "Teknik analiz", "tech debt tara" denildiğinde. Read-only; yeni iskelet için kullanma.
stack: [dotnet, supabase, react, react-native]
---

# Analyze Codebase — Teknik Röntgen

> **Baseline:** Bu skill `CLAUDE.md` baseline'ı (Think Before Coding · Simplicity First · Surgical Changes · Goal-Driven) ile birlikte çalışır. Çatışmada baseline öncelikli.

Mevcut bir kod tabanının **read-only** teknik analizi. İki çıktı üretir:

1. **Teknik Envanter** — endpoint'ler, tablolar, sayfalar, modüller, entegrasyonlar (→ [`analyze-functional`](../analyze-functional/SKILL.md)'ın hammaddesi)
2. **Teknik Sağlık Bulguları** — 4 boyutlu tarama, her bulgu `dosya:satır` kanıtlı

`PROJECT_ANALYSIS.md`'nin **§3 (Envanter)** ve **§4 (Sağlık)** bölümlerini yazar. [`analyze-project`](../analyze-project/SKILL.md) orkestrasyonunun 1. adımıdır; solo da çalışır (örn. 3 ay sonra "borç arttı mı?" karşılaştırması için).

> **Ön koşullar:**
> - Mevcut (legacy) bir kod tabanı. Boş/yeni projede anlamsız — `scaffold-backend` / `scaffold-frontend-react` öner.
> - Git history (churn analizi için). Yoksa churn adımlarını atla ve raporda belirt.

---

## Faz 0 — Yönelim

Kodu derinlemesine okumadan önce zemini tanı:

1. **Manifest'ler:** `*.sln`, `*.csproj`, `package.json`, `supabase/config.toml`, `app.json` — stack ve bağımlılıklar. README'nin iddiasını oku ama **güvenme** — gerçek config esas (`setup-rubion-skills` Faz B sinyal tablosuyla aynı mantık).
2. **Dizin haritası:** 2 seviye derinlikte klasör ağacı; modül adaylarını işaretle.
3. **Churn analizi:**

```bash
# En sık değişen 20 dosya (son 6 ay)
git log --since="6 months ago" --pretty=format: --name-only | sort | uniq -c | sort -rg | head -20

# En büyük 20 kaynak dosya
git ls-files "*.cs" "*.ts" "*.tsx" "*.sql" | xargs wc -l 2>/dev/null | sort -rg | head -21
```

4. **Entry point'ler:** `Program.cs`, `main.tsx`, `App.tsx`, `index.ts` — uygulamanın nasıl ayağa kalktığını anla.

Bulguları 3-4 cümlelik ilerleme notuyla özetle ve taramaya geç — **faz sonlarında onay bekleme**, bu skill kesintisiz akar.

---

## Faz 1 — Teknik Envanter (§3)

Stack'e göre topla (Mixed projede hepsi):

| Stack | Ne | Nasıl bulunur |
|---|---|---|
| .NET | Endpoint'ler | `MapGet/MapPost/MapPut/MapDelete/MapGroup` grep; controller varsa `[HttpGet]` vb. attribute'lar |
| .NET | Tablolar | `DbContext` içindeki `DbSet<>` listesi + `Migrations/` klasörü |
| .NET | Handler'lar | `IRequestHandler<` implementasyonları (MediatR) |
| .NET | Background işler | `BackgroundService`, `IHostedService`, Hangfire/Quartz job'ları |
| .NET | Entegrasyonlar | named `HttpClient`'lar, MassTransit consumer'ları |
| Supabase | Tablolar + RLS | `supabase/migrations/*.sql` içinde `CREATE TABLE` / `CREATE POLICY` |
| Supabase | Edge Functions | `supabase/functions/*/index.ts` |
| React | Sayfalar / route'lar | `createBrowserRouter` / `<Route` tanımları |
| React | Veri kancaları | `useQuery` / `useMutation` → hangi endpoint'i çağırıyor |
| RN | Ekranlar | `app/` (expo-router) veya `screens/` + navigation config |

Envanter çıktısı tablo formatında:

```markdown
### 3.1 Endpoint'ler
| Metod | Path | Handler | Dosya |

### 3.2 Veritabanı
| Tablo | Kaynak (DbSet / migration) | RLS policy (Supabase) |

### 3.3 Sayfalar / Ekranlar
| Route | Component | Dosya |

### 3.4 Modüller
| Modül | Dosya sayısı | Son 6 ay commit | Test var mı |

### 3.5 Entegrasyonlar & Background İşler
| Tür | Ad | Dosya |
```

Modüller tablosundaki churn + test kolonları Faz 2-B'yi ve §5 memory adaylarını besler.

---

## Faz 2 — Teknik Sağlık Taraması (§4)

Her bulgu: **ID · Kategori · `dosya:satır` · Önem · Çaba · Kanıt · Öneri**.

Önem: `Critical` (prod'da veri/güvenlik riski) · `High` (aktif geliştirmeyi yavaşlatıyor) · `Medium` (birikiyor) · `Low` (kozmetik). Çaba: `S` (< yarım gün) · `M` (1-3 gün) · `L` (3+ gün).

### A. Mimari

- **Tanrı dosyası:** >500 satır kaynak dosya (Faz 0 listesinden). >300 satır servis + 8+ public method → God Service adayı.
- **Shallow abstraction:** sadece `_db.Set<T>` sarmalayan repository, tek satır pass-through servisler (bkz. ADR-007) → `improve-codebase-architecture` adayı olarak **işaretle** — derin analiz ve grilling orada.
- **Dairesel bağımlılık:** .NET'te proje referans grafiği; TS'te `npx madge --circular src/`.
- **Katman ihlali:** endpoint'ten doğrudan `DbContext`, component'ten TanStack Query dışı elle `fetch`.
- **Ölü kod:** referanssız public tip/handler; TS'te `npx knip`.

### B. Test Borcu

- Test projesi/dosyası var mı? Kaba oran: test dosyası / kaynak dosyası.
- **Churn × testsiz kesişimi (en değerli sinyal):** en sık değişen 20 dosyadan hangilerinin testi yok? → önem sıralı riskli liste.
- Skip'li testler: `[Fact(Skip=`, `it.skip`, `test.skip`, `xit(`.

### C. Bağımlılık & Güvenlik

```bash
# .NET
dotnet list package --vulnerable --include-transitive
dotnet list package --outdated
dotnet list package --deprecated

# Node
npm audit --omit=dev          # veya pnpm audit
npx knip                      # kullanılmayan bağımlılık + export

# Supabase (lokal kurulum varsa)
supabase db lint
```

Grep taramaları:

- Hardcoded secret: `password=`, `apikey`, `secret=` kalıpları; `appsettings*.json`'da prod credential; `.env` commit'lenmiş mi (`git ls-files .env*`)
- Permissive CORS: `AllowAnyOrigin`, `Access-Control-Allow-Origin: *`
- Auth boşluğu: kritik endpoint'te `[AllowAnonymous]`, guard'sız route
- SQL injection riski: `FromSqlRaw` + string interpolation
- Supabase özel: envanterde `CREATE TABLE` olup `CREATE POLICY`'si olmayan tablolar (**RLS açığı — Critical**); frontend kodunda `service_role` key

### D. Performans & Hata Yönetimi

- **N+1 işaretleri:** döngü içinde `await` (DB/HTTP), EF Core'da eksik `Include`, lazy loading proxy'leri
- **Sync-over-async:** `.Result`, `.Wait()`, `.GetAwaiter().GetResult()`
- **Yutulmuş hata:** boş `catch {}`, log'suz `catch (Exception)`, `.catch(() => {})`
- **Log hijyeni:** `Console.WriteLine` (Serilog yerine), correlation ID yok, structured olmayan log
- **React:** `useEffect` içinde elle fetch (TanStack Query varken) — hafif tut, UI mikro-optimizasyonuna dalma

> **Sınır:** Derin debugging bu skill'in işi değil — semptomu tespit et, `diagnose-dotnet` / `diagnose-supabase` öner. Mimari adayların grilling'i de `improve-codebase-architecture`'a kalır: burada **tespit + işaretleme**, orada **sorgulama + karar**.

---

## Faz 3 — Raporu Yaz

1. `PROJECT_ANALYSIS.md`'yi bul: önce `docs/memory/99-meta/`, yoksa repo kökü. Hiç yoksa iskeletiyle oluştur (tam şablon: [`analyze-project`](../analyze-project/SKILL.md)) ve §2'yi `> henüz çalıştırılmadı — analyze-functional` notuyla boş bırak.
2. **§3 + §4'ü yaz/güncelle** — idempotent; kendi bölümlerinin dışına dokunma. Bölüm başlığının altına damga: `> Analiz: <tarih> @ <kısa-sha> — analyze-codebase`.
3. Frontmatter güncelle: `analyzed_commit: <git rev-parse --short HEAD>`, `last_reviewed: <bugün>`.
4. **§5 Memory Besleme'ye katkı:** churn top-5 modül (memorize-module adayları) + mimari ADR adayları.
5. **Solo modda:** sonucu özetle ve **öner** (çağırma): `analyze-functional` (harita yoksa), `improve-codebase-architecture` (mimari aday varsa), Critical güvenlik bulgusu varsa ilgili review skill'i.

---

## Yapma

- ✗ **Kod değiştirmek** — read-only; tek yazılan dosya `PROJECT_ANALYSIS.md`
- ✗ `dosya:satır` kanıtı olmayan bulgu yazmak — "genel olarak kötü görünüyor" bulgu değildir
- ✗ Her dosyayı okumaya çalışmak — büyük repoda örneklem yeter: churn top 20 + en büyük 20 + entry point'ler + envanter grep'leri
- ✗ Severity enflasyonu — `Critical`'ı gerçek prod riskine sakla, yoksa rapor okunmaz
- ✗ Fix uygulamak veya "hemen düzeltelim mi?" diye dalmak — öneri yaz, karar kullanıcının
- ✗ Fonksiyonel yorum ("bu ekran kullanıcıya ne sağlıyor") — `analyze-functional`'ın işi
- ✗ Bulgu olmayan yerde bulgu uydurmak — temiz alanı "Kötü Görünüyor Ama Sorun Değil" bölümüne yaz, gerekçesiyle

---

## Kontrol Listesi

- [ ] Faz 0: manifest + dizin haritası + churn top 20 + en büyük 20 çıkarıldı
- [ ] §3 Envanter: endpoint / tablo / sayfa / modül / entegrasyon tabloları dolu
- [ ] §4: 4 boyut da tarandı (A-B-C-D); her bulguda dosya:satır + önem + çaba var
- [ ] Churn × testsiz kesişim listesi üretildi
- [ ] Supabase varsa: policy'siz tablo kontrolü yapıldı
- [ ] "Kötü Görünüyor Ama Sorun Değil" bölümü değerlendirildi
- [ ] Frontmatter: `analyzed_commit` + `last_reviewed` güncel; bölüm damgaları atıldı
- [ ] §5'e memorize-module adayları (churn top 5) eklendi
- [ ] Hiçbir kaynak dosya değiştirilmedi
