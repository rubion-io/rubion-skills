# Adaptation Notes — to-prd

**Upstream:** mattpocock/skills/skills/engineering/to-prd
**Commit:** f304057d61d3df3c9fd992ac2b6e3833cb9325fb
**Adaptation Level:** light

## Ne Değişmedi

- "Konuşmayı sentezle, röportaj yapma" disiplini
- PRD şablonu yapısı (Problem → Çözüm → User Stories → Implementation Decisions → Testing Decisions → Out of Scope → Notes)
- Deep module fırsatlarını aktif arama
- Implementasyon kararlarında dosya yolu / kod yazmama kuralı (prototip istisnası dahil)
- Yayın sonrası `ready-for-agent` etiketi uygulama

## Ne Değişti

1. **Dil:** Türkçe
2. **Issue tracker adapter pattern'i:** Upstream `gh` CLI'a sabit; Rubion versiyonu `docs/agents/issue-tracker.md`'den okur ve GitHub veya Jira'ya göre branch'lenir.
3. **Jira payload örneği:** Markdown → ADF dönüşümü için `adf_from_markdown` helper'ı referansı.
4. **Test stack notu:** "xUnit + FluentAssertions + NSubstitute" varsayılan olarak belirtildi, Test Kararları bölümünde tekrar yazılmasına gerek yok.
5. **Multi-context awareness:** Multi-context projede ilgili modülün `CONTEXT.md`'sinin de okunacağı eklendi.
6. **`docs/prd/` opsiyonu:** Büyük feature'lar için PRD'yi repo'da da tutma trade-off açıklaması eklendi.

## Neden Light?

Mantık aynı: konuşma bağlamından PRD üret, sonra yayınla. Sadece "yayınlama nereye" parçası adapter'a delege edildi.
