# Issue Tracker: GitHub

Bu projenin issue'ları ve PRD'leri GitHub Issues olarak yaşar. Tüm işlemler `gh` CLI üzerinden yapılır.

## Ön Koşullar

- `gh` CLI kurulu (https://cli.github.com/)
- `gh auth login` çalıştırılmış — token kalıcı olarak makinede

## Komut Sözlüğü

### Issue oluştur

```bash
gh issue create --title "<başlık>" --body "$(cat <<'EOF'
<gövde — markdown destekler>
EOF
)"
```

Etiket veya assignee eklemek için:

```bash
gh issue create \
  --title "..." \
  --body "..." \
  --label "ready-for-agent" \
  --assignee "@me"
```

### Issue oku

```bash
gh issue view <number> --comments
```

JSON formatında daha zengin:

```bash
gh issue view <number> --json number,title,body,labels,comments,state
```

### Issue listele

```bash
# Açık issue'lar
gh issue list --state open --limit 50

# JSON formatında, etiket ve yorum dahil
gh issue list --state open \
  --json number,title,body,labels,comments \
  --jq '[.[] | {number, title, body, labels: [.labels[].name]}]'

# Belirli etiket
gh issue list --label "ready-for-agent"
```

### Yorum ekle

```bash
gh issue comment <number> --body "<yorum>"
```

### Etiket yönet

```bash
gh issue edit <number> --add-label "ready-for-agent"
gh issue edit <number> --remove-label "needs-triage"
```

### Kapat

```bash
gh issue close <number> --comment "Tamamlandı: PR #<x>"
```

### Issue ile PR bağla

PR description'a `Closes #<number>` yazarak otomatik kapatma:

```bash
gh pr create --title "..." --body "Closes #42"
```

---

## Repo Tespiti

`gh`, repo'yu otomatik olarak `git remote -v`'den çıkarır — bir clone içinde çalıştığın sürece bayrak gerekmez.

Manuel belirlemek gerekirse: `--repo owner/name` bayrağı.

---

## Skill Yönlendirmeleri

| Skill der ki | Yapılacak |
|---|---|
| "issue tracker'a yayınla" | `gh issue create` |
| "ilgili ticket'ı çek" | `gh issue view <num> --comments` |
| "etiket uygula" | `gh issue edit <num> --add-label "..."` |
| "parent issue'a referans" | Markdown'da `#<num>` yaz, otomatik link olur |

---

## Etiket Sözlüğü

Rubion projelerinde standart etiketler (yoksa `gh label create` ile oluşturulur):

- `ready-for-agent` — tam spec, AFK ajan alabilir
- `ready-for-human` — insan implementasyonu gerekiyor
- `needs-triage` — değerlendirme bekliyor
- `needs-info` — reporter'dan bilgi bekliyor
- `wontfix` — yapılmayacak

```bash
# Etiket oluşturma (bir kerelik)
gh label create "ready-for-agent" --color "0E8A16"
gh label create "ready-for-human" --color "C5DEF5"
gh label create "needs-triage" --color "FBCA04"
gh label create "needs-info" --color "D93F0B"
gh label create "wontfix" --color "FFFFFF"
```
