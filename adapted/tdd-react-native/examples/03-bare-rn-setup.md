# Örnek: Bare React Native (Expo Olmayan Projeler)

Mevcut skill Expo SDK üzerine kurulu. Bare RN (Community CLI) projesinde aşağıdaki farklılıklar geçerli.

---

## Setup Farklılıkları

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

---

## Native Modül Mock'ları (Bare RN Zorunluluğu)

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

---

## E2E — Detox vs Maestro (Bare RN için)

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
