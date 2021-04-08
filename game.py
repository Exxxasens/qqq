EMPTY = 0
X = 1
O = 2


def create_game(user_id, n, next_step):
    game = {
        'first_player': user_id,
        'second_player': None,
        'game_field': create_field(n),
        'next_step': next_step,
        'status': 'created'
    }
    return game


def start_game(game):
    game['status'] = 'started'
    return game


def end_game(game):
    game['status'] = 'finished'
    return game


def is_game_end(game):
    pass


def step(game, y, x):
    if game.next_step == X:
        game['game_field'][y][x] = X;
    if game.next_step == O:
        game['game_field'][y][x] = O;

    if is_game_end(game):
        game = end_game(game)

    return game


def create_field(n):
    field = []

    for i in range(n):
        row = []
        for j in range(n):
            row.append(EMPTY)
        field.append(row)

    return field


