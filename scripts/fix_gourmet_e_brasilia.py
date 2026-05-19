"""
fix_gourmet_e_brasilia.py
1. Remove a palavra "gourmet" de todos os 30 MDX, substituindo por termos adequados ao contexto.
2. Reforça em cada artigo que a Ahara tem sede em Brasília e realiza envios para todo o Brasil.
"""
import sys, os, re
sys.stdout.reconfigure(encoding='utf-8')

BLOG_DIR = r"D:\ia\Projeto Ahara\src\content\blog"

SLUGS = [
    'batata-chips-revenda-go','batata-chips-revender-go','batata-chips-atacado-go',
    'batata-chips-revenda-mg','batata-chips-revender-mg','batata-chips-atacado-mg',
    'batata-chips-revenda-sp','batata-chips-revender-sp','batata-chips-atacado-sp',
    'batata-chips-revenda-rj','batata-chips-revender-rj','batata-chips-atacado-rj',
    'batata-chips-revenda-pr','batata-chips-revender-pr','batata-chips-atacado-pr',
    'batata-chips-revenda-rs','batata-chips-revender-rs','batata-chips-atacado-rs',
    'batata-chips-revenda-ba','batata-chips-revender-ba','batata-chips-atacado-ba',
    'batata-chips-revenda-pe','batata-chips-revender-pe','batata-chips-atacado-pe',
    'batata-chips-revenda-ce','batata-chips-revender-ce','batata-chips-atacado-ce',
    'batata-chips-revenda-sc','batata-chips-revender-sc','batata-chips-atacado-sc',
]

# Mapa de estado por slug-prefix
ESTADO_NOME = {
    'go': 'Goiás', 'mg': 'Minas Gerais', 'sp': 'São Paulo',
    'rj': 'Rio de Janeiro', 'pr': 'Paraná', 'rs': 'Rio Grande do Sul',
    'ba': 'Bahia', 'pe': 'Pernambuco', 'ce': 'Ceará', 'sc': 'Santa Catarina',
}

# ── 1. Substituições contextuais de "gourmet" ────────────────────────────────
# Ordem: da mais específica para a mais genérica
GOURMET_RULES = [
    # Locais/estabelecimentos → especializado(s/a/as)
    (re.compile(r'\bsupermercados?\s+gourmet\b', re.IGNORECASE), 'supermercado especializado'),
    (re.compile(r'\bmercados?\s+gourmet\b', re.IGNORECASE), 'mercado especializado'),
    (re.compile(r'\bemporios?\s+gourmet\b', re.IGNORECASE), 'empório especializado'),
    (re.compile(r'\bemporios\s+gourmet\b', re.IGNORECASE), 'empórios especializados'),
    (re.compile(r'\bempórios\s+gourmet\b', re.IGNORECASE), 'empórios especializados'),
    (re.compile(r'\bempório\s+gourmet\b', re.IGNORECASE), 'empório especializado'),
    (re.compile(r'\blojas?\s+gourmet\b', re.IGNORECASE), 'loja especializada'),
    (re.compile(r'\bbares?\s+gourmet\b', re.IGNORECASE), 'bar especializado'),
    (re.compile(r'\bbares\s+gourmet\b', re.IGNORECASE), 'bares especializados'),
    (re.compile(r'\brestaurantes?\s+gourmet\b', re.IGNORECASE), 'restaurante especializado'),
    (re.compile(r'\bcafés?\s+gourmet\b', re.IGNORECASE), 'café especializado'),
    (re.compile(r'\bcafes?\s+gourmet\b', re.IGNORECASE), 'café especializado'),
    (re.compile(r'\bcanais?\s+gourmet\b', re.IGNORECASE), 'canal especializado'),
    (re.compile(r'\bpontos?\s+gourmet\b', re.IGNORECASE), 'ponto especializado'),
    (re.compile(r'\bcharcutaria\s+gourmet\b', re.IGNORECASE), 'charcutaria artesanal'),
    (re.compile(r'\badega\s+gourmet\b', re.IGNORECASE), 'adega especializada'),
    (re.compile(r'\badegas\s+gourmet\b', re.IGNORECASE), 'adegas especializadas'),
    # Produtos/snacks → artesanal(is)
    (re.compile(r'\bsnacks?\s+gourmet\b', re.IGNORECASE), 'snack artesanal'),
    (re.compile(r'\bpetiscos?\s+gourmet\b', re.IGNORECASE), 'petisco artesanal'),
    (re.compile(r'\bpetiscos\s+gourmet\b', re.IGNORECASE), 'petiscos artesanais'),
    (re.compile(r'\bprodutos?\s+gourmet\b', re.IGNORECASE), 'produto artesanal'),
    (re.compile(r'\bchips?\s+gourmet\b', re.IGNORECASE), 'chips artesanal'),
    (re.compile(r'\balimentos?\s+gourmet\b', re.IGNORECASE), 'alimento artesanal'),
    (re.compile(r'\bitem\s+gourmet\b', re.IGNORECASE), 'item artesanal'),
    (re.compile(r'\bitens\s+gourmet\b', re.IGNORECASE), 'itens artesanais'),
    (re.compile(r'\bcestas?\s+gourmet\b', re.IGNORECASE), 'cesta artesanal'),
    (re.compile(r'\bkits?\s+gourmet\b', re.IGNORECASE), 'kit artesanal'),
    # Mix/segmento → premium ou diferenciado
    (re.compile(r'\bmix\s+gourmet\b', re.IGNORECASE), 'mix diferenciado'),
    (re.compile(r'\bsegmento\s+gourmet\b', re.IGNORECASE), 'segmento premium'),
    (re.compile(r'\bmercado\s+gourmet\b', re.IGNORECASE), 'mercado premium'),
    (re.compile(r'\bnicho\s+gourmet\b', re.IGNORECASE), 'nicho premium'),
    (re.compile(r'\bperfil\s+gourmet\b', re.IGNORECASE), 'perfil premium'),
    (re.compile(r'\bpúblico\s+gourmet\b', re.IGNORECASE), 'público exigente'),
    (re.compile(r'\bpublico\s+gourmet\b', re.IGNORECASE), 'público exigente'),
    # Fallback geral — "gourmet" isolado
    (re.compile(r'\bgourmet\b', re.IGNORECASE), 'artesanal premium'),
]

