from flask import Flask, request, jsonify, send_from_directory
from flask_pymongo import PyMongo
import jwt
import re
import os
from game import create_game, X, O, step
from user import create_user, compare_passwords, SECRET
from functools import wraps
from flask_socketio import SocketIO, join_room, leave_room

MONGO_URI = 'mongodb+srv://root:xQ8LDJSY@cluster0.88mra.mongodb.net/tictactoe?retryWrites=true&w=majority'

app = Flask(__name__, static_folder='client/build')
mongo_client = PyMongo(app, uri=MONGO_URI, ssl=True, ssl_cert_reqs='CERT_NONE')
db = mongo_client.db

db.users.create_index('username', name='username_index', )


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

        found_user = db.users.find_one({'username': body['username']})

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
    except:
        return jsonify(error=True, result='Не удалось распарсить JSON')

    try:
        size = int(body['size']) or 3
    except:
        return jsonify(error=True, result='Неверный размер игрового поля')

    try:
        first_step = int(body['first_step']) or 1
    except:
        return jsonify(error=True, result='Неверный параметр first_step')

    if size > 10:
        return jsonify(error=True, result='Максимальный размер игрового поля 10')

    if size < 3:
        return jsonify(error=True, result='Минимальный размер игрового поля 3')

    if not (first_step == X or first_step == O):
        return jsonify(error=True, result='Параметр first_step может принимать значение 1 или 0')

    game = create_game(current_user['id'], size, first_step)
    db.games.insert_one(game)
    return jsonify(game, size, first_step)

# Server React application
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


@socket_.on('join_game')
def on_join_game(data):
    if not (data['token'] and data['game_id']):
        print('token and game_id are required params')
        return

    user_token = data['token']
    game_id = data['game_id']

    game = db.games.find_one({'_id': game_id})
    join_room(game_id)
    user = jwt.decode(user_token, SECRET, algorithms=["HS256"])

    if not game.second_player and not game.first_player == user['id']:
        query = {'_id': data['game_id']}
        update = {'$set': {'second_player': user['id']}}
        db.games.update_one(query, update)
        socket_.emit('second_player_join_game', {'username': user['username']}, room=data['game_id'])

    socket_.emit('join_game_announcement', {'username': user['username']}, room=data['game_id'])


@socket_.on('leave_game')
def on_leave_game(data):
    if not (data['game_id'] and data['token']):
        print('game_id and token are required params')
        return

    user = jwt.decode(data['token'], SECRET, algorithms=["HS256"])
    leave_room(data['game_id'])
    socket_.emit('leave_game_announcement', {'username': user['username']}, room=data['game_id'])


@socket_.on('step')
def on_step(data):
    if not (data['game_id'] and data['token'] and data['x'] and data['y']):
        print('game_id and token are required params')
        return

    game_id = data['game_id']
    user_token = data['token']

    user = jwt.decode(user_token, SECRET, algorithms=["HS256"])
    game = db.games.find_one({'_id': game_id})

    if not game.status == 'started':
        print('game is not started...')
        return

    if (game.next_step == 1 and game.first_player == user['id'] or
            game.next_step == 0 and game.second_player == user['id']):

        game = step(data['y'], data['x'])
        db.games.update_one({'_id': game_id}, game)
        socket_.emit('game_update', game, room=game_id)
        print('game updated')

    else:
        print('user is not authorized')
        return


if __name__ == "__main__":
    app.run(debug=True, port='8080')
