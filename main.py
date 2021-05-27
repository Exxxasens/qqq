from flask import Flask, request, jsonify, send_from_directory, Response
from flask_pymongo import PyMongo
from game import Game, X, O, RANDOM, FINISHED, CREATED
from user import create_user, compare_passwords
from functools import wraps
from settings import MONGO_URI, SECRET
from flask_socketio import SocketIO, join_room, leave_room
from bson.objectid import ObjectId
import jwt
import os
import re
import time
import logging
import eventlet

app = Flask(__name__, static_folder='client/build')
app.logger.setLevel(logging.DEBUG)
mongo_client = PyMongo(app, uri=MONGO_URI, ssl=True, ssl_cert_reqs='CERT_NONE')

db = mongo_client.db

# SocketIO implementation
async_mode = None
socket_ = SocketIO(app, logging=True, cors_allowed_origins='*')
clients = []


def on_except(): return jsonify(error=True, result='Произошла неизвестная ошибка')


def update_user_score(game: Game):
    if game.status == FINISHED:

        winner_upd = {
            '$inc': {
                'games_played': 1,
                'won': 1
            }
        }

        default_upd = {
            '$inc': {
                'games_played': 1,
            }
        }

        app.logger.info('updating user info')

        if game.winner and game.winner == X:
            db.users.update_one({'_id': ObjectId(game.first_player)}, winner_upd)
            db.users.update_one({'_id': ObjectId(game.second_player)}, default_upd)

        elif game.winner and game.winner == O:
            db.users.update_one({'_id': ObjectId(game.first_player)}, default_upd)
            db.users.update_one({'_id': ObjectId(game.second_player)}, winner_upd)


def auth_required(f):
    @wraps(f)
    def decorator(*args, **kwargs):

        token = None

        if 'Authorization' in request.headers:
            token = request.headers['Authorization'].split(' ')[1]
            print(token)

        if not token:
            return jsonify(error=True, result='Для доступа к ресурсу требуется авторизация')

        try:
            data = jwt.decode(token, SECRET, algorithms=["HS256"])
            print(data)
            return f(data, *args, **kwargs)

        except Exception as e:
            print(e.__class__, "occurred.")
            print(e)
            return jsonify(error=True, result='Токен не валиден')

    return decorator


@app.route('/api/register', methods=['POST'])
def register():
    try:
        body = request.get_json(force=True)

        if not body['username'] or len(body['username']) < 4:
            return jsonify(error=True, result='Никнейм слишком короткий')

        if not body['password'] or len(body['password']) < 4:
            return jsonify(error=True, result='Пароль слишком короткий')

        username = body['username']
        password = body['password']

        found_user = db.users.find_one({"username": re.compile(username, re.IGNORECASE)})

        if found_user:
            return jsonify(error=True, result='Пользователь с таким никнеймом существует')

        user = create_user(username, password)

        db.users.insert_one(user)

        return jsonify(error=False, result='Пользователь успешно зарегистрирован')
    except Exception as e:
        app.logger.info(e)
        return jsonify(error=False, result='Произошла неизвестная ошибка')


@app.route('/api/login', methods=['POST'])
def login():
    try:
        body = request.get_json(force=True)

        if not body['username']:
            return jsonify(error=True, result='Поле username обязательное')
        if not body['password']:
            return jsonify(error=True, result='Поле password обязательное')

        found_user = db.users.find_one({'username': re.compile(body['username'], re.IGNORECASE)})

        if not found_user:
            return jsonify(error=True, result='Пользователь с таким именем или паролем не найден')

        if not compare_passwords(body['password'], found_user['password']):
            return jsonify(error=True, result='Пользователь с таким именем или паролем не найден')

        token = jwt.encode({'id': str(found_user.get('_id')), 'username': found_user['username']}, SECRET)

        return jsonify(error=False, result=token)

    except Exception as e:
        print(e)
        return on_except()


