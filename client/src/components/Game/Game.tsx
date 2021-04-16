import React from 'react';
import { connect } from 'react-redux';
import socket from 'socket.io-client';
import { useParams } from 'react-router-dom';
import Field from '../Field';
import Loading from '../Loading';
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

const GameInfo = ({ game }: any) => {
    const { status } = game;

    const getNextStepUsername = () => {
        const { next_step, first_player, second_player } = game;
        return (next_step === 1) ? first_player : second_player;
    }

    const getWinner = () => {
        let { winner } = game;

        if (winner === 0) {
            return 'Ничья';
        }

        if (winner === 1) {
            return 'Победил игрок ' + game.first_player;
        }

        if (winner === 2) {
            return 'Победил игрок ' + game.second_player;
        }

    }

    if (status === 'started') {
        return (
            <div className='game-info'>
                <h1> Ход игрока { getNextStepUsername() } </h1>
            </div>
        )

    } else if (status === 'finished') {
        return (
            <div className='game-info'>
                <h1>{ getWinner() } </h1>
            </div>
        )
    }

    return null; // if game not started or finished
}

const Game = ({ userId, token, username }: any) => {
    const { id }:any = useParams();
    const initialState:any = null;
    const [game, setGame] = React.useState(initialState);
    const [currentSocket, setCurrentSocket] = React.useState(initialState);
    const [error, setError] = React.useState(null);
    const [isLoading, setLoading] = React.useState(true);

    const isUserFirstPlayer = game && game.hasOwnProperty('first_player') && game.first_player === username;
    const isUserSecondPlayer = game && game.hasOwnProperty('second_player') && game.second_player === username;

    const handleCellClick = (y:number, x:number) => {
        const { next_step } = game;
        if ((next_step === 1 && isUserFirstPlayer) || (next_step === 2 && isUserSecondPlayer)) {
            console.log('user make a step!');
            console.log({ game_id: id, token: userId, y, x });
            currentSocket.emit('step', { game_id: id, token, y, x });
        }
    }

    React.useEffect(() => {
        const client = socket();
        
        setCurrentSocket(client);

        const token = window.localStorage.getItem('token');

        client.on('join_game_announcement', payload => {
            console.log('user connected to game', payload);
        });

        client.on('leave_game_announcement', payload => console.log('leave_game_announcement', payload));

        client.on('game_update', (payload) => {
            console.log('game_update', payload);
            console.log(typeof payload);
            setGame((state: any) => {
                if (!state) return {
                    ...payload
                }
                return { ...state, ...payload };
            });
        });

        client.emit('join_game', { token, game_id: id });

        client.on('game_data', payload => {
            console.log('game data', payload);
            setGame(payload);
            setLoading(false);
        });

        client.on('error', payload => console.error(payload));

        return () => {
            client.emit('leave_game', { token, game_id: id });
        }

    }, [id]);

    // component loading...
    if (isLoading && !error) {
        return <Loading/>
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

            <GameInfo game={game} />

            <Field 
                field={game_field}
                nextStep={next_step}
                onCellClick={handleCellClick} 
                isUserFirstPlayer={isUserFirstPlayer}
                isUserSecondPlayer={isUserSecondPlayer}
                gameStatus={status}
            />
            
            <div className='btn-wrapper'>
                <button>Выход</button>
            </div>
        </div>
    )
}

const mapStateToProps = (state: any) => {
    return {
        username: state.username,
        userId: state.userId,
        token: state.token
    }
}

export default connect(mapStateToProps)(Game);