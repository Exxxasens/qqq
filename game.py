import json
import random

EMPTY = 0
X = 1
O = 2
RANDOM = 3
CREATED = 'created'
STARTED = 'started'
FINISHED = 'finished'


class Game:

    @staticmethod
    def create_field(n):
        field = []

        for i in range(n):
            row = []
            for j in range(n):
                row.append(EMPTY)
            field.append(row)

        return field

    @staticmethod
    def create_from_object(obj):
        game = Game()

        if '_id' in obj:
            game._id = str(obj['_id'])

        if 'first_player' in obj:
            game.first_player = str(obj['first_player'])

        if 'second_player' in obj:
            if obj['second_player'] is not None:
                game.second_player = str(obj['second_player'])
            else:
                game.second_player = None

        if 'field' in obj:
            game.field = obj['field']

        if 'next_step' in obj:
            game.next_step = obj['next_step']

        if 'status' in obj:
            game.status = obj['status']

        if 'winner' in obj:
            game.winner = obj['winner']

        if 'lines_to_win' in obj:
            game.line_to_win = obj['line_to_win'] = 3

        if 'multiple_lines' in obj:
            game.multiple_lines = obj['multiple_lines']

        if 'score' in obj:
            game.score = obj['score']

        return game

    def __init__(self, user_id=None, field_size=3, next_step=X, line_to_win=None, multiple_lines=False):

        self.first_player = str(user_id)
        self.second_player = None
        self.field = Game.create_field(field_size)
        self.next_step = next_step
        self.status = CREATED
        self.winner = None
        self.line_to_win = line_to_win or field_size
        self.multiple_lines = multiple_lines
        self.score = 0

    def step(self, y, x):

        if self.next_step == X:
            self.field[y][x] = self.next_step
            self.next_step = O

        elif self.next_step == O:
            self.field[y][x] = self.next_step
            self.next_step = X

        self.is_game_end()

        return self

    def is_game_end(self):
        game_field = self.field
        size = len(game_field)

        def is_safe(y, x):
            if 0 <= x < size and 0 <= y < size:
                return True

            return False

        if self.count_empty_cells() > 0 and self.multiple_lines:
            return

        def check_diagonal(y, x):
            _t = None

            for n in range(self.line_to_win):
                if is_safe(y + n, x + n):
                    if game_field[y + n][x + n] != EMPTY:

                        if _t is None:
                            _t = game_field[y + n][x + n]

                        elif _t != game_field[y + n][x + n]:
                            return None

                    else:
                        return None

                else:
                    return None

            return _t

        def check_right(y, x):
            _t = None

            for n in range(self.line_to_win):
                if is_safe(y, x + n):
                    if game_field[y][x + n] != EMPTY:
                        if _t is None:
                            _t = game_field[y][x + n]

                        elif _t != game_field[y][x + n]:
                            return None

                    else:
                        return None

                else:
                    return None

            return _t

        def check_bottom(y, x):
            _t = None

            for n in range(self.line_to_win):
                if is_safe(y + n, x):
                    if game_field[y + n][x] != EMPTY:

                        if _t is None:
                            _t = game_field[y + n][x]

                        elif _t != game_field[y + n][x]:
                            return None

                    else:
                        return None

                else:
                    return None

            return _t

        def check_second_diagonal(y, x):
            _t = None

            for n in range(self.line_to_win):
                if is_safe(y + n, x - n):
                    if game_field[y + n][x - n] != EMPTY:

                        if _t is None:
                            _t = game_field[y + n][x - n]

                        elif _t != game_field[y + n][x - n]:
                            return None

                    else:
                        return None

                else:
                    return None

            return _t

        x_counter = 0
        o_counter = 0

        for i in range(len(game_field)):
            for j in range(len(game_field[i])):
                right = check_right(i, j)
                bottom = check_bottom(i, j)
                diagonal = check_diagonal(i, j)
                second_diagonal = check_second_diagonal(i, j)

                if right == X:
                    x_counter += 1
                elif right == O:
                    o_counter += 1

                if bottom == X:
                    x_counter += 1
                elif bottom == O:
                    o_counter += 1

                if diagonal == X:
                    x_counter += 1
                elif diagonal == O:
                    o_counter += 1

                if second_diagonal == X:
                    x_counter += 1
                elif second_diagonal == O:
                    o_counter += 1

        if not self.multiple_lines:
            if x_counter > 0:
                self.end_game(X, 1)
            elif o_counter > 0:
                self.end_game(O, 1)
            elif self.count_empty_cells() == 0:
                self.end_game(None, 0)
            return

        if x_counter > o_counter:
            self.end_game(X, x_counter)

        elif o_counter > x_counter:
            self.end_game(O, o_counter)

        else:
            self.end_game(None, 0)

    def count_empty_cells(self):
        counter = 0

        for i in range(len(self.field)):
            for j in range(len(self.field[i])):
                if self.field[i][j] == EMPTY:
                    counter += 1

        return counter

    def end_game(self, winner=None, score=1):
        self.status = FINISHED
        self.winner = winner
        self.score = score

    def is_empty_cell(self, y, x):
        if len(self.field) > y and len(self.field[y]) > x and self.field[y][x] is EMPTY:
            return True

        return False

    def start_game(self):
        if self.status == CREATED:
            print(self.next_step)
            if self.next_step == RANDOM:
                self.next_step = random.randint(1, 2)
            self.status = STARTED

        return self

    def join_game(self, second_player):
        if self.second_player is None and self.first_player != second_player:
            self.second_player = str(second_player)
            self.start_game()

    def is_started(self):
        return self.status == STARTED

    def can_step(self, player):

        if self.first_player == str(player) and self.next_step == X:
            return True

        if self.second_player == str(player) and self.next_step == O:
            return True

        return False

    def get_json(self):
        return json.dumps(self, default=lambda o: o.__dict__, indent=4)

    def get_object(self):
        return self.__dict__

    def to_client(self):
        game_object = self.get_object()
        return {
            'first_player': game_object['first_player'],
            'second_player': game_object['second_player'],
            'field': game_object['field'],
            'winner': game_object['winner'],
            'next_step': game_object['next_step']
        }
