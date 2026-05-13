# Adaptation Notes — tdd-react

**Upstream:** mattpocock/skills/skills/engineering/tdd
**Commit:** f304057d61d3df3c9fd992ac2b6e3833cb9325fb
**Adaptation Level:** heavy

## Ne Değişmedi

- Red-green-refactor döngüsü
- Yatay dilim anti-pattern'i
- "Davranışı test et, implementasyonu değil" felsefesi
- Bir test → bir implementasyon disiplini
- "Tüm testleri çalıştırma sonra cleanup" döngü kuralı

## Ne Değişti

### 1. Stack Spesifikasyonu

Upstream framework-agnostic. Bu adaptasyon Rubion frontend stack'ine sabit:
- Vitest (test runner)
- @testing-library/react v15
- @testing-library/user-event v14 (v13 değil — async API'lar farklı)
- MSW v2 (handler API v1'den farklı)
- @testing-library/jest-dom (matcher'lar)

### 2. TanStack Query Test Stratejisi

Rubion projelerinde server state yönetimi TanStack Query (bkz. stack-conventions). Bu adaptasyon:
- `useQuery` mock'lamamayı kural haline getirir
- MSW ile gerçek fetch intercept eder
- `renderWithQuery` test helper'ı sağlar

### 3. Custom Hook Test Pattern'i

`renderHook` + provider wrapper kombinasyonu, custom hook test'in standardı.

### 4. Query Priority Önceliklendirmesi

`getByRole > getByLabelText > getByText > getByTestId` sırası açıkça yazıldı. `getByTestId` "son çare" olarak işaretlendi.

### 5. Component vs Integration Ayrımı

Upstream "integration test" der ama detay vermez. Bu adaptasyon dört seviye tablo verir (unit / component / integration / E2E) ve **integration'ın yüksek değer** olduğunu söyler.

### 6. Coverage Sayıları

Frontend için somut hedefler (hook %80, component %60, util %90) — dogmatik değil.

### 7. Dil

Türkçe.

## Upstream'den Çıkarılanlar

- `deep-modules.md`, `interface-design.md`, `mocking.md` referansları: gerekli kısımlar bu SKILL.md içine absorbe edildi. React bağlamında "deep module" frontend için farklı yorumlanır — hook + bileşen kombinasyonu.
