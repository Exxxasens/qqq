import React from 'react';
import { NavLink } from 'react-router-dom'
import { connect } from 'react-redux';
import './Menu.scss';

const Menu = ({ username }: any) => {
    console.log('menu component')
    return (
        <div className='menu'>

            <h1>
                Добро пожаловать, { username }
            </h1>

            <div>
                <div className='item'>
                    <NavLink to='/me'>Мой аккаунт</NavLink>
                </div>

                <div className='item'>
                    <NavLink to='/create'>Создать игру</NavLink>
                </div>

                <div className='item'>
                    <NavLink to='/game/connect'>Присоединиться к игре</NavLink>
                </div>

                <div className='item'>
                    <NavLink to='/logout'>Выход</NavLink>
                </div>
            </div>

        </div>
    )
}

const mapStateToProps = (state: any) => {
    console.log(state);
    const { username } = state;
    return {
        username
    }
}

export default connect(mapStateToProps)(Menu);