@app.route('/api/game/create', methods=['POST'])
@auth_required
def create_game_handler(current_user):
    try:
        body = request.get_json(force=True)

        size = int(body['size'] or 3)
        first_step = int(body['first_step'] or X)
        line_to_win = int(body['line_to_win'] or size)
        multiple_lines = bool(body['multiple_lines'] or False)

        if line_to_win > size:
            app.logger.info('line_to_win is more than size')
            raise Exception('line_to_win не может быть больше чем size')

    except (ValueError, KeyError, TypeError) as error:
        app.logger.info(error)
        return jsonify(error=True, message='Неизвестная ошибка')

    if size > 10:
        return jsonify(error=True, result='Максимальный размер игрового поля 10')

    if size < 3:
        return jsonify(error=True, result='Минимальный размер игрового поля 3')

    if not (first_step == X or first_step == O or first_step == RANDOM):
        return jsonify(error=True, result='Параметр first_step может принимать значение 1 или 0')

    if line_to_win > size:
        line_to_win = size

    if line_to_win < 2:
        line_to_win = 2

    game = Game(current_user['id'], size, first_step, line_to_win, multiple_lines)
    app.logger.info('created_game', game.get_object())

    game_id = str(db.games.insert_one(game.get_object()).inserted_id)

    return jsonify(error=False, result=game_id)


def format_sse(data, event=None):
    msg = f'data: {data}\n\n'
    if event is not None:
        msg = f'event: {event}\n{msg}'
    print('event', msg)
    return msg


@app.route('/api/game/<game_id>/events', methods=['GET'])
def game_events(game_id):
    stream_query = {
        '$match': {
            'documentKey._id': ObjectId(game_id)
        }
    }

    def streaming():
        with db.games.watch([stream_query]) as stream:
            while stream.alive:
                change = stream.try_next()
                if change is not None:
                    yield format_sse('game_updated')
                    continue
                time.sleep(1)

    return Response(streaming(), mimetype='text/event-stream')


@app.route('/api/game/<game_id>', methods=['POST', 'GET'])
@auth_required
def fetch_game(current_user, game_id):
    try:
        game = db.games.find_one({'_id': ObjectId(game_id)})

        if not game:
            return jsonify(error=True, result='Игра с данным id не найдена')

        first_player_username = db.users.find_one({'_id': ObjectId(game['first_player'])})['username']
        second_player_username = None

        if game['second_player']:
            second_player_username = db.users.find_one({'_id': ObjectId(game['second_player'])})['username']

        game['first_player'] = first_player_username
        game['second_player'] = second_player_username
        game['_id'] = str(game['_id'])

        return jsonify(error=False, result=game)

    except Exception as e:
        app.logger.info(e)
        return on_except()


@app.route('/api/game/<game_id>/step', methods=['POST'])
@auth_required
def step_game(current_user, game_id):
    try:
        body = request.get_json(force=True)

        if 'x' not in body:
            app.logger.info(
                'user {} not specified x parameter in request, game: {}'.format(current_user['username'], game_id))
            return jsonify(error=True, message='Параметер x обязательный')

        if 'y' not in body:
            app.logger.info(
                'user {} not specified y parameter in request, game: {}'.format(current_user['username'], game_id))
            return jsonify(error=True, message='Параметер y обязательный')

        y = body['y']
        x = body['x']

        data = db.games.find_one({'_id': ObjectId(game_id)})

        print('step')

        if not data:
            return jsonify(error=True, result='Игра с указанным game_id не найдена')

        app.logger.info(data)

        game = Game.create_from_object(data)
        app.logger.info(game)

        if game.can_step(current_user['id']):
            if not game.is_empty_cell(y, x):
                return jsonify(error=True, result='Клетка не пустая')
            game.step(y, x)
            if game.status == FINISHED:
                update_user_score(game)
            game_update = {
                'field': game.field,
                'status': game.status,
                'next_step': game.next_step,
                'winner': game.winner,
                'score': game.score
            }
            query = {
                '$set': game_update
            }
            db.games.update_one({'_id': ObjectId(game_id)}, query)
            socket_.emit('game_update', game_update, room=game_id)
            return jsonify(error=False, result=game.get_object())

        else:
            return jsonify(error=True, result='Игрок не может совершить ход')

    except Exception as e:
        app.logger.info(e)
        return on_except()


