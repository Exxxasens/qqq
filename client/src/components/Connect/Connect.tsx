import React from 'react';
import './Connect.scss';
import { useHistory } from 'react-router-dom';

const Connect = () => {
    const history = useHistory();
    const [id, setID] = React.useState('');

    const handleInputChange = (e: React.ChangeEvent) => {
        if (e.target instanceof HTMLInputElement) {
            let value = e.target.value;
            setID(value);
        }
    }

    const createURL = (gameId: string) => `/game/${gameId}`;

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (id.length > 0) {
            history.push(createURL(id));
        }
    }

    return (
        <div className='connect'>
            <form onSubmit={handleSubmit}>
                <div className='input-wrapper'>
                    <label htmlFor="game-id">
                        Номер игры:
                    </label>
                    <input id='game-id' type='text' value={id} onChange={handleInputChange}/>
                </div>
                <div className='btn-wrapper'>
                    <button className='connect-btn' type='submit'>
                        Подключиться
                    </button>
                </div>
            </form>
        </div>
    )
}

export default Connect;