def remove_gourmet(text: str) -> tuple[str, int]:
    count = 0
    for pat, repl in GOURMET_RULES:
        new, n = pat.subn(repl, text)
        count += n
        text = new
    return text, count


# ── 2. Bloco Brasília → envio nacional ──────────────────────────────────────
# Inserir logo após o primeiro <p> do corpo do artigo (após o frontmatter)
def get_estado(slug: str) -> str:
    uf = slug.split('-')[-1]
    return ESTADO_NOME.get(uf, uf.upper())

def insert_brasilia_block(text: str, estado: str) -> tuple[str, bool]:
    """
    Insere bloco de aviso Brasília → envio nacional após o primeiro </p> do corpo,
    apenas se ainda não tiver o texto indicador.
    """
    indicator = 'sede em Brasília'
    if indicator in text:
        return text, False  # já tem

    BLOCO = (
        f'\n\n<p class="aviso-origem"><strong>A Ahara tem sede em Brasília/DF</strong> '
        f'e realiza envios para todo o Brasil, incluindo {estado}. '
        f'A entrega estruturada com frota própria cobre o Distrito Federal a partir de 15 kg. '
        f'Para pedidos com destino a {estado}, o frete é calculado individualmente conforme volume e localidade '
        f'— consulte as condições pelo canal de atendimento antes de fechar o pedido.</p>\n'
    )

    # Encontrar o fim do frontmatter (segundo "---")
    fm_end = text.find('---', 3)
    if fm_end == -1:
        return text, False

    # Pular o frontmatter e encontrar o primeiro </p> no corpo
    body_start = fm_end + 3
    first_p_close = text.find('</p>', body_start)
    if first_p_close == -1:
        return text, False

    insert_pos = first_p_close + 4  # logo após o primeiro </p>
    new_text = text[:insert_pos] + BLOCO + text[insert_pos:]
    return new_text, True


# ── Processar todos os arquivos ──────────────────────────────────────────────
print("Processando 30 MDX...\n")
total_gourmet = 0
total_brasilia = 0

for slug in SLUGS:
    path = os.path.join(BLOG_DIR, slug + '.mdx')
    with open(path, encoding='utf-8') as f:
        text = f.read()

    # 1. Remover gourmet
    text, ng = remove_gourmet(text)

    # 2. Inserir bloco Brasília
    estado = get_estado(slug)
    text, added = insert_brasilia_block(text, estado)

    with open(path, 'w', encoding='utf-8') as f:
        f.write(text)

    total_gourmet += ng
    total_brasilia += 1 if added else 0
    g_str = f"{ng} 'gourmet' removidos" if ng else "sem gourmet"
    b_str = "bloco Brasília adicionado" if added else "Brasília já presente"
    print(f"  ✓ {slug}: {g_str} | {b_str}")

print(f"\nResumo:")
print(f"  'gourmet' removidos: {total_gourmet}")
print(f"  Blocos Brasília inseridos: {total_brasilia}/30")