@app.route('/api/game/<game_id>/join', methods=['POST'])
@auth_required
def join_game_api(current_user, game_id):
    try:

        query = {
            '_id': ObjectId(game_id)
        }

        data = db.games.find_one(query)

        if not data:
            return jsonify(error=True, result='Игра не найдена')

        game = Game.create_from_object(data)

        if game.is_started():
            return jsonify(error=True, result='Игра уже началась')

        if game.second_player is not None:
            return jsonify(error=True, result='Игра уже заполнена')

        if game.first_player == current_user['id']:
            return jsonify(error=True, result='Вы не можете зайти в игру, которую сами создали')

        app.logger.info('{} connected to game {}'.format(current_user['username'], data['_id']))

        query = {
            '_id': ObjectId(game_id)
        }

        game.join_game(current_user['id'])

        update = {
            'second_player': current_user['id'],
            'status': game.status,
            'next_step': game.next_step,
            'score': game.score
        }

        db.games.update_one(query, {'$set': update})
        first_player_username = db.users.find_one({'_id': ObjectId(game.first_player)})['username']
        update['second_player'] = current_user['username']
        game_object = game.get_object()
        game_object['second_player'] = current_user['username']
        game_object['first_player'] = first_player_username

        # change date for socket
        socket_.emit('game_update', update, room=game_id)

        return jsonify(error=False, result=game.get_object())

    except Exception as e:
        app.logger.info(e)
        return on_except()


@app.route('/api/user/me', methods=['POST'])
@auth_required
def get_user(current_user):
    user = db.users.find_one({'_id': ObjectId(current_user['id'])})

    del user['password']
    del user['_id']

    user['id'] = current_user['id']

    return {
        'error': False,
        'result': user
    }


# Serve React application
@app.route('/', defaults={'path': ''})
@app.route('/<path:path>')
def serve(path):
    if path != "" and os.path.exists(app.static_folder + '/' + path):
        return send_from_directory(app.static_folder, path)
    else:
        return send_from_directory(app.static_folder, 'index.html')


def find_client(sid):
    for client in clients:
        if client['room'] and client['sid'] == sid:
            return client

    return None  # if client not found


@socket_.on('join_game')
def on_join_game(data):
    app.logger.info("{} has join game {}. ".format(data['token'], data['game_id']))

    client = find_client(request.sid)

    if client:
        app.logger.info('{} is already joined game {}').format(request.sid, data['game_id'])
        return

    if not (data['token'] and data['game_id']):
        app.logger.info('token or game_id are required')
        return

    user_token = data['token']
    game_id = data['game_id']

    data = db.games.find_one({'_id': ObjectId(game_id)})

    if not data:
        app.logger.info('game with given game_id is not found')
        return

    game = Game.create_from_object(data)

    join_room(game_id)
    user = jwt.decode(user_token, SECRET, algorithms=["HS256"])

    client_payload = {
        'sid': request.sid,
        'username': user['username'],
        'user_id': user['id'],
        'room': str(game_id)
    }

    if game.second_player is None and game.first_player != user['id']:
        app.logger.info('{} connected to game {}'.format(user['id'], data['_id']))

        game.join_game(user['id'])

        query = {
            '_id': ObjectId(game_id)
        }

        update = {
            'second_player': user['id'],
            'status': 'started',
            'next_step': game.next_step,
            'score': game.score
        }

        db.games.update_one(query, {'$set': update})

        first_player = db.users.find_one({'_id': ObjectId(game.first_player)})

        game_update = {
            'second_player': user['username'],
            'next_step': game.next_step,
            'status': game.status,
            'field': game.field,
            'score': game.score
        }

        socket_game_data = game.get_object()
        # replace first_player id with first_player username
        socket_game_data['first_player'] = first_player['username']

        game_data_payload = game.get_object()

        socket_.emit('game_data', game_data_payload, room=request.sid)
        socket_.emit('game_update', game_update, room=str(game_id))

        if not client:
            clients.append(client_payload)

        return

    first_player_username = db.users.find_one({
        '_id': ObjectId(game.first_player)
    })['username']

    second_player_username = None

    if game.second_player:
        second_player_username = db.users.find_one({
            '_id': ObjectId(game.second_player)
        })['username']

    game_data_payload = game.get_object()

    app.logger.info(game_data_payload)

    # replace ids with usernames
    game_data_payload['first_player'] = first_player_username
    game_data_payload['second_player'] = second_player_username

    socket_.emit('game_data', game_data_payload, room=request.sid)

    if not client:
        clients.append(client_payload)


