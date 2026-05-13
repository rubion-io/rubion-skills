---
adapted_from: mattpocock/skills/skills/engineering/tdd
upstream_commit: f304057d61d3df3c9fd992ac2b6e3833cb9325fb
last_reviewed: 2026-05-13
adaptation_level: heavy
name: tdd-react-native
description: React Native (Expo öncelikli) projelerinde Jest + @testing-library/react-native ile test-driven development. Navigation, AsyncStorage, native modül mock'ları. E2E için Maestro. "RN TDD", "RN component test", "Expo test", "Maestro" denildiğinde kullan.
stack: [react-native, expo, typescript, jest, react-testing-library, maestro]
---

# TDD — React Native / Rubion

## Felsefe (Web ile Aynı)

Kullanıcının yaptığını yap, kullanıcının gördüğünü assert et. Implementation detayını test etme.

Tek fark: RN'de "kullanıcının gördüğü" DOM değil, native primitive'lerin (`<Text>`, `<Pressable>`, `<TextInput>`) çıkarttığı text/accessibility tree'dir.

---

## Stack

| Rol | Paket | Not |
|---|---|---|
| Test runner | Jest | Expo SDK ile geliyor |
| Component | @testing-library/react-native | RTL'nin RN versiyonu |
| User events | @testing-library/react-native built-in `fireEvent` + `userEvent` | v12.4+ user-event API'sı |
| Matcher | @testing-library/jest-native veya built-in | |
| E2E | Maestro | Detox legacy |
| Mock | jest.mock + `__mocks__/` | RN native modülleri için |

`package.json` (Expo SDK 50+):

```json
{
  "devDependencies": {
    "jest": "^29.0.0",
    "jest-expo": "~50.0.0",
    "@testing-library/react-native": "^12.0.0",
    "@types/jest": "^29.0.0"
  },
  "scripts": {
    "test": "jest"
  },
  "jest": {
    "preset": "jest-expo",
    "transformIgnorePatterns": [
      "node_modules/(?!((jest-)?react-native|@react-native|expo(nent)?|@expo(nent)?/.*|@react-navigation/.*|@unimodules/.*|unimodules|sentry-expo|native-base|react-native-svg)/)"
    ]
  }
}
```

---

## İş Akışı

### 1. Planlama

- [ ] Component, ekran (Screen), veya navigator?
- [ ] Native bir API kullanıyor mu (camera, location, AsyncStorage)?
- [ ] Navigation prop'u alıyor mu?
- [ ] TanStack Query veya başka async data var mı?

### 2. Tracer Bullet

```tsx
// OrderListScreen.test.tsx
import { render, screen } from "@testing-library/react-native";
import { OrderListScreen } from "./OrderListScreen";

test("açık sipariş yoksa boş durum mesajını gösterir", () => {
  render(<OrderListScreen orders={[]} />);

  expect(screen.getByText(/henüz açık sipariş yok/i)).toBeOnTheScreen();
});
```

```bash
pnpm test OrderListScreen
# → RED → component yaz → GREEN
```

### 3. Query Stratejisi

RTL-RN'in sorgu API'sı:

```
getByText / findByText        ← görünen yazı
getByDisplayValue              ← TextInput içeriği
getByPlaceholderText          ← TextInput placeholder
getByLabelText                 ← accessibilityLabel
getByRole                      ← accessibilityRole="button", "link", "image"
getByTestId                    ← son çare (testID prop)
```

Custom matchers:
```
toBeOnTheScreen()              ← varsayılan kontrol
toHaveTextContent(...)
toBeDisabled() / toBeEnabled()
toHaveProp("name", value)      ← prop kontrolü
```

---

## Kullanıcı Etkileşimi

```tsx
import { fireEvent, screen, render } from "@testing-library/react-native";

test("Sipariş Oluştur'a basıldığında onSubmit çağrılır", () => {
  const onSubmit = jest.fn();
  render(<CreateOrderForm onSubmit={onSubmit} />);

  fireEvent.changeText(screen.getByPlaceholderText(/müşteri adı/i), "ACME");
  fireEvent.press(screen.getByText(/sipariş oluştur/i));

  expect(onSubmit).toHaveBeenCalledWith({ customer: "ACME" });
});
```

