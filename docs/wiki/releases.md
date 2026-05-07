# Como criar uma Release no GitHub

Guia para publicar uma release a partir de uma tag existente.

---

## Pré-requisitos

- Tag criada localmente e enviada ao GitHub:
  ```bash
  git tag -a v1.2.3 -m "Release v1.2.3"
  git push origin v1.2.3
  ```
- CHANGELOG.md atualizado com a seção `[x.y.z]` fechada.

---

## Passo a passo

1. Acesse o repositório no GitHub.
2. Clique na aba **Releases** (barra lateral direita ou menu superior).
3. Clique em **"Draft a new release"** ou **"Create release from tag"**.
4. No campo **"Choose a tag"**, selecione a tag existente (ex.: `v0.1.0`).
5. Preencha **Title** e **Release notes** conforme abaixo.
6. Clique em **"Publish release"**.

---

## Título

Padrão: `v<versão> — <nome do marco ou tema>`

Exemplos:
```
v0.1.0 — M0: Infraestrutura Base
v0.2.0 — M1: Autenticação e Sessões
v1.0.0 — Lançamento Público
```

---

## Release Notes

Cole o conteúdo da seção correspondente do `CHANGELOG.md`, **sem** o cabeçalho de data.

### Estrutura esperada

```markdown
> Resumo narrativo de até 3 linhas: o que esta versão representa
> e o que o usuário ganha.

### Added
- Descrição do que foi adicionado.

### Fixed
- Correções realizadas.

### Changed
- Mudanças de comportamento.
```

O GitHub renderiza Markdown automaticamente — o resultado fica formatado com seções, listas e destaque de código.

---

## Convenções deste projeto

| Campo | Valor |
|-------|-------|
| Tag | `v<major>.<minor>.<patch>` (ex.: `v0.1.0`) |
| Título | `v<versão> — M<n>: <tema>` durante os marcos iniciais |
| Release notes | Conteúdo do CHANGELOG.md para a versão correspondente |
| Pre-release | Marcar quando a versão ainda é alpha/beta (não para produção) |

---

## Após publicar

Confirme que a release aparece em **github.com/<org>/<repo>/releases** com:
- Tag correta
- Título legível
- Release notes formatadas
- Assets gerados automaticamente (source code .zip e .tar.gz)
