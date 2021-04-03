EMPTY = 0
X = 1
O = 1


def create_game(user_id, n, next_step):
    game = {
        'first_player': user_id,
        'second_player': None,
        'game_field': create_field(n),
        'next_step': next_step,
        'status': 'created'
    }
    return game


def join_game(game, user_id):
    game['second_player'] = user_id
    return game


def start_game(game):
    game['status'] = 'started'
    return game

def end_game(game):
    game['status'] = 'finished'
    return game


def create_field(n):
    field = []
    for i in range(n):
        row = []
        for j in range(n):
            row.append(EMPTY)
        field.append(row)

    return field