Modern `userEvent` (v12.4+):

```tsx
import { userEvent, screen, render } from "@testing-library/react-native";

test("kullanıcı email girip Devam'a basabilir", async () => {
  const user = userEvent.setup();
  render(<LoginScreen />);

  await user.type(screen.getByPlaceholderText(/email/i), "test@rubion.io");
  await user.press(screen.getByText(/devam/i));

  expect(await screen.findByText(/hoş geldiniz/i)).toBeOnTheScreen();
});
```

---

## React Navigation Testi

Navigation prop'u manuel mock'la:

```tsx
import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { render, screen, fireEvent } from "@testing-library/react-native";

const Stack = createNativeStackNavigator();

function renderWithNavigation(initialRouteName = "OrderList") {
  return render(
    <NavigationContainer>
      <Stack.Navigator initialRouteName={initialRouteName}>
        <Stack.Screen name="OrderList" component={OrderListScreen} />
        <Stack.Screen name="OrderDetail" component={OrderDetailScreen} />
      </Stack.Navigator>
    </NavigationContainer>,
  );
}

test("sipariş kartına basınca detay ekranına gider", async () => {
  renderWithNavigation();

  fireEvent.press(screen.getByText("Sipariş #42"));

  expect(await screen.findByText(/sipariş detayı/i)).toBeOnTheScreen();
});
```

Tek ekranı izole test etmek için `useNavigation` hook'u mock'la:

```tsx
const mockNavigate = jest.fn();
jest.mock("@react-navigation/native", () => ({
  ...jest.requireActual("@react-navigation/native"),
  useNavigation: () => ({ navigate: mockNavigate }),
}));

test("Detay butonuna basınca OrderDetail'e navigate eder", () => {
  render(<OrderCard orderId="42" />);

  fireEvent.press(screen.getByText(/detay/i));

  expect(mockNavigate).toHaveBeenCalledWith("OrderDetail", { id: "42" });
});
```

---

## AsyncStorage / SecureStore Mock'ları

```tsx
// __mocks__/expo-secure-store.ts
export const getItemAsync = jest.fn(() => Promise.resolve(null));
export const setItemAsync = jest.fn(() => Promise.resolve());
export const deleteItemAsync = jest.fn(() => Promise.resolve());
```

```tsx
// jest.setup.ts
jest.mock("@react-native-async-storage/async-storage", () =>
  require("@react-native-async-storage/async-storage/jest/async-storage-mock"),
);
```

---

## TanStack Query — Aynı Pattern

```tsx
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

function wrap(ui: React.ReactElement) {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return render(
    <QueryClientProvider client={client}>{ui}</QueryClientProvider>,
  );
}

// fetch için MSW yerine direkt jest.spyOn(global, "fetch") — RN'de jsdom yok
beforeEach(() => {
  global.fetch = jest.fn(() =>
    Promise.resolve({
      ok: true,
      json: async () => ({ id: "42", customer: "ACME" }),
    }),
  ) as jest.Mock;
});
```

> **Not:** MSW v2 React Native'de native fetch interceptor yerine `msw/native` paketi gerektirir. Pratikte basit projelerde `jest.spyOn(global, "fetch")` yeterlidir.

---

## E2E — Maestro

Detox legacy; Maestro daha az boilerplate, daha az flake.

```yaml
# .maestro/login-flow.yaml
appId: io.rubion.app
---
- launchApp
- tapOn: "Email"
- inputText: "test@rubion.io"
- tapOn: "Devam"
- assertVisible: "Hoş geldiniz"
```

```bash
# Lokal device/emulator
maestro test .maestro/login-flow.yaml

# Cloud (kayıtlı flow'ları paralel çalıştırır)
maestro cloud --apiKey $MAESTRO_API_KEY .maestro/
```

