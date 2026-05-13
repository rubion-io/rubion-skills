# Adaptation Notes — tdd-dotnet

**Upstream:** mattpocock/skills/skills/engineering/tdd
**Commit:** f304057d61d3df3c9fd992ac2b6e3833cb9325fb
**Adaptation Level:** heavy

## Ne Değişmedi

- Red-green-refactor döngüsünün temeli
- Yatay dilim anti-pattern'inin reddi
- Tracer bullet yaklaşımı: bir test → bir implementasyon
- "Testler davranışı public interface üzerinden doğrular" felsefesi
- Refactoring kuralı: kırmızıdayken refactor yok
- Planning checklist mantığı

## Ne Değişti

### 1. Test Framework Spesifikasyonu

Upstream framework-agnostic. Bu adaptasyon şunu sabitler:
- xUnit (test runner)
- FluentAssertions (assertion sözdizimi — `result.Should().Be(...)`)
- NSubstitute (mock — `Substitute.For<T>()`, `Received()`, `Returns()`)

### 2. MediatR Handler Test Deseni

Upstream "public interface" demiş, Rubion bu kavramı `IRequestHandler<TCommand, TResult>` olarak somutlaştırıyor. Handler constructor injection pattern'i ile test edilir; MediatR mediator mock'lanmaz.

### 3. Testcontainers Integration Test

Upstream integration test konusunda sessiz. Bu adaptasyon Testcontainers (PostgreSQL + MSSQL) ile gerçek veritabanı spinup'ını ekliyor. `IAsyncLifetime` pattern ile container yaşam döngüsü yönetimi.

### 4. WebApplicationFactory Endpoint Testi

Rubion projelerinde Minimal API yaygın; `WebApplicationFactory<Program>` pattern'i eklendi.

### 5. Coverage Politikası

Sayısal hedefler eklendi (handler %70, integration %40) ama "dogmatik değil" notu korundu.

### 6. Contract Test Sınırı

PactNet ne zaman gerekli, ne zaman gereksiz — açık karar kriterleri.

### 7. Dil

Türkçe yorumlar ve açıklamalar, C# kod standartları PascalCase/camelCase kurallarına uygun.

## Upstream'den Çıkarılanlar

- `tests.md`, `mocking.md`, `refactoring.md`, `interface-design.md`, `deep-modules.md` referansları: içerikleri SKILL.md içine absorbe edildi veya Rubion bağlamına göre yeniden yazıldı.
- Generic framework önerileri yerini xUnit/FluentAssertions/NSubstitute'a bıraktı.
