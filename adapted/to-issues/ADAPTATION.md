# Adaptation Notes — to-issues

**Upstream:** mattpocock/skills/skills/engineering/to-issues
**Commit:** f304057d61d3df3c9fd992ac2b6e3833cb9325fb
**Adaptation Level:** light

## Ne Değişmedi

- Tracer bullet / dikey dilim felsefesi
- HITL vs AFK ayrımı
- Acceptance criteria odaklı issue body şablonu
- "Çok ince > az kalın" heuristics'i
- Dosya yolu / kod yazmama disiplini
- Parent issue'a dokunmama kuralı
- Dependency sırasında yayınlama mantığı

## Ne Değişti

1. **Dil:** Türkçe
2. **Issue tracker adapter pattern'i:** GitHub `gh` ve Jira REST API komutları yan yana sunuldu — `docs/agents/issue-tracker.md` hangisi diyorsa o uygulanır.
3. **Jira "Blocks" link örneği:** Issue linklerinin Jira native `issueLink` API'sıyla nasıl kurulacağı eklendi.
4. **Subtask vs Task ayrımı:** Jira'da parent referansı olan dilim için `issuetype: "Subtask"` notu eklendi.
5. **VSA tracer bullet örneği:** Rubion'a özel — bir Vertical Slice'ın tamamı tipik bir tracer bullet'tır.
6. **"ADR gerektiren dilim HITL olmalı" ipucu:** Mimari karar gerektiren dilimlerin nasıl HITL işaretleneceği örneklendi.

## Neden Light?

Felsefe ve şablon değişmedi; sadece "yayınlama nereye" parçası adapter pattern'iyle GitHub + Jira çift yollu hale getirildi.
