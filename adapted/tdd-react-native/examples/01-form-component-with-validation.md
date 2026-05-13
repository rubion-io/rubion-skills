# Örnek: Login Form — TDD Akışı (Expo)

Senaryo: `LoginScreen` component'i için sıfırdan TDD. Email + şifre alanları, validation, API çağrısı.

---

## Başlangıç Durumu

```
src/
└── features/
    └── auth/
        └── LoginScreen.tsx   ← henüz yok
```

---

## 1. Red — Component Render Testi

Önce test yaz, sonra component.

```typescript
// src/features/auth/__tests__/LoginScreen.test.tsx

import React from 'react';
import { render, screen } from '@testing-library/react-native';
import { LoginScreen } from '../LoginScreen';

describe('LoginScreen', () => {
  it('email ve şifre alanlarını gösterir', () => {
    render(<LoginScreen />);

    expect(screen.getByLabelText('Email')).toBeOnTheScreen();
    expect(screen.getByLabelText('Şifre')).toBeOnTheScreen();
    expect(screen.getByRole('button', { name: 'Giriş Yap' })).toBeOnTheScreen();
  });
});
```

Çalıştır → **FAIL** (module not found):

```bash
npx jest src/features/auth/__tests__/LoginScreen.test.tsx
```

```
FAIL  src/features/auth/__tests__/LoginScreen.test.tsx
  ● Test suite failed to run
    Cannot find module '../LoginScreen' from '...'
```

---

## 2. Green — Minimal Component

```tsx
// src/features/auth/LoginScreen.tsx

import React from 'react';
import { View, TextInput, Pressable, Text } from 'react-native';

export function LoginScreen() {
  return (
    <View>
      <TextInput
        accessibilityLabel="Email"
        testID="email-input"
        autoCapitalize="none"
        keyboardType="email-address"
      />
      <TextInput
        accessibilityLabel="Şifre"
        testID="password-input"
        secureTextEntry
      />
      <Pressable accessibilityRole="button" accessibilityLabel="Giriş Yap">
        <Text>Giriş Yap</Text>
      </Pressable>
    </View>
  );
}
```

```bash
npx jest src/features/auth/__tests__/LoginScreen.test.tsx
```

```
PASS  src/features/auth/__tests__/LoginScreen.test.tsx
  LoginScreen
    ✓ email ve şifre alanlarını gösterir (45ms)
```

---

## 3. Red — Email Validation Testi

```typescript
// LoginScreen.test.tsx — ek test blokları

import { userEvent } from '@testing-library/react-native';

describe('LoginScreen validation', () => {
  it('geçersiz email için hata mesajı gösterir', async () => {
    const user = userEvent.setup();
    render(<LoginScreen />);

    await user.type(screen.getByLabelText('Email'), 'gecersiz-email');
    await user.press(screen.getByRole('button', { name: 'Giriş Yap' }));

    expect(
      await screen.findByText('Geçerli bir email adresi girin')
    ).toBeOnTheScreen();
  });

  it('boş şifre için hata mesajı gösterir', async () => {
    const user = userEvent.setup();
    render(<LoginScreen />);

    await user.type(screen.getByLabelText('Email'), 'test@example.com');
    // şifre boş bırakıldı
    await user.press(screen.getByRole('button', { name: 'Giriş Yap' }));

    expect(
      await screen.findByText('Şifre zorunludur')
    ).toBeOnTheScreen();
  });
});
```

```
FAIL  ...
  ● LoginScreen validation › geçersiz email için hata mesajı gösterir
    Expected to find: 'Geçerli bir email adresi girin'
    Found: (nothing)
```

---

## 4. Green — Validation Ekle

```tsx
// src/features/auth/LoginScreen.tsx

import React, { useState } from 'react';
import { View, TextInput, Pressable, Text, StyleSheet } from 'react-native';

type FormErrors = {
  email?: string;
  password?: string;
};

function validate(email: string, password: string): FormErrors {
  const errors: FormErrors = {};
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    errors.email = 'Geçerli bir email adresi girin';
  }
  if (!password) {
    errors.password = 'Şifre zorunludur';
  }
  return errors;
}

export function LoginScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errors, setErrors] = useState<FormErrors>({});
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = () => {
    const validationErrors = validate(email, password);
    setErrors(validationErrors);
    setSubmitted(true);
  };

  return (
    <View style={styles.container}>
      <TextInput
        accessibilityLabel="Email"
        value={email}
        onChangeText={setEmail}
        autoCapitalize="none"
        keyboardType="email-address"
      />
      {submitted && errors.email && (
        <Text style={styles.error}>{errors.email}</Text>
      )}

      <TextInput
        accessibilityLabel="Şifre"
        value={password}
        onChangeText={setPassword}
        secureTextEntry
      />
      {submitted && errors.password && (
        <Text style={styles.error}>{errors.password}</Text>
      )}

      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Giriş Yap"
        onPress={handleSubmit}
      >
        <Text>Giriş Yap</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16, gap: 8 },
  error: { color: 'red', fontSize: 12 },
});
```

