# Örnek: React Navigation Testi

**Senaryo:** `OrderListScreen` → `OrderDetailScreen` navigasyon akışı.

---

## Integration (NavigationContainer ile)

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

## İzole (useNavigation mock)

Tek ekranı izole test etmek için:

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

**Kural:** Navigasyon flow testi için `NavigationContainer`. Tek ekran birim testi için `useNavigation` mock.
