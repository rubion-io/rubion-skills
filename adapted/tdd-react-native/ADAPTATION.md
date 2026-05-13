# Adaptation Notes — tdd-react-native

**Upstream:** mattpocock/skills/skills/engineering/tdd
**Commit:** f304057d61d3df3c9fd992ac2b6e3833cb9325fb
**Adaptation Level:** heavy

## Ne Değişmedi

- TDD'nin temel red-green-refactor döngüsü
- "Davranışı test et, implementasyonu değil" felsefesi
- Yatay dilim anti-pattern'i
- Bir test → bir implementasyon disiplini

## Ne Değişti

### 1. Mobil-Spesifik Stack

- Jest + jest-expo preset (Vitest değil — Expo'nun resmi desteği Jest'te)
- @testing-library/react-native (RTL web değil)
- Maestro E2E (Detox değil — daha az flake, daha kısa öğrenme eğrisi)

### 2. Native Modül Mock Pattern'leri

Web'de olmayan native dependency'ler için mock şablonları:
- AsyncStorage / SecureStore mock
- expo-secure-store __mocks__/
- React Navigation hook mock veya integration test variant

### 3. RTL-RN Sorgu Önceliklendirmesi

Web'deki "role > label > text > testId" RN'de farklı:
- RN'de `getByRole` accessibilityRole'a dayanır — daha az yaygın
- `getByText` ve `getByPlaceholderText` daha çok kullanılır

### 4. MSW v2 Native Kısıtı

RN'de `msw/node` çalışmaz — `msw/native` gerekir veya pratik basitlik için `jest.spyOn(global, "fetch")` kullanılır. Bu fark açıkça belirtildi.

### 5. Maestro E2E Pipeline

Upstream E2E'den bahsetmez. Bu adaptasyon EAS Build öncesi smoke test stratejisini ekler:
- PR'da Jest + Maestro smoke
- Merge sonrası EAS Build
- Release branch'te Maestro Cloud "release" suite

### 6. Coverage Hedefleri

Web'den farklı: component %50 (RN'de görsel test ağırlıklı manuel; component test fiziksel UX'i tam yakalamaz).

### 7. Dil

Türkçe.

## Upstream'den Çıkarılanlar

- jsdom referansları
- MSW v2 node setup (RN'de uygulanmaz)
- Browser DOM event'leri (touch event'ler farklı)