```
PASS  ...
  LoginScreen
    ✓ email ve şifre alanlarını gösterir (45ms)
  LoginScreen validation
    ✓ geçersiz email için hata mesajı gösterir (62ms)
    ✓ boş şifre için hata mesajı gösterir (58ms)
```

---

## 5. Red — API Çağrısı Testi

```typescript
// LoginScreen.test.tsx — API mock

import { loginUser } from '../../../services/authService';

jest.mock('../../../services/authService');
const mockLoginUser = loginUser as jest.MockedFunction<typeof loginUser>;

describe('LoginScreen API', () => {
  it('geçerli form submit edilince loginUser çağrılır', async () => {
    mockLoginUser.mockResolvedValue({ token: 'abc123' });
    const user = userEvent.setup();
    render(<LoginScreen />);

    await user.type(screen.getByLabelText('Email'), 'test@example.com');
    await user.type(screen.getByLabelText('Şifre'), 'sifre123');
    await user.press(screen.getByRole('button', { name: 'Giriş Yap' }));

    expect(mockLoginUser).toHaveBeenCalledWith({
      email: 'test@example.com',
      password: 'sifre123',
    });
  });

  it('API hatası olunca hata mesajı gösterir', async () => {
    mockLoginUser.mockRejectedValue(new Error('Geçersiz kimlik bilgileri'));
    const user = userEvent.setup();
    render(<LoginScreen />);

    await user.type(screen.getByLabelText('Email'), 'test@example.com');
    await user.type(screen.getByLabelText('Şifre'), 'yanlis');
    await user.press(screen.getByRole('button', { name: 'Giriş Yap' }));

    expect(
      await screen.findByText('Geçersiz kimlik bilgileri')
    ).toBeOnTheScreen();
  });
});
```

---

## 6. Green — API Entegrasyonu

```tsx
// src/features/auth/LoginScreen.tsx (güncel)

import { loginUser } from '../../services/authService';

// handleSubmit güncellendi:
const handleSubmit = async () => {
  const validationErrors = validate(email, password);
  setErrors(validationErrors);
  setSubmitted(true);

  if (Object.keys(validationErrors).length > 0) return;

  try {
    await loginUser({ email, password });
    // navigation.navigate('Home') — test'te navigation mock'lanır
  } catch (err) {
    setErrors({ email: (err as Error).message });
  }
};
```

---

## 7. Refactor — Hook'a Ekstrakt

Validation + API logic component'ten çıkarılabilir:

```typescript
// src/features/auth/useLoginForm.ts

import { useState } from 'react';
import { loginUser } from '../../services/authService';

type FormErrors = { email?: string; password?: string };

function validate(email: string, password: string): FormErrors {
  const errors: FormErrors = {};
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    errors.email = 'Geçerli bir email adresi girin';
  }
  if (!password) {
    errors.password = 'Şifre zorunludur';
  }
  return errors;
}

export function useLoginForm() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errors, setErrors] = useState<FormErrors>({});
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async () => {
    const validationErrors = validate(email, password);
    setErrors(validationErrors);
    setSubmitted(true);

    if (Object.keys(validationErrors).length > 0) return;

    try {
      await loginUser({ email, password });
    } catch (err) {
      setErrors({ email: (err as Error).message });
    }
  };

  return { email, setEmail, password, setPassword, errors, submitted, handleSubmit };
}
```

Hook testi ayrı yazılabilir — component testleri değişmez çünkü davranış aynı.

---

## 8. E2E — Maestro Flow

```yaml
# .maestro/flows/login.yaml

appId: com.rubion.myapp
---
- launchApp
- tapOn:
    text: "Email"
- inputText: "test@example.com"
- tapOn:
    text: "Şifre"
- inputText: "Test1234!"
- tapOn:
    text: "Giriş Yap"
- assertVisible:
    text: "Ana Sayfa"  # başarılı giriş sonrası görünen ekran
```

Çalıştır:

```bash
maestro test .maestro/flows/login.yaml
```

---

## Sonuç

| Aşama | Test | Sonuç |
|---|---|---|
| Render | `getByLabelText` ile alan varlığı | PASS |
| Validation | Geçersiz email, boş şifre | PASS |
| API entegrasyonu | Mock ile submit + hata | PASS |
| E2E | Maestro flow | PASS |

**Önemli:** Test'ler `loginUser` implementasyonunu değil, formun **davranışını** test eder — "geçersiz email girilince hata göster", "başarılı girişte token al". Refactor'da testler kırılmaz.
