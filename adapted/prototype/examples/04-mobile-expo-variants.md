# Örnek: Mobile Expo — UI Variant POC

**Soru:** "Native modal mı, BottomSheet mi?"
**Mod:** Mobile (Expo)

---

## Hızlı Yol — Expo Snack

https://snack.expo.dev — native module gerektirmiyorsa en hızlı. URL kaydı yeterli.

---

## Lokal Yol

```bash
npx create-expo-app -t blank prototype-rn
cd prototype-rn
npx expo start
```

## App.tsx

```tsx
import { useState } from "react";
import { View, Text, Pressable, StyleSheet } from "react-native";

const variants = ["A", "B", "C"] as const;
type Variant = typeof variants[number];

export default function App() {
  const [variant, setVariant] = useState<Variant>("A");

  return (
    <View style={styles.container}>
      {variant === "A" && <VariantA />}
      {variant === "B" && <VariantB />}
      {variant === "C" && <VariantC />}
      <View style={styles.bar}>
        {variants.map((v) => (
          <Pressable key={v} onPress={() => setVariant(v)} style={styles.btn}>
            <Text style={{ fontWeight: v === variant ? "bold" : "normal" }}>{v}</Text>
          </Pressable>
        ))}
      </View>
    </View>
  );
}

// VariantA, VariantB, VariantC buraya — UI denemeleri

const styles = StyleSheet.create({
  container: { flex: 1, padding: 24, justifyContent: "center" },
  bar: { position: "absolute", bottom: 32, left: 0, right: 0,
         flexDirection: "row", justifyContent: "center", gap: 12 },
  btn: { padding: 12, borderRadius: 8, backgroundColor: "#eee" },
});
```

Variant seçimi alt bar üzerinden yapılır. Her VariantX bileşeni tek bir UI yaklaşımını temsil eder.
