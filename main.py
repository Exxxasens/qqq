from flask import Flask, request, jsonify
from flask_pymongo import PyMongo
import jwt
import re
from game import create_game, X, O
from user import create_user, compare_passwords, SECRET
from functools import wraps

MONGO_URI = 'mongodb+srv://root:xQ8LDJSY@cluster0.88mra.mongodb.net/tictactoe?retryWrites=true&w=majority'

app = Flask(__name__)
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
    return jsonify(game, size, first_step)


if __name__ == "__main__":
    app.run(debug=True, port='8080')
