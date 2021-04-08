import React from 'react';
import { connect } from 'react-redux';
import socket from 'socket.io-client';
import { useParams } from 'react-router-dom';
import Field from '../Field';
import './Game.scss';

type Game = {
    first_player?: string,
    second_player?: string,
    game_field?: number[][],
    next_step?: number,
    status?: 'created' | 'started' | 'finished'
}

const copyGame = (game: Game) => {
    if (game && game.game_field) {
        const game_field = game.game_field.map(row => row.map(cell => cell));
        return {
            ...game,
            game_field
        }
    }
    return game;
}

const Game = ({ userId }: any) => {
    const { id }:any = useParams();
    const initialState:any = null;
    const [game, setGame] = React.useState(initialState);
    const [currentSocket, setCurrentSocket] = React.useState(initialState);
    const [error, setError] = React.useState(null);
    const [isLoading, setLoading] = React.useState(true);

    const handleCellClick = React.useCallback((y:number, x:number) => {
        console.log(game);
        const { next_step } = game;
        if ((next_step === 1 && isUserFirstPlayer(userId)) || (next_step === 2 && isUserSecondPlayer(userId))) {
            console.log('user make a step!');
            console.log({ game_id: id, token: userId, y, x });
            currentSocket.emit('step', { game_id: id, token: userId, y, x });
        }
    }, [id, userId, game]);

    const isUserFirstPlayer = (id: string) => game && game.hasOwnProperty('first_player') && game.first_player === id;
    const isUserSecondPlayer = (id: string) => game && game.hasOwnProperty('second_player') && game.second_player === id;

    React.useEffect(() => {
        const client = socket();
        
        setCurrentSocket(client);

        const token = window.localStorage.getItem('token');

        client.on('join_game_announcement', payload => {
            console.log('user connected to game', payload);
        });

        client.on('leave_game_announcement', payload => console.log('leave_game_announcement', payload));

        client.on('second_player_join_game', payload => {
            const { game } = payload; // update game and game status
            setGame((state:any) => {
                return  { ...copyGame(state), ...game };
            });
        });

        client.emit('join_game', { token, game_id: id });

        client.on('game_data', payload => {
            console.log('game data', payload);
            const response = JSON.parse(payload);
            setGame(response);
            setLoading(false);
        });

        client.on('error', payload => console.error(payload));

        return () => {
            client.emit('leave_game', { token, game_id: id });
        }

    }, [id]);

    // component loading...
    if (isLoading && !error) {
        return (
            <div>
                loading...
            </div>
        )
    }

    // component error
    if (error) {
        return (
            <div className='game'>
                <div className='error'>
                    { error }
                </div>
            </div>
        )
    }

    // successfully loaded
    const { game_field, next_step, status, first_player, second_player } = game;
    return (
        <div className='game'>
            <div className='players'>
                <div>
                    <div className='title'>Игрок 1:</div>
                    <div className='name'>{ first_player }</div>
                </div>
                <div>
                    <div className='title'>Игрок 2:</div>
                    <div className='name'>{ second_player || 'Ожидание игрока' }</div>
                </div>
            </div>
            <Field 
                field={game_field}
                nextStep={next_step}
                onCellClick={handleCellClick} 
                isUserFirstPlayer={isUserFirstPlayer(userId)}
                isUserSecondPlayer={isUserSecondPlayer(userId)}
                gameStatus={status}
            />
        </div>
    )
}

const mapStateToProps = (state: any) => {
    return {
        userId: state.userId
    }
}

export default connect(mapStateToProps)(Game);