import React from 'react';
import Loading from '../Loading';
import useRequest from '../hooks/useRequest';
import { Redirect } from 'react-router-dom';
import ApiContext from '../contexts/ApiContext';
import './CreateGame.scss';

type CreateGameProps = {
    first_step?: number,
    size?: number
}

const SelectGameParams = () => {
    const [size, setSize] = React.useState(3);
    const [firstStep, setFirstStep] = React.useState(3);
    const [isSubmitted, setSubmitted] = React.useState(false);

    console.log('game component')

    const handleSizeChange = (e: React.ChangeEvent) => {
        if (e.target instanceof HTMLInputElement) {
            console.log('ok')
            const value = parseInt(e.target.value);
            if (!value || value > 10 || value < 3) return;
            return setSize(value)
        }
    }

    const handleStepSelect = (e: React.ChangeEvent) => {
        if (e.target instanceof HTMLSelectElement) {
            const value = parseInt(e.target.value);
            if (value > 0 && value < 4) {
                setFirstStep(value);
            }
        } 
    }
    
    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        return setSubmitted(true);
    }

    if (isSubmitted) return <CreateGame size={size} first_step={firstStep} />

    return (
        <div className='create-game'>
            <h1>
                Создание новой игры
            </h1>
            <div className='discription'>
                Пожалуйста, выберите параметры для создания игры.
            </div>
            <form className='form' onSubmit={handleSubmit}>

                <div className='input-wrapper'>
                    <label htmlFor='field-size'>
                        Размер игрового поля:
                    </label>
                    <input id='field-size' type='number' value={size} onChange={handleSizeChange}/>
                </div>

                <div className='input-wrapper'>
                    <label htmlFor="first-step">
                        Первый ход:
                    </label>
                    <select id='first-step' onChange={handleStepSelect} value={firstStep}>
                        <option value='1'>X</option>
                        <option value='2'>O</option>
                        <option value='3'>Рандомно</option>
                    </select>
                </div>

                <div className='submit-btn-wrapper'>
                    <button type='submit'>Создать</button>
                </div>

            </form>

        </div>
    )
}

const CreateGame = ({ first_step = 1, size = 3 }:CreateGameProps) => {
    const api = React.useContext(ApiContext);
    const request = React.useCallback(() => {
        const options = {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ first_step, size })
        };
        return api.fetchWithToken('/api/game/create', options);
    }, [api, first_step, size]);

    const { data, status } = useRequest(request);
    console.log(data);
    if (status === 'ok') {
        const url = `/game/${data}`;
        return <Redirect to={url}/>
    }
    // Todo: error component
    if (status === 'error') {
        return <div>Error</div>
    }

    if (status === 'loading') {
        return <Loading/>
    }
}

export default SelectGameParams;