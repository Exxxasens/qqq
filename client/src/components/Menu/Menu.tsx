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

            <div className='list'>
                <div className='item'>
                    <NavLink to='/me' activeClassName='selected'>Мой аккаунт</NavLink>
                </div>

                <div className='item'>
                    <NavLink to='/create' activeClassName='selected'>Создать игру</NavLink>
                </div>

                <div className='item'>
                    <NavLink to='/game/connect' activeClassName='selected'>Присоединиться к игре</NavLink>
                </div>

                <div className='item'>
                    <NavLink to='/logout' activeClassName='selected'>Выход</NavLink>
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