@socket_.on('disconnect')
def on_disconnect():
    client = find_client(request.sid)
    if client:
        payload = {
            'username': client['username'],
            'user_id': client['user_id']
        }
        socket_.emit('leave_game_announcement', payload, room=client['room'])

    for idx in range(len(clients) - 1):
        if clients[idx]['sid'] == request.sid:
            del clients[idx]


@socket_.on('leave_game')
def on_leave_game(data):
    app.logger.info("{} has left game {}. ".format(data['token'], data['game_id']))
    if not (data['game_id'] and data['token']):
        app.logger.info('token or game_id are not specified')
        return

    user = jwt.decode(data['token'], SECRET, algorithms=["HS256"])
    leave_room(data['game_id'])
    socket_.emit('leave_game_announcement', {'username': user['username'], 'user_id': user['id']}, room=data['game_id'])


@socket_.on('step')
def on_step(data):
    if not (data['game_id'] and data['token'] and isinstance(data['x'], int) and isinstance(data['y'], int)):
        error_payload = {
            'message': 'game_id, token, x, y обязательные параметры',
            'event': 'step'
        }
        socket_.emit('error', error_payload, room=request.sid)
        app.logger.info('token or game_id or x or y are not specified')
        return

    game_id = data['game_id']
    user_token = data['token']
    user = jwt.decode(user_token, SECRET, algorithms=["HS256"])
    x = data['x']
    y = data['y']
    data = db.games.find_one({'_id': ObjectId(game_id)})

    if not data:
        error_payload = {
            'message': 'Игра не найдена',
            'event': 'step'
        }
        socket_.emit('error', error_payload, room=request.sid)
        app.logger.info('game with given game_id is not found')
        return

    game = Game.create_from_object(data)

    if not game.is_started():
        error_payload = {
            'message': 'Игра уже закончена или ещё не начата',
            'event': 'step'
        }
        socket_.emit('error', error_payload, room=request.sid)
        app.logger.info('game is not started')
        return

    if game.can_step(user['id']):
        if not game.is_empty_cell(y, x):
            error_payload = {
                'message': 'Клетка не пустая',
                'event': 'step'
            }
            return socket_.emit('error', error_payload, room=request.sid)

        game.step(y, x)

        if game.status == FINISHED and game.winner:
            update_user_score(game)

        update = game.get_object()

        del update['_id']

        db.games.update_one({'_id': ObjectId(game_id)}, {'$set': update})

        game_update = {
            'field': game.field,
            'status': game.status,
            'next_step': game.next_step,
            'winner': game.winner,
            'score': game.score
        }

        socket_.emit('game_update', game_update, room=game_id)
        app.logger.info('game updated')

    else:
        error_payload = {
            'message': 'Пользователь не может совершить ход',
            'event': 'step'
        }
        socket_.emit('error', error_payload, room=request.sid)
        app.logger.info('user is not authorized')
        return


if __name__ == '__main__':
    socket_.run(app, debug=True)