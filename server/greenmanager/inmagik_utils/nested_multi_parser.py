import re

from django.utils.datastructures import MultiValueDict
from rest_framework.exceptions import ParseError
from rest_framework.parsers import DataAndFiles, MultiPartParser

# Un segmento di chiave: nome iniziale, .chiave, oppure [indice] / []
KEY_RE = re.compile(r"^(\w+)|\.(\w+)|\[(\w*)\]")

MAX_LIST_ITEMS = 1_000
MAX_TOTAL_LIST_ITEMS = 10_000


class _FilesForCleanup(MultiValueDict):
    """Keep uploaded files available for cleanup without merging them twice."""

    def __bool__(self):
        # DRF only merges ``files`` into ``data`` when this mapping is truthy.
        # The entries remain available to Django's HttpRequest.close(), which
        # iterates them via MultiValueDict.lists() and closes every upload.
        return False


def _tokenize(key):
    """
    'items[0].name'      -> ['items', '0', 'name']
    'items[0].tags[1]'   -> ['items', '0', 'tags', '1']
    'items[].name'       -> ['items', '', 'name']
    'user.address.city'  -> ['user', 'address', 'city']
    """
    tokens = []
    pos = 0
    while pos < len(key):
        m = KEY_RE.match(key, pos)
        if not m:
            raise ValueError(f"carattere inatteso a pos {pos}: {key!r}")
        g1, g2, g3 = m.groups()
        if g1 is not None:  # nome iniziale
            tokens.append(g1)
        elif g2 is not None:  # .chiave
            tokens.append(g2)
        else:  # [indice] o [] -> g3 può essere ''
            tokens.append(g3)
        pos = m.end()
    return tokens


def _is_index(tok):
    """Un token rappresenta una posizione di lista se è vuoto (append) o numerico."""
    return tok == "" or tok.isdigit()


class _ExpansionBudget:
    def __init__(self):
        self.list_items = 0

    def reserve(self, amount):
        if self.list_items + amount > MAX_TOTAL_LIST_ITEMS:
            raise ValueError(
                f"limite complessivo di {MAX_TOTAL_LIST_ITEMS} elementi lista superato"
            )
        self.list_items += amount


def _grow(lst, idx, budget):
    target_length = idx + 1
    if target_length > MAX_LIST_ITEMS:
        raise ValueError(f"indice {idx} oltre il limite di {MAX_LIST_ITEMS - 1}")

    missing = target_length - len(lst)
    if missing > 0:
        budget.reserve(missing)
        lst.extend([None] * missing)


def _append(lst, value, budget):
    if len(lst) >= MAX_LIST_ITEMS:
        raise ValueError(f"limite di {MAX_LIST_ITEMS} elementi lista superato")
    budget.reserve(1)
    lst.append(value)


def _list_set(lst, tok, value, budget):
    if tok == "":
        _append(lst, value, budget)
    else:
        idx = int(tok)
        _grow(lst, idx, budget)
        lst[idx] = value


def _list_get_or_create(lst, tok, default, budget):
    if tok == "":
        _append(lst, default, budget)
        return lst[-1]
    idx = int(tok)
    _grow(lst, idx, budget)
    if not isinstance(lst[idx], (dict, list)):
        lst[idx] = default
    return lst[idx]


def _assign(container, tokens, value, budget):
    """Inserisce value dentro container (dict) seguendo il percorso tokens."""
    for i, tok in enumerate(tokens):
        last = i == len(tokens) - 1
        cur_is_index = _is_index(tok)
        expected_type = list if cur_is_index else dict
        if not isinstance(container, expected_type):
            raise ValueError(f"contenitore incompatibile per {tok!r}")

        if last:
            if cur_is_index:
                _list_set(container, tok, value, budget)
            else:
                container[tok] = value
            return

        # Non è l'ultimo: garantisci l'esistenza del contenitore figlio,
        # scegliendo lista o dict in base al token successivo.
        nxt = tokens[i + 1]
        child = [] if _is_index(nxt) else {}

        if cur_is_index:
            container = _list_get_or_create(container, tok, child, budget)
        else:
            if not isinstance(container.get(tok), (dict, list)):
                container[tok] = child
            container = container[tok]


class NestedMultiPartParser(MultiPartParser):
    """
    MultiPartParser che interpreta la sintassi bracket + dot:

        title=ordine 1
        items[0].name=foo
        items[0].qty=3
        items[0].file=<file>
        items[1].name=bar
        items[1].file=<file>

    produce in request.data:

        {
            'title': 'ordine 1',
            'items': [
                {'name': 'foo', 'qty': '3', 'file': <UploadedFile>},
                {'name': 'bar', 'file': <UploadedFile>},
            ],
        }

    I file seguono la stessa convenzione di chiavi dei campi scalari e
    vengono fusi nella struttura; result.files resta comunque popolato.
    """

    def parse(self, stream, media_type=None, parser_context=None):
        result = super().parse(stream, media_type, parser_context)

        root = {}
        budget = _ExpansionBudget()
        # data e files insieme: le chiavi dei file usano la stessa sintassi.
        for source in (result.data, result.files):
            for key in source:
                values = source.getlist(key)
                try:
                    tokens = _tokenize(key)
                except ValueError as e:
                    raise ParseError(f"Chiave malformata: {key!r} ({e})")

                if len(tokens) == 1:
                    # Chiave semplice: preserva il comportamento del QueryDict
                    # (valore singolo, o lista se ripetuta).
                    root[key] = values if len(values) > 1 else values[0]
                    continue

                for v in values:
                    try:
                        _assign(root, tokens, v, budget)
                    except (ValueError, IndexError) as e:
                        raise ParseError(f"Chiave malformata: {key!r} ({e})")

        return DataAndFiles(root, _FilesForCleanup(result.files))
