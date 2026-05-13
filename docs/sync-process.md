# Aylık Upstream Sync Prosedürü

**Sıklık:** Her ayın ilk pazartesi, ~30 dakika.

## Adımlar

1. **Diff al:**
   ```bash
   cd /tmp && rm -rf upstream-skills
   git clone --depth 50 https://github.com/mattpocock/skills.git upstream-skills
   cd upstream-skills
   # UPSTREAM.md'deki son pin SHA ile karşılaştır
   git log --oneline <last_pinned_sha>..HEAD -- skills/
   ```

2. **Per-skill karar matrisi:**

   | Durum | Aksiyon |
   |---|---|
   | Adapte etmediğin skill'de değişiklik | Vendor'u güncelle |
   | Adapte ettiğin skill'de küçük iyileştirme | Manuel olarak adapted/'a uygula |
   | Adapte ettiğin skill'de felsefi değişiklik | Test repo'sunda dene, sonra karar |
   | Yeni skill eklenmiş | Değerli mi? adapted/'a al. Değilse logla, geç |
   | Skill silinmiş | UPSTREAM.md'ye not düş, adapted/'da kalsın |

3. **Vendor'u güncelle (yapacaksan):**
   ```bash
   rm -rf vendor/mattpocock
   cp -r /tmp/upstream-skills/skills vendor/mattpocock
   git add . && git commit -m "vendor: sync to <new_sha>"
   ```

4. **UPSTREAM.md'ye yeni entry ekle.**

5. **CHANGELOG.md güncelle** (kullanıcıya etki edecek değişiklikler varsa).

6. **Test repo'sunda smoke test:** Bir CRUD endpoint'i yazdır, davranış değişti mi gözle.

## Cherry-Pick Karar Kriteri

Bir upstream değişikliğini almaya değer mi?

1. **Felsefi mi, taktik mi?** Taktik (örnek/prompt iyileştirmesi) → genelde al. Felsefi (mantık değişimi) → tartış, çoğunlukla alma.
2. **Senin custom kısmınla çakışıyor mu?** Çakışıyorsa kendi versiyonunda kal.
3. **Stack'inle alakalı mı?** TypeScript-specific iyileştirme .NET skill'ini bozar → bypass et.
