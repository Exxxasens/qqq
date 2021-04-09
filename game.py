EMPTY = 0
X = 1
O = 2
RANDOM = 3


def create_game(user_id, n, next_step):
    game = {
        'first_player': user_id,
        'second_player': None,
        'game_field': create_field(n),
        'next_step': next_step,
        'status': 'created',
        'winner': None
    }
    return game


def start_game(game):
    game['status'] = 'started'
    return game


def end_game(game):
    game['status'] = 'finished'
    return game


def is_game_end(game):
    game_field = game['game_field']
    size = len(game_field)

    for i in range(size):
        horizontal = -2
        vertical = -2

        for j in range(size):
            if vertical == -2:
                vertical = game_field[j][i]
            if not vertical == game_field[j][i]:
                vertical = 0

            if horizontal == -2:
                horizontal = game_field[i][j]
            if not horizontal == game_field[i][j]:
                horizontal = 0

        if vertical == X or horizontal == X:
            return {
                'end': True,
                'winner': X
            }
        if vertical == O or horizontal == O:
            return {
                'end': True,
                'winner': O
            }

    return {
        'end': False,
        'winner': None
    }


def step(game, y, x):

    if game['next_step'] == X:
        game['game_field'][y][x] = X
        game['next_step'] = O

    elif game['next_step'] == O:
        game['game_field'][y][x] = O
        game['next_step'] = X

    result = is_game_end(game)

    if result['end']:
        game['status'] = 'finished'
        game['winner'] = result['winner']

    return game


def create_field(n):
    field = []

    for i in range(n):
        row = []
        for j in range(n):
            row.append(EMPTY)
        field.append(row)

    return field


