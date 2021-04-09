from flask import Flask, request, jsonify, send_from_directory, Response
from flask_pymongo import PyMongo
from game import create_game, X, O, RANDOM, step
from user import create_user, compare_passwords
from functools import wraps
from settings import MONGO_URI, SECRET
from flask_socketio import SocketIO, join_room, leave_room
from bson.objectid import ObjectId
import random
import jwt
import re
import os
import json


app = Flask(__name__, static_folder='client/build')
mongo_client = PyMongo(app, uri=MONGO_URI, ssl=True, ssl_cert_reqs='CERT_NONE')
db = mongo_client.db


def on_except(): return jsonify(error=True, result='Произошла неизвестная ошибка')


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

        except:
            return jsonify(error=True, result='Токен не валиден')

    return decorator


@app.route('/api/register', methods=['POST'])
def register():
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

    except Exception:
        return on_except()


@app.route('/api/game/create', methods=['POST'])
@auth_required
def create_game_handler(current_user):
    try:
        body = request.get_json(force=True)
        size = int(body['size']) or 3
        first_step = int(body['first_step']) or 1
    except (ValueError, KeyError, TypeError) as error:
        app.logger(error)
        resp = Response({"Ошибка в JSON"}, status=400, mimetype='application/json')
        return resp

    if size > 10:
        return jsonify(error=True, result='Максимальный размер игрового поля 10')

    if size < 3:
        return jsonify(error=True, result='Минимальный размер игрового поля 3')

    if not (first_step == X or first_step == O or first_step == RANDOM):
        return jsonify(error=True, result='Параметр first_step может принимать значение 1 или 0')

    game = create_game(current_user['id'], size, first_step)
    db.games.insert_one(game)
    return jsonify(error=False, result=str(game['_id']))


# Serve React application
@app.route('/', defaults={'path': ''})
@app.route('/<path:path>')
def serve(path):
    if path != "" and os.path.exists(app.static_folder + '/' + path):
        return send_from_directory(app.static_folder, path)
    else:
        return send_from_directory(app.static_folder, 'index.html')


# SocketIO implementation
async_mode = None
socket_ = SocketIO(app, async_mode=async_mode)
clients = []


def find_client(sid):
    for client in clients:
        if client['room'] and client['sid'] == sid:
            return client


@socket_.on('join_game')
def on_join_game(data):
    app.logger.info("{} has join game {}. ".format(data['token'], data['game_id']))

    client = find_client(request.sid)

    if client:
        app.logger.info('{} is already joined game {}').format(request.sid, data['game_id'])

    if not (data['token'] and data['game_id']):
        app.logger.info('token or game_id are not specified')
        return

    user_token = data['token']
    game_id = data['game_id']
    game = db.games.find_one({'_id': ObjectId(game_id)})

    if not game:
        app.logger.info('game with given game_id are not found')
        return

    join_room(game_id)
    user = jwt.decode(user_token, SECRET, algorithms=["HS256"])

    if not game['second_player'] and not str(game['first_player']) == user['id']:
        app.logger.info('{} connected to game {}'.format(user['id'], game['_id']))

        update = {'$set': {'second_player': user['id'], 'status': 'started'}}
        query = {'_id': ObjectId(data['game_id'])}

        if game['next_step'] == RANDOM:
            game['next_step'] = random.randint(1, 2)
            update['$set']['next_step'] = game['next_step']

        db.games.update_one(query, update)

        first_player = db.users.find_one({'_id': ObjectId(game['first_player'])})

        game_update = {
            'second_player': user['username'],
            'next_step': game['next_step'],
            'status': 'started'
        }

        game_data_payload = {
            '_id': str(game['_id']),
            'first_player': first_player['username'],
            'second_player': user['username'],
            'next_step': game['next_step'],
            'status': 'started',
            'game_field': game['game_field'],
            'winner': game['winner']
        }

        socket_.emit('game_update', game_update, room=str(data['game_id']))
        socket_.emit('game_data', game_data_payload, room=request.sid)
        return

    join_payload = {
        'username': user['username'],
        'user_id': user['id']
    }
    client_payload = {
        'sid': request.sid,
        'username': user['username'],
        'user_id': user['id'],
        'room': data['game_id']
    }

    first_player_username = db.users.find_one({'_id': ObjectId(game['first_player'])})['username']
    second_player_username = None
    if game['second_player']:
        second_player_username = db.users.find_one({'_id': ObjectId(game['second_player'])})['username']

    game_data_payload = {
        '_id': str(game['_id']),
        'first_player': first_player_username,
        'second_player': second_player_username,
        'game_field': game['game_field'],
        'status': game['status'],
        'next_step': game['next_step'],
        'winner': game['winner']
    }

    socket_.emit('join_game_announcement', join_payload, room=data['game_id'])
    socket_.emit('game_data', game_data_payload, room=request.sid)
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

    for idx in range(len(clients)-1):
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
    game = db.games.find_one({'_id': ObjectId(game_id)})

    if not game:
        error_payload = {
            'message': 'Игра не найдена',
            'event': 'step'
        }
        socket_.emit('error', error_payload, room=request.sid)
        app.logger.info('game with given game_id is not found')
        return

    if not game['status'] == 'started':
        error_payload = {
            'message': 'Игра уже закончена или ещё не начата',
            'event': 'step'
        }
        socket_.emit('error', error_payload, room=request.sid)
        app.logger.info('game is not started')
        return

    if (game['next_step'] == 1 and game['first_player'] == user['id'] or
            game['next_step'] == 2 and game['second_player'] == user['id']):

        game = step(game, data['y'], data['x'])

        query = {
            '$set': game
        }

        db.games.update_one({'_id': ObjectId(game_id)}, query)

        game_update = {
            'game_field': game['game_field'],
            'status': game['status'],
            'next_step': game['next_step'],
            'winner': game['winner']
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


if __name__ == "__main__":
    app.run(debug=True, port='8080')
