from flask_socketio import SocketIO, join_room, leave_room
from bson.objectid import ObjectId
from main import app, db
from flask import request
import json
import jwt


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
        query = {'_id': ObjectId(data['game_id'])}
        update = {'$set': {'second_player': user['id'], 'status': 'started'}}
        db.games.update_one(query, update)
        socket_.emit('second_player_join_game', {'username': user['username']}, room=data['game_id'])

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
    game_json = json.dumps(game, default=str)
    socket_.emit('join_game_announcement', join_payload, room=data['game_id'])
    socket_.emit('game_data', game_json, room=request.sid)
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
    if not (data['game_id'] and data['token'] and data['x'] and data['y']):
        error_payload = {
            'message': 'game_id, token, x, y are required params',
            'event': 'step'
        }
        socket_.emit('error', error_payload, room=request.sid)
        app.logger.info('token or game_id or x or y are not specified')
        return

    game_id = data['game_id']
    user_token = data['token']

    user = jwt.decode(user_token, SECRET, algorithms=["HS256"])
    game = db.games.find_one({'_id': game_id})

    if not game:
        app.logger.info('game with given game_id is not found')
        return

    if not game.status == 'started':
        app.logger.info('game is not started')
        return

    if (game.next_step == 1 and game.first_player == user['id'] or
            game.next_step == 2 and game.second_player == user['id']):

        game = step(data['y'], data['x'])
        db.games.update_one({'_id': game_id}, game)
        socket_.emit('game_update', game, room=game_id)
        app.logger.info('game updated')

    else:
        app.logger.info('user is not authorized')
        return