CI'da: GitHub Actions için `mobile-dev-inc/action-maestro-cloud` action'ı.

---

## Expo EAS Build Öncesi Smoke Test Stratejisi

Build öncesi tüm akışları manuel test etmek pahalı. Önerilen pipeline:

```
1. CI'da: jest + tdd-react-native testleri zorunlu          ← her PR'da
2. CI'da: Maestro smoke test (login + ana akış)              ← her PR'da
3. EAS Build trigger ediliyor                                ← merge sonrası
4. Build hazır → Maestro Cloud "release" suite               ← release branch'te
```

Smoke test örnekleri (Maestro):
- `login-flow.yaml` — auth path'i ayakta
- `cold-start.yaml` — uygulama crash'siz açılıyor
- `offline-mode.yaml` — network kesilince hata yerine cache

---

## Coverage

```
Hook (saf logic)     %80
Component (UI flow)   %50  (RN'de görsel testler ağırlıklı manuel)
Util / formatter      %90
E2E (Maestro)         Kritik 3-5 flow
```

---

## Bare React Native — Expo Olmayan Projeler

Mevcut skill Expo SDK üzerine kurulu. Bare RN (Community CLI) projesinde aşağıdaki farklılıklar geçerli.

### Setup Farklılıkları

- **CLI:** `npx @react-native-community/cli init` (Expo `expo init` yerine)
- **Test preset:** `react-native` preset (`jest-expo` yerine)

```json
// package.json — bare RN
{
  "jest": {
    "preset": "react-native",
    "setupFilesAfterFramework": ["@testing-library/jest-native/extend-expect"],
    "transformIgnorePatterns": [
      "node_modules/(?!(@react-native|react-native|@react-navigation)/)"
    ]
  }
}
```

### Native Modül Mock'ları (Bare RN Zorunluluğu)

Expo managed workflow'da çoğu modül otomatik mock'lanır. Bare RN'de her native bağımlılık için `__mocks__/` altında mock yaz:

```typescript
// __mocks__/react-native-permissions.ts
export const PERMISSIONS = { IOS: {}, ANDROID: {} };
export const RESULTS = { GRANTED: 'granted', DENIED: 'denied', BLOCKED: 'blocked' };
export const check = jest.fn().mockResolvedValue('granted');
export const request = jest.fn().mockResolvedValue('granted');
export const openSettings = jest.fn().mockResolvedValue(true);
```

```typescript
// __mocks__/react-native-fs.ts
export default {
  DocumentDirectoryPath: '/mock/documents',
  readFile: jest.fn().mockResolvedValue('file content'),
  writeFile: jest.fn().mockResolvedValue(true),
  exists: jest.fn().mockResolvedValue(false),
};
```

### E2E — Detox vs Maestro (Bare RN için)

| | Maestro | Detox |
|---|---|---|
| Setup süresi | 15 dk | 2-4 saat |
| Test dili | YAML | JavaScript/TypeScript |
| iOS + Android | Tek YAML | Ayrı setup |
| Flakiness | Düşük | Orta |
| Mature | 2023+ | 2017+ |

**Default öneri:** Maestro (yeni projeler için). Detox zaten kuruluysa geçme — değmez.

Maestro bare RN'de de aynı şekilde çalışır; `appId` değişir:

```yaml
# .maestro/login-flow.yaml (bare RN)
appId: com.rubion.myapp   # android/app/build.gradle'daki applicationId
---
- launchApp
- tapOn: "Email"
- inputText: "test@rubion.io"
```

---

## Döngü Başına Checklist

```
[ ] Test user-facing davranışı assert ediyor
[ ] Native modüller mock'lanmış (varsa)
[ ] Navigation testi izolasyon mu integration mu — bilinçli seçim
[ ] fetch / async data için gerçek API path test edildi
[ ] testID son çare olarak kullanıldı (accessibility query'leri önce)
[ ] E2E için Maestro flow ayrı dosyada
[ ] Bare RN ise: jest preset "react-native", __mocks__/ native modüller için mevcut
```
