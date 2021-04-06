import React from 'react';
import { NavLink } from 'react-router-dom'
import './Menu.scss';

const Menu = () => {
    console.log('menu component')
    return (
        <div className='menu'>

            <div className='item'>
                <NavLink to='/me'>Мой аккаунт</NavLink>
            </div>

            <div className='item'>
                <NavLink to='/game/new'>Создать игру</NavLink>
            </div>

            <div className='item'>
                <NavLink to='/game/connect'>Присоединиться к игре</NavLink>
            </div>

            <div className='item'>
                <NavLink to='/logout'>Выход</NavLink>
            </div>

        </div>
    )
}

export default Menu;