# Adaptation Notes — improve-codebase-architecture

**Upstream:** mattpocock/skills/skills/engineering/improve-codebase-architecture
**Commit:** f304057d61d3df3c9fd992ac2b6e3833cb9325fb
**Adaptation Level:** heavy

## Ne Değişmedi

- Ousterhout "deep modules" felsefesinin tamamı
- Mimari sözlük: Module, Interface, Implementation, Depth, Seam, Adapter, Locality
- Silme testi (deletion test)
- "Interface, test yüzeyidir" ilkesi
- "1 adapter = hipotetik, 2 adapter = gerçek seam" kuralı
- Süreç akışı: Explore → Present candidates → Grilling loop
- CONTEXT.md sözlüğüne sadık kalma
- ADR çelişkilerini sadece sürtünme gerçekse açma

## Ne Değişti / Eklendi

### 1. VSA vs Clean Architecture Karar Ağacı

Rubion default VSA (ADR-001). Hangi koşullarda Clean'e geçiş düşünülür, hangi koşullarda overkill — somut kriterler.

### 2. Domain Event vs Integration Event Ayrımı

Upstream bu ayrımdan bahsetmiyor. Rubion'da bu ayrım kritik:
- Domain Event = in-process, MediatR INotification
- Integration Event = cross-service, RabbitMQ exchange + versioned contract

Anti-pattern uyarısı: Domain event'i doğrudan RabbitMQ'ya göndermeme.

### 3. Repository Pattern Eleştirisi

EF Core context'inde repository çoğu zaman shallow. Silme testini uygulamış somut bir örnek + "Tut / Sil" karar matrisi.

### 4. Monolith → Mikroservis Kararı

- Bounded context tespit checklist'i
- Strangler Fig pattern adımları (1-5)
- Database-per-service vs Shared DB karar matrisi
- Rubion default: database-per-service + CDC

### 5. Sık Derinleştirme Fırsatları Tablosu

Rubion projelerinde gerçek dünyada karşılaşılan 6 shallow pattern → derinleştirme önerisi.

### 6. Dil

Türkçe.

## Upstream'den Çıkarılanlar / Absorbe Edilenler

- `LANGUAGE.md` referansı: tüm sözlük SKILL.md'ye taşındı (Türkçe karşılıklarla)
- `INTERFACE-DESIGN.md` referansı: grilling loop kısmında ihtiyaç anına bırakıldı
- `DEEPENING.md` referansı: temel ilkeleri SKILL.md'ye taşındı

## Adaptation Level Neden Heavy?

Upstream'in mantığı korunsa da .NET/VSA bağlamı için iki büyük ek var:
1. Mimari pattern karar ağaçları (VSA/Clean/Domain Event/Repository/Monolith→Mikroservis)
2. Rubion-özgün "sık karşılaşılan shallow pattern" tablosu

Bu eklemeler skill'in yarısından fazlasını oluşturuyor.
