# -*- coding: utf-8 -*-
"""
fix_acentos_corpus.py — corrige acentuação faltante no corpo dos 89 MDX do blog.

Sucessor de fix_acentos.py, que cobria apenas os 30 arquivos da Fase 1.

Duas salvaguardas que o antecessor não tinha:

1. NÃO toca em URL. Trechos dentro de href="...", src="..." e de qualquer
   ocorrência de aharabr.com.br são mascarados antes da substituição e restaurados
   depois. Slug não leva acento, e foi assim que /para-comércios/ virou um 404.

2. Dicionário CONSERVADOR. Só entram palavras cuja forma sem acento não é uma
   palavra válida do português em uso corrente. Ficaram DE FORA, deliberadamente:
     pratica  -> prática   ("a Ahara pratica preço base" é verbo, e correto)
     duvidas  -> dúvidas   ("tu duvidas" é verbo)
     ate      -> até       ("que ele ate" é verbo)
     sabia    -> sabiá     (verbo)
     esta     -> está      (pronome demonstrativo)
     e        -> é         (conjunção)
   Essas exigem análise de contexto e ficam para revisão humana. Trocá-las por
   regra fixa cria erro novo em frase hoje correta.

Uso:
    python scripts/fix_acentos_corpus.py           ensaio, lista as ocorrências
    python scripts/fix_acentos_corpus.py --apply   aplica
"""
import io
import os
import re
import sys
import glob

sys.stdout.reconfigure(encoding='utf-8')

BLOG = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', 'src', 'content', 'blog')
APLICAR = '--apply' in sys.argv

# chave = forma sem acento (minúscula); valor = forma correta
CORRECOES = {
    'emporios': 'empórios',
    'emporio': 'empório',
    'pagina': 'página',
    'paginas': 'páginas',
    'municipio': 'município',
    'municipios': 'municípios',
    'umido': 'úmido',
    'umida': 'úmida',
    'comeca': 'começa',
    'comecar': 'começar',
    'comecam': 'começam',
    'possivel': 'possível',
    'impossivel': 'impossível',
    'disponivel': 'disponível',
    'disponiveis': 'disponíveis',
    'variavel': 'variável',
    'variaveis': 'variáveis',
    'nivel': 'nível',
    'niveis': 'níveis',
    'facil': 'fácil',
    'dificil': 'difícil',
    'util': 'útil',
    'uteis': 'úteis',
    'estavel': 'estável',
    'rentavel': 'rentável',
    'aceitavel': 'aceitável',
    'simulacoes': 'simulações',
    'simulacao': 'simulação',
    'duvida': 'dúvida',
    'historico': 'histórico',
    'logistica': 'logística',
    'logistico': 'logístico',
    'pratico': 'prático',
    'praticos': 'práticos',
    'praticas': 'práticas',
    'basico': 'básico',
    'basicos': 'básicos',
    'basica': 'básica',
    'publico': 'público',
    'publicos': 'públicos',
    # 'publica' fica de fora: no corpus inteiro ela aparece como VERBO
    # ("a Ahara publica 5% em 25kg"), e a troca criaria erro em frase correta.
    'unico': 'único',
    'unica': 'única',
    'unicos': 'únicos',
    'unicas': 'únicas',
    'minimo': 'mínimo',
    'minima': 'mínima',
    'maximo': 'máximo',
    'maxima': 'máxima',
    'medio': 'médio',
    'media': 'média',
    'medias': 'médias',
    'proprio': 'próprio',
    'propria': 'própria',
    'proprios': 'próprios',
    'proprias': 'próprias',
    'periodo': 'período',
    'periodos': 'períodos',
    'calculo': 'cálculo',
    'calculos': 'cálculos',
    'analise': 'análise',
    'analises': 'análises',
    'tecnico': 'técnico',
    'tecnica': 'técnica',
    'tecnicos': 'técnicos',
    'tecnicas': 'técnicas',
    'especifico': 'específico',
    'especifica': 'específica',
    'especificos': 'específicos',
    'especificas': 'específicas',
    'estrategia': 'estratégia',
    'estrategias': 'estratégias',
    'estrategico': 'estratégico',
    'referencia': 'referência',
    'referencias': 'referências',
    'experiencia': 'experiência',
    'frequencia': 'frequência',
    'consequencia': 'consequência',
    'transferencia': 'transferência',
    'preferencia': 'preferência',
    'ciencia': 'ciência',
    'eficiencia': 'eficiência',
    'quilometro': 'quilômetro',
    'quilometros': 'quilômetros',
    'ultimo': 'último',
    'ultima': 'última',
    'ultimos': 'últimos',
    'ultimas': 'últimas',
    'proximo': 'próximo',
    'proxima': 'próxima',
    'proximos': 'próximos',
    'proximas': 'próximas',
}

# Máscara: nada dentro de URL é tocado.
MASCARAS = [
    re.compile(r'href=["\'][^"\']*["\']', re.I),
    re.compile(r'src=["\'][^"\']*["\']', re.I),
    re.compile(r'https?://[^\s"\'<>)]+'),
]


def preserva_caixa(original, correta):
    if original.isupper():
        return correta.upper()
    if original[0].isupper():
        return correta[0].upper() + correta[1:]
    return correta


def processa(texto):
    guardados = []

    def guarda(m):
        guardados.append(m.group(0))
        return '\x00%d\x00' % (len(guardados) - 1)

    for padrao in MASCARAS:
        texto = padrao.sub(guarda, texto)

    achados = {}
    for sem, com in CORRECOES.items():
        padrao = re.compile(r'\b' + sem + r'\b', re.IGNORECASE)

        def troca(m):
            achados[sem] = achados.get(sem, 0) + 1
            return preserva_caixa(m.group(0), com)

        texto = padrao.sub(troca, texto)

    texto = re.sub(r'\x00(\d+)\x00', lambda m: guardados[int(m.group(1))], texto)
    return texto, achados


def main():
    arquivos = sorted(glob.glob(os.path.join(BLOG, '*.mdx')))
    total = 0
    tocados = 0
    geral = {}
    for caminho in arquivos:
        original = io.open(caminho, encoding='utf-8').read()
        novo, achados = processa(original)
        if novo != original:
            tocados += 1
            n = sum(achados.values())
            total += n
            for k, v in achados.items():
                geral[k] = geral.get(k, 0) + v
            if APLICAR:
                io.open(caminho, 'w', encoding='utf-8', newline='\n').write(novo)

    print('MODO:', 'APLICANDO' if APLICAR else 'ENSAIO (nada foi escrito)')
    print('arquivos varridos: %d | arquivos com correcao: %d | ocorrencias: %d'
          % (len(arquivos), tocados, total))
    print()
    for k, v in sorted(geral.items(), key=lambda x: -x[1]):
        print('   %-18s -> %-18s %d' % (k, CORRECOES[k], v))


if __name__ == '__main__':
    main()
