import React from 'react';
import { connect } from 'react-redux';
import socket from 'socket.io-client';
import { useParams, useHistory } from 'react-router-dom';
import Field from '../Field';
import Loading from '../Loading';
import './Game.scss';

type Game = {
    first_player?: string,
    second_player?: string,
    field?: number[][],
    next_step?: number,
    status?: 'created' | 'started' | 'finished'
}

const Header = ({ game }:any) => {

    if (!(game && game.hasOwnProperty('status'))) {
        return null;
    }

    const { status } = game;
    const getNextStepUsername = () => {
        const { next_step, first_player, second_player } = game;
        return (next_step === 1) ? first_player : second_player;
    }
    const getWinner = () => {
        let { winner, score, status } = game;
        if (winner === 1) {
            return 'Победил игрок ' + game.first_player + ', со счетом: ' + score;
        }

        if (winner === 2) {
            return 'Победил игрок ' + game.second_player + ', со счетом: ' + score;
        }

        return 'Ничья';
    }
    if (status === 'started') {
        return (
            <div className='game-info'>
                <h1> Ход игрока { getNextStepUsername() } </h1>
            </div>
        )
    }
    if (status === 'finished') {
        return (
            <div className='game-info'>
                <h1>{ getWinner() }</h1>
            </div>
        )
    }
    
    return null;
}

const GameInfo = ({ game }: any) => {

    const Settings = () => {
        const { line_to_win, multiple_lines, _id } = game;
        return (
            <div className='settings'>

                <div>Игровые настройки:</div>

                <div className='settings-list'>
                    <div>
                        Номер игры: { _id }
                    </div>
                    <div>
                        Размер линии: { line_to_win }
                    </div>
                    <div>
                        Собрать как можно больше линий: { (multiple_lines) ? 'Да' : 'Нет' }
                    </div>
                </div>

            </div>
        )
    }

    const { first_player, second_player } = game;

    return (
        <>
        <Header/>
        <Settings/>
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
        </>
    )
}

const Game = ({ userId, token, username }: any) => {
    const { id }:any = useParams();
    const history = useHistory();
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
            console.log({ game_id: id, token: userId, y, x });
            currentSocket.emit('step', { game_id: id, token, y, x });
        }
    }

    const onGameUpdate = (payload = {}) => {
        console.log('game_update', payload);
        return setGame((state: any) => {
            if (!state) state = {};
            return { ...state, ...payload };
        });
    }

    const onGameData = (payload = {}) => {
        console.log('game_data', payload);
        setGame(payload);
        setLoading(false);
    }

    const onSocketError = (error: any) => {
        setError(error);
    }

    const handleExit = () => {
        history.push('/');
    }

    React.useEffect(() => {
        const client = socket();
        
        setCurrentSocket(client);

        const token = window.localStorage.getItem('token');

        client.on('join_game_announcement', payload => {
            console.log('user connected to game', payload);
        });

        client.on('leave_game_announcement', payload => console.log('leave_game_announcement', payload));
        client.on('game_update', onGameUpdate);
        client.on('game_data', onGameData);
        client.on('error', onSocketError);

        client.emit('join_game', { token, game_id: id });

        return () => {
            client.emit('leave_game', { token, game_id: id });
        }

    }, [id]);

    // component loading...
    if (isLoading && !error) return <Loading/>

    // component error
    if (error) return (
        <div className='game'>
            <div className='error'>
                { error }
            </div>
        </div>
    )

    // successfully loaded
    const { field, next_step, status } = game;

    if (error) {

        <div className='error'>
            { error.message }
        </div>

    }

    return (
        <div className='game-wrapper'>
            <Header game={game}/>

            <div className='game'>

                <GameInfo game={game} />

                <Field 
                    field={field}
                    nextStep={next_step}
                    onCellClick={handleCellClick} 
                    isUserFirstPlayer={isUserFirstPlayer}
                    isUserSecondPlayer={isUserSecondPlayer}
                    gameStatus={status}
                />

                <div className='btn-wrapper'>
                    <button onClick={handleExit}>Выход</button>
                </div>
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